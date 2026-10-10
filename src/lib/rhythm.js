// Rhythm helpers: notation on a single line, bar generation and playback. Time is counted in sixteenths.
import { el, rnd, shuffle, audio } from "./music.js";

export const BAR = 16;
const LINE = 104;
const STEM = 52;

/** Number of beams a note value carries. */
const beams = (dur) => (dur === 1 ? 2 : dur === 2 || dur === 3 ? 1 : 0);

function restShape(g, x, y, dur) {
  const base = dur >= 4 ? "ink" : "ink";
  const stroke = { class: "stem", fill: "none", "stroke-width": 3 };
  if (dur === 8 || dur === 12) {
    g.append(el("rect", { class: base, x: x - 9, y: y - 7, width: 18, height: 7, rx: 1 }));
  } else if (dur === 16) {
    g.append(el("rect", { class: base, x: x - 9, y: y, width: 18, height: 7, rx: 1 }));
  } else if (dur === 4 || dur === 6) {
    g.append(el("path", { ...stroke, d: `M${x - 3} ${y - 26} L${x + 5} ${y - 14} L${x - 4} ${y - 4} C${x - 10} ${y + 4} ${x + 4} ${y + 4} ${x + 2} ${y + 16}` }));
  } else {
    const n = dur === 1 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const yy = y - 16 + i * 14;
      g.append(el("circle", { class: base, cx: x - 4, cy: yy, r: 3.4 }));
      g.append(el("path", { ...stroke, "stroke-width": 2.6, d: `M${x + 5} ${yy - 3} Q${x} ${yy + 4} ${x - 8} ${yy + 6}` }));
    }
    g.append(el("line", { class: "stem", x1: x + 5, x2: x - 5 - (n - 1) * 0, y1: y - 19, y2: y + (n === 2 ? 22 : 12), "stroke-width": 2.4 }));
  }
  if (dur === 6 || dur === 12 || dur === 3) g.append(el("circle", { class: base, cx: x + 14, cy: y - 7, r: 2.8 }));
}

/**
 * Draws events [{on, dur, rest}] on a one-line staff into svg.
 * opts: {W, time: [4,4] or null, bars: number of 16ths per bar (default 16)}
 */
