let ctx;
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
  } catch {}
}
export function beep() {
  try {
    unlockAudio();
    const t = ctx.currentTime;
    [0, 0.25, 0.5].forEach((d) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.4, t + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
      o.start(t + d); o.stop(t + d + 0.2);
    });
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch {}
}
