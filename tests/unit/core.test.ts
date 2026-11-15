import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geographicPoint, lunarOrbit, lunarPeriod, places, scenePose } from '../../src/lib/earth-state.ts';

test('the camera approaches continuously without reversing or moving the planet', () => {
  assert.deepEqual(scenePose(-1, false), scenePose(0, false));
  assert.deepEqual(scenePose(5, false), scenePose(1, false));
  assert.deepEqual(scenePose(NaN, false), scenePose(0, false));
  for (const mobile of [false, true]) {
    let previous = scenePose(0, mobile);
    for (let i = 1; i <= 1000; i++) {
      const current = scenePose(i / 1000, mobile);
      assert.ok(current.x >= previous.x && current.z <= previous.z);
      assert.ok(Math.hypot(current.x, current.y, current.z) > 1.075);
      assert.ok(Math.hypot(current.x - previous.x, current.y - previous.y, current.z - previous.z) < .03);
      previous = current;
    }
  }
});

test('Moon completes a closed inclined orbit with front and rear passages', () => {
  const start = lunarOrbit(0), end = lunarOrbit(lunarPeriod);
  assert.ok(Math.hypot(start.x - end.x, start.y - end.y, start.z - end.z) < 1e-10);
  const points = Array.from({ length: 32 }, (_, i) => lunarOrbit(i));
  for (const point of points) assert.ok(Math.abs(Math.hypot(point.x, point.y, point.z) - 1.4) < 1e-10);
  assert.ok(points.some(point => point.z < -1) && points.some(point => point.z > 1));
  assert.ok(points.some(point => point.x < -1) && points.some(point => point.x > 1));
});

test('location focus moves closer and blends out before the horizon', () => {
  for (const mobile of [false, true]) {
    assert.ok(scenePose(.4, mobile, 1).z < scenePose(.4, mobile).z);
    assert.deepEqual(scenePose(1, mobile, 1), scenePose(1, mobile));
    assert.deepEqual(scenePose(.4, mobile, NaN), scenePose(.4, mobile));
  }
});
test('geographic points lie on the unit sphere, with correct poles', () => {
  for (const place of Object.values(places)) {
    const p = geographicPoint(place.latitude, place.longitude);
    assert.ok(Math.abs(Math.hypot(p.x, p.y, p.z) - 1) < 1e-10);
  }
  assert.equal(geographicPoint(90, 0).y, 1);
  for (const values of [[91, 0], [0, 181], [NaN, 0], [0, Infinity]]) {
    assert.throws(() => geographicPoint(values[0]!, values[1]!), RangeError);
  }
});
