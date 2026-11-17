import { useState } from "react";
import { useStore } from "./store";
import { Header, Seg } from "./UI";

export function SettingsPage() {
  const { settings, setUnit, exportAll, importAll } = useStore();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const doExport = async () => {
    const json = exportAll();
    setText(json);
    try { await navigator.clipboard.writeText(json); setMsg("Backup wurde in die Zwischenablage kopiert. Füge es z. B. in Notizen ein."); }
    catch { setMsg("Kopieren nicht möglich – markiere den Text im Feld und kopiere ihn manuell."); }
  };
  const doImport = async () => {
    if (!text.trim()) return setMsg("Füge zuerst ein Backup in das Feld ein.");
    if (!confirm("Alle aktuellen Daten werden durch das Backup ersetzt. Fortfahren?")) return;
    try { await importAll(text); } catch (e) { setMsg("Fehler: " + e.message); }
  };

  return (
    <>
      <Header title="Einstellungen" />
      <main>
        <h3>Gewichtseinheit</h3>
        <Seg options={[{ id: "kg", label: "kg" }, { id: "lbs", label: "lbs" }]} value={settings.unit} onChange={setUnit} />

        <h3>Backup</h3>
        <p className="hint" style={{ textAlign: "left" }}>
          Deine Daten liegen nur auf diesem Gerät. Wenn du die App vom Home-Bildschirm löschst, sind sie weg – sichere sie vorher.
        </p>
        <textarea className="field" value={text} onChange={(e) => setText(e.target.value)} placeholder="Backup-Text" />
        <div className="row">
          <button className="primary" onClick={doExport}>Backup erzeugen</button>
          <button onClick={doImport}>Wiederherstellen</button>
        </div>
        {msg && <p className="hint">{msg}</p>}
      </main>
    </>
  );
}
