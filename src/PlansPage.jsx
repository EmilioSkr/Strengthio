import { useState } from "react";
import { useStore, useUnit } from "./store";
import { Empty, Header, NumInput, Sheet } from "./UI";
import { MAX_PLANS, MUSCLES, ORDER, STARTERS } from "./data";
import { mmss, uid } from "./utils";
import { unlockAudio } from "./audio";
import { ImportExportSheet } from "./ImportExport";

export function PlansPage({ onOpen }) {
  const { plans, savePlan } = useStore();
  const [io, setIo] = useState(false);
  const create = () => {
    if (plans.length >= MAX_PLANS) return alert(`Maximal ${MAX_PLANS} Pläne. Lösche zuerst einen Plan.`);
    const name = (prompt("Name des Plans:") || "").trim();
    if (!name) return;
    const p = { id: uid(), name, createdAt: Date.now(), entries: [] };
    savePlan(p);
    onOpen(p.id);
  };
  return (
    <>
      <Header title="Workout-Pläne"
        left={<button onClick={() => setIo(true)}>⇅ Import/Export</button>}
        right={<button onClick={create} style={{ fontSize: 26 }}>＋</button>} />
      <main>
        {plans.length ? (
          <ul className="list">
            {plans.map((p) => (
              <li key={p.id} onClick={() => onOpen(p.id)}>
                <div><b>{p.name}</b><small>{p.entries.length} Übungen</small></div>
                <span style={{ color: "var(--sub)" }}>›</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Noch keine Pläne">Tippe auf ＋, um deinen ersten Workout-Plan zu erstellen.</Empty>
        )}
        <p className="hint">{plans.length} von {MAX_PLANS} Plänen</p>
      </main>
      {io && <ImportExportSheet onClose={() => setIo(false)} />}
    </>
  );
}

export function PlanDetail({ planId, onBack }) {
  const { plans, exercises, savePlan, deletePlan, saveExercise, setActive } = useStore();
  const { unit, toDisp, fromDisp } = useUnit();
  const [adding, setAdding] = useState(false);
  const [sorting, setSorting] = useState(false);
  const [io, setIo] = useState(false);
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return null;

  const setEntries = (entries) => savePlan({ ...plan, entries });
  const upd = (i, fn) => setEntries(plan.entries.map((e, k) => (k === i ? fn(e) : e)));
  const updSet = (i, j, patch) => upd(i, (e) => ({ ...e, sets: e.sets.map((s, m) => (m === j ? { ...s, ...patch } : s)) }));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= plan.entries.length) return;
    const a = [...plan.entries];
    [a[i], a[j]] = [a[j], a[i]];
    setEntries(a);
  };
  const changeRest = (name, d) => {
    const ex = exercises[name];
    saveExercise({ ...ex, rest: Math.max(0, Math.min(600, ex.rest + d)) });
  };
  const start = () => {
    unlockAudio();
    setActive({
      planId: plan.id, planName: plan.name, startedAt: Date.now(), restEndsAt: null,
      items: plan.entries.map((e) => ({ exercise: e.exercise, sets: e.sets.map((s) => ({ reps: s.reps, weight: s.weight, done: false })) })),
    });
  };

  return (
    <>
      <Header
        title={plan.name}
        left={<button onClick={onBack}>‹ Pläne</button>}
        right={<button className="primary" onClick={start} disabled={!plan.entries.length}>Start</button>}
      />
      <main>
        {!plan.entries.length && <Empty title="Plan ist leer">Füge Übungen hinzu, um loszulegen.</Empty>}

        {plan.entries.length > 1 && (
          <div style={{ textAlign: "right" }}>
            <button onClick={() => setSorting((s) => !s)}>{sorting ? "✓ Fertig" : "↕ Reihenfolge ändern"}</button>
          </div>
        )}

        {sorting ? (
          plan.entries.map((e, i) => (
            <div className="sortrow" key={e.exercise}>
              <div><b>{i + 1}. {e.exercise}</b><small>{exercises[e.exercise]?.group} · {e.sets.length} Sätze</small></div>
              <div>
                <button className="ghost" disabled={i === 0} onClick={() => move(i, -1)}>▲</button>
                <button className="ghost" disabled={i === plan.entries.length - 1} onClick={() => move(i, 1)}>▼</button>
              </div>
            </div>
          ))
        ) : (
          plan.entries.map((e, i) => {
            const ex = exercises[e.exercise] || { group: "", rest: 90 };
            return (
              <section className="card" key={e.exercise}>
                <div className="cardhead">
                  <div><b>{i + 1}. {e.exercise}</b><small>{ex.group}</small></div>
                  <button className="red" onClick={() => setEntries(plan.entries.filter((_, k) => k !== i))}>Entfernen</button>
                </div>
                {e.sets.map((s, j) => (
                  <div className="setrow" key={j}>
                    <span className="sn">Satz {j + 1}</span>
                    <NumInput value={s.reps} onChange={(v) => updSet(i, j, { reps: v })} />
                    <span className="u">Wdh</span>
                    <NumInput decimal value={toDisp(s.weight)} onChange={(v) => updSet(i, j, { weight: fromDisp(v) })} />
                    <span className="u">{unit}</span>
                    <button className="ghost" onClick={() => upd(i, (x) => ({ ...x, sets: x.sets.filter((_, m) => m !== j) }))}>−</button>
                  </div>
                ))}
                <button onClick={() => {
                  const l = e.sets[e.sets.length - 1];
                  upd(i, (x) => ({ ...x, sets: [...x.sets, { reps: l ? l.reps : 10, weight: l ? l.weight : 0 }] }));
                }}>＋ Satz hinzufügen</button>
                <div className="rest">
                  <span>Satzpause: {ex.rest ? mmss(ex.rest) + " min" : "keine"}</span>
                  <span>
                    <button className="step" onClick={() => changeRest(e.exercise, -15)}>−</button>
                    <button className="step" onClick={() => changeRest(e.exercise, 15)}>＋</button>
                  </span>
                </div>
                <small>Gilt für diese Übung in allen Plänen.</small>
              </section>
            );
          })
        )}

        <button className="primary block" style={{ marginTop: 6 }} onClick={() => setAdding(true)}>＋ Übung hinzufügen</button>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
          <span>
            <button onClick={() => { const n = (prompt("Neuer Name:", plan.name) || "").trim(); if (n) savePlan({ ...plan, name: n }); }}>Umbenennen</button>
            <button onClick={() => setIo(true)}>⇅ Exportieren</button>
          </span>
          <button className="red" onClick={() => { if (confirm(`Plan „${plan.name}“ löschen?`)) { deletePlan(plan.id); onBack(); } }}>Plan löschen</button>
        </div>
      </main>
      {adding && <AddExerciseSheet plan={plan} onClose={() => setAdding(false)} />}
      {io && <ImportExportSheet planId={plan.id} onClose={() => setIo(false)} />}
    </>
  );
}

function AddExerciseSheet({ plan, onClose }) {
  const { exercises, savePlan, saveExercise } = useStore();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState(null);
  const [custom, setCustom] = useState(false);
  const [cname, setCname] = useState("");
  const [cgroup, setCgroup] = useState(MUSCLES[0]);

  const inPlan = new Set(plan.entries.map((e) => e.exercise));
  const all = Object.values(exercises).sort((a, b) => a.name.localeCompare(b.name, "de"));
  const addToPlan = (name) =>
    savePlan({ ...plan, entries: [...plan.entries, { exercise: name, sets: [0, 1, 2].map(() => ({ reps: 10, weight: 0 })) }] });

  // Vorschläge
  let suggestions = [];
  if (!search.trim() && !filter) {
    const avail = all.filter((x) => !inPlan.has(x.name)).sort((a, b) => (ORDER[a.name] ?? 999) - (ORDER[b.name] ?? 999));
    if (!plan.entries.length) {
      suggestions = STARTERS.map((n) => avail.find((x) => x.name === n)).filter(Boolean);
    } else {
      const used = new Set(plan.entries.map((e) => exercises[e.exercise]?.group));
      suggestions = avail.filter((x) => used.has(x.group)).slice(0, 3);
      MUSCLES.filter((g) => !used.has(g) && avail.some((x) => x.group === g)).slice(0, 3).forEach((g) => {
        const f = avail.find((x) => x.group === g);
        if (f) suggestions.push(f);
      });
    }
  }
  const q = search.trim().toLowerCase();
  const list = all.filter((x) => (!filter || x.group === filter) && (!q || x.name.toLowerCase().includes(q)));

  const Row = ({ x }) => {
    const added = inPlan.has(x.name);
    return (
      <div className={"exrow" + (added ? " added" : "")} onClick={() => !added && addToPlan(x.name)}>
        <div><b>{x.name}</b><small>{x.group}</small></div>
        <span>{added ? "✓" : "＋"}</span>
      </div>
    );
  };

  const saveCustom = () => {
    const name = cname.trim();
    if (!name) return;
    if (Object.keys(exercises).some((n) => n.toLowerCase() === name.toLowerCase())) return alert("Diese Übung gibt es schon.");
    saveExercise({ name, group: cgroup, rest: 90, custom: true });
    addToPlan(name);
    setCustom(false); setCname("");
  };

  if (custom) {
    return (
      <Sheet title="Eigene Übung"
        left={<button onClick={() => setCustom(false)}>Abbrechen</button>}
        right={<button onClick={saveCustom} style={{ fontWeight: 600 }}>Anlegen</button>}>
        <div className="pad">
          <input className="field" placeholder="Name der Übung" value={cname} onChange={(e) => setCname(e.target.value)} />
          <select className="field" value={cgroup} onChange={(e) => setCgroup(e.target.value)}>
            {MUSCLES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet title="Übung hinzufügen" right={<button onClick={onClose} style={{ fontWeight: 600 }}>Fertig</button>}>
      <div className="pad">
        <input className="search" type="search" placeholder="Übung suchen" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="chips">
          {[null, ...MUSCLES].map((g) => (
            <button key={g || "alle"} className={"chip" + (filter === g ? " on" : "")} onClick={() => setFilter(g)}>{g || "Alle"}</button>
          ))}
        </div>
        <button onClick={() => setCustom(true)}>＋ Eigene Übung erstellen</button>
      </div>
      <div className="pad">
        {suggestions.length > 0 && <><h3>Vorgeschlagen</h3>{suggestions.map((x) => <Row key={"s" + x.name} x={x} />)}</>}
        {MUSCLES.map((g) => {
          const items = list.filter((x) => x.group === g);
          return items.length ? <div key={g}><h3>{g}</h3>{items.map((x) => <Row key={x.name} x={x} />)}</div> : null;
        })}
        {!list.length && <Empty title="Nichts gefunden">Du kannst oben eine eigene Übung erstellen.</Empty>}
      </div>
    </Sheet>
  );
}
