import React, { useState } from 'react';
import { Award, ArrowRight, ArrowLeft, CheckCircle2, X, Compass, ExternalLink } from 'lucide-react';

const STEPS = [
  {
    step: 1,
    title: "1. Overview & Active Dataset Provenance",
    view: "overview",
    badge: "PS03 Scope",
    description: "GOLDX ingests MCX gold futures (GOLDM, GOLDTEN, GOLDGUINEA, GOLDPETAL) and aligns them onto a defensible common analytical unit: ₹ per 10 grams (999 fineness).",
    actionNote: "Inspect the top KPI ribbon: Total Contracts (4), Valid Observations (1,000), Data Quality Score (100%), and active relative spread."
  },
  {
    step: 2,
    title: "2. Data Ingestion & Row-Level Validation",
    view: "import",
    badge: "Data Intelligence",
    description: "Test CSV upload or one-click benchmark data. GOLDX checks date formats, symbol whitelists, numerical bounds, duplicates, and stale quotes with exact line numbers.",
    actionNote: "Click 'Download Validation Report' to inspect the detailed JSON/CSV diagnostic audit report."
  },
  {
    step: 3,
    title: "3. Contract Master & Defensible Normalization",
    view: "contracts",
    badge: "Quantitative Normalization",
    description: "Raw MCX contract prices cannot be compared directly because quotation bases differ (100g, 10g, 8g Guinea, 1g Petal). GOLDX applies explicit, verifiable conversion factors.",
    actionNote: "Examine the multiplier table: GOLDGUINEA requires 1.25x (8g -> 10g), GOLDPETAL requires 10.0x (1g -> 10g)."
  },
  {
    step: 4,
    title: "4. Cross-Contract Relative-Value Spreads",
    view: "relative-value",
    badge: "Statistical Modeling",
    description: "Calculates absolute spread, percentage spread, rolling historical mean, rolling std dev, and rolling Z-score strictly on historical observations without look-ahead bias.",
    actionNote: "Switch pairs between GOLDM - GOLDGUINEA and GOLDM - GOLDPETAL, and adjust the lookback window slider."
  },
  {
    step: 5,
    title: "5. Explainable 8-Point Historical Anomaly Detection",
    view: "anomalies",
    badge: "Core Innovation",
    description: "Unlike black-box models that merely label 'BUY/SELL', GOLDX generates an institutional 8-point diagnostic answering: What happened? How was it calculated? What assumptions were made? Can it survive costs?",
    actionNote: "Click any flagged anomaly in the table to open the deep-dive institutional explainability drawer."
  },
  {
    step: 6,
    title: "6. Liquidity & Expiry Reality Check",
    view: "liquidity",
    badge: "Risk & Execution",
    description: "An apparent spread is meaningless if the contract cannot be executed in size or is entering physical delivery tender period (DTE <= 5 days).",
    actionNote: "Inspect the volume/OI turnover ratio and days to expiry (DTE) countdown cards."
  },
  {
    step: 7,
    title: "7. Realistic Transaction-Cost Friction Hurdle",
    view: "liquidity",
    badge: "Cost Awareness",
    description: "Accounts for Brokerage, Exchange transaction charges (0.0021%), CTT (0.01% sell), GST (18%), stamp duty, and slippage buffers (total hurdle ₹85 - ₹105/10g).",
    actionNote: "Adjust fee sliders to see how gross spreads are separated from net tradable edges."
  },
  {
    step: 8,
    title: "8. Chronological Walk-Forward Backtesting",
    view: "backtesting",
    badge: "Responsible Backtesting",
    description: "Replays historical observations chronologically using sliding train and test folds. Signals on day t are generated strictly without future information.",
    actionNote: "Click 'Run Walk-Forward Backtest' and inspect the real simulation results."
  },
  {
    step: 9,
    title: "9. Fold Stability Matrix & Simulated Event Ledger",
    view: "backtesting",
    badge: "No Curve-Fitting",
    description: "Evaluates whether the analytical rule remains stable across chronological market regimes, reporting fold-by-fold win rate, net P&L, and trade reasons.",
    actionNote: "Scroll down to the Trade Ledger to verify entry/exit prices, fees deducted, and holding periods."
  },
  {
    step: 10,
    title: "10. Transparent Methodology & PS03 Alignment",
    view: "methodology",
    badge: "Compliance & About",
    description: "GOLDX does not claim guaranteed profits or market predictions. Built by Team CodeHimalayan for Hack in Hills '26 Problem Statement 03.",
    actionNote: "Review full mathematical formulations, contract references, and responsible disclosure statements."
  }
];

export default function JudgeTourModal({ isOpen, onClose, currentView, onNavigate }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      if (onNavigate) onNavigate(STEPS[nextIdx].view);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1;
      setCurrentStepIndex(prevIdx);
      if (onNavigate) onNavigate(STEPS[prevIdx].view);
    }
  };

  const handleJump = (idx) => {
    setCurrentStepIndex(idx);
    if (onNavigate) onNavigate(STEPS[idx].view);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-xl shadow-2xl p-6 flex flex-col gap-5 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Hack in Hills '26 — Judge Demo Guide
                <span className="text-xs font-normal text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  Step {currentStep.step} of 10
                </span>
              </h2>
              <p className="text-xs text-slate-400">Problem Statement 03: Commodity Derivatives Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="flex flex-col gap-3 py-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">{currentStep.title}</h3>
            <span className="gold-badge text-xs">{currentStep.badge}</span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="p-3.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-200">Recommended Judge Interaction:</strong> {currentStep.actionNote}
            </div>
          </div>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => handleJump(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? 'w-6 bg-amber-400'
                    : idx < currentStepIndex
                    ? 'bg-emerald-500'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                title={s.title}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="gold-button px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              {currentStepIndex === STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
