import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { dayLong, dayStr, fmt } from "./utils";

const tick = { fill: "#8e8e93", fontSize: 11 };
const tip = { background: "#2c2c2e", border: "none", borderRadius: 8, color: "#fff" };
const DAY = 864e5;

/** Linienchart über die Zeit. data: [{t: Zeitstempel, value}] */
export function TrendChart({ data, format = fmt, yPad = false, color = "#0a84ff" }) {
  const t0 = data[0].t, t1 = data[data.length - 1].t;
  const xDomain = t0 === t1 ? [t0 - DAY, t1 + DAY] : ["dataMin", "dataMax"];
  const yDomain = yPad ? ["dataMin - 1", "dataMax + 1"] : [0, "auto"];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#38383a" strokeDasharray="3 3" />
        <XAxis dataKey="t" type="number" scale="time" domain={xDomain} tickCount={4} tickFormatter={dayStr} tick={tick} stroke="#38383a" />
        <YAxis tick={tick} stroke="#38383a" width={46} domain={yDomain} tickFormatter={(v) => fmt(v)} allowDecimals />
        <Tooltip contentStyle={tip} labelFormatter={dayLong} formatter={(v) => [format(v), ""]} separator="" />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={{ r: 3.5, fill: color }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function WeeklyBars({ data }) {
  return (
    <ResponsiveContainer width="100%" height={170}>
      <BarChart data={data} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#38383a" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={tick} stroke="#38383a" interval="preserveStartEnd" />
        <YAxis tick={tick} stroke="#38383a" width={30} allowDecimals={false} />
        <Tooltip contentStyle={tip} cursor={{ fill: "rgba(255,255,255,.06)" }} formatter={(v) => [v, "Trainings"]} labelFormatter={(l) => "Woche ab " + l} />
        <Bar dataKey="count" fill="#30d158" radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
