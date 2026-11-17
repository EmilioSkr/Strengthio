import { useEffect, useRef, useState } from "react";
import { fmt, num } from "./utils";

/** Zahlenfeld mit lokalem Text (damit "7," beim Tippen nicht verschwindet). */
export function NumInput({ value, onChange, decimal = false }) {
  const [text, setText] = useState(fmt(value));
  const focused = useRef(false);
  useEffect(() => { if (!focused.current) setText(fmt(value)); }, [value]);
  return (
    <input
      className="num"
      inputMode={decimal ? "decimal" : "numeric"}
      value={text}
      onFocus={(e) => { focused.current = true; e.target.select(); }}
      onBlur={() => { focused.current = false; setText(fmt(value)); }}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const n = num(t);
        onChange(decimal ? Math.max(0, n) : Math.max(0, Math.round(n)));
      }}
    />
  );
}

export const Empty = ({ title, children }) => (
  <div className="empty"><b>{title}</b>{children}</div>
);

export const Header = ({ title, left, right }) => (
  <header><div>{left}</div><h1>{title}</h1><div>{right}</div></header>
);

export function Sheet({ title, left, right, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return <div className="sheet"><Header title={title} left={left} right={right} />{children}</div>;
}

export const Seg = ({ options, value, onChange }) => (
  <div className="seg">
    {options.map((o) => (
      <button key={o.id} className={value === o.id ? "on" : ""} onClick={() => onChange(o.id)}>{o.label}</button>
    ))}
  </div>
);
