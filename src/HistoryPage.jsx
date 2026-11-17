import { useStore, useUnit } from "./store";
import { Empty, Header } from "./UI";
import { dateTimeStr, fmt } from "./utils";

const dur = (s) => (s.endedAt > s.startedAt ? Math.round((s.endedAt - s.startedAt) / 60000) + " min" : "–");

export function HistoryPage({ onOpen }) {
  const { sessions } = useStore();
  return (
    <>
      <Header title="Verlauf" />
      <main>
        {sessions.length ? (
          <ul className="list">
            {sessions.map((s) => (
              <li key={s.id} onClick={() => onOpen(s.id)}>
                <div>
                  <b>{s.planName}</b>
                  <small>{dateTimeStr(s.startedAt)} · {dur(s)} · {s.logs.length} Sätze</small>
                </div>
                <span style={{ color: "var(--sub)" }}>›</span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Noch keine Trainings">Abgeschlossene Trainings erscheinen hier.</Empty>
        )}
      </main>
    </>
  );
}

export function SessionDetail({ id, onBack }) {
  const { sessions, deleteSession } = useStore();
  const { unit, toDisp } = useUnit();
  const s = sessions.find((x) => x.id === id);
  if (!s) return null;
  const groups = [];
  s.logs.forEach((l) => {
    let g = groups.find((x) => x.name === l.exercise);
    if (!g) groups.push((g = { name: l.exercise, logs: [] }));
    g.logs.push(l);
  });
  return (
    <>
      <Header title={s.planName} left={<button onClick={onBack}>‹ Verlauf</button>} />
      <main>
        <p className="hint">{dateTimeStr(s.startedAt)} · {dur(s)}</p>
        {groups.map((g) => (
          <div key={g.name}>
            <h3>{g.name}</h3>
            <ul className="list">
              {g.logs.map((l, i) => (
                <li key={i}><span className="sub" style={{ margin: 0 }}>Satz {l.setNumber}</span><span>{fmt(toDisp(l.weight))} {unit} × {l.reps}</span></li>
              ))}
            </ul>
          </div>
        ))}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button className="red" onClick={() => { if (confirm("Dieses Training löschen?")) { deleteSession(s.id); onBack(); } }}>Training löschen</button>
        </div>
      </main>
    </>
  );
}
