let dbp;
export function openDB() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open("gymtracker-react", 1);
      r.onupgradeneeded = () => {
        const d = r.result;
        d.createObjectStore("exercises", { keyPath: "name" });
        d.createObjectStore("plans", { keyPath: "id" });
        d.createObjectStore("sessions", { keyPath: "id" });
        d.createObjectStore("weights", { keyPath: "date" });
        d.createObjectStore("kv", { keyPath: "key" });
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}
async function tx(store, mode, fn) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => res(req && req.result);
    t.onerror = () => rej(t.error);
    t.onabort = () => rej(t.error);
  });
}
export const dbAll = (s) => tx(s, "readonly", (o) => o.getAll());
export const dbGet = (s, k) => tx(s, "readonly", (o) => o.get(k));
export const dbPut = (s, v) => tx(s, "readwrite", (o) => o.put(v));
export const dbDel = (s, k) => tx(s, "readwrite", (o) => o.delete(k));
export const dbClear = (s) => tx(s, "readwrite", (o) => o.clear());
export const dbPutMany = (s, items) => tx(s, "readwrite", (o) => { items.forEach((i) => o.put(i)); });
