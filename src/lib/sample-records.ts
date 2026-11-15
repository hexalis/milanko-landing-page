import type { Place } from './earth-state';

// Illustrative readings, not observations. Each tuple contains the lower bound,
// upper bound and simulated event reading for the same 90-day window.
type Reading = readonly [low: number, high: number, observed: number];
export const sampleRecords = {
  atlantic:  { temperature: [26, 29, 31], rainfall: [180, 240, 215] },
  sahara:    { temperature: [29, 34, 32], rainfall: [4, 15, 2] },
  pacific:   { temperature: [25, 30, 28], rainfall: [210, 320, 370] },
  canada:    { temperature: [-6, 2, -9], rainfall: [45, 85, 70] },
  australia: { temperature: [24, 29, 32], rainfall: [80, 140, 55] },
} as const satisfies Record<Place, Record<'temperature' | 'rainfall', Reading>>;
