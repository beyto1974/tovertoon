// Shared music helpers for the lesson pages: note names, pitches, staff drawing and sound.

export const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
export const SOLFEGE = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
export const SEMI = [0, 2, 4, 5, 7, 9, 11];

export const $ = (id) => document.getElementById(id);
export const rnd = (n) => Math.floor(Math.random() * n);
export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function store(key, fallback, allowed) {
  try {
    const v = localStorage.getItem(key);
    if (v !== null && (!allowed || allowed.includes(v))) return v;
  } catch (e) {}
  return fallback;
}
export function save(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

// ---- note names (Do Re Mi or letters), shared by all pages ----
let namesMode = store("tt-names", "do", ["do", "abc"]);
const listeners = [];
export const names = () => namesMode;
/** Name of a letter with optional accidental text, e.g. "F♯" -> "Fa♯". */
export const nm = (n) => (namesMode === "do" ? SOLFEGE[LETTERS.indexOf(n[0])] + n.slice(1) : n);
export function bindNames(box, onChange) {
  const sync = () =>
    box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.n === namesMode)));
  box.querySelectorAll("button").forEach((b) => {
    b.onclick = () => {
      namesMode = b.dataset.n;
      save("tt-names", namesMode);
      sync();
      listeners.forEach((f) => f());
    };
  });
  listeners.push(onChange);
  sync();
}

// ---- pitches ----
// A pitch is {d, alter}: d = diatonic number (octave*7 + letter index, C4 = 28), alter = -1, 0 or 1.
export const pitch = (letter, octave, alter = 0) => ({ d: octave * 7 + LETTERS.indexOf(letter), alter });
export const letterOf = (p) => LETTERS[((p.d % 7) + 7) % 7];
export const octaveOf = (p) => Math.floor(p.d / 7);
export const midi = (p) => 12 * (octaveOf(p) + 1) + SEMI[((p.d % 7) + 7) % 7] + p.alter;
export const accText = (alter) => (alter > 0 ? "♯" : alter < 0 ? "♭" : "");
export const pitchName = (p) => nm(letterOf(p) + accText(p.alter));
export const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---- sound ----
let ctx = null;
export function audio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
  } catch (e) {}
  return ctx;
}
/** Plays a soft piano-like tone. `when` is seconds from now. */
export function playMidi(m, when = 0, dur = 1.2, vol = 0.5) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + when + 0.02;
  const out = c.createGain();
  out.gain.setValueAtTime(0, t);
  out.gain.linearRampToValueAtTime(vol, t + 0.01);
  out.gain.exponentialRampToValueAtTime(0.001, t + dur);
  out.connect(c.destination);
  [[1, 1], [2, 0.4], [3, 0.18], [4, 0.08]].forEach(([h, a], i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq(m) * h;
    g.gain.setValueAtTime(a, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur / (1 + i * 0.5));
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + dur + 0.1);
  });
}
export const playPitch = (p, when, dur, vol) => playMidi(midi(p), when, dur, vol);

// ---- staff drawing ----
const NS = "http://www.w3.org/2000/svg";
export function el(tag, attrs = {}, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text) e.textContent = text;
  return e;
}
export const GAP = 16; // distance between staff lines
export const CLEFS = {
  treble: { d0: 30, glyph: "\u{1D11E}", size: 72, dy: 13, anchor: 1 }, // bottom line E4, glyph wraps the G line
  bass: { d0: 18, glyph: "\u{1D122}", size: 72, dy: 46, anchor: 3 }, // bottom line G2, glyph sits on the F line
};
export const STAFF_BOTTOM = 150;

export function accGlyph(g, flat, cx, cy, cls) {
  const grp = el("g", {
    fill: "none",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    style: "stroke:var(--" + (cls || (flat ? "flat" : "sharp")) + ")",
  });
  if (flat) {
    grp.append(el("line", { x1: cx - 4, x2: cx - 4, y1: cy - 24, y2: cy + 7, "stroke-width": 2.4 }));
    grp.append(el("path", { d: `M${cx - 4} ${cy + 7} C${cx + 10} ${cy + 2} ${cx + 11} ${cy - 10} ${cx - 4} ${cy - 3}`, "stroke-width": 2.4 }));
  } else {
    grp.append(el("line", { x1: cx - 3.5, x2: cx - 3.5, y1: cy - 15, y2: cy + 12, "stroke-width": 1.8 }));
    grp.append(el("line", { x1: cx + 3.5, x2: cx + 3.5, y1: cy - 12, y2: cy + 15, "stroke-width": 1.8 }));
    grp.append(el("line", { x1: cx - 7, x2: cx + 7, y1: cy - 1, y2: cy - 5, "stroke-width": 3.6 }));
    grp.append(el("line", { x1: cx - 7, x2: cx + 7, y1: cy + 6, y2: cy + 2, "stroke-width": 3.6 }));
  }
  g.append(grp);
}

