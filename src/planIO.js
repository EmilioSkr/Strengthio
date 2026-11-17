import { KG2LB, pad, uid } from "./utils";
import { MUSCLES } from "./data";

/* ================= CSV ================= */
export function parseCSV(text) {
  text = text.replace(/^\uFEFF/, "");
  const first = text.split(/\r?\n/, 1)[0];
  const delim = [",", ";", "\t"].map((d) => [d, first.split(d).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [], f = "", q = false;
  const endRow = () => { row.push(f); f = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; endRow(); }
    else f += c;
  }
  if (f !== "" || row.length) endRow();
  return rows;
}

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n\r;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\n") + "\n";
const r2 = (n) => Math.round(n * 100) / 100;

/* ================= Datum / Dauer ================= */
const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
export function parseDate(s) {
  s = (s || "").trim();
  if (!s) return null;
  let m;
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}.*([zZ]|[+-]\d{2}:?\d{2})$/.test(s)) { const t = Date.parse(s.replace(" ", "T")); return isNaN(t) ? null : t; }
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/))) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] || 0)).getTime();
  if ((m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/))) return new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0).getTime();
  if ((m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\.?,?\s+(\d{4}),?\s*(\d{1,2}):(\d{2})/)) && MON[m[2].toLowerCase()] !== undefined)
    return new Date(+m[3], MON[m[2].toLowerCase()], +m[1], +m[4], +m[5]).getTime();
  if ((m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/))) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] || 12), +(m[5] || 0)).getTime();
  const t = Date.parse(s);
  return isNaN(t) ? null : t;
}
export function parseDuration(s) {
  s = (s || "").trim();
  if (!s) return null;
  let m = s.match(/^(\d+):(\d{2}):(\d{2})$/);
  if (m) return ((+m[1]) * 3600 + (+m[2]) * 60 + (+m[3])) * 1000;
  m = s.match(/^(?:(\d+)\s*h)?\s*(?:(\d+)\s*m(?:in)?)?\s*(?:(\d+)\s*s)?$/i);
  if (m && (m[1] || m[2] || m[3])) return ((+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0)) * 1000;
  return null;
}
const fmtDT = (ts) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const fmtDur = (ms) => {
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

/* ================= Export ================= */
const STRONG_HEADER = ["Date", "Workout Name", "Duration", "Exercise Name", "Set Order", "Weight", "Reps", "Distance", "Seconds", "Notes", "Workout Notes", "RPE"];

export function plansToJSON(plans, exercises) {
  return JSON.stringify({
    app: "gym-tracker", type: "plans", version: 1, weightUnit: "kg", exportedAt: new Date().toISOString(),
    plans: plans.map((p) => ({
      name: p.name,
      entries: p.entries.map((e) => ({
        exercise: e.exercise,
        group: exercises[e.exercise]?.group,
        rest: exercises[e.exercise]?.rest,
        sets: e.sets.map((s) => ({ reps: s.reps, weight: r2(s.weight) })),
      })),
    })),
  }, null, 2);
}

/** Jeder Plan als ein Workout im Strong-CSV-Format (Datum = heute) */
export function plansToStrongCSV(plans, toDisp) {
  const date = fmtDT(Date.now());
  const rows = [STRONG_HEADER];
  plans.forEach((p) => p.entries.forEach((e) => e.sets.forEach((s, j) =>
    rows.push([date, p.name, "", e.exercise, j + 1, r2(toDisp(s.weight)), s.reps, "", "", "", "", ""]))));
  return toCSV(rows);
}

export function historyToStrongCSV(sessions, toDisp) {
  const rows = [STRONG_HEADER];
  [...sessions].sort((a, b) => a.startedAt - b.startedAt).forEach((s) => {
    const dur = s.endedAt > s.startedAt ? fmtDur(s.endedAt - s.startedAt) : "";
    const counter = {};
    s.logs.forEach((l) => {
      counter[l.exercise] = (counter[l.exercise] || 0) + 1;
      rows.push([fmtDT(s.startedAt), s.planName, dur, l.exercise, counter[l.exercise], r2(toDisp(l.weight)), l.reps, "", "", "", "", ""]);
    });
  });
  return toCSV(rows);
}

/* ================= Import: Einlesen ================= */
/** -> { format, label, fixedUnit, unitHint, planOnly, workouts:[{name, ts, durationMs, exercises:[{name, group?, rest?, sets:[{reps, weight}]}]}] } */
export function parseImport(text) {
  text = (text || "").trim();
  if (!text) throw new Error("Keine Daten gefunden.");
  if (text[0] === "{" || text[0] === "[") return parseJSON(text);
  return parseCSVImport(text);
}

function parseJSON(text) {
  let d;
  try { d = JSON.parse(text); } catch { throw new Error("Die Datei ist kein gültiges JSON."); }
  if (d && d.app === "gym-tracker" && Array.isArray(d.sessions))
    throw new Error("Das ist ein Komplett-Backup. Stelle es unter „Mehr“ → Backup wieder her.");
  if (!d || d.app !== "gym-tracker" || d.type !== "plans" || !Array.isArray(d.plans))
    throw new Error("Unbekanntes JSON-Format. Unterstützt werden Gym-Tracker-Pläne.");
  const workouts = d.plans.map((p) => ({
    name: String(p.name || "Plan"), ts: null, durationMs: null,
    exercises: (p.entries || []).map((e) => ({
      name: String(e.exercise), group: e.group, rest: e.rest,
      sets: (e.sets || []).map((s) => ({ reps: Math.max(0, Math.round(+s.reps || 0)), weight: Math.max(0, +s.weight || 0) })),
    })),
  }));
  return { format: "gym-tracker", label: "Gym-Tracker-Pläne (JSON)", fixedUnit: "kg", unitHint: "kg", planOnly: true, workouts };
}

function parseCSVImport(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) throw new Error("Die CSV-Datei enthält keine Datenzeilen.");
  const head = rows[0].map((h) => h.trim().toLowerCase());
  const col = (...names) => head.findIndex((h) => names.includes(h));
  const colStart = (...p) => head.findIndex((h) => p.some((x) => h.startsWith(x)));
  const data = rows.slice(1);
  const get = (r, i) => (i >= 0 && i < r.length ? (r[i] ?? "").trim() : "");
  const numOf = (v) => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : 0; };

  let spec;
  if (col("exercise_title") >= 0 && col("set_index") >= 0) {
    const wk = colStart("weight");
    const unit = head[wk]?.includes("lb") ? "lbs" : "kg";
    spec = {
      format: "hevy", label: "Hevy-CSV", unitHint: unit, fixedUnit: wk >= 0 ? unit : null,
      name: col("title"), ex: col("exercise_title"), reps: col("reps"), weight: wk,
      start: col("start_time"), end: col("end_time"), setType: col("set_type"),
    };
  } else if (col("workout name") >= 0 && col("exercise name") >= 0 && col("set order") >= 0) {
    const wk = colStart("weight");
    const h = head[wk] || "";
    spec = {
      format: "strong", label: "Strong-CSV", unitHint: h.includes("(kg") ? "kg" : /\(lb/.test(h) ? "lbs" : null,
      fixedUnit: null, name: col("workout name"), ex: col("exercise name"), reps: col("reps"), weight: wk,
      start: col("date"), dur: col("duration"), setOrder: col("set order"),
    };
  } else if (col("exercise name", "exercise", "übung", "uebung") >= 0 && col("reps", "wdh", "wiederholungen") >= 0) {
    spec = {
      format: "csv", label: "Allgemeine CSV", unitHint: null, fixedUnit: null,
      name: col("workout name", "workout", "plan", "routine", "title", "name"),
      ex: col("exercise name", "exercise", "übung", "uebung"), reps: col("reps", "wdh", "wiederholungen"),
      weight: colStart("weight", "gewicht"), start: col("date", "datum"), setOrder: col("set order", "set", "satz"),
    };
  } else {
    throw new Error("CSV-Format nicht erkannt. Erwartet werden Spalten wie „Workout Name, Exercise Name, Set Order, Weight, Reps“ (Strong) oder Hevy-Export.");
  }

  const groups = new Map();
  data.forEach((r) => {
    const exName = get(r, spec.ex);
    if (!exName) return;
    if (spec.format === "strong" && !/^\d+$/.test(get(r, spec.setOrder))) return; // Warm-up-/Rest-Timer-Zeilen
    if (spec.format === "hevy" && get(r, spec.setType).toLowerCase() === "warmup") return;
    const reps = Math.round(numOf(get(r, spec.reps)));
    if (!(reps > 0)) return; // Zeit-/Distanz-Sätze werden nicht unterstützt
    const wName = (spec.name >= 0 ? get(r, spec.name) : "") || "Import";
    const dateStr = spec.start >= 0 ? get(r, spec.start) : "";
    const key = wName + "\u0001" + dateStr;
    let w = groups.get(key);
    if (!w) {
      const ts = parseDate(dateStr);
      let durationMs = null;
      if (spec.format === "strong") durationMs = parseDuration(get(r, spec.dur));
      if (spec.format === "hevy") { const e = parseDate(get(r, spec.end)); if (ts && e && e > ts) durationMs = e - ts; }
      groups.set(key, (w = { name: wName, ts, durationMs, exercises: [] }));
    }
    let ex = w.exercises.find((x) => x.name === exName);
    if (!ex) w.exercises.push((ex = { name: exName, sets: [] }));
    ex.sets.push({ reps, weight: Math.max(0, numOf(get(r, spec.weight))) });
  });
  const workouts = [...groups.values()];
  if (!workouts.length) throw new Error("Keine verwertbaren Sätze gefunden (nur Sätze mit Wiederholungen werden importiert).");
  return { format: spec.format, label: spec.label, fixedUnit: spec.fixedUnit, unitHint: spec.unitHint, planOnly: !workouts.some((w) => w.ts), workouts };
}

