# Validation and remaining boundaries

Checked on Windows, 2026-11-09. This is a static Spanish landing, not the Milanko data application.

## Completed checks

- `npm run verify`: Astro/TypeScript diagnostics (zero errors/warnings), six unit tests, production build, one generated-output test and gzip budgets passed.
- `npm run test:e2e`: 12 tests across desktop and mobile emulation. Covers location context including Nicaragua, motion pause/resume with equal canvas frames while paused, reduced motion, no WebGL, no JavaScript, overflow and automated WCAG A/AA rules. Animation is paused before contrast evaluation.
- Final bundle: 151,739 JavaScript bytes and 4,319 CSS bytes gzip across external assets. The Three.js renderer is dynamically imported.
- Inspected desktop, tablet and phone renders, plus the real WebGL view in the browser. Fixed tablet title wrapping, poster overlap and the scene leaking into the evidence section.
- Atmosphere: a bright sky-blue limb and a wider soft shell, with additive blending and no postprocessing pass. Color comes from `--atmosphere`. A restrained static halo remains on the fallback image.

## Reference-motion evidence

Source parameters were read from `hexalis/landing-page` at `21f424acc9754457a7692835fd9f44de1aede5a2`. Copy entrances use the source's 14px / 420ms opacity / 520ms transform / 50ms stagger and easing. The original earlier Earth at `f5e48df` was a CSS/SVG sphere; the textured Three.js Earth here is new.

Reanimate captured 15 frames per version at 1440×900, 10fps, a 1200ms window plus pre-roll, identical scroll settings. All source-filmstrip frames and the final comparison sheet were inspected. Round 2 restored the missing copy entrance found in round 1.

| Round 2 measurement | Result |
| --- | --- |
| Whole-region mean pixel mismatch | 90.85% |
| Activity window start / end / duration difference | −200 / 0 / +200ms |
| Activity peak difference | 0ms |
| Exact-reference pass | No |

The source panel and destination have different positions, dimensions, text, themes and imagery. This comparison does **not** establish motion fidelity or pixel fidelity. Keep it as evidence of a deliberate adaptation; do not advertise a 1:1 reconstruction. No clone of the hexagonal scene was requested or shipped. Local recordings remain ignored in `.reanimate/hexalis/`.

The design inspector measured two-line hero titles at 1440, 768 and 390px. Its last pass had zero failures with four declared exceptions: brand-prescribed telemetry monospace; semantic control/disclosure dividers; one continuous 3D subject instead of four photographs; canvas-filled chapters that its static-content heuristic treats as empty. Warnings about the type scale, telemetry label and absence of video are accepted for this branded, live-3D composition.

## Before public release

- Replace the interim SVG mark with the approved exported logo.
- Translate the landing into English in a later iteration; the page view includes a matching `TODO(i18n)` comment.
- Set `SITE_URL` to the approved origin; the default preview emits noindex.
- Supply a real product/demo URL before adding an “open app” action. Current actions navigate locally or to Hexalis.
- Check real iOS/Android hardware and GPU performance. Emulation and automated accessibility checks do not certify WCAG conformance or field performance.
- Geographic examples make no claim of measured trends. No API, statistical test, scientific projection, tracking or lead collection is implemented.

## Spatial-scene checkpoint — 2026-11-09

The 8.23s WhatsApp reference inspires spatial continuity, not a literal reconstruction. Earth stays at the origin. A monotonic camera approach replaces its previous left/right zigzag and finishes at a broad horizon. The Moon follows a closed, inclined 32s presentation orbit with depth occlusion and PCF shadows: its eclipse shadow was observed crossing the surface in an 11s recording. Distances and time are illustrative, explicitly disclosed in the UI.

There are 620 seeded stars, a subtle sky dome, detailed independent clouds, night-side lights and a thinner cyan atmosphere. Fine-pointer movement steers directional lighting with damping; coarse pointers keep stable light. Both the literal Sun and the conspicuous central ray shader were removed following user feedback; only a faint corner light remains. Pause/reduced-motion and hidden/offscreen suspension remain. Optional detail textures do not block the base planet.

Nicaragua uses a conceptual reference at 13°N, 85°W. Location selection rotates toward the camera using quaternion interpolation, adds a 12% dolly and keeps the location visible rather than spinning away. Focus fades out before the horizon. Mobile chapter heights measured 880 / 857 / 760px, replacing 1100 / 1350 / 1150px.

Clouds, night map and sky: [Solar System Scope](https://www.solarsystemscope.com/textures/), CC BY 4.0. Moon: [Three.js planet examples](https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets). Local textures and visible footer credits; no new dependency or bloom pass. The light field and legibility scrim are deliberate exceptions to generic gradient rules.

Ignored evidence is in `.reanimate/scene/`: full-orbit recordings, scroll journey recordings, eclipse video and reviewed filmstrips. No source-equivalence timing or pixel pass is claimed. Real-device performance remains unchecked. No push or deployment.

## Final illustrative phenomena

Nicaragua and Atacama/ALMA remain. Svalbard, Sahel and La Palma were removed. Five geographically separated demonstrations show an assumed category-4 hurricane in the Atlantic, a South Pacific tropical storm, Saharan dust, Canadian snow and Australian fire/smoke. Category and intensity are fictional scenario inputs, not inferred measurements. Open peripheral contours leave the phenomenon visible; procedural patches curve onto the sphere. Unit checks verify that all vertices stay on that sphere and that displayed areas do not overlap.

The global-view control clears selection, restores framing and returns keyboard focus to the previous location button. Mobile selectors use two columns and hide redundant introductory copy to preserve space for the planet. A short navy-to-paper transition softens entry into the evidence section. The 12-test browser pass covers these controls and all seven selections. The final copy-spacing change was additionally built and inspected in the browser.

The focused code-quality closing pass read the changed modules, callers and tests directly because the nested application was not tracked by the available structural index. No additional actionable defect was found within this scope. Private iteration history and reusable strategies belong in the owner's personal repositories, not this application repository.
