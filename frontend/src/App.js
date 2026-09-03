import './index.css';
import { useState } from 'react';
import { usePortfolio } from './hooks/usePortfolio';
import { useTheme } from './hooks/useTheme';
import StockCard from './components/StockCard';
import AlertPanel from './components/AlertPanel';
import PortfolioChart from './components/PortfolioChart';
import SettingsPanel from './components/SettingsPanel';

const TICKER_COLORS      = { HLT: '#34D399', WLT: '#FBBF24', SOC: '#60A5FA' };
const TICKER_COLORS_LIGHT = { HLT: '#047857', WLT: '#B45309', SOC: '#1D4ED8' };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button onClick={onToggle} title={isDark ? 'Light mode' : 'Dark mode'} style={{
      width: 56, height: 30, borderRadius: 15,
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      border: `1px solid var(--border-warm)`,
      cursor: 'pointer', position: 'relative',
      transition: 'all 0.25s ease', flexShrink: 0,
      display: 'flex', alignItems: 'center', padding: '0 5px',
    }}>
      <i className={`ti ${isDark ? 'ti-moon' : 'ti-sun'}`} style={{ position:'absolute', left: isDark ? 'auto' : 7, right: isDark ? 7 : 'auto', fontSize: 13, color: 'var(--amber)', transition: 'all 0.2s' }}/>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: 'var(--amber)',
        transform: isDark ? 'translateX(26px)' : 'translateX(0px)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        flexShrink: 0,
      }}/>
    </button>
  );
}