/* ================= Import: Übungen zuordnen ================= */
// Häufige englische Namen (Strong/Hevy) -> vorhandene deutsche Übungen
const ALIASES = {
  "bench press (barbell)": "Bankdrücken", "incline bench press (barbell)": "Schrägbankdrücken",
  "bench press (dumbbell)": "Kurzhantel-Bankdrücken", "chest fly (dumbbell)": "Fliegende",
  "pull up": "Klimmzüge", "lat pulldown (cable)": "Latziehen", "bent over row (barbell)": "Langhantelrudern",
  "deadlift (barbell)": "Kreuzheben", "overhead press (barbell)": "Schulterdrücken",
  "lateral raise (dumbbell)": "Seitheben", "front raise (dumbbell)": "Frontheben", "face pull (cable)": "Face Pulls",
  "bicep curl (barbell)": "Langhantel-Curls", "bicep curl (dumbbell)": "Kurzhantel-Curls", "hammer curl (dumbbell)": "Hammer-Curls",
  "triceps pushdown (cable)": "Trizepsdrücken am Kabel", "skullcrusher (barbell)": "French Press",
  "squat (barbell)": "Kniebeuge", "leg press": "Beinpresse", "leg press (machine)": "Beinpresse",
  "romanian deadlift (barbell)": "Rumänisches Kreuzheben", "leg extension (machine)": "Beinstrecker",
  "seated leg curl (machine)": "Beinbeuger", "lying leg curl (machine)": "Beinbeuger", "hip thrust (barbell)": "Hip Thrust",
  "standing calf raise (machine)": "Wadenheben stehend", "seated calf raise (machine)": "Wadenheben sitzend",
  "crunch": "Crunches", "plank": "Plank", "push up": "Liegestütze", "hanging leg raise": "Beinheben hängend",
};