export const yOf = (clef, d) => STAFF_BOTTOM - ((d - CLEFS[clef].d0) * GAP) / 2;

/**
 * Draws an empty staff with a clef into `svg` and returns helpers for adding notes.
 * opts: {clef, width, keysig: number of sharps(+) or flats(-)}
 */
export function staff(svg, opts = {}) {
  const clef = opts.clef || "treble";
  const W = opts.width || 340;
  svg.innerHTML = "";
  svg.setAttribute("viewBox", `0 20 ${W} 190`);
  const x0 = 12, x1 = W - 12;
  const top = STAFF_BOTTOM - 4 * GAP;
  for (let i = 0; i < 5; i++) svg.append(el("line", { class: "line", x1: x0, x2: x1, y1: STAFF_BOTTOM - i * GAP, y2: STAFF_BOTTOM - i * GAP }));
  svg.append(el("line", { class: "line", x1: x0, x2: x0, y1: top, y2: STAFF_BOTTOM }));
  const c = CLEFS[clef];
  const anchorY = STAFF_BOTTOM - c.anchor * GAP;
  svg.append(el("text", { x: x0 + 6, y: anchorY + c.dy, style: `font:400 ${c.size}px 'Noto Music','Segoe UI Symbol','DejaVu Sans',serif;fill:var(--ink)` }, c.glyph));
  let x = x0 + 70;
  const ks = opts.keysig || 0;
  if (ks) {
    // Steps above the bottom line for the usual order of sharps or flats, written for the treble clef.
    const order = ks > 0 ? [8, 5, 9, 6, 3, 7, 4] : [4, 7, 3, 6, 2, 5, 1];
    for (let i = 0; i < Math.abs(ks); i++) {
      const y = STAFF_BOTTOM - (order[i] * GAP) / 2 + (clef === "bass" ? GAP : 0); // bass sits two steps lower
      accGlyph(svg, ks < 0, x + i * 16, y);
    }
    x += Math.abs(ks) * 16 + 10;
  }
  const api = {
    svg, clef, W, x,
    y: (d) => yOf(clef, d),
    /** Draw a notehead (with ledger lines, stem and accidental) at horizontal position nx. */
    note(p, nx, o = {}) {
      const y = yOf(clef, p.d);
      const d0 = c.d0;
      const g = el("g", { class: o.cls || "" });
      // ledger lines
      for (let d = d0 - 2; d >= p.d; d -= 2) g.append(el("line", { class: "line", x1: nx - 13, x2: nx + 13, y1: yOf(clef, d), y2: yOf(clef, d) }));
      for (let d = d0 + 10; d <= p.d; d += 2) g.append(el("line", { class: "line", x1: nx - 13, x2: nx + 13, y1: yOf(clef, d), y2: yOf(clef, d) }));
      if (p.alter && !o.noAcc) accGlyph(g, p.alter < 0, o.accX ?? nx - 19, y);
      const head = el("ellipse", { class: "head" + (o.hollow ? " hollow" : ""), cx: nx, cy: y, rx: 9, ry: 6.4, transform: `rotate(-20 ${nx} ${y})` });
      g.append(head);
      if (o.stem !== false) {
        const up = p.d < d0 + 4;
        const sx = up ? nx + 8.3 : nx - 8.3;
        g.append(el("line", { class: "stem", x1: sx, x2: sx, y1: y, y2: up ? y - 52 : y + 52 }));
      }
      svg.append(g);
      return g;
    },
  };
  return api;
}

// ---- practice helpers ----
export function makeStats(root, bestKey) {
  let score = 0, rounds = 0, streak = 0, best = Number(store(bestKey, "0")) || 0;
  const draw = () => {
    root.innerHTML = `<div class="stat"><small>Score</small><b>${score}/${rounds}</b></div><div class="stat"><small>Reeks</small><b>${streak}</b></div><div class="stat"><small>Beste reeks</small><b>${best}</b></div>`;
  };
  draw();
  return {
    record(ok) {
      rounds++;
      if (ok) { score++; streak++; best = Math.max(best, streak); save(bestKey, String(best)); } else streak = 0;
      draw();
    },
  };
}
/** Shows right/wrong feedback with an explanation and a next button inside `fb`. */
export function feedback(fb, ok, head, explain, onNext) {
  fb.innerHTML = "";
  const m = document.createElement("div");
  m.className = "msg";
  m.style.color = ok ? "var(--good)" : "var(--bad)";
  m.textContent = head;
  fb.append(m);
  if (explain) {
    const e = document.createElement("p");
    e.className = "muted";
    e.textContent = explain;
    fb.append(e);
  }
  const n = document.createElement("button");
  n.type = "button";
  n.className = "go";
  n.textContent = "Volgende  →";
  n.onclick = onNext;
  fb.append(n);
  n.focus({ preventScroll: true });
}
/** Marks option buttons (data-v) after an answer. */
export function markOptions(box, correct, picked) {
  [...box.children].forEach((b) => {
    b.disabled = true;
    if (b.dataset.v === String(correct)) b.classList.add("right");
    else if (b.dataset.v === String(picked)) b.classList.add("wrong");
  });
}
export function seg(box, value, fn) {
  const sync = (v) => box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
  box.querySelectorAll("button").forEach((b) => {
    b.onclick = () => { sync(b.dataset.v); fn(b.dataset.v); };
  });
  sync(value);
}