export default function App() {
  const { portfolio, loading, error, lastUpdated, logActivity, syncGroww } = usePortfolio();
  const { theme, toggle: toggleTheme } = useTheme();
  const [syncMsg, setSyncMsg]           = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const isDark = theme === 'dark';
  const tColors = isDark ? TICKER_COLORS : TICKER_COLORS_LIGHT;

  const handleSync = async () => {
    setSyncMsg('Checking Groww…');
    const res = await syncGroww();
    if (res?.wlt) {
      const label = res.from_cache ? 'Cached' : 'Synced';
      setSyncMsg(`${label} — Wealth ${Math.round(res.wlt.new_price).toLocaleString()} VTL · ${res.wlt.signal}`);
      setTimeout(() => setSyncMsg(null), 3000);
    } else if (res?.status === 'error') {
      setSyncMsg(`Groww unavailable — using last known data`);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  if (loading && !portfolio) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
      <div style={{ fontFamily:'Bricolage Grotesque, sans-serif', fontSize:32, fontWeight:800, color:'var(--amber)', letterSpacing:'-0.03em' }}>VitalityX</div>
      <div style={{ fontSize:13, color:'var(--text-muted)' }}>Loading your life portfolio…</div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:'var(--bg-card)', border:`1px solid var(--rose-dim)`, borderRadius:20, padding:32, maxWidth:400, textAlign:'center' }}>
        <i className="ti ti-alert-triangle" style={{ fontSize:36, color:'var(--rose)', display:'block', marginBottom:12 }}/>
        <div style={{ fontFamily:'Bricolage Grotesque, sans-serif', fontWeight:700, marginBottom:8, color:'var(--rose)', fontSize:18 }}>API Offline</div>
        <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6 }}>{error}</div>
        <div style={{ marginTop:12, fontFamily:'DM Mono, monospace', fontSize:11, color:'var(--text-muted)', background:'var(--bg-elevated)', padding:'8px 14px', borderRadius:8 }}>uvicorn main:app --reload</div>
      </div>
    </div>
  );

  const stocks   = portfolio?.stocks || [];
  const alerts   = portfolio?.alerts || [];
  const totalVTL = portfolio?.total_vtl || 0;

  return (
    <div style={{ minHeight:'100vh', maxWidth:1140, margin:'0 auto', padding:'0 24px 80px' }}>

      {/* Ticker strip */}
      <div style={{ borderBottom:`1px solid var(--border)`, overflow:'hidden', height:36, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', gap:40, alignItems:'center', animation:'ticker 22s linear infinite', whiteSpace:'nowrap' }}>
          {[...stocks, ...stocks].map((t, i) => (
            <span key={i} style={{ fontFamily:'DM Mono, monospace', fontSize:11, display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ color:'var(--text-muted)', letterSpacing:'0.06em' }}>{t.name?.toUpperCase()}</span>
              <span style={{ color: tColors[t.ticker], fontWeight:500 }}>{Math.round(t.price).toLocaleString()} VTL</span>
              <span style={{ color: t.direction==='up' ? 'var(--mint)' : t.direction==='down' ? 'var(--rose)' : 'var(--text-muted)' }}>
                <i className={`ti ti-trending-${t.direction==='up'?'up':t.direction==='down'?'down':'right'}`} style={{ fontSize:11, verticalAlign:'middle' }}/> {Math.abs(t.change_pct).toFixed(1)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <div style={{ padding:'32px 0 28px', animation:'fadeUp 0.4s ease both' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>

          {/* Left: branding */}
          <div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
              <i className="ti ti-hand-stop" style={{ fontSize:14, color:'var(--amber)' }}/>
              {getGreeting()}, Shrithik
            </div>
            <div style={{ fontFamily:'Bricolage Grotesque, sans-serif', fontWeight:800, fontSize:36, color:'var(--amber)', letterSpacing:'-0.03em', lineHeight:1 }}>
              VitalityX
            </div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:6 }}>
              {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
            </div>
          </div>

          {/* Right: controls + portfolio card */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ThemeToggle theme={theme} onToggle={toggleTheme}/>
              <button onClick={() => setShowSettings(true)} title="Settings" style={{ width:38, height:38, borderRadius:12, background:'var(--bg-elevated)', border:'1px solid var(--border)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', transition:'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--bg-card-hover)'}
                onMouseLeave={e => e.currentTarget.style.background='var(--bg-elevated)'}
              >
                <i className="ti ti-settings" style={{ fontSize:18 }}/>
              </button>
            </div>
            <div style={{ background:'var(--bg-card)', border:`1px solid var(--amber-dim)`, borderRadius:18, padding:'16px 22px', textAlign:'right', minWidth:180 }}>
              <div style={{ fontSize:10, color:'var(--text-muted)', marginBottom:5, letterSpacing:'0.08em', textTransform:'uppercase' }}>Total portfolio</div>
              <div style={{ fontFamily:'DM Mono, monospace', fontSize:30, fontWeight:500, color:'var(--amber)', letterSpacing:'-0.02em', lineHeight:1 }}>
                {Math.round(totalVTL).toLocaleString()}
                <span style={{ fontSize:12, color:'var(--text-muted)', marginLeft:4 }}>VTL</span>
              </div>
              <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>Vitals · {stocks.length} stocks active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} theme={theme}
          stats={{ bestStreak: Math.max(...stocks.map(s=>s.streak_days), 0), peakVTL: totalVTL, activities: 47 }}
          growwInfo={{ holdings: 19, syncedAgo: '2 min ago' }} currency="₹"
        />
      )}

      {/* Sync banner */}
      {syncMsg && (
        <div style={{ background:'var(--amber-dim)', border:'1px solid var(--amber)', borderRadius:10, padding:'10px 16px', marginBottom:20, fontSize:13, color:'var(--amber)', animation:'fadeUp 0.2s ease both', display:'flex', alignItems:'center', gap:8 }}>
          <i className="ti ti-refresh" style={{ fontSize:14 }}/> {syncMsg}
        </div>
      )}

      {/* Stock cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:16, marginBottom:24 }}>
        {stocks.map((s, i) => (
          <StockCard key={s.ticker} stock={{ ...s, peak_price: s.peak_price || s.price * 1.1 }}
            onLog={t => logActivity(t)} onSync={handleSync} animDelay={i * 0.08} theme={theme}/>
        ))}
      </div>

      <PortfolioChart theme={theme}/>
      <AlertPanel alerts={alerts}/>

      <div style={{ marginTop:40, paddingTop:20, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:'0.04em' }}>VITALITYX · CURRENCY: VITALS (VTL)</div>
        <div style={{ fontSize:11, color:'var(--text-muted)' }}>
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}` : 'Live'}
        </div>
      </div>
    </div>
  );
}