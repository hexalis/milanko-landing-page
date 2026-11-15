# Milanko landing

An Astro landing for Milanko, built from [ABC Astro](https://github.com/RogerG03/abc-astro) revision `842d42c00d4f2f975326e47c78b4853becaae692`. Static HTML carries the proposal; Motion coordinates entrances and the scroll journey; a lazy Three.js module draws the tilted Earth.

Spanish lives at `/` and English at `/en/`. The language switch, alternate metadata, content collection, scene controls and observatory copy follow the selected route.

## Run

Node 24 is recommended.

```sh
npm ci
npm run dev
npm run verify
npm run test:e2e
```

Production output is `dist/`. Set `SITE_URL` to the approved origin before building for publication. The landing is served at `/` (Spanish) and `/en/` (English); the application is served at `/app`. The placeholder origin intentionally emits noindex and disallows crawling.

## Ownership

- `src/pages -> src/views -> src/components/sections -> src/components/ui`: inherited Astro composition.
- `src/content/pages/milanko.json`: schema-validated Spanish copy.
- `src/styles/tokens.css`: Milanko brand roles.
- `src/lib/earth-state.ts`: tested geographic and scroll transforms.
- `src/scripts/experience.ts`: Motion, location controls, pause/reduced-motion behavior.
- `src/scripts/earth.ts`: one shared Three.js renderer, capped DPR and offscreen/hidden-tab suspension.

The geographic selector is an illustrative interaction. It rotates the Earth and describes a question; it does not fetch measurements or calculate trends. Motion controls and event selection work without WebGL. Without JavaScript, the local poster, a worked example and the application link remain available.

The guided investigation starts with a question about temperature or rainfall. Visitors compare five simulated regional records, identify matching evidence and reveal the associated event. Four planets then introduce modules from the [POC research](https://github.com/hexalis/poc-research-design-concept/tree/f90d218/portal). The Arctic case box follows the investigation. Completing a case reveals the invitation to try real records there; the public application link is `/app`.

## References and assets

Brand: [Milanko identity v1.2](https://claude.ai/artifact/3GXv4ASX7YopzKvewofLDA#marca), 2026-11-02. The small SVG mark is an interim reconstruction from that manual; replace it with the approved export before final brand sign-off.

Composition/motion: [Hexalis](https://hexalis.org/), with source parameters checked in `hexalis/landing-page`: 14px copy entrance, opacity 420ms, transform 520ms, 50ms stagger, cubic-bezier(.23,1,.32,1). Reanimate recordings and comparisons stay in ignored `.reanimate/`; they are evidence, not application runtime.

Earth imagery: NASA Blue Marble via [Three.js day texture](https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg) and [water map](https://threejs.org/examples/textures/planets/earth_specular_2048.jpg); [NASA source collection](https://visibleearth.nasa.gov/collection/1484/blue-marble). No affiliation or endorsement is implied. Three.js and Motion use MIT. Locally served IBM Plex Sans, Source Serif 4 and JetBrains Mono use SIL OFL 1.1 through Fontsource.

The default starter's 80KB JavaScript budget is raised to 240KB gzip for the deliberate, lazy 3D renderer; CSS stays at 60KB. Tests and budgets are guardrails, not claims of real-phone performance or WCAG certification.
