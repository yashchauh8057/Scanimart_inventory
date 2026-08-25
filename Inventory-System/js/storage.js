window.InventoryStorage = {
  get(key, fallback = []) {
    try { return JSON.parse(localStorage.getItem(`inventory:${key}`)) ?? fallback; }
    catch { return fallback; }
  },
  set(key, value) { localStorage.setItem(`inventory:${key}`, JSON.stringify(value)); },
  remove(key) { localStorage.removeItem(`inventory:${key}`); }
};
