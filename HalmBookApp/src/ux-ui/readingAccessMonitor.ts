import type { BookAccessDetail } from './rentalService';

export const ACCESS_CHECK_INTERVAL_MS = 15000;
export const deniedAccess = (status: string): BookAccessDetail => ({
  hasAccess: false, currentPage: 1, readingPercentage: 0, remainingDays: 0,
  isForever: false, status, checkedFromServer: false,
});

/** A paused/stopped monitor can never publish a late grant from an older request. */
export function createReadingAccessMonitor(
  check: (signal: AbortSignal) => Promise<BookAccessDetail>,
  onChange: (detail: BookAccessDetail) => void,
  intervalMs = ACCESS_CHECK_INTERVAL_MS,
) {
  let active = false;
  let generation = 0;
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  let lease: ReturnType<typeof setTimeout> | undefined;
  let inFlight: Promise<void> | null = null;
  const publish = (detail: BookAccessDetail) => {
    clearTimeout(lease);
    if (detail.hasAccess) {
      const epoch = generation;
      lease = setTimeout(() => {
        if (!active || generation !== epoch) return;
        generation++;
        controller?.abort();
        inFlight = null;
        onChange(deniedAccess('NETWORK_ERROR'));
        void refresh();
      }, intervalMs + 5000);
    }
    onChange(detail);
  };
  const refresh = () => {
    if (!active) return Promise.resolve();
    if (inFlight) return inFlight;
    const epoch = generation;
    const request = new AbortController();
    controller = request;
    const operation = (async () => {
      try {
        const detail = await check(request.signal);
        if (active && generation === epoch && !request.signal.aborted) publish(detail);
      } catch {
        if (active && generation === epoch && !request.signal.aborted) publish(deniedAccess('NETWORK_ERROR'));
      }
    })();
    inFlight = operation;
    void operation.finally(() => { if (inFlight === operation) inFlight = null; });
    return operation;
  };
  const pause = (status = 'PAUSED') => {
    active = false;
    generation++;
    controller?.abort();
    controller = null;
    inFlight = null;
    clearInterval(timer);
    clearTimeout(lease);
    timer = undefined;
    onChange(deniedAccess(status));
  };
  const resume = () => {
    pause('CHECKING');
    active = true;
    timer = setInterval(() => { void refresh(); }, intervalMs);
    return refresh();
  };
  return { refresh, resume, pause, stop: () => {
    active = false; generation++; controller?.abort(); clearInterval(timer); clearTimeout(lease); inFlight = null;
  } };
}
