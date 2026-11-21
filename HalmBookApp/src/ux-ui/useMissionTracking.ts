import { useEffect } from 'react';
import { AppState } from 'react-native';
import { readingMissionHeartbeat, recordMissionVisit } from './missionService';

export function useMissionVisit(kind: 'OFFERS' | 'BOOKSHELF', enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const visit = () => { if (AppState.currentState === 'active') void recordMissionVisit(kind, undefined, controller.signal).catch(() => {}); };
    visit();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') visit(); });
    return () => { controller.abort(); listener.remove(); };
  }, [kind, enabled]);
}

/** Starts a new server clock lease whenever the reader returns to the foreground. */
export function useReadingMission(bookId: string, enabled: boolean) {
  useEffect(() => {
    if (!enabled || !bookId) return;
    let controller: AbortController | undefined;
    let timer: ReturnType<typeof setInterval> | undefined;
    let busy = false;
    const stop = () => { if (timer) clearInterval(timer); timer = undefined; controller?.abort(); };
    const start = () => {
      stop(); busy = false;
      const current = new AbortController(); controller = current;
      const session = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + '-reader';
      const tick = async () => {
        if (busy || current.signal.aborted || AppState.currentState !== 'active') return;
        busy = true;
        try { await readingMissionHeartbeat(bookId, session, current.signal); }
        catch (error: any) { if ([401, 403, 423].includes(error?.response?.status) && controller === current) stop(); }
        finally { if (controller === current) busy = false; }
      };
      void tick(); timer = setInterval(() => { void tick(); }, 15000);
    };
    if (AppState.currentState === 'active') start();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') start(); else stop(); });
    return () => { stop(); listener.remove(); };
  }, [bookId, enabled]);
}
