import React from 'react';
import { 
  BookOpen, Layers, TrendingUp, AlertTriangle, Activity, 
  ShieldCheck, DollarSign, Award, CheckCircle2, Info
} from 'lucide-react';

export default function MethodologyView() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="gold-badge text-xs">Hack in Hills '26</span>
          <span className="text-xs text-slate-400">Problem Statement 03: Commodity Derivatives Intelligence</span>
        </div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-amber-400" />
          GOLDX Quantitative Architecture & Methodology
        </h2>
        <p className="text-xs text-slate-300">
          Transforming raw MCX gold-futures data into explainable cross-contract intelligence through defensible normalization, statistical relative value, and walk-forward validation.
        </p>
      </div>

      {/* Team Submission Credential Card */}
      <div className="p-5 rounded-xl gold-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Hackathon Team</span>
            <h3 className="text-base font-bold text-white">CodeHimalayan</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Anshika Yadav <span className="text-slate-500">(Full-Stack Analytics Lead)</span> • Aniket Kaushik <span className="text-slate-500">(Data, Infrastructure and Deployment Lead)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono">
          <span className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-amber-300 font-semibold">
            Submission PS03
          </span>
          <span className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-400 font-semibold">
            v2024.1 Production Prototype
          </span>
        </div>
      </div>

      {/* 1. The Core Problem & Normalization Math */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-4 text-xs leading-relaxed text-slate-300">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Layers className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">1. Contract Normalization Architecture</h3>
        </div>

        <p>
          MCX lists four gold futures contracts: <strong>GOLDM</strong> (Mini, 100g), <strong>GOLDTEN</strong> (10g), <strong>GOLDGUINEA</strong> (8g), and <strong>GOLDPETAL</strong> (1g). These instruments differ in trading unit, quotation basis, fineness, and liquidity. Their raw bhavcopy prices cannot automatically be compared like-for-like.
        </p>

        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono flex flex-col gap-2">
          <span className="text-slate-400 font-bold text-[11px]">Standard Normalization Formula:</span>
          <span className="text-amber-300 text-sm">
            NormalizedPrice(t) = [ QuotedPrice(t) / QuotationBasis ] × TargetUnitGrams × [ TargetPurity / ContractPurity ]
          </span>
          <span className="text-slate-500 text-[10px]">
            Target Analytical Basis: ₹ per 10 grams (999 fineness parity)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <strong className="text-amber-400 block mb-1">GOLDM:</strong>
            <span>Quoted: ₹/10g</span>
            <span className="text-slate-400 block">Multiplier: 1.0x</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <strong className="text-amber-400 block mb-1">GOLDTEN:</strong>
            <span>Quoted: ₹/10g</span>
            <span className="text-slate-400 block">Multiplier: 1.0x</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <strong className="text-amber-400 block mb-1">GOLDGUINEA:</strong>
            <span>Quoted: ₹/8g</span>
            <span className="text-slate-400 block">Multiplier: 1.25x (10/8)</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
            <strong className="text-amber-400 block mb-1">GOLDPETAL:</strong>
            <span>Quoted: ₹/1g</span>
            <span className="text-slate-400 block">Multiplier: 10.0x (10/1)</span>
          </div>
        </div>
      </div>

      {/* 2. Relative Value & Z-Score Mathematics */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-4 text-xs leading-relaxed text-slate-300">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">2. Relative-Value & Statistical Spread Formulation</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <span className="text-cyan-400 font-bold">Absolute Spread:</span>
            <span className="text-white text-sm">Spread(t) = PriceA_Norm(t) - PriceB_Norm(t)</span>
            <span className="text-slate-500 text-[10px]">Expressed in ₹ per 10 grams</span>
          </div>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <span className="text-cyan-400 font-bold">Rolling Historical Z-Score:</span>
            <span className="text-white text-sm">Z(t) = [ Spread(t) - μ_W(t) ] / σ_W(t)</span>
            <span className="text-slate-500 text-[10px]">W = Lookback window (e.g. 30 sessions), zero look-ahead bias</span>
          </div>
        </div>
      </div>

      {/* 3. The 8-Point Institutional Diagnostic */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-4 text-xs leading-relaxed text-slate-300">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white">3. Institutional 8-Point Explainability Framework</h3>
        </div>

        <p>
          GOLDX rejects opaque black-box outputs that merely show a buy/sell indicator. Every flagged deviation generates a structured 8-point institutional diagnostic:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">1. What did GOLDX observe?</strong>
            <span>Exact spread breach, deviation magnitude in ₹ and %, and statistical Z-score.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">2. How was it calculated?</strong>
            <span>Step-by-step arithmetic from raw contract quotes through applied multipliers.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">3. What historical reference was used?</strong>
            <span>Lookback window length W, historical rolling mean μ, rolling std σ, and percentile.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">4. What assumptions were applied?</strong>
            <span>Fineness standardization (999), delivery parity outside tender periods.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">5. What do liquidity and expiry tell us?</strong>
            <span>Volume, open interest, turnover ratio, and days to expiry (DTE) tender warnings.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">6. Were transaction costs included?</strong>
            <span>Brokerage, MCX exchange fees, CTT (0.01%), GST (18%), stamp duty, and slippage buffer.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">7. What are the limitations?</strong>
            <span>Delivery coin packaging premiums, lot size mismatches, and execution risk.</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <strong className="text-amber-400 block mb-1">8. What additional evidence is required?</strong>
            <span>Local bullion spot market basis, COMEX international parity, and Level-2 order book depth.</span>
          </div>
        </div>
      </div>

      {/* 4. Responsible Walk-Forward Backtesting */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-4 text-xs leading-relaxed text-slate-300">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Activity className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">4. Walk-Forward Backtesting (Zero Look-Ahead Bias)</h3>
        </div>

        <p>
          Standard backtests often suffer from look-ahead bias and full-sample overfitting. GOLDX enforces strict chronological walk-forward sliding folds:
        </p>

        <ul className="list-disc pl-5 flex flex-col gap-1.5 text-slate-300">
          <li><strong>Chronological Sliding Folds:</strong> Evaluates sequential test periods using only past data.</li>
          <li><strong>Zero Look-Ahead:</strong> At day t, features and signals use observations strictly up to t-1.</li>
          <li><strong>Separation of Strategy from Gold Price:</strong> Evaluates spread performance independently from directional gold market rallies.</li>
          <li><strong>Full Friction Accounting:</strong> Subtracts round-trip brokerage, statutory taxes, and slippage on every simulated signal.</li>
          <li><strong>Expiry Hard Cutoff:</strong> Automatically closes open positions when DTE ≤ 5 to prevent physical delivery obligations.</li>
        </ul>
      </div>

      {/* Responsible Compliance Disclaimer */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white block mb-1">Responsible Quantitative Disclaimer</strong>
          GOLDX is an explainable research prototype created for Hack in Hills '26 Problem Statement 03. It does not promise guaranteed trading profits, automated execution, or personalized investment advice. All relative-value signals represent historical statistical observations subject to transaction friction, liquidity variations, and physical settlement rules.
        </div>
      </div>
    </div>
  );
}
