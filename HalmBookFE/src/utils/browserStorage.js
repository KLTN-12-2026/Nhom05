function storageFor(persistent) {
  try { return persistent ? globalThis.localStorage : globalThis.sessionStorage; }
  catch { return null; }
}

export function readStorage(key, persistent = true) {
  try { return storageFor(persistent)?.getItem(key) ?? null; }
  catch { return null; }
}

export function writeStorage(key, value, persistent = true) {
  try {
    if (value == null) storageFor(persistent)?.removeItem(key);
    else storageFor(persistent)?.setItem(key, String(value));
  } catch { /* Storage restrictions must not break navigation. */ }
}

export function removeSessionKeys(keys) {
  for (const key of keys) {
    writeStorage(key, null, true);
    writeStorage(key, null, false);
  }
}

export function readStoredJson(key, fallback = null, persistent = true) {
  try { return JSON.parse(readStorage(key, persistent)) ?? fallback; }
  catch { return fallback; }
}
