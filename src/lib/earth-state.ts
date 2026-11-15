export const places = {
  atlantic: { label: 'Huracán · Escenario cat. 4', kind: 'hurricane', latitude: 22, longitude: -45, coordinates: '22.00° N · 45.00° O', description: 'Atlántico · Escenario ilustrativo de huracán categoría 4. La intensidad es un supuesto de esta demostración, sin mediciones ni un evento real.' },
  sahara: { label: 'Polvo · Sáhara', kind: 'dust', latitude: 23, longitude: 15, coordinates: '23.00° N · 15.00° E', description: 'Sáhara · Una nube de polvo en movimiento invita a explorar aerosoles y visibilidad. Es una simulación, no una detección actual.' },
  pacific: { label: 'Tormenta tropical · Pacífico', kind: 'tropical', latitude: -18, longitude: -150, coordinates: '18.00° S · 150.00° O', description: 'Pacífico sur · Nubes más dispersas muestran una tormenta tropical ilustrativa. No representa un fenómeno real ni una alerta.' },
  canada: { label: 'Nieve · Canadá', kind: 'snow', latitude: 58, longitude: -105, coordinates: '58.00° N · 105.00° O', description: 'Canadá · Nubosidad fría y trazos de nieve ilustran un escenario invernal. No es una observación meteorológica actual.' },
  australia: { label: 'Incendio y humo · Australia', kind: 'fire', latitude: -33, longitude: 145, coordinates: '33.00° S · 145.00° E', description: 'Australia · Un frente de fuego y su columna de humo son una demostración visual. No indican un incendio activo ni una alerta.' },
} as const;
export type Place = keyof typeof places;

/** A single camera approach: wide Earth–Moon scene, then the Earth's horizon. */
export function scenePose(progress: number, mobile: boolean, focus = 0) {
  const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
  const phase = Math.max(0, (p - .48) / .52);
  const approach = phase * phase * (3 - 2 * phase);
  const exit = Math.max(0, Math.min(1, (p - .65) / .25));
  const closeup = Math.max(0, Math.min(1, Number.isFinite(focus) ? focus : 0)) * (1 - exit * exit * (3 - 2 * exit));
  return {
    x: mobile ? 0 : -1 * (1 - approach),
    y: mobile ? 1.65 - .6 * approach : 1.05 * approach,
    z: (mobile ? 7.4 - 5.6 * approach : 4.7 - 2.9 * approach) * (1 - .12 * closeup),
  };
}

// Presentation orbit, deliberately compressed to 32s; distances are not an astronomical scale.
export const lunarPeriod = 32;
export function lunarOrbit(seconds: number) {
  const angle = (Number.isFinite(seconds) ? seconds : 0) / lunarPeriod * Math.PI * 2 - .6;
  return { x: -1.4 * Math.cos(angle) * Math.cos(.6), y: 1.4 * Math.cos(angle) * Math.sin(.6), z: 1.4 * Math.sin(angle) };
}

/** Convert geographic degrees to the Three.js sphere's texture coordinates. */
export function geographicPoint(latitude: number, longitude: number, radius = 1) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new RangeError('Invalid geographic coordinates');
  }
  const lat = latitude * Math.PI / 180;
  const lon = longitude * Math.PI / 180;
  return { x: radius * Math.cos(lat) * Math.cos(lon), y: radius * Math.sin(lat), z: -radius * Math.cos(lat) * Math.sin(lon) };
}
