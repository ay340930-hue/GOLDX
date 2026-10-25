import React, { useState } from 'react';

export default function EquityCurveChart({ equityCurve = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!equityCurve || equityCurve.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        No equity curve generated yet. Run backtest to populate.
      </div>
    );
  }

  const width = 800;
  const height = 240;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const pnlValues = equityCurve.map(d => d.cumulative_net_pnl);
  const minPnl = Math.min(0, ...pnlValues);
  const maxPnl = Math.max(100, ...pnlValues) * 1.15;
  const pnlRange = maxPnl - minPnl || 1;

  const getX = (idx) => padding.left + (idx / Math.max(equityCurve.length - 1, 1)) * chartW;
  const getYPnl = (val) => padding.top + chartH - ((val - minPnl) / pnlRange) * chartH;

  const points = equityCurve.map((d, i) => `${getX(i)},${getYPnl(d.cumulative_net_pnl)}`).join(' ');

  // Gradient area fill
  const areaPoints = `${getX(0)},${getYPnl(minPnl)} ${points} ${getX(equityCurve.length - 1)},${getYPnl(minPnl)}`;

  const activeItem = hoverIndex !== null ? equityCurve[hoverIndex] : equityCurve[equityCurve.length - 1];

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full"></span>
            Cumulative Net Spread P&L (₹/10g)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-600 rounded-full"></span>
            Zero Baseline
          </span>
        </div>

        {activeItem && (
          <div className="font-mono text-xs text-slate-300">
            Trade #{activeItem.trade} ({activeItem.date}) | Cumulative Net: <strong className={activeItem.cumulative_net_pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
              ₹{activeItem.cumulative_net_pnl?.toLocaleString()}
            </strong> | Drawdown: <span className="text-rose-400">₹{activeItem.drawdown?.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden bg-slate-950/60 rounded-lg border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width * width;
            const idx = Math.round(((relX - padding.left) / chartW) * (equityCurve.length - 1));
            if (idx >= 0 && idx < equityCurve.length) setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Zero Line */}
          <line
            x1={padding.left}
            y1={getYPnl(0)}
            x2={width - padding.right}
            y2={getYPnl(0)}
            stroke="#475569"
            strokeDasharray="3 3"
          />
          <text x={padding.left - 6} y={getYPnl(0) + 4} fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">
            ₹0
          </text>

          {/* Max and Min Grid Labels */}
          <text x={padding.left - 6} y={padding.top + 10} fill="#10B981" fontSize="9" textAnchor="end" fontFamily="monospace">
            ₹{Math.round(maxPnl).toLocaleString()}
          </text>

          {/* Area Fill */}
          <polygon points={areaPoints} fill="url(#equityGrad)" />

          {/* Equity Line */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            points={points}
            strokeLinejoin="round"
          />

          {/* Trade Markers */}
          {equityCurve.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getYPnl(d.cumulative_net_pnl)}
              r="3.5"
              fill={d.cumulative_net_pnl >= 0 ? "#10B981" : "#EF4444"}
              stroke="#0A0E17"
              strokeWidth="1.5"
            />
          ))}

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
              <circle
                cx={getX(hoverIndex)}
                cy={getYPnl(equityCurve[hoverIndex].cumulative_net_pnl)}
                r="5"
                fill="#34D399"
                stroke="#0A0E17"
                strokeWidth="2"
              />
            </g>
          )}

          {/* X-axis milestones */}
          {[0, Math.floor(equityCurve.length * 0.5), equityCurve.length - 1].map((idx) => {
            if (!equityCurve[idx]) return null;
            return (
              <text
                key={idx}
                x={getX(idx)}
                y={height - padding.bottom + 16}
                fill="#64748B"
                fontSize="9"
                textAnchor="middle"
                fontFamily="monospace"
              >
                {equityCurve[idx].date || `T#${equityCurve[idx].trade}`}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
