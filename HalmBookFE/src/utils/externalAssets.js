const pendingScripts = new Map();

export function loadStylesheet(href) {
  if (Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some(link => link.href === href)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

/** Share in-flight requests and allow failed CDN loads to be retried. */
export function loadExternalScript(src, id) {
  const key = id || src;
  if (pendingScripts.has(key)) return pendingScripts.get(key);
  const existing = (id && document.getElementById(id))
    || Array.from(document.scripts).find(script => script.src === src);
  if (existing?.dataset.halmLoaded === 'true') return Promise.resolve(existing);
  const promise = new Promise((resolve, reject) => {
    const script = existing || document.createElement('script');
    const loaded = () => { script.dataset.halmLoaded = 'true'; resolve(script); };
    const failed = () => {
      pendingScripts.delete(key);
      if (!existing) script.remove();
      reject(new Error(`Không thể tải tài nguyên: ${src}`));
    };
    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
    if (!existing) {
      if (id) script.id = id;
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    } else if (!script.hasAttribute('async') && document.readyState !== 'loading') loaded();
  });
  pendingScripts.set(key, promise);
  return promise;
}
