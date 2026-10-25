import React, { useState } from 'react';

export default function ZScoreTimelineChart({ data = [], threshold = 2.0, onSelectAnomaly }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-sm">
        No Z-Score data available
      </div>
    );
  }

  const width = 800;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 35, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Max Z extent (at least ±3.5 for full visibility)
  const zScores = data.map(d => d.ZScore).filter(z => z !== null && !isNaN(z));
  const maxZ = Math.max(3.5, ...zScores.map(Math.abs)) * 1.1;

  const getX = (idx) => padding.left + (idx / (data.length - 1)) * chartW;
  const getYZ = (z) => padding.top + chartH / 2 - (z / maxZ) * (chartH / 2);

  // Generate Z-Score path points
  const pointsZ = data
    .map((d, i) => (d.ZScore !== null && !isNaN(d.ZScore) ? `${getX(i)},${getYZ(d.ZScore)}` : null))
    .filter(Boolean)
    .join(' ');

  // Identify anomalies
  const anomalyPoints = data
    .map((d, i) => ({ ...d, origIndex: i }))
    .filter(d => d.ZScore !== null && Math.abs(d.ZScore) >= threshold);

  const activeItem = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 rounded-full"></span>
            Rolling Z-Score
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500/80 rounded-full"></span>
            Anomaly Threshold (±{threshold}σ)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-slate-600 rounded-full"></span>
            Critical Band (±3.0σ)
          </span>
        </div>

        {activeItem && activeItem.ZScore !== null && (
          <div className="font-mono text-xs text-slate-300">
            {activeItem.Date} | Z: <strong className={Math.abs(activeItem.ZScore) >= threshold ? "text-amber-400" : "text-white"}>
              {activeItem.ZScore >= 0 ? `+${activeItem.ZScore}` : activeItem.ZScore}σ
            </strong>
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
            const idx = Math.round(((relX - padding.left) / chartW) * (data.length - 1));
            if (idx >= 0 && idx < data.length) setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Zero Mean Line */}
          <line
            x1={padding.left}
            y1={getYZ(0)}
            x2={width - padding.right}
            y2={getYZ(0)}
            stroke="#475569"
            strokeWidth="1"
          />
          <text x={padding.left - 6} y={getYZ(0) + 4} fill="#64748B" fontSize="9" textAnchor="end" fontFamily="monospace">
            0σ
          </text>

          {/* Positive and Negative Configured Threshold Bands */}
          <line
            x1={padding.left}
            y1={getYZ(threshold)}
            x2={width - padding.right}
            y2={getYZ(threshold)}
            stroke="#EF4444"
            strokeDasharray="4 3"
            strokeOpacity="0.8"
          />
          <text x={padding.left - 6} y={getYZ(threshold) + 4} fill="#F87171" fontSize="9" textAnchor="end" fontFamily="monospace">
            +{threshold}σ
          </text>

          <line
            x1={padding.left}
            y1={getYZ(-threshold)}
            x2={width - padding.right}
            y2={getYZ(-threshold)}
            stroke="#EF4444"
            strokeDasharray="4 3"
            strokeOpacity="0.8"
          />
          <text x={padding.left - 6} y={getYZ(-threshold) + 4} fill="#F87171" fontSize="9" textAnchor="end" fontFamily="monospace">
            -{threshold}σ
          </text>

          {/* Critical 3.0 Sigma Band */}
          <line
            x1={padding.left}
            y1={getYZ(3.0)}
            x2={width - padding.right}
            y2={getYZ(3.0)}
            stroke="#B91C1C"
            strokeDasharray="2 4"
            strokeOpacity="0.5"
          />
          <line
            x1={padding.left}
            y1={getYZ(-3.0)}
            x2={width - padding.right}
            y2={getYZ(-3.0)}
            stroke="#B91C1C"
            strokeDasharray="2 4"
            strokeOpacity="0.5"
          />

          {/* Rolling Z-Score Line */}
          <polyline
            fill="none"
            stroke="#F59E0B"
            strokeWidth="2"
            points={pointsZ}
            strokeLinejoin="round"
          />

          {/* Anomaly Outlier Markers */}
          {anomalyPoints.map((pt, i) => (
            <circle
              key={i}
              cx={getX(pt.origIndex)}
              cy={getYZ(pt.ZScore)}
              r="4"
              fill={Math.abs(pt.ZScore) >= 3.0 ? "#EF4444" : "#F59E0B"}
              stroke="#0A0E17"
              strokeWidth="2"
              className="cursor-pointer transition-transform hover:scale-150"
              onClick={() => onSelectAnomaly && onSelectAnomaly(pt)}
            />
          ))}

          {/* Crosshair on hover */}
          {hoverIndex !== null && data[hoverIndex] && data[hoverIndex].ZScore !== null && (
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
                cy={getYZ(data[hoverIndex].ZScore)}
                r="4"
                fill="#FBBF24"
                stroke="#0F172A"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Date Axis labels */}
          {[0, Math.floor(data.length * 0.33), Math.floor(data.length * 0.66), data.length - 1].map((idx) => {
            if (!data[idx]) return null;
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
                {data[idx].Date}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
