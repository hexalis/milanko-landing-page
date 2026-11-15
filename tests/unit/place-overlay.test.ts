import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createPlaceOverlay } from '../../src/scripts/place-overlay.ts';
import { geographicPoint, places } from '../../src/lib/earth-state.ts';

test('weather overlays and their contours follow the sphere instead of floating over a flat plane', () => {
  for (const kind of ['hurricane', 'tropical', 'dust', 'snow', 'fire'] as const) {
    const overlay = createPlaceOverlay(geographicPoint(22, -45, 1.035), kind);
    overlay.group.updateMatrixWorld(true);
    for (const object of overlay.group.children) {
      const geometry = (object as THREE.Mesh).geometry;
      const vertices = geometry.getAttribute('position');
      for (let i = 0; i < vertices.count; i++) {
        const point = new THREE.Vector3().fromBufferAttribute(vertices, i).applyMatrix4(object.matrixWorld);
        assert.ok(Math.abs(point.length() - 1.035) < 1e-6);
      }
    }
  }
});

test('the displayed areas do not overlap each other', () => {
  const areas = Object.values(places).map(place => {
    const point = geographicPoint(place.latitude, place.longitude, 1.035);
    const overlay = createPlaceOverlay(point, place.kind);
    const ring = overlay.group.children[0] as THREE.LineLoop;
    const vertex = ring.geometry.getAttribute('position');
    const edge = Math.hypot(vertex.getX(0), vertex.getY(0));
    return { label: place.label, normal: new THREE.Vector3(point.x, point.y, point.z).normalize(), angle: Math.asin(edge / 1.035) };
  });
  for (let i = 0; i < areas.length; i++) {
    for (let j = i + 1; j < areas.length; j++) {
      const a = areas[i]!, b = areas[j]!;
      assert.ok(a.normal.angleTo(b.normal) > a.angle + b.angle + .03, `${a.label} overlaps ${b.label}`);
    }
  }
});
