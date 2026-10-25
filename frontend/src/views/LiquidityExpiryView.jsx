import React, { useState, useEffect } from 'react';
import { 
  Droplets, Calendar, DollarSign, AlertTriangle, ShieldCheck, 
  ArrowRight, Calculator, CheckCircle2, Info
} from 'lucide-react';
import { fetchLiquidity } from '../services/api';

export default function LiquidityExpiryView({ onNavigate }) {
  const [liquidityData, setLiquidityData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Transaction Cost Model State
  const [goldPrice, setGoldPrice] = useState(72000); // ₹/10g reference
  const [brokerageBps, setBrokerageBps] = useState(1.0); // 1 bps (0.01%)
  const [exchangeFeeRate, setExchangeFeeRate] = useState(0.0021); // MCX 0.0021%
  const [cttRate, setCttRate] = useState(0.01); // 0.01% on sell futures turnover
  const [gstRate, setGstRate] = useState(18.0); // 18% on fees
  const [stampDutyRate, setStampDutyRate] = useState(0.002); // 0.002% on buy turnover
  const [slippagePer10g, setSlippagePer10g] = useState(20.0); // ₹20/10g buffer

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetchLiquidity();
        if (res.contracts) setLiquidityData(res);
      } catch (err) {
        console.error('Error fetching liquidity:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute 2-leg round-trip friction model
  // Round trip for a spread position involves 4 executions (Buy A, Sell B; then unwind: Sell A, Buy B)
  // Turnover per 10g leg round-trip = 2 * goldPrice
  const roundTripTurnoverPerLeg = 2 * goldPrice; // for Leg A and Leg B
  const totalTurnover = roundTripTurnoverPerLeg * 2; // ~ ₹2,88,000 for 10g spread roundtrip

  const totalBrokerage = totalTurnover * (brokerageBps / 10000);
  const totalExchangeCharges = totalTurnover * (exchangeFeeRate / 100);
  const totalGst = (totalBrokerage + totalExchangeCharges) * (gstRate / 100);
  // CTT is applied on sell side only (2 sell transactions)
  const totalCtt = (roundTripTurnoverPerLeg) * (cttRate / 100);
  // Stamp duty on buy side only (2 buy transactions)
  const totalStampDuty = (roundTripTurnoverPerLeg) * (stampDutyRate / 100);
  const totalSlippage = slippagePer10g * 2; // 2 legs

  const totalRoundTripFriction = totalBrokerage + totalExchangeCharges + totalGst + totalCtt + totalStampDuty + totalSlippage;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            Liquidity, Expiry & Transaction-Cost Layer
          </h2>
          <p className="text-xs text-slate-400">
            Assessing contract tradability, delivery tender period risks, and friction hurdles before considering an analytical spread actionable.
          </p>
        </div>

        <button
          onClick={() => onNavigate('backtesting')}
          className="gold-button px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start"
        >
          Evaluate in Walk-Forward Backtester
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Contract Liquidity & Expiry Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(liquidityData?.contracts || []).map((c, i) => (
          <div key={i} className="p-5 rounded-xl gold-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold font-mono text-white">{c.symbol}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  c.status === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {c.status}
                </span>
              </div>
              <h3 className="text-xs text-slate-300 font-medium">{c.name}</h3>
            </div>

            <div className="flex flex-col gap-2 text-xs font-mono pt-3 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Daily Volume:</span>
                <strong className="text-white">{c.volume?.toLocaleString()} lots</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Open Interest (OI):</span>
                <strong className="text-slate-300">{c.open_interest?.toLocaleString()} lots</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Turnover/OI Ratio:</span>
                <strong className="text-cyan-400">{c.vol_oi_ratio}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Active Expiry:</span>
                <strong className="text-slate-200">{c.expiry_date}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Days to Expiry (DTE):</span>
                <strong className={c.dte <= 5 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {c.dte !== null ? `${c.dte} Days` : 'N/A'}
                </strong>
              </div>
            </div>

            {/* Warnings Alert */}
            {c.warnings && c.warnings.length > 0 ? (
              <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 flex flex-col gap-1">
                <span className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  Risk Notification
                </span>
                <span>{c.warnings[0]}</span>
              </div>
            ) : (
              <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/20 text-[10px] text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Active executable liquidity
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Transaction-Cost Friction Calculator */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-400" />
              Dynamic Institutional Round-Trip Transaction Cost Model
            </h3>
            <p className="text-xs text-slate-400">
              Accounts for full round-trip friction across two contract legs (Buy A + Short B, then reverse unwind).
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/40 text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Round-Trip Hurdle</span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
              ₹{totalRoundTripFriction.toFixed(2)}
              <span className="text-xs font-normal text-slate-400 font-sans ml-1">/ 10g</span>
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Reference Gold (₹/10g)</label>
            <input
              type="number"
              value={goldPrice}
              onChange={(e) => setGoldPrice(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Brokerage (bps)</label>
            <input
              type="number"
              step="0.5"
              value={brokerageBps}
              onChange={(e) => setBrokerageBps(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Exchange Charges (%)</label>
            <input
              type="number"
              step="0.0005"
              value={exchangeFeeRate}
              onChange={(e) => setExchangeFeeRate(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Commodity Tax CTT (%)</label>
            <input
              type="number"
              step="0.005"
              value={cttRate}
              onChange={(e) => setCttRate(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">GST on Fees (%)</label>
            <input
              type="number"
              value={gstRate}
              onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Slippage Buffer (₹/10g)</label>
            <input
              type="number"
              value={slippagePer10g}
              onChange={(e) => setSlippagePer10g(parseFloat(e.target.value) || 0)}
              className="w-full p-2 rounded bg-slate-950 border border-slate-800 text-white font-mono"
            />
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 text-xs font-mono">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="p-2.5">Cost Component</th>
                <th className="p-2.5">Statutory Basis / Rate</th>
                <th className="p-2.5">Application Scope</th>
                <th className="p-2.5 text-right">Calculated Cost (₹/10g)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              <tr>
                <td className="p-2.5 font-bold text-white">Brokerage</td>
                <td className="p-2.5">{brokerageBps} bps (0.01%)</td>
                <td className="p-2.5 text-slate-400">Turnover on 4 transactions</td>
                <td className="p-2.5 text-right font-bold text-slate-200">₹{totalBrokerage.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-white">MCX Exchange Transaction Fee</td>
                <td className="p-2.5">{exchangeFeeRate}%</td>
                <td className="p-2.5 text-slate-400">Exchange schedule</td>
                <td className="p-2.5 text-right font-bold text-slate-200">₹{totalExchangeCharges.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-white">Commodity Transaction Tax (CTT)</td>
                <td className="p-2.5">{cttRate}%</td>
                <td className="p-2.5 text-slate-400">Non-agri sell turnover</td>
                <td className="p-2.5 text-right font-bold text-slate-200">₹{totalCtt.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-white">Goods & Services Tax (GST)</td>
                <td className="p-2.5">{gstRate}%</td>
                <td className="p-2.5 text-slate-400">On Brokerage + Exchange charges</td>
                <td className="p-2.5 text-right font-bold text-slate-200">₹{totalGst.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-white">Stamp Duty</td>
                <td className="p-2.5">{stampDutyRate}%</td>
                <td className="p-2.5 text-slate-400">Buy side turnover</td>
                <td className="p-2.5 text-right font-bold text-slate-200">₹{totalStampDuty.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-2.5 font-bold text-white">Execution Slippage Buffer</td>
                <td className="p-2.5">₹{slippagePer10g} per leg</td>
                <td className="p-2.5 text-slate-400">Bid-ask crossing buffer (2 legs)</td>
                <td className="p-2.5 text-right font-bold text-slate-200">₹{totalSlippage.toFixed(2)}</td>
              </tr>
              <tr className="bg-slate-900/80 font-bold text-amber-400">
                <td className="p-2.5 text-white" colSpan={3}>Total Round-Trip Hurdle Threshold:</td>
                <td className="p-2.5 text-right text-base text-amber-400">₹{totalRoundTripFriction.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Explainability Note */}
        <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Institutional Cost Filter:</strong> Any statistical spread dislocation smaller than <strong>₹{totalRoundTripFriction.toFixed(2)}/10g</strong> is economically unexecutable. In the walk-forward backtesting lab, every executed signal deducts this exact friction hurdle from the gross spread before recording net performance.
          </div>
        </div>
      </div>
    </div>
  );
}
