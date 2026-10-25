import React, { useState } from 'react';

export default function InteractiveSpreadChart({ data = [], symbolA = 'GOLDM', symbolB = 'GOLDGUINEA' }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [showPriceA, setShowPriceA] = useState(true);
  const [showPriceB, setShowPriceB] = useState(true);
  const [showSpread, setShowSpread] = useState(true);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm">
        No time-series data available for chart
      </div>
    );
  }

  const width = 800;
  const height = 300;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Price Extents
  const minPrice = Math.min(...data.map(d => Math.min(d.PriceA_Norm || Infinity, d.PriceB_Norm || Infinity)));
  const maxPrice = Math.max(...data.map(d => Math.max(d.PriceA_Norm || -Infinity, d.PriceB_Norm || -Infinity)));
  const priceRange = maxPrice - minPrice || 1;

  // Spread Extents
  const spreads = data.map(d => d.Spread).filter(s => s !== null && !isNaN(s));
  const minSpread = Math.min(...spreads);
  const maxSpread = Math.max(...spreads);
  const spreadRange = Math.max(Math.abs(minSpread), Math.abs(maxSpread)) * 1.2 || 10;

  // Mapping functions
  const getX = (idx) => padding.left + (idx / (data.length - 1)) * chartW;
  const getYPrice = (val) => padding.top + chartH - ((val - minPrice) / priceRange) * chartH;
  const getYSpread = (val) => padding.top + chartH / 2 - (val / spreadRange) * (chartH / 2);

  // Generate SVG path points
  const pointsA = data.map((d, i) => `${getX(i)},${getYPrice(d.PriceA_Norm)}`).join(' ');
  const pointsB = data.map((d, i) => `${getX(i)},${getYPrice(d.PriceB_Norm)}`).join(' ');
  const pointsSpread = data
    .map((d, i) => d.Spread !== null ? `${getX(i)},${getYSpread(d.Spread)}` : null)
    .filter(Boolean)
    .join(' ');

  const activeItem = hoverIndex !== null ? data[hoverIndex] : data[data.length - 1];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Chart Control Ribbon & Active Inspection */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPriceA(!showPriceA)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              showPriceA ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-amber-400 rounded-full"></span>
            {symbolA} (Norm ₹/10g)
          </button>
          <button
            onClick={() => setShowPriceB(!showPriceB)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              showPriceB ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full"></span>
            {symbolB} (Norm ₹/10g)
          </button>
          <button
            onClick={() => setShowSpread(!showSpread)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-colors ${
              showSpread ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-800/40 border-slate-700/50 text-slate-500'
            }`}
          >
            <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full"></span>
            Spread (₹/10g)
          </button>
        </div>

        {activeItem && (
          <div className="flex items-center gap-4 text-slate-300 font-mono text-xs bg-slate-900/60 px-3 py-1.5 rounded border border-slate-800">
            <span>Date: <strong className="text-white">{activeItem.Date}</strong></span>
            <span>{symbolA}: <strong className="text-amber-400">₹{activeItem.PriceA_Norm?.toLocaleString()}</strong></span>
            <span>{symbolB}: <strong className="text-cyan-400">₹{activeItem.PriceB_Norm?.toLocaleString()}</strong></span>
            <span>Spread: <strong className={activeItem.Spread >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {activeItem.Spread >= 0 ? `+₹${activeItem.Spread}` : `-₹${Math.abs(activeItem.Spread)}`}
            </strong></span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden bg-slate-950/60 rounded-lg border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width * width;
            const idx = Math.round(((relX - padding.left) / chartW) * (data.length - 1));
            if (idx >= 0 && idx < data.length) setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + pct * chartH;
            const priceVal = Math.round(maxPrice - pct * priceRange);
            return (
              <g key={i}>
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#1E293B" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={y + 4} fill="#64748B" fontSize="10" textAnchor="end" fontFamily="monospace">
                  ₹{priceVal.toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Zero Spread Reference Line */}
          {showSpread && (
            <line
              x1={padding.left}
              y1={getYSpread(0)}
              x2={width - padding.right}
              y2={getYSpread(0)}
              stroke="#059669"
              strokeDasharray="4 4"
              strokeOpacity="0.4"
            />
          )}

          {/* Price Series A */}
          {showPriceA && (
            <polyline
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              points={pointsA}
              strokeLinejoin="round"
            />
          )}

          {/* Price Series B */}
          {showPriceB && (
            <polyline
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2"
              points={pointsB}
              strokeLinejoin="round"
            />
          )}

          {/* Spread Series */}
          {showSpread && (
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              points={pointsSpread}
              strokeLinejoin="round"
            />
          )}

          {/* Hover Crosshair */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={padding.top}
                x2={getX(hoverIndex)}
                y2={height - padding.bottom}
                stroke="#94A3B8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {showPriceA && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getYPrice(data[hoverIndex].PriceA_Norm)}
                  r="4"
                  fill="#F59E0B"
                  stroke="#0F172A"
                  strokeWidth="2"
                />
              )}
              {showPriceB && (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getYPrice(data[hoverIndex].PriceB_Norm)}
                  r="4"
                  fill="#06B6D4"
                  stroke="#0F172A"
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* Date Axis labels (4 milestones) */}
          {[0, Math.floor(data.length * 0.33), Math.floor(data.length * 0.66), data.length - 1].map((idx) => {
            if (!data[idx]) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={height - padding.bottom + 18}
                fill="#64748B"
                fontSize="10"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {data[idx].Date}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
