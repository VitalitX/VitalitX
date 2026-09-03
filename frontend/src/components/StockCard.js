import { useState } from 'react';
import Sparkline from './Sparkline';

const STOCK_CONFIG = {
  HLT: {
    colorDark: '#34D399', colorLight: '#047857',
    dimDark: 'rgba(52,211,153,0.1)',   dimLight: 'rgba(4,120,87,0.08)',
    bordDark: 'rgba(52,211,153,0.22)', bordLight: 'rgba(4,120,87,0.2)',
    icon: 'ti-heart', label: 'Health', category: 'Physical & Mental',
    greeting: s => s>=7 ? `On fire — ${s} days straight` : s>=3 ? `${s}-day streak. Keep going` : 'Start a streak today',
  },
  WLT: {
    colorDark: '#FBBF24', colorLight: '#B45309',
    dimDark: 'rgba(251,191,36,0.1)',   dimLight: 'rgba(180,83,9,0.08)',
    bordDark: 'rgba(251,191,36,0.22)', bordLight: 'rgba(180,83,9,0.2)',
    icon: 'ti-chart-line', label: 'Wealth', category: 'Savings & Investments',
    greeting: s => s>=7 ? `Compounding — ${s} days active` : s>=3 ? 'Building momentum' : 'Log a wealth action today',
  },
  SOC: {
    colorDark: '#60A5FA', colorLight: '#1D4ED8',
    dimDark: 'rgba(96,165,250,0.1)',   dimLight: 'rgba(29,78,216,0.08)',
    bordDark: 'rgba(96,165,250,0.22)', bordLight: 'rgba(29,78,216,0.2)',
    icon: 'ti-users', label: 'Social', category: 'People & Connections',
    greeting: s => s>=7 ? `Well connected — ${s} days` : s>=3 ? `${s} days of good energy` : 'Reach out to someone today',
  },
};

const SOURCE = {
  HLT: { label: 'Manual log',  iconDark: 'rgba(255,255,255,0.06)', iconLight: 'rgba(0,0,0,0.06)', textDark: '#8892AA', textLight: '#6B7280' },
  WLT: { label: 'Groww live',  iconDark: 'rgba(251,191,36,0.12)',  iconLight: 'rgba(180,83,9,0.1)',  textDark: '#FBBF24', textLight: '#B45309' },
  SOC: { label: 'Manual log',  iconDark: 'rgba(255,255,255,0.06)', iconLight: 'rgba(0,0,0,0.06)', textDark: '#8892AA', textLight: '#6B7280' },
};

const ACTIVITIES = {
  HLT: [
    { type:'gym_session',  label:'Gym session',    vtl:'+12', icon:'ti-barbell'      },
    { type:'run_walk',     label:'Run / Walk',     vtl:'+8',  icon:'ti-run'          },
    { type:'sleep_logged', label:'Great sleep',    vtl:'+6',  icon:'ti-moon'         },
    { type:'healthy_meal', label:'Healthy meal',   vtl:'+4',  icon:'ti-salad'        },
  ],
  WLT: [
    { type:'sip_active',      label:'SIP active',        vtl:'+10', icon:'ti-trending-up'   },
    { type:'savings_added',   label:'Added savings',     vtl:'+12', icon:'ti-piggy-bank'    },
    { type:'portfolio_check', label:'Portfolio review',  vtl:'+3',  icon:'ti-eye'           },
  ],
  SOC: [
    { type:'event_attended',  label:'Event attended',   vtl:'+10', icon:'ti-calendar-event' },
    { type:'friend_call',     label:'Called a friend',  vtl:'+7',  icon:'ti-phone'          },
    { type:'networking_meet', label:'Networking',       vtl:'+9',  icon:'ti-briefcase'      },
  ],
};

