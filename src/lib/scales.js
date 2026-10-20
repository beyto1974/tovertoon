// Scale names, valid tonics and spelling shared by the scale-building pages.
import { LETTERS, nm, midi, accText, scalePitches, SCALE_PATTERNS, letterOf } from "./music.js";

export const KIND_NAME = { maj: "groot", nat: "natuurlijk klein", har: "harmonisch klein", mel: "melodisch klein" };
export const stepLabel = (s) => (s === 1 ? "h" : s === 2 ? "H" : "1½");

// Valid tonics: every degree can be spelled with at most one accidental.
export const TONICS = [];
for (const L of LETTERS) for (const alter of [-1, 0, 1]) TONICS.push({ L, alter });
export const tonicName = (t) => t.L + accText(t.alter);
export const tonicPitch = (t) => {
  let p = { d: 28 + LETTERS.indexOf(t.L), alter: t.alter };
  if (midi(p) < 60) p = { d: p.d + 7, alter: p.alter };
  return p;
};
export const valid = (t, kind) => scalePitches(tonicPitch(t), kind).every((p) => Math.abs(p.alter) <= 1) && midi(tonicPitch(t)) + 12 <= 84;
export const tonicsFor = (kind) => TONICS.filter((t) => valid(t, kind));

export const spell = (p) => nm(letterOf(p) + accText(p.alter));
export const patternText = (k) => SCALE_PATTERNS[k].slice(1).map((v, i) => stepLabel(v - SCALE_PATTERNS[k][i])).join(" ");
