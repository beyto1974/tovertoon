// Rhythm helpers: notation on a single line, bar generation and playback. Time is counted in sixteenths.
import { el, rnd, shuffle, audio, playMidi, stopSound } from "./music.js";

export const BAR = 16;
const LINE = 104;
const STEM = 52;

/** Number of beams a note value carries. */
const beams = (dur) => (dur === 1 ? 2 : dur === 2 || dur === 3 ? 1 : 0);

export function restShape(g, x, y, dur) {
  const base = "ink";
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
 * opts: {W, time: [4,4] or null, total: length of the drawing in sixteenths (default 16),
 *   beat: sixteenths per beat, which decides what shares a beam (default 4; 6 in 6/8),
 *   bands: {eventIndex: class} for a coloured band behind an event, labels: [{on, text}] under the line,
 *   next: sixteenth where the next note goes, shown as a dashed placeholder}
 * Returns {xOf} to place other things on the same time scale.
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
  const bl = opts.beat || 4;
  // beam groups: consecutive short notes inside one beat
  const xs = events.map((e) => xOf(e.on));
  if (opts.bands) Object.entries(opts.bands).forEach(([i, cls]) => {
    const e = events[i];
    if (e) svg.append(el("rect", { class: "band " + cls, x: xs[i] - 14, y: LINE - STEM - 14, width: Math.max(28, (e.dur / total) * span - 2), height: STEM + 56, rx: 8 }));
  });
  if (opts.labels) opts.labels.forEach((l) => svg.append(el("text", { x: xOf(l.on), y: 136, style: "font:600 13px var(--body);fill:var(--muted);text-anchor:middle" }, l.text)));
  if (opts.next != null && opts.next < total) svg.append(el("ellipse", { class: "slot on", cx: xOf(opts.next), cy: LINE, rx: 9, ry: 6.4 }));
  const groups = [];
  events.forEach((e, i) => {
    if (e.rest || beams(e.dur) === 0) return;
    const last = groups[groups.length - 1];
    const prev = last && last[last.length - 1];
    if (last && prev === i - 1 && Math.floor(events[prev].on / bl) === Math.floor(e.on / bl)) last.push(i);
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
    if (e.tie && events[i + 1]) {
      const x2 = xOf(events[i + 1].on);
      svg.append(el("path", { class: "stem", fill: "none", "stroke-width": 2.2, d: `M${x + 6} ${LINE + 12} Q${(x + x2) / 2} ${LINE + 30} ${x2 - 6} ${LINE + 12}` }));
    }
  });
  return { xOf };
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
/** What can be heard: only the sounding notes, with their lengths. Rests are silence and add nothing. */
export const audibleKey = (events) => events.filter((e) => !e.rest).map((e) => `${e.on}:${e.dur}`).join(" ");
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
  const seen = new Set([audibleKey(events)]);
  const out = [];
  for (let t = 0; t < 200 && out.length < n; t++) {
    const m = t < 120 ? mutate(events, level) : makeBar(level);
    if (!m) continue;
    const s = audibleKey(m);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(m);
  }
  return out;
}

// ---- playback ----
// The rhythm is played with the same soft piano tone as the scales: one pitch (G4) for the notes,
// a quiet low C for the pulse and short high ticks for the count-in.
const NOTE = 67, PULSE = 48, TICK = 91, TICK_FIRST = 96;
/**
 * Plays events over `beats` beats (optionally after a count-in). Returns the duration in seconds.
 * opts: {beatLen: sixteenths per beat (4; 6 in 6/8), ticks: beats in the count-in (4)}
 */
export function playLine(events, bpm, beats, countIn, opts = {}) {
  if (!audio()) return 0;
  stopSound(); // a new line cuts the previous one instead of playing over it
  const beatLen = opts.beatLen || 4, ticks = opts.ticks || 4;
  const beat = 60 / bpm, u = beat / beatLen;
  const t0 = 0.06 + (countIn ? ticks * beat : 0);
  if (countIn) for (let i = 0; i < ticks; i++) playMidi(i === 0 ? TICK_FIRST : TICK, 0.06 + i * beat, 0.15, 0.12);
  for (let i = 0; i < beats; i++) playMidi(PULSE, t0 + i * beat, 0.3, 0.14);
  events.forEach((e) => {
    // A piano tone fades by itself, so longer notes ring a little longer without being held at full volume.
    if (!e.rest) playMidi(NOTE, t0 + e.on * u, Math.min(1.5, Math.max(0.3, e.dur * u * 1.4)), 0.45);
  });
  return (countIn ? ticks + beats : beats) * beat;
}
/** Plays one 4/4 bar. */
export const playBar = (events, bpm, countIn) => playLine(events, bpm, 4, countIn);

// ---- meters and ready-made bars ----
/**
 * total: sixteenths in one bar. beats: pulses per bar. beatLen: sixteenths per pulse.
 * tempo: the factor that keeps a sixteenth equally fast, so 6/8 at "normal" feels like 4/4 at "normal".
 */
