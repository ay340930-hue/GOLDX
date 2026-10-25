import React, { useState } from 'react';
import { 
  Play, RotateCcw, ShieldCheck, Activity, Award, TrendingUp, 
  DollarSign, Clock, AlertTriangle, CheckCircle2, ChevronRight, FileText
} from 'lucide-react';
import EquityCurveChart from '../components/charts/EquityCurveChart';
import { runBacktest } from '../services/api';

export default function BacktestingLabView({ onNavigate }) {
  const [symbolA, setSymbolA] = useState('GOLDM');
  const [symbolB, setSymbolB] = useState('GOLDGUINEA');
  const [lookbackWindow, setLookbackWindow] = useState(30);
  const [entryThreshold, setEntryThreshold] = useState(2.0);
  const [exitThreshold, setExitThreshold] = useState(0.5);
  const [stopLossThreshold, setStopLossThreshold] = useState(3.5);
  const [maxHoldDays, setMaxHoldDays] = useState(15);
  const [expiryCutoffDte, setExpiryCutoffDte] = useState(5);
  const [roundTripCost, setRoundTripCost] = useState(90.0);
  const [foldTrainSize, setFoldTrainSize] = useState(60);
  const [foldTestSize, setFoldTestSize] = useState(20);

  const [loading, setLoading] = useState(false);
  const [backtestResult, setBacktestResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleRunBacktest = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await runBacktest({
        symbol_a: symbolA,
        symbol_b: symbolB,
        lookback_window: lookbackWindow,
        entry_threshold: entryThreshold,
        exit_threshold: exitThreshold,
        stop_loss_threshold: stopLossThreshold,
        max_hold_days: maxHoldDays,
        expiry_cutoff_dte: expiryCutoffDte,
        round_trip_cost: roundTripCost,
        fold_train_size: foldTrainSize,
        fold_test_size: foldTestSize
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setBacktestResult(res);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Backtest failed');
    } finally {
      setLoading(false);
    }
  };

  const metrics = backtestResult?.metrics;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Walk-Forward Backtesting Lab (Zero Look-Ahead Bias)
          </h2>
          <p className="text-xs text-slate-400">
            Strict chronological evaluation of statistical spread rules across unseen historical test folds.
          </p>
        </div>

        <button
          onClick={handleRunBacktest}
          disabled={loading}
          className="gold-button px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg self-start"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
              Simulating Walk-Forward Folds...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Play className="w-4 h-4 fill-slate-950" />
              Run Walk-Forward Backtest
            </span>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Configuration Parameters Grid */}
      <div className="p-5 rounded-xl gold-card flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
            Simulation Parameters & Execution Rules
          </span>
          <span className="gold-badge text-[10px]">Anti-Curve-Fitting Engine</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Leg A</label>
            <select
              value={symbolA}
              onChange={(e) => setSymbolA(e.target.value)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            >
              <option value="GOLDM">GOLDM</option>
              <option value="GOLDTEN">GOLDTEN</option>
              <option value="GOLDGUINEA">GOLDGUINEA</option>
              <option value="GOLDPETAL">GOLDPETAL</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Leg B</label>
            <select
              value={symbolB}
              onChange={(e) => setSymbolB(e.target.value)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            >
              <option value="GOLDGUINEA">GOLDGUINEA</option>
              <option value="GOLDTEN">GOLDTEN</option>
              <option value="GOLDM">GOLDM</option>
              <option value="GOLDPETAL">GOLDPETAL</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Entry Threshold (|Z| ≥)</label>
            <input
              type="number"
              step="0.1"
              value={entryThreshold}
              onChange={(e) => setEntryThreshold(parseFloat(e.target.value))}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Exit Target (|Z| ≤)</label>
            <input
              type="number"
              step="0.1"
              value={exitThreshold}
              onChange={(e) => setExitThreshold(parseFloat(e.target.value))}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Stop Loss (|Z| ≥)</label>
            <input
              type="number"
              step="0.1"
              value={stopLossThreshold}
              onChange={(e) => setStopLossThreshold(parseFloat(e.target.value))}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Max Hold Days</label>
            <input
              type="number"
              value={maxHoldDays}
              onChange={(e) => setMaxHoldDays(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Expiry Cutoff (DTE ≤)</label>
            <input
              type="number"
              value={expiryCutoffDte}
              onChange={(e) => setExpiryCutoffDte(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Round-Trip Friction (₹/10g)</label>
            <input
              type="number"
              value={roundTripCost}
              onChange={(e) => setRoundTripCost(parseFloat(e.target.value))}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Train Fold (Sessions)</label>
            <input
              type="number"
              value={foldTrainSize}
              onChange={(e) => setFoldTrainSize(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-semibold">Test Fold (Sessions)</label>
            <input
              type="number"
              value={foldTestSize}
              onChange={(e) => setFoldTestSize(parseInt(e.target.value))}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {metrics ? (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* KPI Cards Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-xs">
            <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
              <span className="text-slate-400">Total Trades</span>
              <div className="text-xl font-bold font-mono text-white">{metrics.total_trades}</div>
              <span className="text-[10px] text-slate-500 font-mono">Executed Signals</span>
            </div>

            <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
              <span className="text-slate-400">Win Rate</span>
              <div className="text-xl font-bold font-mono text-emerald-400">{metrics.win_rate_pct}%</div>
              <span className="text-[10px] text-slate-500 font-mono">{metrics.winning_trades}W / {metrics.losing_trades}L</span>
            </div>

            <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
              <span className="text-slate-400">Gross P&L</span>
              <div className={`text-xl font-bold font-mono ${metrics.total_gross_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₹{metrics.total_gross_pnl?.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Before Fees</span>
            </div>

            <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
              <span className="text-slate-400">Total Friction</span>
              <div className="text-xl font-bold font-mono text-rose-400">-₹{metrics.total_fees_paid?.toLocaleString()}</div>
              <span className="text-[10px] text-slate-500 font-mono">Brokerage + Taxes</span>
            </div>

            <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
              <span className="text-slate-400">Net P&L (₹/10g)</span>
              <div className={`text-xl font-bold font-mono ${metrics.total_net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.total_net_pnl >= 0 ? `+₹${metrics.total_net_pnl?.toLocaleString()}` : `-₹${Math.abs(metrics.total_net_pnl)?.toLocaleString()}`}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-mono">Realized Edge</span>
            </div>

            <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
              <span className="text-slate-400">Max Drawdown</span>
              <div className="text-xl font-bold font-mono text-rose-400">₹{metrics.max_drawdown}</div>
              <span className="text-[10px] text-slate-500 font-mono">Peak-to-Trough</span>
            </div>

            <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
              <span className="text-slate-400">Profit Factor</span>
              <div className="text-xl font-bold font-mono text-amber-400">{metrics.profit_factor}</div>
              <span className="text-[10px] text-slate-500 font-mono">Gross Gain / Loss</span>
            </div>

            <div className="p-3.5 rounded-xl gold-card flex flex-col gap-1">
              <span className="text-slate-400">Avg Hold Time</span>
              <div className="text-xl font-bold font-mono text-cyan-400">{metrics.average_hold_days}d</div>
              <span className="text-[10px] text-slate-500 font-mono">Trading Sessions</span>
            </div>
          </div>

          {/* Equity Curve Chart */}
          <div className="p-6 rounded-xl gold-card flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Cumulative Net Strategy Spread Equity Curve
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated strictly on historical test folds. Past performance does not guarantee future results.
            </p>
            <EquityCurveChart equityCurve={backtestResult.equity_curve} />
          </div>

          {/* Chronological Fold Stability Matrix */}
          <div className="p-6 rounded-xl gold-card flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Chronological Walk-Forward Fold Stability Matrix ({backtestResult.folds?.length} Folds)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Train: {foldTrainSize} sessions | Test: {foldTestSize} sessions
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-2.5">Fold ID</th>
                    <th className="p-2.5">Training Period (In-Sample)</th>
                    <th className="p-2.5">Testing Period (Out-of-Sample)</th>
                    <th className="p-2.5">Trades</th>
                    <th className="p-2.5">Win Rate</th>
                    <th className="p-2.5">Gross P&L</th>
                    <th className="p-2.5 text-right">Net P&L (₹/10g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {backtestResult.folds.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-bold text-amber-400">Fold #{f.fold_id}</td>
                      <td className="p-2.5 text-slate-400">{f.train_start} ➔ {f.train_end}</td>
                      <td className="p-2.5 text-white">{f.test_start} ➔ {f.test_end}</td>
                      <td className="p-2.5">{f.trade_count}</td>
                      <td className="p-2.5 font-bold text-emerald-400">{f.win_rate}%</td>
                      <td className="p-2.5 font-mono">₹{f.gross_pnl}</td>
                      <td className={`p-2.5 text-right font-bold font-mono ${f.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {f.net_pnl >= 0 ? `+₹${f.net_pnl}` : `-₹${Math.abs(f.net_pnl)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Trade / Event Ledger */}
          <div className="p-6 rounded-xl gold-card flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Simulated Execution & Trade Event Ledger ({backtestResult.trades?.length} Executions)
            </h3>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2.5">Trade ID</th>
                    <th className="p-2.5">Entry Date</th>
                    <th className="p-2.5">Exit Date</th>
                    <th className="p-2.5">Direction</th>
                    <th className="p-2.5">Entry Spread</th>
                    <th className="p-2.5">Exit Spread</th>
                    <th className="p-2.5">Gross P&L</th>
                    <th className="p-2.5">Friction</th>
                    <th className="p-2.5">Net P&L</th>
                    <th className="p-2.5">Hold Days</th>
                    <th className="p-2.5">Exit Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {backtestResult.trades.map((t, i) => (
                    <tr key={i} className="hover:bg-slate-900/50">
                      <td className="p-2.5 text-amber-400 font-bold">{t.trade_id}</td>
                      <td className="p-2.5 text-white">{t.entry_date}</td>
                      <td className="p-2.5 text-white">{t.exit_date}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.direction === 'SHORT_SPREAD' ? 'bg-amber-500/10 text-amber-300' : 'bg-cyan-500/10 text-cyan-300'
                        }`}>
                          {t.direction}
                        </span>
                      </td>
                      <td className="p-2.5">₹{t.entry_spread}</td>
                      <td className="p-2.5">₹{t.exit_spread}</td>
                      <td className="p-2.5">₹{t.gross_pnl}</td>
                      <td className="p-2.5 text-rose-400">-₹{t.fee_deducted}</td>
                      <td className={`p-2.5 font-bold ${t.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.net_pnl >= 0 ? `+₹${t.net_pnl}` : `-₹${Math.abs(t.net_pnl)}`}
                      </td>
                      <td className="p-2.5">{t.hold_days}d</td>
                      <td className="p-2.5 text-slate-400 text-[11px]">{t.exit_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
            <strong>Historical Simulation Disclaimer:</strong> {backtestResult.disclaimer}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-xl gold-card flex flex-col items-center justify-center gap-3 text-center">
          <Activity className="w-8 h-8 text-amber-400" />
          <h3 className="text-base font-bold text-white">No Backtest Executed Yet</h3>
          <p className="text-xs text-slate-400 max-w-md">
            Click "Run Walk-Forward Backtest" above to initiate chronological walk-forward simulation across unseen test folds without look-ahead bias.
          </p>
        </div>
      )}
    </div>
  );
}
