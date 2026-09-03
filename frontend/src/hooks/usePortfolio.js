import { useState, useEffect, useCallback } from 'react';

const USER_ID = 'shrithik'; // hardcoded for MVP

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await window.fetch(`/portfolio/${USER_ID}`);
      const data = await res.json();
      setPortfolio(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError('Cannot reach VitalityX API — is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  const logActivity = useCallback(async (activityType, note = '') => {
    try {
      const res = await window.fetch('/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: USER_ID, activity_type: activityType, note }),
      });
      const data = await res.json();
      await fetch(); // refresh portfolio
      return data;
    } catch (e) {
      console.error('Log failed:', e);
    }
  }, [fetch]);

  const syncGroww = useCallback(async (force = false) => {
    try {
      const url = `/sync/groww/${USER_ID}${force ? '?force=true' : ''}`;
      const res  = await window.fetch(url);
      const data = await res.json();
      await fetch();
      return data;
    } catch (e) {
      console.error('Groww sync failed:', e);
    }
  }, [fetch]);

  useEffect(() => { fetch(); }, [fetch]);

  // Auto-refresh every 60s
  useEffect(() => {
    const t = setInterval(fetch, 60000);
    return () => clearInterval(t);
  }, [fetch]);

  return { portfolio, loading, error, lastUpdated, refetch: fetch, logActivity, syncGroww };
}