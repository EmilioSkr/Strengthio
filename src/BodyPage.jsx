import { useMemo, useState } from "react";
import { useStore, useUnit } from "./store";
import { Empty, Header, NumInput } from "./UI";
import { TrendChart } from "./Charts";
import { dayLong, fmt, isoToTs, todayISO } from "./utils";

export function BodyPage() {
  const { weights, saveWeight, deleteWeight } = useStore();
  const { unit, toDisp, fromDisp } = useUnit();
  const lastKg = weights.length ? weights[weights.length - 1].kg : 0;
  const [date, setDate] = useState(todayISO());
  const [val, setVal] = useState(null); // Anzeige-Einheit; null = letzter Wert

  const shown = val ?? toDisp(lastKg);
  const save = () => {
    if (!(shown > 0) || shown > 700) return alert("Bitte ein gültiges Gewicht eingeben.");
    saveWeight({ date, kg: fromDisp(shown) });
    setVal(null);
  };

  const data = useMemo(() => weights.map((w) => ({ t: isoToTs(w.date), value: toDisp(w.kg) })), [weights, unit]);
  const cur = data.length ? data[data.length - 1].value : null;
  const start = data.length ? data[0].value : null;
  const min = data.length ? Math.min(...data.map((d) => d.value)) : null;
  const diff = data.length > 1 ? cur - start : 0;

  return (
    <>
      <Header title="Körpergewicht" />
      <main>
        <div className="card">
          <div className="row">
            <input className="field date" type="date" max={todayISO()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
              <NumInput decimal value={shown} onChange={setVal} />
              <span className="u">{unit}</span>
            </div>
          </div>
          <button className="primary block" style={{ marginTop: 8 }} onClick={save}>Eintragen</button>
          <small>Pro Tag zählt ein Eintrag – erneutes Eintragen überschreibt den Wert.</small>
        </div>

        {data.length > 0 ? (
          <>
            <div className="chartcard">
              <h4>Verlauf ({unit})</h4>
              <TrendChart data={data} yPad format={(v) => `${fmt(v)} ${unit}`} color="#ff9f0a" />
            </div>
            <div className="stats">
              <div className="stat"><b>{fmt(cur)} {unit}</b><small>Aktuell</small></div>
              <div className="stat"><b>{fmt(min)} {unit}</b><small>Minimum</small></div>
              <div className="stat"><b className={diff < 0 ? "green" : diff > 0 ? "red" : ""}>{diff > 0 ? "+" : ""}{fmt(diff)} {unit}</b><small>Seit Beginn</small></div>
            </div>
            <h3>Einträge</h3>
            <ul className="list">
              {[...weights].reverse().map((w) => (
                <li key={w.date}>
                  <span>{dayLong(isoToTs(w.date))}</span>
                  <span>
                    <b className="tnum">{fmt(toDisp(w.kg))} {unit}</b>
                    <button className="ghost" onClick={() => confirm("Eintrag löschen?") && deleteWeight(w.date)}>✕</button>
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <Empty title="Noch keine Einträge">Trage oben dein Gewicht ein, um den Verlauf zu sehen.</Empty>
        )}
      </main>
    </>
  );
}