// ---- keys and scales ----
const MAJ_S = ["C", "G", "D", "A", "E", "B", "F♯", "C♯"], MIN_S = ["A", "E", "B", "F♯", "C♯", "G♯", "D♯", "A♯"];
const MAJ_F = ["C", "F", "B♭", "E♭", "A♭", "D♭", "G♭", "C♭"], MIN_F = ["A", "D", "G", "C", "F", "B♭", "E♭", "A♭"];
/** Key names for a signature: v > 0 sharps, v < 0 flats. */
export const keyNames = (v) => (v >= 0 ? { maj: MAJ_S[v], min: MIN_S[v] } : { maj: MAJ_F[-v], min: MIN_F[-v] });
export const splitName = (n) => ({ letter: n[0], alter: n.endsWith("♯") ? 1 : n.endsWith("♭") ? -1 : 0 });
export const SCALE_PATTERNS = {
  maj: [0, 2, 4, 5, 7, 9, 11, 12],
  nat: [0, 2, 3, 5, 7, 8, 10, 12],
  har: [0, 2, 3, 5, 7, 8, 11, 12],
  mel: [0, 2, 3, 5, 7, 9, 11, 12],
};
const semisOf = (p) => SEMI[((p.d % 7) + 7) % 7] + 12 * Math.floor(p.d / 7);
/** Eight pitches of a scale starting on tonic (spelled correctly, one letter per degree). */
export function scalePitches(tonic, kind) {
  const base = semisOf(tonic) + tonic.alter;
  return SCALE_PATTERNS[kind].map((s, i) => {
    const d = tonic.d + i;
    return { d, alter: base + s - semisOf({ d }) };
  });
}
export function playSequence(ps, step = 0.42) {
  ps.forEach((p, i) => playPitch(p, i * step, 0.9, 0.45));
}

// ---- piano keyboard (C4 to C6) ----
const BLACK_PC = [1, 3, 6, 8, 10];
/**
 * Draws a two-octave keyboard into `svg`. Returns {mark(map), keys}:
 * map is {midi: {cls, label}}; cls is one of "scale", "tonic", "good", "bad".
 */
export function keyboard(svg, onKey) {
  const LOW = 60, HIGH = 84;
  const W = 700, H = 170;
  svg.setAttribute("viewBox", `0 0 ${W} ${H + 24}`);
  svg.innerHTML = "";
  const whites = [];
  for (let m = LOW; m <= HIGH; m++) if (!BLACK_PC.includes(m % 12)) whites.push(m);
  const ww = W / whites.length;
  const keys = {};
  const g = el("g");
  svg.append(g);
  const mk = (m, x, w, h, black) => {
    const r = el("rect", { class: "key " + (black ? "bk" : "wk"), x, y: 0, width: w, height: h, rx: 6, "data-m": m, tabindex: 0, role: "button", "aria-label": "toets " + m });
    const t = el("text", { class: "kl", x: x + w / 2, y: black ? h - 12 : h - 12, "text-anchor": "middle" });
    const act = () => onKey && onKey(m);
    r.addEventListener("click", act);
    r.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
    keys[m] = { r, t, black };
    return [r, t];
  };
  whites.forEach((m, i) => { const [r, t] = mk(m, i * ww + 1, ww - 2, H, false); g.append(r); keys[m].t = t; });
  const bw = ww * 0.6;
  for (let m = LOW; m <= HIGH; m++) {
    if (!BLACK_PC.includes(m % 12)) continue;
    const left = whites.indexOf(m - 1);
    const [r, t] = mk(m, (left + 1) * ww - bw / 2, bw, H * 0.6, true);
    g.append(r);
  }
  // labels go on top of all keys
  Object.values(keys).forEach((k) => svg.append(k.t));
  return {
    keys,
    mark(map) {
      Object.entries(keys).forEach(([m, k]) => {
        const v = map && map[m];
        k.r.setAttribute("class", "key " + (k.black ? "bk" : "wk") + (v ? " " + v.cls : ""));
        k.t.textContent = v && v.label ? v.label : "";
        k.t.setAttribute("class", "kl" + (k.black ? " onblack" : ""));
      });
    },
  };
}
