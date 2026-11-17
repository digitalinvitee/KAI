/**
 * Storage access that never throws. Private windows, blocked site data
 * and sandboxed previews can make Web Storage unavailable; the site then
 * keeps working with in-memory state for the current page view.
 */

const memory = new Map();

const resolve = (kind) => {
  try {
    const store = kind === 'local' ? window.localStorage : window.sessionStorage;
    const probe = '__kai_probe__';
    store.setItem(probe, '1');
    store.removeItem(probe);
    return store;
  } catch {
    return null;
  }
};

const createStore = (kind) => {
  let store;
  const backend = () => {
    if (store === undefined) store = typeof window === 'undefined' ? null : resolve(kind);
    return store;
  };

  return {
    get(key) {
      try {
        const raw = backend() ? backend().getItem(key) : memory.get(`${kind}:${key}`);
        return raw == null ? null : JSON.parse(raw);
      } catch {
        return null;
      }
    },
    set(key, value) {
      const raw = JSON.stringify(value);
      try {
        if (backend()) backend().setItem(key, raw);
        else memory.set(`${kind}:${key}`, raw);
      } catch {
        memory.set(`${kind}:${key}`, raw);
      }
    },
    remove(key) {
      try {
        if (backend()) backend().removeItem(key);
      } catch {
        /* ignore */
      }
      memory.delete(`${kind}:${key}`);
    },
  };
};

export const localStore = createStore('local');
export const sessionStore = createStore('session');
export const createMemoryStore = () => {
  const map = new Map();
  return {
    get: (key) => (map.has(key) ? JSON.parse(map.get(key)) : null),
    set: (key, value) => map.set(key, JSON.stringify(value)),
    remove: (key) => map.delete(key),
  };
};
