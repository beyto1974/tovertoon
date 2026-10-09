# Tovertoon

Interactive music theory lessons in Dutch, for people learning to read music. Short pages with sound, notation and exercises, no sign-up and no tracking.

The repository is private for now and is meant to become public. It is released under the MIT license.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Homepage with an index of all lessons. |
| `/voortekening` | Key signatures: a slider from 7 flats to 7 sharps with a live treble staff, the two rules for finding the key, relative minors, and a table of all 15 signatures. |
| `/toonladders-oefenen` | Exercises: key signature to scale name, scale name to number of accidentals, and parallel major/minor. Every answer explains the rule. |
| `/maatsoorten` | Time signatures with a metronome, accents and subdivisions, the ways to fill a bar and a beat, and a 3/4 versus 6/8 comparison. |

Conventions used throughout: Do Re Mi or letter names (the reader can switch; the choice is kept in `localStorage`), "groot" and "klein" for major and minor, "kruis" and "mol" for sharp and flat.

## Development

Built with [Astro](https://astro.build). Needs Node 22.12 or newer.

```
npm install
npm run dev       # local dev server
npm run build     # static site in dist/
npm run preview   # serve dist/ locally
```

## How it is put together

- `src/layouts/Base.astro`: document shell, navigation, footer, font imports.
- `src/styles/global.css`: design tokens (light and dark) and the site chrome. Pages reuse these tokens.
- `src/pages/*.astro`: one file per page. Page-specific CSS is global to that page (`is:global`) because much of the markup is built by the page's own script. Scripts are `is:inline` so they run unchanged.
- Fonts are self-hosted through `@fontsource` packages (Bricolage Grotesque, DM Sans, Noto Music), so the site makes no requests to Google.
- Audio is synthesized with the Web Audio API. It only starts after a click.

## Notes

- The treble clef is the Noto Music glyph (U+1D11E). Sharps and flats on the staff are drawn as SVG shapes instead of text, because font metrics placed text glyphs at the wrong height.
- The pages began as standalone prototypes in the sibling `rustynotes` repository, which also holds a Rust/egui note-guessing app.

## License

MIT, see [LICENSE](LICENSE). Fonts keep their own licenses (SIL Open Font License).
