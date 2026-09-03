import { useState } from 'react';

const SERVICES = [
  { key:'groww',        name:'Groww',           icon:'ti-chart-bar',      stock:'WLT', status:'connected', color:'var(--amber)',  desc: g => g ? `Feeds Wealth · ${g.holdings} holdings · synced ${g.syncedAgo}` : 'Feeds Wealth stock automatically' },
  { key:'gcal',         name:'Google Calendar', icon:'ti-calendar',       stock:'SOC', status:'connect',   color:'var(--blue)',   desc: () => 'Would feed Social stock with events & meetups' },
  { key:'apple_health', name:'Apple Health',    icon:'ti-heart-rate-monitor', stock:'HLT', status:'soon', label:'iOS soon',      color:'var(--mint)',   desc: () => 'Feed Health with steps, sleep & workouts' },
  { key:'bank',         name:'Bank account',    icon:'ti-building-bank',  stock:'WLT', status:'soon', label:'Coming soon',      color:'var(--amber)',  desc: () => 'Feed Wealth · savings rate tracking' },
  { key:'strava',       name:'Strava',          icon:'ti-run',            stock:'HLT', status:'soon', label:'Coming soon',      color:'var(--mint)',   desc: () => 'Feed Health with workouts & runs' },
];

const CURRENCIES = [
  { code:'₹', label:'INR' }, { code:'$', label:'USD' },
  { code:'£', label:'GBP' }, { code:'€', label:'EUR' },
];

export default function SettingsPanel({ onClose, stats={}, growwInfo=null, currency='₹', theme='dark' }) {
  const [activeCurrency, setActiveCurrency] = useState(currency);
  const isDark = theme === 'dark';

  const bg       = isDark ? '#0E1118' : '#FAFAF8';
  const border   = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const cardBg   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const divider  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const rowDiv   = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';

  return (
    <div style={{ position:'fixed', inset:0, zIndex:100, display:'flex', justifyContent:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }} onClick={onClose}/>
      <div style={{ position:'relative', zIndex:1, width:380, height:'100%', background:bg, borderLeft:`1px solid ${border}`, overflowY:'auto', animation:'slideIn 0.25s cubic-bezier(0.4,0,0.2,1)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ padding:'20px 20px 18px', borderBottom:`1px solid ${divider}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:'var(--amber-dim)', border:'2px solid var(--amber)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Bricolage Grotesque, sans-serif', fontSize:15, fontWeight:800, color:'var(--amber)' }}>SR</div>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--text-primary)', fontFamily:'Bricolage Grotesque, sans-serif' }}>Shrithik Raj</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>shrithikraj.com · Vitals (VTL)</div>
              </div>
            </div>
            <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:cardBg, border:`1px solid ${border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>
              <i className="ti ti-x" style={{ fontSize:15 }}/>
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
            {[
              { val: stats.bestStreak ? `${stats.bestStreak}d` : '—', lbl:'Best streak', icon:'ti-flame' },
              { val: stats.peakVTL ? Math.round(stats.peakVTL).toLocaleString() : '—', lbl:'Peak VTL', icon:'ti-trophy' },
              { val: stats.activities || '—', lbl:'Activities', icon:'ti-activity' },
            ].map(s => (
              <div key={s.lbl} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
                <i className={`ti ${s.icon}`} style={{ fontSize:14, color:'var(--amber)', display:'block', marginBottom:4 }}/>
                <div style={{ fontSize:17, fontWeight:700, color:'var(--text-primary)', fontFamily:'DM Mono, monospace' }}>{s.val}</div>
                <div style={{ fontSize:10, color:'var(--text-muted)', marginTop:2, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Data sources */}
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${divider}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Data sources</div>
          {SERVICES.map((svc, i) => (
            <div key={svc.key} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom: i < SERVICES.length-1 ? `1px solid ${rowDiv}` : 'none' }}>
              <div style={{ width:38, height:38, borderRadius:10, background: svc.status==='connected' ? 'var(--amber-dim)' : cardBg, border:`1px solid ${svc.status==='connected' ? 'var(--amber)' : border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <i className={`ti ${svc.icon}`} style={{ fontSize:17, color: svc.status==='connected' ? 'var(--amber)' : 'var(--text-muted)' }}/>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color: svc.status==='connected' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{svc.name}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2, lineHeight:1.4 }}>{svc.desc(svc.key==='groww' ? growwInfo : null)}</div>
              </div>
              <div style={{ flexShrink:0 }}>
                {svc.status==='connected' && <span style={{ fontSize:10, fontWeight:600, background:'var(--mint-dim)', color:'var(--mint)', border:'1px solid var(--mint)', padding:'3px 9px', borderRadius:20 }}>Live</span>}
                {svc.status==='connect'   && <span style={{ fontSize:10, fontWeight:600, background:cardBg, color:'var(--text-secondary)', border:`1px solid ${border}`, padding:'3px 9px', borderRadius:20, cursor:'pointer' }}>Connect</span>}
                {svc.status==='soon'      && <span style={{ fontSize:10, fontWeight:600, background:'var(--blue-dim)', color:'var(--blue)', border:'1px solid var(--blue)', padding:'3px 9px', borderRadius:20 }}>{svc.label}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Currency */}
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${divider}` }}>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Alert currency</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {CURRENCIES.map(c => (
              <button key={c.code} onClick={()=>setActiveCurrency(c.code)}
                style={{ padding:'9px 0', borderRadius:10, cursor:'pointer', background: activeCurrency===c.code ? 'var(--amber-dim)' : cardBg, border:`1px solid ${activeCurrency===c.code ? 'var(--amber)' : border}`, color: activeCurrency===c.code ? 'var(--amber)' : 'var(--text-muted)', fontSize:12, fontWeight:600, transition:'all 0.15s', fontFamily:'Nunito, sans-serif' }}>
                {c.code}<br/>
                <span style={{ fontSize:9, opacity:0.7 }}>{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'16px 20px', marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          <i className="ti ti-circle-check-filled" style={{ fontSize:13, color:'var(--mint)' }}/>
          <span style={{ fontSize:11, color:'var(--text-muted)' }}>VitalityX v0.1.0 · All systems operational</span>
        </div>
      </div>
    </div>
  );
}