export function drawRhythm(svg, events, opts = {}) {
  const W = opts.W || 340;
  const total = opts.total || BAR;
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 22 ${W} 118`);
  svg.append(el("line", { class: "line", x1: 8, x2: W - 8, y1: LINE, y2: LINE }));
  svg.append(el("line", { class: "line", x1: W - 8, x2: W - 8, y1: LINE - 18, y2: LINE + 18 }));
  const X0 = opts.time ? 58 : 28;
  if (opts.time) {
    const st = `font:800 34px var(--display);fill:var(--ink);text-anchor:middle`;
    svg.append(el("text", { x: 30, y: LINE - 3, style: st }, String(opts.time[0])));
    svg.append(el("text", { x: 30, y: LINE + 29, style: st }, String(opts.time[1])));
  }
  const span = W - 22 - X0 - 12;
  const xOf = (on) => X0 + (on / total) * span;
  // beam groups: consecutive short notes inside one beat
  const xs = events.map((e) => xOf(e.on));
  const groups = [];
  events.forEach((e, i) => {
    if (e.rest || beams(e.dur) === 0) return;
    const last = groups[groups.length - 1];
    const prev = last && last[last.length - 1];
    if (last && prev === i - 1 && Math.floor(events[prev].on / 4) === Math.floor(e.on / 4)) last.push(i);
    else groups.push([i]);
  });
  const inBeam = new Set(groups.filter((g) => g.length > 1).flat());
  const top = LINE - STEM;
  groups.forEach((gr) => {
    if (gr.length < 2) return;
    const a = xs[gr[0]] + 8.3, b = xs[gr[gr.length - 1]] + 8.3;
    svg.append(el("rect", { class: "ink", x: a - 1.2, y: top, width: b - a + 2.4, height: 6 }));
    for (let k = 0; k < gr.length; ) {
      if (beams(events[gr[k]].dur) < 2) { k++; continue; }
      let m = k;
      while (m < gr.length && beams(events[gr[m]].dur) >= 2) m++;
      if (m - k >= 2) svg.append(el("rect", { class: "ink", x: xs[gr[k]] + 7.1, y: top + 10, width: xs[gr[m - 1]] - xs[gr[k]] + 2.4, height: 6 }));
      else {
        const left = k > 0;
        const sx = xs[gr[k]] + 8.3;
        svg.append(el("rect", { class: "ink", x: left ? sx - 10 : sx - 1.2, y: top + 10, width: 11, height: 6 }));
      }
      k = m;
    }
  });
  events.forEach((e, i) => {
    const x = xs[i];
    const g = el("g");
    if (e.rest) {
      restShape(g, x, LINE, e.dur);
    } else {
      const hollow = e.dur >= 8;
      g.append(el("ellipse", { class: "head" + (hollow ? " hollow" : ""), cx: x, cy: LINE, rx: 9, ry: 6.4, transform: `rotate(-20 ${x} ${LINE})` }));
      if (e.dur < 16) g.append(el("line", { class: "stem", x1: x + 8.3, x2: x + 8.3, y1: LINE - 2, y2: top }));
      if (!inBeam.has(i) && beams(e.dur) > 0) g.append(el("path", { class: "stem", fill: "none", "stroke-width": 3.2, d: `M${x + 8.3} ${top} q 14 10 9 26` }));
      if (e.dur === 3 || e.dur === 6 || e.dur === 12) g.append(el("circle", { class: "ink", cx: x + 16, cy: LINE - 5, r: 2.8 }));
    }
    svg.append(g);
    if (e.tie) {
      const x2 = xOf(events[i + 1].on);
      svg.append(el("path", { class: "stem", fill: "none", "stroke-width": 2.2, d: `M${x + 6} ${LINE + 12} Q${(x + x2) / 2} ${LINE + 30} ${x2 - 6} ${LINE + 12}` }));
    }
  });
}

// ---- bar generation ----
const BEAT_PATTERNS = {
  easy: [[4], [2, 2]],
  hard: [[4], [2, 2], [3, 1], [1, 3], [2, 1, 1], [1, 1, 2], [1, 2, 1], [1, 1, 1, 1]],
};
function beatEvents(on, level, noRestFirst) {
  const pats = BEAT_PATTERNS[level];
  const pat = pats[rnd(pats.length)];
  let o = on;
  return pat.map((dur, i) => {
    const rest = !(noRestFirst && i === 0 && on === 0) && Math.random() < 0.18 && pat.length < 4;
    const ev = { on: o, dur, rest };
    o += dur;
    return ev;
  });
}
export function makeBar(level) {
  // Layout of the bar: how the 16 sixteenths split into larger blocks.
  const layouts = level === "easy"
    ? [["b", "b", "b", "b"], [8, "b", "b"], ["b", "b", 8], [8, 8]]
    : [["b", "b", "b", "b"], [8, "b", "b"], ["b", "b", 8], [8, 8], [12, "b"], ["b", 12]];
  const lay = layouts[rnd(layouts.length)];
  const events = [];
  let on = 0;
  lay.forEach((blk) => {
    if (blk === "b") { events.push(...beatEvents(on, level, events.length === 0)); on += 4; }
    else { events.push({ on, dur: blk, rest: events.length > 0 && Math.random() < 0.2 }); on += blk; }
  });
  return events;
}
export const signature = (events) => events.map((e) => `${e.on}:${e.dur}${e.rest ? "r" : ""}`).join(" ");
/** A near-miss: change one beat of the bar. Returns null when that is not possible. */
export function mutate(events, level) {
  const b = rnd(4);
  const lo = b * 4, hi = lo + 4;
  const inside = events.filter((e) => e.on >= lo && e.on + e.dur <= hi);
  const spanning = events.some((e) => e.on < hi && e.on + e.dur > hi && e.on >= lo - 0 && e.on < lo + 0) || events.some((e) => (e.on < lo && e.on + e.dur > lo) || (e.on < hi && e.on + e.dur > hi));
  if (spanning || inside.length === 0) return null;
  const repl = beatEvents(lo, level, lo === 0);
  const out = events.filter((e) => e.on < lo || e.on >= hi).concat(repl).sort((a, c) => a.on - c.on);
  return signature(out) === signature(events) ? null : out;
}
export function distractors(events, level, n = 3) {
  const seen = new Set([signature(events)]);
  const out = [];
  for (let t = 0; t < 200 && out.length < n; t++) {
    const m = t < 120 ? mutate(events, level) : makeBar(level);
    if (!m) continue;
    const s = signature(m);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(m);
  }
  return out;
}

// ---- playback ----
function blip(c, t, f, v, d) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = "triangle";
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + d + 0.05);
}
/** Plays one bar (optionally after a count-in bar). Returns the duration in seconds. */
export function playBar(events, bpm, countIn) {
  const c = audio();
  if (!c) return 0;
  const beat = 60 / bpm, u = beat / 4;
  const t0 = c.currentTime + 0.08 + (countIn ? 4 * beat : 0);
  if (countIn) for (let i = 0; i < 4; i++) blip(c, c.currentTime + 0.08 + i * beat, i === 0 ? 1500 : 1100, 0.18, 0.05);
  for (let i = 0; i < 4; i++) blip(c, t0 + i * beat, 900, 0.05, 0.04); // soft pulse under the rhythm
  events.forEach((e) => { if (!e.rest) blip(c, t0 + e.on * u, 560, 0.4, Math.min(0.4, e.dur * u)); });
  return (countIn ? 8 : 4) * beat;
}

/** Counting syllables for a position inside a 4/4 bar. */
export function syllable(on) {
  const beat = Math.floor(on / 4) + 1;
  return ["" + beat, "e", "en", "a"][on % 4];
}