export default function StockCard({ stock, onLog, onSync, animDelay=0, theme='dark' }) {
  const [expanded, setExpanded]     = useState(false);
  const [logging, setLogging]       = useState(null);
  const [celebrated, setCelebrated] = useState(null);

  const isDark   = theme === 'dark';
  const cfg      = STOCK_CONFIG[stock.ticker] || STOCK_CONFIG.HLT;
  const color    = isDark ? cfg.colorDark    : cfg.colorLight;
  const dimColor = isDark ? cfg.dimDark      : cfg.dimLight;
  const bordColor = isDark ? cfg.bordDark    : cfg.bordLight;
  const src      = SOURCE[stock.ticker];
  const acts     = ACTIVITIES[stock.ticker] || [];
  const isUp     = stock.direction === 'up';
  const isDown   = stock.direction === 'down';
  const statusLabel = stock.status ? stock.status.charAt(0).toUpperCase()+stock.status.slice(1) : 'Steady';
  const statusColor = stock.status==='bullish' ? (isDark?'#34D399':'#047857') : stock.status==='bearish' ? (isDark?'#F87171':'#B91C1C') : 'var(--text-muted)';

  const handleLog = async (type) => {
    setLogging(type);
    await onLog(type);
    setCelebrated(type);
    setTimeout(() => setCelebrated(null), 800);
    setLogging(null);
    setExpanded(false);
  };

  const cardBg = isDark
    ? `linear-gradient(145deg, #141826 0%, #1C2133 100%)`
    : `linear-gradient(145deg, #FFFFFF 0%, #F5F2ED 100%)`;

  return (
    <div style={{ background: cardBg, border:`1px solid ${expanded ? bordColor : 'var(--border)'}`, borderRadius:20, padding:22, cursor:'pointer', transition:'all 0.3s cubic-bezier(0.4,0,0.2,1)', animation:`fadeUp 0.5s ease ${animDelay}s both`, position:'relative', overflow:'hidden' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor=bordColor; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=isDark?'0 8px 32px rgba(0,0,0,0.3)':'0 8px 24px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor=expanded?bordColor:'var(--border)'; e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
      onClick={() => setExpanded(v=>!v)}
    >
      <div style={{ position:'absolute', top:-50, right:-50, width:140, height:140, borderRadius:'50%', background:color, opacity:0.05, filter:'blur(40px)', pointerEvents:'none' }}/>

      {/* Identity + price */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:13, background:dimColor, border:`1px solid ${bordColor}`, display:'flex', alignItems:'center', justifyContent:'center', animation: celebrated ? 'celebrate 0.6s ease' : 'none' }}>
            <i className={`ti ${cfg.icon}`} style={{ fontSize:20, color }}/>
          </div>
          <div>
            <div style={{ fontFamily:'Bricolage Grotesque, sans-serif', fontWeight:600, fontSize:16, color:'var(--text-primary)', letterSpacing:'-0.01em' }}>{cfg.label}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>{cfg.category}</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'DM Mono, monospace', fontSize:24, fontWeight:500, color, letterSpacing:'-0.02em', lineHeight:1 }}>
            {Math.round(stock.price).toLocaleString()}<span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:3 }}>VTL</span>
          </div>
          <div style={{ fontSize:12, marginTop:4, fontFamily:'DM Mono, monospace', color: isUp?(isDark?'#34D399':'#047857'): isDown?(isDark?'#F87171':'#B91C1C'):'var(--text-muted)', display:'flex', alignItems:'center', gap:3, justifyContent:'flex-end' }}>
            <i className={`ti ti-trending-${isUp?'up':isDown?'down':'right'}`} style={{ fontSize:12 }}/>
            {Math.abs(stock.change_pct).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Greeting */}
      <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:14, fontStyle:'italic', lineHeight:1.5 }}>
        {cfg.greeting(stock.streak_days)}
      </div>

      {/* Sparkline */}
      <div style={{ marginBottom:16 }}>
        <Sparkline data={stock.sparkline} color={color} width={280} height={52}/>
      </div>

      {/* 3 metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:16 }}>
        {[
          { label:'Streak', value:`${stock.streak_days}d`, color: stock.streak_days>=7 ? (isDark?'#FBBF24':'#B45309') : 'var(--text-primary)', glow: stock.streak_days>=7, icon:'ti-flame' },
          { label:'Peak',   value: Math.round(stock.peak_price||stock.price).toLocaleString(), color:'var(--text-primary)', icon:'ti-trophy' },
          { label:'Status', value: statusLabel, color: statusColor, icon:'ti-activity' },
        ].map(m => (
          <div key={m.label} style={{ background:'var(--bg-elevated)', borderRadius:8, padding:'10px 12px', border:'1px solid var(--border)', animation: m.glow?'streak-glow 2s ease infinite':'none' }}>
            <div style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:4, display:'flex', alignItems:'center', gap:4 }}>
              <i className={`ti ${m.icon}`} style={{ fontSize:11 }}/>{m.label}
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:m.color, fontFamily: m.label==='Status'?'Nunito, sans-serif':'DM Mono, monospace' }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:10, fontWeight:600, padding:'3px 9px', borderRadius:20, background: isDark ? src.iconDark : src.iconLight, color: isDark ? src.textDark : src.textLight, border:`1px solid ${isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.1)'}` }}>
          <i className={stock.ticker==='WLT' ? 'ti ti-brand-google-analytics' : 'ti ti-pencil'} style={{ fontSize:10 }}/>
          {src.label}
        </span>
        <div style={{ fontSize:11, fontWeight:600, color, background:dimColor, padding:'4px 12px', borderRadius:999, border:`1px solid ${bordColor}` }}>
          {expanded ? 'Close' : 'Log activity'}
          <i className={`ti ${expanded?'ti-chevron-up':'ti-chevron-down'}`} style={{ fontSize:11, marginLeft:4 }}/>
        </div>
      </div>

      {/* Activity log */}
      {expanded && (
        <div style={{ marginTop:18, paddingTop:18, borderTop:'1px solid var(--border)', animation:'fadeUp 0.25s ease both' }} onClick={e=>e.stopPropagation()}>
          <div style={{ fontSize:11, color:'var(--text-muted)', marginBottom:10, letterSpacing:'0.06em', textTransform:'uppercase' }}>What did you do?</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {acts.map(a => (
              <button key={a.type} disabled={!!logging} onClick={()=>handleLog(a.type)}
                style={{ background: celebrated===a.type ? dimColor : 'var(--bg-surface)', border:`1px solid ${celebrated===a.type ? bordColor : 'var(--border)'}`, borderRadius:8, padding:'11px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.2s', animation: celebrated===a.type?'celebrate 0.6s ease':'none' }}
                onMouseEnter={e=>{ e.currentTarget.style.background=dimColor; e.currentTarget.style.borderColor=bordColor; }}
                onMouseLeave={e=>{ if(celebrated!==a.type){ e.currentTarget.style.background='var(--bg-surface)'; e.currentTarget.style.borderColor='var(--border)'; }}}
              >
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <i className={`ti ${a.icon}`} style={{ fontSize:15, color }}/>
                  <span style={{ fontSize:12, color:'var(--text-warm)', fontWeight:500 }}>{logging===a.type?'Logging…':a.label}</span>
                </div>
                <span style={{ fontFamily:'DM Mono, monospace', fontSize:11, color, fontWeight:500 }}>{a.vtl}</span>
              </button>
            ))}
            {stock.ticker==='WLT' && (
              <button style={{ gridColumn:'1/-1', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:8, padding:'11px 14px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'all 0.2s' }}
                onClick={e=>{e.stopPropagation(); onSync();}}
                onMouseEnter={e=>{ e.currentTarget.style.background=dimColor; e.currentTarget.style.borderColor=bordColor; }}
                onMouseLeave={e=>{ e.currentTarget.style.background='var(--bg-surface)'; e.currentTarget.style.borderColor='var(--border)'; }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <i className="ti ti-refresh" style={{ fontSize:15, color:'var(--amber)' }}/>
                  <span style={{ fontSize:12, color:'var(--text-warm)', fontWeight:500 }}>Sync Groww portfolio</span>
                </div>
                <span style={{ fontFamily:'DM Mono, monospace', fontSize:11, color:'var(--amber)' }}>AUTO</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}