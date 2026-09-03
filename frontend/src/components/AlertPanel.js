export default function AlertPanel({ alerts=[] }) {
  if (!alerts.length) return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, padding:'18px 24px', display:'flex', alignItems:'center', gap:14, animation:'fadeUp 0.5s ease 0.3s both' }}>
      <div style={{ width:40, height:40, borderRadius:12, background:'var(--mint-dim)', border:'1px solid var(--mint)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <i className="ti ti-circle-check" style={{ fontSize:20, color:'var(--mint)' }}/>
      </div>
      <div>
        <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>All stocks healthy</div>
        <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>No alerts — portfolio performing well. Keep the momentum going.</div>
      </div>
    </div>
  );

  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', animation:'fadeUp 0.5s ease 0.3s both' }}>
      <div style={{ padding:'14px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--rose)', animation:'pulse-soft 1.5s ease infinite' }}/>
        <span style={{ fontSize:12, color:'var(--text-secondary)', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:700 }}>
          {alerts.length} alert{alerts.length>1?'s':''} need your attention
        </span>
      </div>
      {alerts.map((a, i) => (
        <div key={i} style={{ padding:'18px 22px', borderBottom: i<alerts.length-1 ? '1px solid var(--border)' : 'none', display:'flex', gap:14, alignItems:'flex-start', transition:'background 0.2s', cursor:'default' }}
          onMouseEnter={e => e.currentTarget.style.background='var(--bg-elevated)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}
        >
          <div style={{ width:36, height:36, borderRadius:10, flexShrink:0, background: a.severity==='danger' ? 'var(--rose-dim)' : 'var(--amber-dim)', border:`1px solid ${a.severity==='danger' ? 'var(--rose)' : 'var(--amber)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <i className={`ti ${a.severity==='danger' ? 'ti-alert-triangle' : 'ti-trending-down'}`} style={{ fontSize:17, color: a.severity==='danger' ? 'var(--rose)' : 'var(--amber)' }}/>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Bricolage Grotesque, sans-serif', fontWeight:700, fontSize:14, color: a.severity==='danger' ? 'var(--rose)' : 'var(--amber)', marginBottom:5 }}>{a.headline}</div>
            <div style={{ fontSize:13, color:'var(--text-secondary)', lineHeight:1.6, marginBottom:8 }}>{a.detail}</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <span style={{ fontFamily:'DM Mono, monospace', fontSize:12, color: a.severity==='danger' ? 'var(--rose)' : 'var(--amber)', background: a.severity==='danger' ? 'var(--rose-dim)' : 'var(--amber-dim)', padding:'3px 10px', borderRadius:20, border:`1px solid ${a.severity==='danger' ? 'var(--rose)' : 'var(--amber)'}` }}>{a.cost_impact}</span>
              <span style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', display:'flex', alignItems:'center', gap:4 }}>
                <i className="ti ti-arrow-right" style={{ fontSize:11 }}/>{a.action_prompt}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}