export const METERS = {
  "2/4": { num: 2, den: 4, total: 8, beats: 2, beatLen: 4, tempo: 1 },
  "3/4": { num: 3, den: 4, total: 12, beats: 3, beatLen: 4, tempo: 1 },
  "4/4": { num: 4, den: 4, total: 16, beats: 4, beatLen: 4, tempo: 1 },
  "6/8": { num: 6, den: 8, total: 12, beats: 2, beatLen: 6, tempo: 4 / 6 },
};
/** One-bar patterns: durations in sixteenths, a negative number is a rest. 4/4 bars are two 2/4 cells. */
const CELLS = {
  "2/4": {
    easy: [[4, 4], [2, 2, 4], [4, 2, 2], [2, 2, 2, 2], [8]],
    mid: [[4, -4], [-4, 4], [6, 2], [2, 2, -4], [4, 2, -2], [2, -2, 4], [2, 4, 2]],
    hard: [[1, 1, 1, 1, 4], [4, 1, 1, 1, 1], [2, 1, 1, 4], [1, 1, 2, 4], [3, 1, 4], [4, 3, 1], [1, 1, 1, 1, 1, 1, 1, 1], [2, 2, 1, 1, 2], [1, 1, 2, 2, 2], [4, 1, 1, 2], [3, 1, 2, 2], [-2, 2, 4], [2, 1, 1, 2, 2]],
  },
  "3/4": {
    easy: [[4, 4, 4], [8, 4], [4, 8], [2, 2, 4, 4], [4, 2, 2, 4], [4, 4, 2, 2], [2, 2, 2, 2, 4], [12]],
    mid: [[4, 4, -4], [-4, 4, 4], [4, -4, 4], [6, 2, 4], [4, 6, 2], [8, -4], [4, 2, 2, -4], [2, 4, 2, 4], [6, 2, 2, 2]],
    hard: [[1, 1, 1, 1, 4, 4], [4, 1, 1, 1, 1, 4], [4, 4, 1, 1, 1, 1], [3, 1, 4, 4], [4, 3, 1, 4], [2, 1, 1, 4, 4], [6, 2, 2, 1, 1], [4, 2, 1, 1, 4], [1, 1, 2, 4, 4], [4, 4, 2, 1, 1], [-2, 2, 4, 4], [8, 2, 1, 1]],
  },
  "6/8": {
    easy: [[6, 6], [2, 2, 2, 6], [6, 2, 2, 2], [2, 2, 2, 2, 2, 2], [4, 2, 6], [6, 4, 2], [4, 2, 4, 2], [12]],
    mid: [[6, -6], [-6, 6], [6, 2, -4], [4, -2, 6], [2, 2, -2, 6], [4, 2, 2, 2, 2], [2, 4, 6], [6, -2, 2, 2]],
    hard: [[3, 1, 2, 6], [6, 3, 1, 2], [2, 2, 2, 3, 1, 2], [1, 1, 2, 2, 6], [6, 2, 1, 1, 2], [3, 1, 2, 3, 1, 2], [4, 2, 3, 1, 2], [2, 1, 1, 2, 6]],
  },
};
/** The cells of a level. "mid" adds rests to the easy ones, "hard" drops the easy ones. 4/4 has no cells of its own, see `randomBar`. */
export function cellPool(meter, level) {
  const c = CELLS[meter];
  return level === "easy" ? c.easy : level === "mid" ? [...c.easy, ...c.mid] : [...c.mid, ...c.hard];
}
export function toEvents(cell, start = 0) {
  let on = start;
  return cell.map((d) => { const e = { on, dur: Math.abs(d), rest: d < 0 }; on += e.dur; return e; });
}
/** A random bar as events. 4/4 joins two different 2/4 cells. */
export function randomBar(meter, level) {
  if (meter !== "4/4") {
    const pool = cellPool(meter, level);
    return toEvents(pool[rnd(pool.length)]);
  }
  const pool = cellPool("2/4", level);
  const a = pool[rnd(pool.length)];
  let b;
  do { b = pool[rnd(pool.length)]; } while (b === a);
  return [...toEvents(a), ...toEvents(b, 8)];
}
/** What can be heard: tied notes merge into one and rests drop out, so every way of writing the same sound compares equal. */
export function sounds(events) {
  const out = [];
  events.forEach((e, i) => {
    if (e.rest) return;
    if (i > 0 && events[i - 1].tie && !events[i - 1].rest && out.length) out[out.length - 1].dur += e.dur;
    else out.push({ on: e.on, dur: e.dur, first: i });
  });
  return out;
}

/** Counting syllables for a position inside a 4/4 bar. */
export function syllable(on) {
  const beat = Math.floor(on / 4) + 1;
  return ["" + beat, "e", "en", "a"][on % 4];
}
