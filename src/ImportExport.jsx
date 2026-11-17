import { useMemo, useState } from "react";
import { useStore, useUnit } from "./store";
import { Seg, Sheet } from "./UI";
import { MAX_PLANS } from "./data";
import { buildImport, copyText, historyToStrongCSV, parseImport, plansToJSON, plansToStrongCSV, safeName, shareText } from "./planIO";

export function ImportExportSheet({ onClose, planId = null }) {
  const { plans, exercises, sessions, importData } = useStore();
  const { unit, toDisp } = useUnit();

  /* ---------- Export ---------- */
  const [scope, setScope] = useState(planId || "all");
  const [fmtSel, setFmtSel] = useState("json");
  const [exMsg, setExMsg] = useState("");

  const payload = (kind) => {
    if (kind === "history") return { name: "gym-verlauf-strong.csv", text: historyToStrongCSV(sessions, toDisp), mime: "text/csv" };
    const list = scope === "all" ? plans : plans.filter((p) => p.id === scope);
    const base = scope === "all" ? "gym-plaene" : "gym-plan-" + safeName(list[0]?.name || "plan");
    return fmtSel === "json"
      ? { name: base + ".json", text: plansToJSON(list, exercises), mime: "application/json" }
      : { name: base + "-strong.csv", text: plansToStrongCSV(list, toDisp), mime: "text/csv" };
  };
  const doShare = async (kind) => {
    const p = payload(kind);
    const r = await shareText(p.name, p.text, p.mime);
    setExMsg(r === "shared" ? "Geteilt." : r === "downloaded" ? "Datei wurde heruntergeladen." : "");
  };
  const doCopy = async (kind) => {
    const ok = await copyText(payload(kind).text);
    setExMsg(ok ? "In die Zwischenablage kopiert." : "Kopieren nicht möglich.");
  };

  /* ---------- Import ---------- */
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [err, setErr] = useState("");
  const [fileUnit, setFileUnit] = useState(unit);
  const [withHistory, setWithHistory] = useState(true);
  const [done, setDone] = useState("");

  const analyze = (t) => {
    setDone(""); setErr("");
    try {
      const p = parseImport(t);
      setParsed(p);
      setFileUnit(p.fixedUnit || p.unitHint || unit);
    } catch (e) { setParsed(null); setErr(e.message); }
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const t = await f.text();
    setText(t);
    analyze(t);
    e.target.value = "";
  };
  const result = useMemo(
    () => (parsed ? buildImport(parsed, { fileUnit, withHistory, exercises, existingPlans: plans, maxPlans: MAX_PLANS }) : null),
    [parsed, fileUnit, withHistory]
  );
  const apply = () => {
    importData(result);
    setDone(`${result.plans.length} ${result.plans.length === 1 ? "Plan" : "Pläne"}${result.sessions.length ? ` und ${result.sessions.length} Trainings` : ""} importiert.`);
    setParsed(null); setText("");
  };
  const hasHistory = parsed && !parsed.planOnly;

  return (
    <Sheet title="Import / Export" right={<button onClick={onClose} style={{ fontWeight: 600 }}>Fertig</button>}>
      <main>
        <h3>Exportieren</h3>
        <select className="field" value={scope} onChange={(e) => setScope(e.target.value)}>
          <option value="all">Alle Pläne ({plans.length})</option>
          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <Seg value={fmtSel} onChange={setFmtSel}
          options={[{ id: "json", label: "Gym Tracker (JSON)" }, { id: "csv", label: "Strong-CSV" }]} />
        <div className="row">
          <button className="primary" disabled={!plans.length} onClick={() => doShare("plans")}>Teilen / Speichern</button>
          <button disabled={!plans.length} onClick={() => doCopy("plans")}>Text kopieren</button>
        </div>
        <small>
          {fmtSel === "json"
            ? "Verlustfrei, zum Übertragen zwischen eigenen Geräten oder zum Weitergeben. Gewichte in kg."
            : `Strong-Format (z. B. für den Import in Hevy). Jeder Plan wird als ein Workout mit heutigem Datum exportiert, Gewichte in ${unit}.`}
        </small>

        <h3>Trainingsverlauf exportieren</h3>
        <div className="row">
          <button disabled={!sessions.length} onClick={() => doShare("history")}>Als Strong-CSV teilen</button>
          <button disabled={!sessions.length} onClick={() => doCopy("history")}>Text kopieren</button>
        </div>
        {exMsg && <p className="hint">{exMsg}</p>}

        <h3>Importieren</h3>
        <small style={{ marginBottom: 6 }}>
          Unterstützt: Gym-Tracker-JSON, Strong-CSV, Hevy-CSV und einfache CSV-Dateien mit Spalten wie
          Workout, Exercise, Reps, Weight. Aus Verlaufs-Exporten wird pro Workout-Name das neueste Training als Plan übernommen.
        </small>
        <input className="field" type="file" accept=".json,.csv,.txt,text/csv,application/json,text/plain" onChange={onFile} />
        <textarea className="field" placeholder="… oder Text hier einfügen" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="primary block" disabled={!text.trim()} onClick={() => analyze(text)}>Einlesen</button>
        {err && <p className="hint red" style={{ color: "var(--red)" }}>{err}</p>}
        {done && <p className="hint green">{done}</p>}

        {parsed && result && (
          <div className="card">
            <b>{parsed.label}</b>
            <small>{parsed.workouts.length} Workouts in der Datei</small>
            {!parsed.fixedUnit && (
              <>
                <small style={{ marginTop: 10 }}>Gewichtseinheit in der Datei{parsed.unitHint ? "" : " (nicht erkennbar – bitte prüfen)"}:</small>
                <Seg value={fileUnit} onChange={setFileUnit} options={[{ id: "kg", label: "kg" }, { id: "lbs", label: "lbs" }]} />
              </>
            )}
            {hasHistory && (
              <label style={{ display: "flex", gap: 8, alignItems: "center", margin: "8px 0" }}>
                <input type="checkbox" checked={withHistory} onChange={(e) => setWithHistory(e.target.checked)} />
                Trainingsverlauf mitimportieren ({parsed.workouts.filter((w) => w.ts).length} Trainings)
              </label>
            )}
            <h3 style={{ margin: "12px 0 4px" }}>Neue Pläne</h3>
            {result.plans.length ? (
              <ul className="list">
                {result.plans.map((p) => <li key={p.id}><span>{p.name}</span><span className="sub" style={{ margin: 0 }}>{p.entries.length} Übungen</span></li>)}
              </ul>
            ) : <small>Keine Pläne importierbar.</small>}
            {result.skippedPlans > 0 && <small style={{ color: "var(--red)" }}>{result.skippedPlans} Plan/Pläne übersprungen – maximal {MAX_PLANS} Pläne.</small>}
            {result.newExercises.length > 0 && (
              <small style={{ marginTop: 8 }}>
                {result.newExercises.length} neue Übung(en) werden angelegt; die Muskelgruppe wird geschätzt.
              </small>
            )}
            <button className="primary block" style={{ marginTop: 10 }} disabled={!result.plans.length && !result.sessions.length} onClick={apply}>
              Importieren
            </button>
          </div>
        )}
      </main>
    </Sheet>
  );
}