const RULES = [
  ["Waden", /calf|calves|wade/],
  ["Gesäß", /hip thrust|glute|gesäß|gesaess/],
  ["Trizeps", /tricep|trizep|pushdown|skull|french press/],
  ["Beine", /romanian|rumänisch|leg curl|leg press|leg ext|leg raise machine|squat|lunge|quad|hamstring|kniebeuge|bein|ausfall/],
  ["Bizeps", /bicep|bizep|curl/],
  ["Schultern", /shoulder|overhead press|military|lateral raise|front raise|rear delt|face pull|arnold|schulter|seitheben|frontheben/],
  ["Rücken", /deadlift|row|pull.?up|chin.?up|pulldown|pull down|lat |rücken|klimmzug|kreuzheben|hyperext/],
  ["Brust", /chest|bench|fly|flye|push.?up|dip|pec|brust|butterfly|liegestütz/],
  ["Bauch", /crunch|plank|\babs?\b|sit.?up|core|bauch|leg raise/],
];
export function guessGroup(name) {
  const n = name.toLowerCase();
  for (const [g, re] of RULES) if (re.test(n)) return g;
  return "Sonstige";
}

/* ================= Import: Ergebnis berechnen ================= */
export function buildImport(parsed, { fileUnit, withHistory, exercises, existingPlans, maxPlans }) {
  const kg = (w) => r2(fileUnit === "lbs" ? w / KG2LB : w);
  const lowerIndex = Object.fromEntries(Object.keys(exercises).map((n) => [n.toLowerCase(), n]));
  const created = {};
  const resolve = (ex) => {
    const low = ex.name.toLowerCase();
    if (lowerIndex[low]) return lowerIndex[low];
    const alias = ALIASES[low];
    if (alias && exercises[alias]) return alias;
    if (created[low]) return created[low].name;
    const group = MUSCLES.includes(ex.group) ? ex.group : guessGroup(ex.name);
    const rest = Number.isFinite(ex.rest) ? Math.max(0, Math.min(600, Math.round(ex.rest))) : 90;
    created[low] = { name: ex.name, group, rest, custom: true };
    return ex.name;
  };

  // Plan = jeweils das neueste Workout pro Name
  const latest = new Map();
  parsed.workouts.forEach((w) => {
    const cur = latest.get(w.name);
    if (!cur || (w.ts || 0) >= (cur.ts || 0)) latest.set(w.name, w);
  });

  const taken = new Set(existingPlans.map((p) => p.name.toLowerCase()));
  const freeSlots = Math.max(0, maxPlans - existingPlans.length);
  const plans = [];
  let skipped = 0;
  [...latest.values()].forEach((w, idx) => {
    const entries = w.exercises.filter((e) => e.sets.length)
      .map((e) => ({ exercise: resolve(e), sets: e.sets.map((s) => ({ reps: s.reps, weight: kg(s.weight) })) }));
    if (!entries.length) return;
    if (plans.length >= freeSlots) { skipped++; return; }
    let name = w.name, k = 2;
    if (taken.has(name.toLowerCase())) name = `${w.name} (Import)`;
    while (taken.has(name.toLowerCase())) name = `${w.name} (Import ${k++})`;
    taken.add(name.toLowerCase());
    plans.push({ id: uid(), name, createdAt: Date.now() + idx, entries });
  });

  const sessions = [];
  if (withHistory && !parsed.planOnly) {
    parsed.workouts.forEach((w) => {
      if (!w.ts) return;
      const logs = [];
      w.exercises.forEach((e) => {
        const name = resolve(e);
        e.sets.forEach((s, i) => logs.push({ exercise: name, setNumber: i + 1, reps: s.reps, weight: kg(s.weight) }));
      });
      if (!logs.length) return;
      sessions.push({ id: `imp-${w.ts}-${w.name}`, planName: w.name, startedAt: w.ts, endedAt: w.ts + (w.durationMs || 0), logs });
    });
  }
  return { plans, newExercises: Object.values(created), sessions, skippedPlans: skipped };
}

/* ================= Teilen / Kopieren ================= */
export async function shareText(fileName, text, mime) {
  const file = new File([text], fileName, { type: mime });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: fileName });
      return "shared";
    }
  } catch (e) {
    if (e && e.name === "AbortError") return "cancelled";
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  return "downloaded";
}
export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
export const safeName = (s) => s.replace(/[^\w\-äöüÄÖÜß]+/g, "_").replace(/^_+|_+$/g, "") || "plan";
