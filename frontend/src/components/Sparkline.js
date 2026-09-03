export default function Sparkline({ data = [], color = '#10D078', width = 120, height = 40 }) {
  if (!data || data.length < 2) {
    // Flat line placeholder
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line x1="0" y1={height/2} x2={width} y2={height/2}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" strokeDasharray="4 3"/>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 4;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const lastX = parseFloat(points[points.length - 1].split(',')[0]);
  const lastY = parseFloat(points[points.length - 1].split(',')[1]);

  // Area fill path
  const areaPath = `M ${points[0]} L ${points.join(' L ')} L ${lastX},${height} L ${pad},${height} Z`;

  const isDown = data[data.length - 1] < data[0];
  const lineColor = isDown ? '#FF4D6A' : color;
  const fillId = `spark-fill-${Math.random().toString(36).slice(2)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={lineColor} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={lineColor} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${fillId})`}/>
      <polyline points={polyline} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      {/* Last price dot */}
      <circle cx={lastX} cy={lastY} r="3" fill={lineColor}/>
      <circle cx={lastX} cy={lastY} r="5" fill={lineColor} opacity="0.25"/>
    </svg>
  );
}
