# VitalityX Backend
**Stock market for your life. Currency: Vitals (VTL)**

## Stocks
| Ticker | Name   | Decay     | What moves it                        |
|--------|--------|-----------|--------------------------------------|
| HLT    | Health | Fast (2d) | Gym, run, sleep, healthy meals       |
| WLT    | Wealth | Slow (wks)| SIP, savings, Zerodha portfolio      |
| SOC    | Social | Medium(4d)| Events, friend calls, networking     |

## Pricing formula
```
price = base_price × streak_multiplier × recency_decay
streak_multiplier = 1 + (streak_days × 0.02)   # +2%/day, caps at 2x
recency_decay     = e^(−decay_rate × days_since_last_activity)
```

## Setup
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
API docs: http://localhost:8000/docs

## Key endpoints
```
GET  /                          # health check
GET  /activities                # all valid activity types
POST /log                       # log an activity → reprices stock
GET  /portfolio/{user_id}       # full portfolio with alerts
```

## Log an activity
```bash
curl -X POST http://localhost:8000/log \
  -H "Content-Type: application/json" \
  -d '{"user_id": "your-id", "activity_type": "gym_session"}'
```

## Get your portfolio
```bash
curl http://localhost:8000/portfolio/your-id
```

## Activity types
- **HLT:** gym_session, run_walk, sleep_logged, healthy_meal
- **WLT:** sip_active, savings_added, portfolio_check, zerodha_sync
- **SOC:** event_attended, friend_call, networking_meet

## Next steps
- [ ] Zerodha Kite Connect integration (auto-feeds WLT)
- [ ] Google Calendar integration (auto-feeds SOC)
- [ ] React frontend dashboard
- [ ] User auth
- [ ] Deploy to Railway/Render
