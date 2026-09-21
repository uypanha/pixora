import '@testing-library/jest-dom';

// Mock IndexedDB for test environments where indexedDB is not polyfilled
if (typeof window !== 'undefined' && !window.indexedDB) {
  const store: Record<string, Record<string, any>> = {};

  const fakeIdb: any = {
    open: (_name: string, _version: number) => {
      const req: any = {
        result: {
          objectStoreNames: {
            contains: (s: string) => !!store[s],
          },
          createObjectStore: (s: string) => {
            store[s] = {};
            return {};
          },
          transaction: (_stores: string | string[], _mode: string) => {
            const tx: any = {
              objectStore: (s: string) => ({
                put: (val: any, key?: string) => {
                  if (!store[s]) store[s] = {};
                  store[s][key || val.id] = val;
                },
                get: (key: string) => {
                  const r: any = { result: store[s]?.[key] || null };
                  setTimeout(() => r.onsuccess && r.onsuccess({ target: r }), 0);
                  return r;
                },
                getAll: () => {
                  const r: any = { result: Object.values(store[s] || {}) };
                  setTimeout(() => r.onsuccess && r.onsuccess({ target: r }), 0);
                  return r;
                },
                delete: (key: string) => {
                  if (store[s]) delete store[s][key];
                },
                clear: () => {
                  store[s] = {};
                },
              }),
              oncomplete: null,
              onerror: null,
            };
            setTimeout(() => tx.oncomplete && tx.oncomplete(), 0);
            return tx;
          },
        },
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      };

      setTimeout(() => {
        if (req.onupgradeneeded) {
          req.onupgradeneeded({ target: req });
        }
        if (req.onsuccess) {
          req.onsuccess({ target: req });
        }
      }, 0);

      return req;
    },
  };

  (window as any).indexedDB = fakeIdb;
}

if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = () => 'blob:mock-url';
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = () => {};
  }
  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
}

