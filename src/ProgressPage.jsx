import { useMemo, useState } from "react";
import { useStore, useUnit } from "./store";
import { Empty, Header, Seg } from "./UI";
import { TrendChart, WeeklyBars } from "./Charts";
import { METRICS, exerciseSeries, fmt, weeklyCounts } from "./utils";

export function ProgressPage() {
  const { sessions } = useStore();
  const { unit, toDisp } = useUnit();
  const [sel, setSel] = useState(null);
  const [metric, setMetric] = useState("max");

  const names = useMemo(() => {
    const last = {};
    sessions.forEach((s) => s.logs.forEach((l) => { last[l.exercise] = Math.max(last[l.exercise] || 0, s.startedAt); }));
    return Object.keys(last).sort((a, b) => last[b] - last[a]);
  }, [sessions]);

  const weekly = useMemo(() => weeklyCounts(sessions), [sessions]);
  const name = names.includes(sel) ? sel : names[0];
  const m = METRICS.find((x) => x.id === metric);
  const suffix = m.weight ? unit : "Wdh";
  const data = useMemo(
    () => (name ? exerciseSeries(sessions, name, metric).map((p) => ({ t: p.t, value: m.weight ? toDisp(p.value) : p.value })) : []),
    [sessions, name, metric, unit]
  );
  const f = (v) => `${fmt(v)} ${suffix}`;

  if (!sessions.length) {
    return (
      <>
        <Header title="Fortschritt" />
        <main><Empty title="Noch keine Daten">Schließe ein Training ab, dann erscheinen hier deine Diagramme.</Empty></main>
      </>
    );
  }

  const first = data[0]?.value, last = data[data.length - 1]?.value;
  const best = data.length ? Math.max(...data.map((d) => d.value)) : 0;
  const diff = data.length > 1 ? last - first : 0;

  return (
    <>
      <Header title="Fortschritt" />
      <main>
        <div className="chartcard">
          <h4>Trainings pro Woche (letzte 12 Wochen)</h4>
          <WeeklyBars data={weekly} />
        </div>

        <h3>Übung</h3>
        <select className="field" value={name} onChange={(e) => setSel(e.target.value)}>
          {names.map((n) => <option key={n}>{n}</option>)}
        </select>
        <Seg options={METRICS} value={metric} onChange={setMetric} />

        {data.length > 0 ? (
          <>
            <div className="chartcard">
              <h4>{name} · {m.label} ({suffix})</h4>
              <TrendChart data={data} format={f} />
            </div>
            <div className="stats">
              <div className="stat"><b>{f(last)}</b><small>Zuletzt</small></div>
              <div className="stat"><b>{f(best)}</b><small>Bestwert</small></div>
              <div className="stat"><b className={diff > 0 ? "green" : diff < 0 ? "red" : ""}>{diff > 0 ? "+" : ""}{fmt(diff)} {suffix}</b><small>Seit Beginn</small></div>
            </div>
            <p className="hint">{data.length} {data.length === 1 ? "Training" : "Trainings"} mit dieser Übung. 1RM wird nach der Epley-Formel geschätzt.</p>
          </>
        ) : (
          <Empty title="Keine Daten">Für diese Auswahl gibt es noch keine Werte.</Empty>
        )}
      </main>
    </>
  );
}
