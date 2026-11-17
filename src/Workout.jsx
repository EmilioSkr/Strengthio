import { useEffect, useState } from "react";
import { useStore, useUnit } from "./store";
import { Header, NumInput, Sheet } from "./UI";
import { beep, unlockAudio } from "./audio";
import { clock, mmss, uid } from "./utils";

function useWakeLock() {
  useEffect(() => {
    let lock = null, gone = false;
    const get = async () => {
      try { if ("wakeLock" in navigator) { lock = await navigator.wakeLock.request("screen"); if (gone) lock.release(); } } catch {}
    };
    const vis = () => document.visibilityState === "visible" && get();
    get();
    document.addEventListener("visibilitychange", vis);
    return () => { gone = true; document.removeEventListener("visibilitychange", vis); try { lock && lock.release(); } catch {} };
  }, []);
}

function Elapsed({ start }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 500); return () => clearInterval(t); }, []);
  return <span className="tnum" style={{ fontWeight: 600 }}>{clock(Date.now() - start)}</span>;
}

function RestBar() {
  const { active, updateActive } = useStore();
  const [now, setNow] = useState(Date.now());
  const end = active.restEndsAt;
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (end && now >= end) {
      if (now - end < 3000) beep();
      updateActive((a) => ({ ...a, restEndsAt: null }));
    }
  }, [now, end]);
  if (!end) return null;
  const left = Math.max(0, Math.ceil((end - now) / 1000));
  return (
    <div className="restbar">
      <span>⏳</span>
      <b>{mmss(left)}</b>
      <button className="step" onClick={() => updateActive((a) => ({ ...a, restEndsAt: a.restEndsAt + 15000 }))}>+15 s</button>
      <button className="primary" onClick={() => updateActive((a) => ({ ...a, restEndsAt: null }))}>Skip</button>
    </div>
  );
}

export default function Workout({ onDone }) {
  const { active, exercises, plans, updateActive, setActive, savePlan, saveSession } = useStore();
  const { unit, toDisp, fromDisp } = useUnit();
  const [finishing, setFinishing] = useState(false);
  useWakeLock();

  const patchSet = (i, j, patch) =>
    updateActive((a) => ({ ...a, items: a.items.map((it, k) => k !== i ? it : { ...it, sets: it.sets.map((s, m) => (m === j ? { ...s, ...patch } : s)) }) }));

  const toggle = (i, j) =>
    updateActive((a) => {
      const it = a.items[i];
      const done = !it.sets[j].done;
      let next = { ...a, items: a.items.map((x, k) => k !== i ? x : { ...x, sets: x.sets.map((y, m) => (m === j ? { ...y, done } : y)) }) };
      if (done) {
        unlockAudio();
        const ex = exercises[it.exercise];
        if (ex && ex.rest > 0) next = { ...next, restEndsAt: Date.now() + ex.rest * 1000 };
      }
      return next;
    });

  const addSet = (i) =>
    updateActive((a) => ({
      ...a,
      items: a.items.map((it, k) => {
        if (k !== i) return it;
        const l = it.sets[it.sets.length - 1];
        return { ...it, sets: [...it.sets, { reps: l ? l.reps : 10, weight: l ? l.weight : 0, done: false }] };
      }),
    }));

  const finish = (save) => {
    if (save) {
      const p = plans.find((x) => x.id === active.planId);
      const entries = p ? p.entries.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) })) : null;
      const logs = [];
      active.items.forEach((it) =>
        it.sets.forEach((s, j) => {
          if (!s.done) return;
          logs.push({ exercise: it.exercise, setNumber: j + 1, reps: s.reps, weight: s.weight });
          const entry = entries && entries.find((e) => e.exercise === it.exercise);
          if (entry) {
            if (j < entry.sets.length) entry.sets[j] = { reps: s.reps, weight: s.weight };
            else entry.sets.push({ reps: s.reps, weight: s.weight });
          }
        })
      );
      if (logs.length) {
        saveSession({ id: uid(), planName: active.planName, startedAt: active.startedAt, endedAt: Date.now(), logs });
        if (p) savePlan({ ...p, entries });
      }
    }
    setActive(null);
    onDone();
  };

  return (
    <>
      <Header title={active.planName} left={<Elapsed start={active.startedAt} />}
        right={<button style={{ fontWeight: 600 }} onClick={() => setFinishing(true)}>Beenden</button>} />
      <main>
        {active.items.map((it, i) => {
          const ex = exercises[it.exercise] || { group: "", rest: 0 };
          return (
            <section className="card" key={it.exercise}>
              <div className="cardhead">
                <div><b>{it.exercise}</b><small>{ex.group} · Pause {ex.rest ? mmss(ex.rest) : "keine"}</small></div>
              </div>
              {it.sets.map((s, j) => (
                <div className={"setrow" + (s.done ? " row-done" : "")} key={j}>
                  <span className="sn">{j + 1}</span>
                  <NumInput decimal value={toDisp(s.weight)} onChange={(v) => patchSet(i, j, { weight: fromDisp(v) })} />
                  <span className="u">{unit}</span>
                  <NumInput value={s.reps} onChange={(v) => patchSet(i, j, { reps: v })} />
                  <span className="u">Wdh</span>
                  <button className={"done" + (s.done ? " on" : "")} onClick={() => toggle(i, j)}>{s.done ? "●" : "○"}</button>
                </div>
              ))}
              <button onClick={() => addSet(i)}>＋ Satz hinzufügen</button>
            </section>
          );
        })}
      </main>
      <RestBar />
      {finishing && (
        <Sheet title="Training beenden?">
          <div className="dialog">
            <button className="green" onClick={() => finish(true)}>Speichern &amp; beenden</button>
            <button className="danger" onClick={() => finish(false)}>Verwerfen</button>
            <button onClick={() => setFinishing(false)}>Weitertrainieren</button>
            <p className="hint">Beim Speichern werden deine Werte für das nächste Training dieses Plans übernommen.</p>
          </div>
        </Sheet>
      )}
    </>
  );
}
