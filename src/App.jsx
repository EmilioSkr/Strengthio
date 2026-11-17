import { useEffect, useState } from "react";
import { StoreProvider, useStore } from "./store";
import { PlansPage, PlanDetail } from "./PlansPage";
import { HistoryPage, SessionDetail } from "./HistoryPage";
import { ProgressPage } from "./ProgressPage";
import { BodyPage } from "./BodyPage";
import { SettingsPage } from "./SettingsPage";
import Workout from "./Workout";

const TABS = [
  { id: "plans", icon: "🏋️", label: "Pläne" },
  { id: "history", icon: "🕘", label: "Verlauf" },
  { id: "progress", icon: "📈", label: "Fortschritt" },
  { id: "body", icon: "⚖️", label: "Körper" },
  { id: "settings", icon: "⚙️", label: "Mehr" },
];

function Shell() {
  const { ready, active } = useStore();
  const [tab, setTab] = useState("plans");
  const [planId, setPlanId] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => { window.scrollTo(0, 0); }, [tab, planId, sessionId, !!active]);

  if (!ready) return <div className="empty">Lade …</div>;
  if (active) return <Workout onDone={() => { setTab("history"); setPlanId(null); setSessionId(null); }} />;

  const go = (t) => { setTab(t); setPlanId(null); setSessionId(null); };
  let page;
  if (tab === "plans") page = planId ? <PlanDetail planId={planId} onBack={() => setPlanId(null)} /> : <PlansPage onOpen={setPlanId} />;
  else if (tab === "history") page = sessionId ? <SessionDetail id={sessionId} onBack={() => setSessionId(null)} /> : <HistoryPage onOpen={setSessionId} />;
  else if (tab === "progress") page = <ProgressPage />;
  else if (tab === "body") page = <BodyPage />;
  else page = <SettingsPage />;

  return (
    <>
      {page}
      <nav>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => go(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </>
  );
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>;
}
