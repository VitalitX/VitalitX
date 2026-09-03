import { useState, useEffect, useRef } from 'react';

const STOCK_COLORS = { HLT: '#34D399', WLT: '#FBBF24', SOC: '#60A5FA' };
const USER_ID = 'shrithik';

function useHistory() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.fetch(`/portfolio/${USER_ID}/history?days=30`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { data, loading };
}

function LineChart({ points, width, height, color = '#FBBF24', field = 'total' }) {
  if (!points || points.length < 2) return (
    <svg width={width} height={height}>
      <text x={width/2} y={height/2} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize={12} fontFamily="Nunito, sans-serif">
        Chart builds as you use the app
      </text>
    </svg>
  );

  const values = points.map(p => p[field]);
  const min    = Math.min(...values);
  const max    = Math.max(...values);
  const range  = max - min || 1;
  const padX   = 8, padY = 12;
  const W      = width - padX * 2;
  const H      = height - padY * 2;

  const toX = (i) => padX + (i / (points.length - 1)) * W;
  const toY = (v) => padY + (1 - (v - min) / range) * H;

  const coords  = points.map((p, i) => [toX(i), toY(p[field])]);
  const polyline = coords.map(([x, y]) => `${x},${y}`).join(' ');
  const lastX    = coords[coords.length - 1][0];
  const lastY    = coords[coords.length - 1][1];

  const areaPath = `M ${coords[0][0]},${coords[0][1]} `
    + coords.slice(1).map(([x, y]) => `L ${x},${y}`).join(' ')
    + ` L ${lastX},${padY + H} L ${padX},${padY + H} Z`;

  const fillId = `fill-${field}-${Math.random().toString(36).slice(2, 6)}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`}/>
      <polyline points={polyline} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lastX} cy={lastY} r="4" fill={color}/>
      <circle cx={lastX} cy={lastY} r="7" fill={color} opacity="0.2"/>
    </svg>
  );
}

export default function PortfolioChart() {
  const { data, loading } = useHistory();
  const [activeStock, setActiveStock] = useState('total');
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const chartRef = useRef(null);

  const points  = data?.points || [];
  const summary = data?.summary || {};
  const isUp    = (summary.change_pct || 0) >= 0;

  const stockTabs = [
    { key: 'total', label: 'Portfolio', color: '#FBBF24' },
    { key: 'HLT',   label: 'Health',    color: '#34D399' },
    { key: 'WLT',   label: 'Wealth',    color: '#FBBF24' },
    { key: 'SOC',   label: 'Social',    color: '#60A5FA' },
  ];

  const activeColor = stockTabs.find(t => t.key === activeStock)?.color || '#FBBF24';

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 20,
      padding: '24px',
      marginBottom: 24,
      animation: 'fadeUp 0.5s ease 0.15s both',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
            Life Portfolio
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 32, fontWeight: 500, color: activeColor, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {points.length > 0
              ? Math.round(points[points.length - 1][activeStock] || 0).toLocaleString()
              : '—'}
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 5, fontFamily: 'var(--font-body)' }}>VTL</span>
          </div>
          {points.length > 1 && (
            <div style={{ fontSize: 13, marginTop: 5, fontFamily: 'var(--font-mono)', color: isUp ? '#34D399' : '#F87171' }}>
              {isUp ? '▲' : '▼'} {Math.abs(summary.change_pct || 0).toFixed(2)}% · 30 days
            </div>
          )}
        </div>

        {/* Stock selector tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {stockTabs.map(t => (
            <button key={t.key}
              onClick={() => setActiveStock(t.key)}
              style={{
                background: activeStock === t.key ? `${t.color}18` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeStock === t.key ? t.color + '40' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20,
                padding: '5px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                color: activeStock === t.key ? t.color : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — only render when data exists */}
      {loading && (
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>Loading…</div>
        </div>
      )}
      {!loading && points.length >= 2 && (
        <div ref={chartRef} style={{ width: '100%', height: 160, marginBottom: 8 }}>
          <LineChart points={points} width={1060} height={160} color={activeColor} field={activeStock}/>
        </div>
      )}

      {/* Per-stock mini summary */}
      {points.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--border)' }}>
          {['HLT', 'WLT', 'SOC'].map(ticker => {
            const vals   = points.map(p => p[ticker]);
            const first  = vals[0] || 0;
            const last   = vals[vals.length - 1] || 0;
            const chgPct = first ? ((last - first) / first * 100).toFixed(1) : '0.0';
            const up     = parseFloat(chgPct) >= 0;
            const color  = STOCK_COLORS[ticker];
            const labels = { HLT: 'Health', WLT: 'Wealth', SOC: 'Social' };

            return (
              <div key={ticker} style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '12px 14px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => setActiveStock(ticker)}
                onMouseEnter={e => e.currentTarget.style.borderColor = color + '30'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                  {labels[ticker]}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color, lineHeight: 1 }}>
                  {Math.round(last).toLocaleString()}
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3 }}>VTL</span>
                </div>
                <div style={{ fontSize: 11, marginTop: 4, fontFamily: 'var(--font-mono)', color: up ? '#34D399' : '#F87171' }}>
                  {up ? '▲' : '▼'} {Math.abs(parseFloat(chgPct)).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {points.length === 0 && !loading && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(251,191,36,0.05)', borderRadius: 12, border: '1px solid rgba(251,191,36,0.1)' }}>
          <div style={{ fontSize: 13, color: '#FBBF24', fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-body)' }}>
            Your portfolio graph starts now
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Every time you open the app, a snapshot is saved. Come back tomorrow and you'll see your first trend line.
          </div>
        </div>
      )}

    </div>
  );
}