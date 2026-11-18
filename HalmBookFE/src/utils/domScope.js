/** Own DOM listeners and timers so route changes can dispose them together. */
export function createDomScope() {
  const cleanups = new Set();
  let disposed = false;
  return {
    listen(target, event, handler, options) {
      if (!target || disposed) return;
      target.addEventListener(event, handler, options);
      cleanups.add(() => target.removeEventListener(event, handler, options));
    },
    setTimeout(callback, delay, ...args) {
      if (disposed) return null;
      let cleanup;
      const id = globalThis.setTimeout(() => { cleanups.delete(cleanup); if (!disposed) callback(...args); }, delay);
      cleanup = () => globalThis.clearTimeout(id);
      cleanups.add(cleanup);
      return id;
    },
    setInterval(callback, delay, ...args) {
      if (disposed) return null;
      const id = globalThis.setInterval(() => { if (!disposed) callback(...args); }, delay);
      cleanups.add(() => globalThis.clearInterval(id));
      return id;
    },
    requestAnimationFrame(callback) {
      if (disposed) return null;
      let cleanup;
      const id = globalThis.requestAnimationFrame(time => { cleanups.delete(cleanup); if (!disposed) callback(time); });
      cleanup = () => globalThis.cancelAnimationFrame(id);
      cleanups.add(cleanup);
      return id;
    },
    dispose() {
      disposed = true;
      cleanups.forEach(cleanup => cleanup());
      cleanups.clear();
    },
  };
}
