import { useEffect } from 'react';
import { isTokenValid } from '@/services/authToken';
import { readingMissionHeartbeat, recordMissionVisit } from '@/services/missionService';

export function useMissionVisit(kind, keyword) {
  useEffect(() => {
    if (!isTokenValid() || (kind === 'SEARCH' && (!keyword || keyword.trim().length < 2))) return;
    const controller = new AbortController();
    const visit = () => { if (!document.hidden) void recordMissionVisit(kind, keyword?.trim(), controller.signal).catch(() => {}); };
    const timer = setTimeout(visit, kind === 'SEARCH' ? 600 : 0);
    document.addEventListener('visibilitychange', visit);
    return () => { clearTimeout(timer); controller.abort(); document.removeEventListener('visibilitychange', visit); };
  }, [kind, keyword]);
}
export function useReadingMission(bookId, enabled) {
  useEffect(() => {
    if (!enabled || !bookId || !isTokenValid()) return;
    let controller; let timer; let busy = false;
    const stop = () => { clearInterval(timer); controller?.abort(); };
    const start = () => {
      stop(); if (document.hidden) return;
      busy = false;
      const current = new AbortController(); controller = current;
      const sessionId = crypto.randomUUID();
      const tick = async () => {
        if (busy || current.signal.aborted || document.hidden) return;
        busy = true;
        try { await readingMissionHeartbeat(bookId, sessionId, current.signal); }
        catch (error) { if ([401, 403, 423].includes(error?.response?.status) && controller === current) stop(); }
        finally { if (controller === current) busy = false; }
      };
      void tick(); timer = setInterval(() => { void tick(); }, 15000);
    };
    const visibility = () => { if (document.hidden) stop(); else start(); };
    start(); document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', stop); window.addEventListener('pageshow', visibility);
    return () => { stop(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', stop); window.removeEventListener('pageshow', visibility); };
  }, [bookId, enabled]);
}
