// The interval catalogue and the drawing helpers the interval pages share.
import { SEMI, staff } from "./music.js";

// Interval catalogue: size = number of letters spanned, semis = half tones.
export const IV = [
  { id: "p1", size: 1, semis: 0, name: "reine prime", short: "prime" },
  { id: "k2", size: 2, semis: 1, name: "kleine secunde", short: "secunde" },
  { id: "g2", size: 2, semis: 2, name: "grote secunde", short: "secunde" },
  { id: "k3", size: 3, semis: 3, name: "kleine terts", short: "terts" },
  { id: "g3", size: 3, semis: 4, name: "grote terts", short: "terts" },
  { id: "r4", size: 4, semis: 5, name: "reine kwart", short: "kwart" },
  { id: "o4", size: 4, semis: 6, name: "overmatige kwart", short: "kwart" },
  { id: "v5", size: 5, semis: 6, name: "verminderde kwint", short: "kwint" },
  { id: "r5", size: 5, semis: 7, name: "reine kwint", short: "kwint" },
  { id: "k6", size: 6, semis: 8, name: "kleine sext", short: "sext" },
  { id: "g6", size: 6, semis: 9, name: "grote sext", short: "sext" },
  { id: "k7", size: 7, semis: 10, name: "kleine septiem", short: "septiem" },
  { id: "g7", size: 7, semis: 11, name: "grote septiem", short: "septiem" },
  { id: "r8", size: 8, semis: 12, name: "reine octaaf", short: "octaaf" },
];
export const BASIC = ["p1", "g2", "g3", "r4", "r5", "g6", "g7", "r8", "k3", "k6"];
export const byId = Object.fromEntries(IV.map((i) => [i.id, i]));

/** Upper pitch for a lower pitch and an interval; null when it would need a double accidental. */
export function upper(low, iv) {
  const d = low.d + iv.size - 1;
  const semisNatural = SEMI[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  const lowSemis = SEMI[((low.d % 7) + 7) % 7] + 12 * Math.floor(low.d / 7) + low.alter;
  const alter = lowSemis + iv.semis - semisNatural;
  if (Math.abs(alter) > 1) return null;
  return { d, alter };
}
export function pair(svg, low, high, o = {}) {
  const st = staff(svg, { clef: "treble", width: 340 });
  const gap = high.d - low.d;
  const close = gap <= 1; // seconds and primes: the upper head moves to the right of the lower one
  const lowAcc = 180 - 19;
  st.note(low, 180, { stem: false, accX: lowAcc });
  st.note(high, close ? 206 : 180, { stem: false, accX: close ? lowAcc - (low.alter ? 16 : 0) : undefined, noAcc: gap === 0 && !o.keepAcc });
  return st;
}
