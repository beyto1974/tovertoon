// @ts-check
import { defineConfig } from 'astro/config';

// On GitHub Pages the site lives under /tovertoon. Locally it is served from the root.
const onPages = process.env.GITHUB_ACTIONS === 'true';

// https://astro.build/config
export default defineConfig({
  site: 'https://beyto1974.github.io',
  base: onPages ? '/tovertoon' : '/',
  trailingSlash: 'ignore',
});
