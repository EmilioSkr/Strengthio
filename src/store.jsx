import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { dbAll, dbGet, dbPut, dbDel, dbClear, dbPutMany } from "./db";
import { SEED } from "./data";
import { KG2LB } from "./utils";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function useUnit() {
  const { settings } = useStore();
  const lbs = settings.unit === "lbs";
  return {
    unit: settings.unit,
    toDisp: (kg) => (lbs ? kg * KG2LB : kg),
    fromDisp: (v) => (lbs ? v / KG2LB : v),
  };
}

const log = (e) => console.error(e);

export function StoreProvider({ children }) {
  const [s, setS] = useState({
    ready: false, exercises: {}, plans: [], sessions: [], weights: [],
    settings: { unit: "kg" }, active: null,
  });
  const ref = useRef(s);
  ref.current = s;

  useEffect(() => {
    (async () => {
      try {
        let ex = await dbAll("exercises");
        if (!ex.length) {
          ex = SEED.map(([name, group, rest]) => ({ name, group, rest, custom: false }));
          await dbPutMany("exercises", ex);
        }
        const exercises = Object.fromEntries(ex.map((e) => [e.name, e]));
        const plans = (await dbAll("plans")).sort((a, b) => a.createdAt - b.createdAt);
        const sessions = (await dbAll("sessions")).sort((a, b) => b.startedAt - a.startedAt);
        const weights = (await dbAll("weights")).sort((a, b) => a.date.localeCompare(b.date));
        const st = await dbGet("kv", "settings");
        const ac = await dbGet("kv", "active");
        if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
        setS({ ready: true, exercises, plans, sessions, weights, settings: st?.value || { unit: "kg" }, active: ac?.value || null });
      } catch (e) {
        log(e);
        setS((x) => ({ ...x, ready: true }));
      }
    })();
  }, []);

  const api = useMemo(() => { const self = {
    savePlan(p) {
      setS((x) => ({ ...x, plans: x.plans.some((q) => q.id === p.id) ? x.plans.map((q) => (q.id === p.id ? p : q)) : [...x.plans, p] }));
      dbPut("plans", p).catch(log);
    },
    deletePlan(id) {
      setS((x) => ({ ...x, plans: x.plans.filter((q) => q.id !== id) }));
      dbDel("plans", id).catch(log);
    },
    saveExercise(ex) {
      setS((x) => ({ ...x, exercises: { ...x.exercises, [ex.name]: ex } }));
      dbPut("exercises", ex).catch(log);
    },
    saveSession(sess) {
      setS((x) => ({ ...x, sessions: [sess, ...x.sessions.filter((q) => q.id !== sess.id)].sort((a, b) => b.startedAt - a.startedAt) }));
      dbPut("sessions", sess).catch(log);
    },
    deleteSession(id) {
      setS((x) => ({ ...x, sessions: x.sessions.filter((q) => q.id !== id) }));
      dbDel("sessions", id).catch(log);
    },
    saveWeight(w) {
      setS((x) => ({ ...x, weights: [...x.weights.filter((q) => q.date !== w.date), w].sort((a, b) => a.date.localeCompare(b.date)) }));
      dbPut("weights", w).catch(log);
    },
    deleteWeight(date) {
      setS((x) => ({ ...x, weights: x.weights.filter((q) => q.date !== date) }));
      dbDel("weights", date).catch(log);
    },
    setUnit(unit) {
      setS((x) => ({ ...x, settings: { ...x.settings, unit } }));
      dbPut("kv", { key: "settings", value: { ...ref.current.settings, unit } }).catch(log);
    },
    setActive(a) {
      ref.current = { ...ref.current, active: a };
      setS((x) => ({ ...x, active: a }));
      (a ? dbPut("kv", { key: "active", value: a }) : dbDel("kv", "active")).catch(log);
    },
    updateActive(fn) {
      const next = fn(ref.current.active);
      self.setActive(next);
    },
    importData({ plans, newExercises, sessions }) {
      const ids = new Set(sessions.map((q) => q.id));
      setS((x) => ({
        ...x,
        exercises: { ...x.exercises, ...Object.fromEntries(newExercises.map((e) => [e.name, e])) },
        plans: [...x.plans, ...plans],
        sessions: [...sessions, ...x.sessions.filter((q) => !ids.has(q.id))].sort((a, b) => b.startedAt - a.startedAt),
      }));
      if (newExercises.length) dbPutMany("exercises", newExercises).catch(log);
      if (plans.length) dbPutMany("plans", plans).catch(log);
      if (sessions.length) dbPutMany("sessions", sessions).catch(log);
    },
    exportAll() {
      const c = ref.current;
      return JSON.stringify({
        app: "gym-tracker", version: 1, exportedAt: new Date().toISOString(),
        exercises: Object.values(c.exercises), plans: c.plans, sessions: c.sessions,
        weights: c.weights, settings: c.settings,
      });
    },
    async importAll(text) {
      const d = JSON.parse(text);
      if (d.app !== "gym-tracker" || !Array.isArray(d.plans) || !Array.isArray(d.sessions)) throw new Error("Ungültiges Backup");
      for (const [store, items] of [["exercises", d.exercises || []], ["plans", d.plans], ["sessions", d.sessions], ["weights", d.weights || []]]) {
        await dbClear(store);
        await dbPutMany(store, items);
      }
      await dbPut("kv", { key: "settings", value: d.settings || { unit: "kg" } });
      await dbDel("kv", "active");
      window.location.reload();
    },
  }; return self; }, []);

  const value = useMemo(() => ({ ...s, ...api }), [s, api]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
