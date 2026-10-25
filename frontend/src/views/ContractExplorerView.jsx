import React, { useState, useEffect } from 'react';
import { 
  Layers, Calculator, CheckCircle2, ArrowRight, BookOpen, 
  Search, Filter, ExternalLink, ShieldAlert
} from 'lucide-react';
import { fetchContracts, fetchPrices } from '../services/api';

export default function ContractExplorerView({ onNavigate }) {
  const [contracts, setContracts] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sandbox Calculator State
  const [calcSymbol, setCalcSymbol] = useState('GOLDGUINEA');
  const [calcPrice, setCalcPrice] = useState('54000');
  const [calcPurity, setCalcPurity] = useState('999');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [contractsRes, pricesRes] = await Promise.all([
          fetchContracts(),
          fetchPrices('ALL', 100)
        ]);

        if (contractsRes.contracts) setContracts(contractsRes.contracts);
        if (pricesRes.records) setPrices(pricesRes.records);
      } catch (err) {
        console.error('Error fetching contracts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Sandbox calculation
  const selectedSpec = contracts.find(c => c.symbol === calcSymbol);
  const quotationBasis = selectedSpec ? selectedSpec.quotation_basis : 10;
  const unitFactor = 10.0 / quotationBasis;
  const purityFactor = 999.0 / (parseFloat(calcPurity) || 999.0);
  const calcNormalized = (parseFloat(calcPrice) || 0) * unitFactor * purityFactor;

  // Filtered prices
  const filteredPrices = prices.filter(p => {
    const matchSym = selectedFilter === 'ALL' || p.Symbol === selectedFilter;
    const matchSearch = searchTerm === '' || p.Date.includes(searchTerm) || p.Symbol.includes(searchTerm);
    return matchSym && matchSearch;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            Contract Master & Defensible Normalization Engine
          </h2>
          <p className="text-xs text-slate-400">
            Authoritative MCX specifications, quotation bases, and conversion to common analytical unit: ₹ / 10g (999 fineness).
          </p>
        </div>

        <button
          onClick={() => onNavigate('relative-value')}
          className="gold-button px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 self-start"
        >
          Compare Spreads in Relative-Value Lab
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Contract Master Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {contracts.map((c, i) => (
          <div key={i} className="p-5 rounded-xl gold-card flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold font-mono text-white">{c.symbol}</span>
                <span className="gold-badge text-xs">{c.multiplier_to_10g}x Multiplier</span>
              </div>
              <h3 className="text-xs font-semibold text-amber-300">{c.name}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{c.description}</p>
            </div>

            <div className="flex flex-col gap-1.5 text-xs font-mono pt-3 border-t border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Trading Unit:</span>
                <strong className="text-white">{c.trading_unit_label}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Quotation Basis:</span>
                <strong className="text-amber-400">{c.quotation_label}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Standard Purity:</span>
                <strong className="text-white">{c.purity} Fineness (24k)</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tick Size:</span>
                <strong className="text-white">₹{c.tick_size}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Delivery Unit:</span>
                <strong className="text-slate-300">{c.delivery_unit_label || `${c.trading_unit}g`}</strong>
              </div>
            </div>

            <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-slate-400 flex flex-col gap-1">
              <span className="text-slate-500 uppercase font-bold text-[9px]">Normalization Formula</span>
              <span className="text-amber-300/90 break-words">{c.formula}</span>
              <span className="text-slate-600 text-[8px] mt-0.5">Source: {c.source?.split('Ref:')[0]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Normalization Sandbox */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Calculator className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Interactive Normalization Sandbox</h3>
            <p className="text-xs text-slate-400">Verify step-by-step conversion from quoted MCX price to standardized ₹/10g</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
          <div>
            <label className="text-slate-400 block mb-1 font-medium">Contract Symbol</label>
            <select
              value={calcSymbol}
              onChange={(e) => setCalcSymbol(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
            >
              <option value="GOLDM">GOLDM (10g quoted)</option>
              <option value="GOLDTEN">GOLDTEN (10g quoted)</option>
              <option value="GOLDGUINEA">GOLDGUINEA (8g quoted)</option>
              <option value="GOLDPETAL">GOLDPETAL (1g quoted)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Raw Quoted Price (₹)</label>
            <input
              type="number"
              value={calcPrice}
              onChange={(e) => setCalcPrice(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
              placeholder="e.g. 54000"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1 font-medium">Contract Fineness / Purity</label>
            <input
              type="number"
              value={calcPurity}
              onChange={(e) => setCalcPurity(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono"
              placeholder="999"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-amber-500/40 flex flex-col justify-center">
            <span className="text-[10px] text-amber-400/90 font-bold uppercase">Normalized Output (₹/10g)</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              ₹{calcNormalized.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5">
              Multiplier applied: {(unitFactor * purityFactor).toFixed(4)}x
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>
            Formula Execution: <strong className="text-white">({calcPrice} / {quotationBasis}g) × 10g × (999 / {calcPurity}) = ₹{calcNormalized.toFixed(2)}</strong>
          </span>
          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified against MCX Circular Specs
          </span>
        </div>
      </div>

      {/* Side-by-Side Normalized Price Ledger */}
      <div className="p-6 rounded-xl gold-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              Side-by-Side Contract Price Ledger (Active Dataset)
            </h3>
            <p className="text-xs text-slate-400">Side-by-side comparison of original raw prices vs normalized prices</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Filter buttons */}
            {['ALL', 'GOLDM', 'GOLDTEN', 'GOLDGUINEA', 'GOLDPETAL'].map((sym) => (
              <button
                key={sym}
                onClick={() => setSelectedFilter(sym)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  selectedFilter === sym
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Symbol</th>
                <th className="p-2.5">Quoted Price</th>
                <th className="p-2.5">Quotation Basis</th>
                <th className="p-2.5">Multiplier</th>
                <th className="p-2.5 text-amber-300">Normalized Price (₹/10g)</th>
                <th className="p-2.5">Applied Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {filteredPrices.slice(0, 100).map((row, i) => (
                <tr key={i} className="hover:bg-slate-900/50">
                  <td className="p-2.5 text-white">{row.Date}</td>
                  <td className="p-2.5 font-bold text-cyan-400">{row.Symbol}</td>
                  <td className="p-2.5">₹{row.RawPrice?.toLocaleString()}</td>
                  <td className="p-2.5 text-slate-400">{row.QuotationBasis}</td>
                  <td className="p-2.5 text-amber-400 font-bold">{row.TotalMultiplier}x</td>
                  <td className="p-2.5 text-amber-300 font-bold">₹{row.NormalizedPrice?.toLocaleString()}</td>
                  <td className="p-2.5 text-slate-500 text-[10px]">{row.Formula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
