# Tovertoon

**Live site: https://beyto1974.github.io/tovertoon/**

Interactive music theory lessons in Dutch, for people learning to read music. Short pages with sound, notation and exercises, no sign-up and no tracking.

Released under the MIT license.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Homepage with an index of all lessons, grouped by theme. |
| `/notenbalk` | Reading the staff: treble and bass clef, lines and spaces, ledger lines. Click-to-hear explorer and a note-naming exercise. |
| `/intervallen` | Intervals: table of every interval in an octave, a playground with melodic and harmonic playback, exercises on the staff and by ear. |
| `/voortekening` | Key signatures: a slider from 7 flats to 7 sharps with a live treble staff, the two rules for finding the key, relative minors, and a table of all 15 signatures. |
| `/kwintencirkel` | Interactive circle of fifths: signature, parallel, dominant and subdominant, enharmonic spellings, scale playback and a clicking quiz. |
| `/toonladders-bouwen` | Building scales: the whole/half step patterns for major and the three minor scales, a keyboard explorer, and a build-it-yourself exercise. |
| `/toonladders-oefenen` | Exercises: key signature to scale name, scale name to number of accidentals, and parallel major/minor. Every answer explains the rule. |
| `/maatsoorten` | Time signatures with a metronome, accents and subdivisions, the ways to fill a bar and a beat, and a 3/4 versus 6/8 comparison. |
| `/ritme` | Rhythm reading: note and rest values, the dot and the tie, and a listen-and-pick exercise with one-line notation. |

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
- `src/lib/music.js` and `src/lib/rhythm.js`: shared helpers for the newer lessons (note names, pitches, staff and keyboard drawing, tones, practice helpers, one-line rhythm notation and bar generation).
- `src/styles/components.css`: shared UI building blocks for the newer lessons.
- `src/pages/*.astro`: one file per page. Page-specific CSS is global to that page (`is:global`) because much of the markup is built by the page's own script. Scripts are `is:inline` so they run unchanged.
- Fonts are self-hosted through `@fontsource` packages (Bricolage Grotesque, DM Sans, Noto Music), so the site makes no requests to Google.
- Audio is synthesized with the Web Audio API. It only starts after a click.

## Deployment

Pushes to `master` build the site and deploy it to GitHub Pages (`.github/workflows/deploy.yml`). On Pages the site is served under `/tovertoon`; `astro.config.mjs` sets the base path only when `GITHUB_ACTIONS` is set, so local development stays at the root. Internal links go through `import.meta.env.BASE_URL`.

## Security

- No server code, no accounts, no analytics, no third-party requests. Fonts are self-hosted.
- Every page carries a Content-Security-Policy meta tag that only allows the site's own files, inline scripts and styles. GitHub Pages cannot set HTTP headers, so this is the strongest option there. `frame-ancestors` is not supported in a meta tag.
- Dependabot updates npm packages and GitHub Actions weekly. Actions are pinned to commit SHAs.
- CodeQL runs on pushes, pull requests and weekly. Secret scanning with push protection is enabled.
- Report vulnerabilities privately, see [SECURITY.md](SECURITY.md).

## Notes

- The treble clef is the Noto Music glyph (U+1D11E). Sharps and flats on the staff are drawn as SVG shapes instead of text, because font metrics placed text glyphs at the wrong height.
- The pages began as standalone prototypes in the sibling `rustynotes` repository, which also holds a Rust/egui note-guessing app.

## License

MIT, see [LICENSE](LICENSE). The bundled fonts keep their own SIL Open Font License; the texts are in `public/lettertypes.txt` and linked from the site footer.
