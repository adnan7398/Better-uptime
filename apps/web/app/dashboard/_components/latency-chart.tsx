"use client";

import { useMemo, useState } from "react";
import type { MonitorCheck } from "../../../lib/api";

const WIDTH = 720;
const HEIGHT = 220;
const PAD_LEFT = 48;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;

export function LatencyChart({ checks }: { checks: MonitorCheck[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const { points, maxLatency, minTime, maxTime } = useMemo(() => {
    if (checks.length === 0) {
      return { points: [], maxLatency: 0, minTime: 0, maxTime: 0 };
    }
    const times = checks.map((c) => new Date(c.createdAt).getTime());
    const latencies = checks.map((c) => c.response_time_ms);
    return {
      points: checks,
      maxLatency: Math.max(...latencies, 1),
      minTime: Math.min(...times),
      maxTime: Math.max(...times)
    };
  }, [checks]);

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  function xFor(time: number) {
    if (maxTime === minTime) return PAD_LEFT + plotWidth / 2;
    return PAD_LEFT + ((time - minTime) / (maxTime - minTime)) * plotWidth;
  }

  function yFor(latency: number) {
    return PAD_TOP + plotHeight - (latency / maxLatency) * plotHeight;
  }

  if (points.length === 0) {
    return <p className="viz-empty">No checks recorded yet in this window.</p>;
  }

  const linePath = points
    .map((p, i) => {
      const x = xFor(new Date(p.createdAt).getTime());
      const y = yFor(p.response_time_ms);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${linePath} L${xFor(new Date(points[points.length - 1]!.createdAt).getTime()).toFixed(1)},${(
    PAD_TOP + plotHeight
  ).toFixed(1)} L${xFor(new Date(points[0]!.createdAt).getTime()).toFixed(1)},${(PAD_TOP + plotHeight).toFixed(1)} Z`;

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="viz-root">
      <style>{`
        .viz-root {
          color-scheme: light;
          --surface-1: #fcfcfb;
          --text-primary: #0b0b0b;
          --text-secondary: #52514e;
          --text-muted: #898781;
          --gridline: #e1e0d9;
          --series-1: #2a78d6;
          --status-critical: #d03b3b;
        }
        @media (prefers-color-scheme: dark) {
          :root:where(:not([data-theme="light"])) .viz-root {
            color-scheme: dark;
            --surface-1: #1a1a19;
            --text-primary: #ffffff;
            --text-secondary: #c3c2b7;
            --text-muted: #898781;
            --gridline: #2c2c2a;
            --series-1: #3987e5;
            --status-critical: #e66767;
          }
        }
        :root[data-theme="dark"] .viz-root {
          color-scheme: dark;
          --surface-1: #1a1a19;
          --text-primary: #ffffff;
          --text-secondary: #c3c2b7;
          --text-muted: #898781;
          --gridline: #2c2c2a;
          --series-1: #3987e5;
          --status-critical: #e66767;
        }
        .viz-root { background: var(--surface-1); }
        .viz-svg text { fill: var(--text-muted); font-size: 11px; }
        .viz-tooltip {
          position: absolute;
          pointer-events: none;
          background: var(--surface-1);
          color: var(--text-primary);
          border: 1px solid var(--gridline);
          border-radius: 4px;
          padding: 6px 8px;
          font-size: 12px;
          transform: translate(-50%, -110%);
          white-space: nowrap;
        }
        .viz-tooltip strong { color: var(--text-primary); }
        .viz-tooltip span { color: var(--text-secondary); }
        .viz-toggle {
          font-size: 12px;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
        table.viz-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        table.viz-table th, table.viz-table td {
          text-align: left;
          padding: 4px 8px;
          border-bottom: 1px solid var(--gridline);
          color: var(--text-primary);
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        <button className="viz-toggle" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "View as chart" : "View as table"}
        </button>
      </div>

      {showTable ? (
        <table className="viz-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Status</th>
              <th>Response time</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i}>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
                <td>{p.status}</td>
                <td>{p.response_time_ms}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div style={{ position: "relative" }}>
          <svg
            className="viz-svg"
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ width: "100%", height: "auto" }}
            onPointerMove={(e) => {
              const svg = e.currentTarget;
              const rect = svg.getBoundingClientRect();
              const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
              let nearest = 0;
              let nearestDist = Infinity;
              points.forEach((p, i) => {
                const x = xFor(new Date(p.createdAt).getTime());
                const dist = Math.abs(x - relX);
                if (dist < nearestDist) {
                  nearestDist = dist;
                  nearest = i;
                }
              });
              setHoverIndex(nearest);
            }}
            onPointerLeave={() => setHoverIndex(null)}
          >
            {/* gridlines */}
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={PAD_TOP + plotHeight * f}
                y2={PAD_TOP + plotHeight * f}
                stroke="var(--gridline)"
                strokeWidth={1}
              />
            ))}
            <text x={4} y={PAD_TOP + 4}>{maxLatency}ms</text>
            <text x={4} y={PAD_TOP + plotHeight + 4}>0ms</text>

            {/* area fill */}
            <path d={areaPath} fill="var(--series-1)" opacity={0.1} stroke="none" />
            {/* line */}
            <path d={linePath} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

            {/* down-check markers */}
            {points.map((p, i) =>
              p.status === "Down" ? (
                <circle
                  key={i}
                  cx={xFor(new Date(p.createdAt).getTime())}
                  cy={yFor(p.response_time_ms)}
                  r={5}
                  fill="var(--status-critical)"
                  stroke="var(--surface-1)"
                  strokeWidth={2}
                />
              ) : null
            )}

            {/* crosshair */}
            {hovered && (
              <line
                x1={xFor(new Date(hovered.createdAt).getTime())}
                x2={xFor(new Date(hovered.createdAt).getTime())}
                y1={PAD_TOP}
                y2={PAD_TOP + plotHeight}
                stroke="var(--text-muted)"
                strokeWidth={1}
              />
            )}
          </svg>

          {hovered && (
            <div
              className="viz-tooltip"
              style={{
                left: `${(xFor(new Date(hovered.createdAt).getTime()) / WIDTH) * 100}%`,
                top: `${(yFor(hovered.response_time_ms) / HEIGHT) * 100}%`
              }}
            >
              <div><strong>{hovered.response_time_ms}ms</strong> <span>({hovered.status})</span></div>
              <span>{new Date(hovered.createdAt).toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
