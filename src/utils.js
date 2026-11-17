export const KG2LB = 2.2046226218;
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const pad = (n) => String(n).padStart(2, "0");
export const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};
export const fmt = (n) => String(Math.round(n * 10) / 10).replace(".", ",");
export const mmss = (s) => Math.floor(s / 60) + ":" + pad(s % 60);
export const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h}:${pad(m)}:${pad(x)}` : `${m}:${pad(x)}`;
};
export const dateTimeStr = (ts) => new Date(ts).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
export const dayStr = (ts) => new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
export const dayLong = (ts) => new Date(ts).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" });
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
export const isoToTs = (iso) => new Date(iso + "T12:00:00").getTime();

// Geschätztes 1-Wiederholungs-Maximum (Epley-Formel)
export const est1RM = (w, r) => (r <= 1 ? w : w * (1 + r / 30));

export function weekStart(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Montag
  return d.getTime();
}

export const METRICS = [
  { id: "max", label: "Max. Gewicht", weight: true },
  { id: "rm", label: "1RM (geschätzt)", weight: true },
  { id: "vol", label: "Volumen", weight: true },
  { id: "reps", label: "Wiederholungen", weight: false },
];

/** Verlauf einer Übung über alle Trainings (Werte in kg, bzw. Wiederholungen) */
export function exerciseSeries(sessions, name, metric) {
  return [...sessions]
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((s) => {
      const logs = s.logs.filter((l) => l.exercise === name && l.reps > 0);
      if (!logs.length) return null;
      let v;
      if (metric === "max") v = Math.max(...logs.map((l) => l.weight));
      else if (metric === "rm") v = Math.max(...logs.map((l) => est1RM(l.weight, l.reps)));
      else if (metric === "vol") v = logs.reduce((a, l) => a + l.weight * l.reps, 0);
      else v = logs.reduce((a, l) => a + l.reps, 0);
      return { t: s.startedAt, value: v };
    })
    .filter(Boolean);
}

export function weeklyCounts(sessions, weeks = 12) {
  const start = new Date(weekStart(Date.now()));
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(d.getDate() - 7 * i);
    out.push({ t: d.getTime(), label: dayStr(d.getTime()), count: 0 });
  }
  sessions.forEach((s) => {
    const o = out.find((x) => x.t === weekStart(s.startedAt));
    if (o) o.count++;
  });
  return out;
}
