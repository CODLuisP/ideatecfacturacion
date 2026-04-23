const STORE_KEY = 'factunet_venta_compartida';

export const sharedVentaStore = {
  save(cliente: any, items: any[], extra: any = {}) {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify({ cliente, items, extra }));
    } catch { /* ignore */ }
  },

  get(): { cliente: any; items: any[]; extra: any } {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { cliente: null, items: [], extra: {} };
  },

  clear() {
    try {
      sessionStorage.removeItem(STORE_KEY);
    } catch { /* ignore */ }
  },
};
