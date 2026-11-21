import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { BookAccessDetail, checkBookAccessDetailApi } from './rentalService';
import { createReadingAccessMonitor, deniedAccess } from './readingAccessMonitor';

export function useReadingAccess(bookId: string, isPersonal: boolean, isLoggedIn: boolean) {
  const [snapshot, setSnapshot] = useState<{ bookId: string; detail: BookAccessDetail }>({ bookId: '', detail: deniedAccess('CHECKING') });
  const monitor = useRef<ReturnType<typeof createReadingAccessMonitor> | null>(null);
  useEffect(() => {
    if (!bookId || isPersonal || !isLoggedIn) return;
    const current = createReadingAccessMonitor(signal => checkBookAccessDetailApi(bookId, signal),
      detail => setSnapshot({ bookId, detail }));
    monitor.current = current;
    if (AppState.currentState === 'active' || AppState.currentState === null) void current.resume();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void current.resume();
      else current.pause();
    });
    return () => { current.stop(); subscription.remove(); if (monitor.current === current) monitor.current = null; };
  }, [bookId, isPersonal, isLoggedIn]);
  const retry = useCallback(() => { void monitor.current?.resume(); }, []);
  const detail = !isLoggedIn ? deniedAccess('GUEST')
    : snapshot.bookId === bookId ? snapshot.detail : deniedAccess('CHECKING');
  return { accessInfo: detail, retryAccess: retry };
}
