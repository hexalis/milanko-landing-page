import * as THREE from 'three';
import { animate } from 'motion';
import { geographicPoint, lunarOrbit, lunarPeriod, places, scenePose, type Place } from '../lib/earth-state';
import { createPlaceOverlay } from './place-overlay';

/** Create one renderer for the entire journey; return controls, or preserve the poster on failure. */
export async function createEarth(journey: HTMLElement, initiallyPaused: boolean) {
  const canvas = journey.querySelector<HTMLCanvasElement>('canvas')!;
  const stage = journey.querySelector<HTMLElement>('.planet-stage')!;
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' }); }
  catch { journey.dataset.renderer = 'fallback'; return undefined; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(max-width:960px)').matches ? 1 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  camera.position.z = 5.4;
  const globe = new THREE.Group();
  globe.rotation.z = -23.5 * Math.PI / 180;
  scene.add(globe);
  const surface = new THREE.Group();
  globe.add(surface);
  const loader = new THREE.TextureLoader();
  const [day, water] = await Promise.all([
    loader.loadAsync('/textures/earth-day.jpg'),
    loader.loadAsync('/textures/earth-water.jpg'),
  ]).catch(() => { renderer.dispose(); return []; });
  if (!day || !water) return undefined;
  day.colorSpace = THREE.SRGBColorSpace;
  day.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  const sphere = new THREE.SphereGeometry(1, 96, 64);
  const lightDirection = { value: new THREE.Vector3(-3, 3, 3).normalize() };
  const earthMaterial = new THREE.MeshPhongMaterial({ map: day, specularMap: water, specular: new THREE.Color('#24394b'), shininess: 24 });
  earthMaterial.onBeforeCompile = shader => {
    shader.uniforms.sunDirection = lightDirection;
    shader.fragmentShader = 'uniform vec3 sunDirection;\n' + shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= 1. - smoothstep(-.2,.25,dot(normal,sunDirection));');
  };
  const earthMesh = new THREE.Mesh(sphere, earthMaterial);
  earthMesh.castShadow = true; earthMesh.receiveShadow = true;
  surface.add(earthMesh);
  loader.load('/textures/earth-night.jpg', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    earthMaterial.emissiveMap = texture; earthMaterial.emissive.set('#ffc999'); earthMaterial.emissiveIntensity = .7;
    earthMaterial.needsUpdate = true; render();
  });
  // Optional detail textures must never prevent the base planet from appearing.
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 48), new THREE.MeshPhongMaterial({
    color: '#edf5ff', transparent: true, opacity: 0, depthWrite: false, shininess: 5,
  }));
  globe.add(clouds);
  loader.load('/textures/earth-clouds.jpg', texture => {
    texture.anisotropy = day.anisotropy;
    clouds.material.alphaMap = texture; clouds.material.opacity = .72; clouds.material.needsUpdate = true; render();
  });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(.19, 48, 32), new THREE.MeshPhongMaterial({ color: '#b5bac6', shininess: 2 }));
  moon.castShadow = true; moon.receiveShadow = true;
  moon.rotation.set(.12, -1, .15);
  scene.add(moon);
  loader.load('/textures/moon.jpg', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    moon.material.map = texture; moon.material.bumpMap = texture; moon.material.bumpScale = .008;
    moon.material.needsUpdate = true; render();
  });
  scene.add(new THREE.AmbientLight('#a7badf', .3));
  const sun = new THREE.DirectionalLight('#ffffff', 2.5);
  sun.position.set(-3, 3, 3); scene.add(sun);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -2;
  sun.shadow.camera.right = sun.shadow.camera.top = 2;
  sun.shadow.camera.near = .5; sun.shadow.camera.far = 12;
  sun.shadow.bias = -.0003; sun.shadow.normalBias = .01;
  const lightTarget = sun.position.clone();
  const skyDome = new THREE.Mesh(new THREE.SphereGeometry(45, 48, 32), new THREE.MeshBasicMaterial({
    side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, color: '#7999b2',
  }));
  skyDome.rotation.set(.35, -.8, -.45);
  scene.add(skyDome);
  loader.load('/textures/milky-way.jpg', texture => {
    texture.colorSpace = THREE.SRGBColorSpace;
    skyDome.material.map = texture; skyDome.material.opacity = .28; skyDome.material.needsUpdate = true; render();
  });
  // A deterministic star field uses one draw call and no DOM particles or postprocessing.
  const starPositions: number[] = [], starSizes: number[] = [], starPhases: number[] = [];
  for (let i = 0; i < 620; i++) {
    const random = (salt: number) => { const n = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453; return n - Math.floor(n); };
    starPositions.push((random(1) - .5) * 25, (random(2) - .5) * 16, -3 - random(3) * 9);
    starSizes.push(.7 + Math.pow(random(4), 5) * 2.5);
    starPhases.push(random(5) * Math.PI * 2);
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
  starsGeometry.setAttribute('phase', new THREE.Float32BufferAttribute(starPhases, 1));
  const stars = new THREE.Points(starsGeometry, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, pixelRatio: { value: renderer.getPixelRatio() } },
    vertexShader: 'attribute float size; attribute float phase; uniform float time; uniform float pixelRatio; varying float light; void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=size*pixelRatio;light=.48+.18*sin(time*.45+phase);}',
    fragmentShader: 'varying float light; void main(){float d=length(gl_PointCoord-.5);float a=1.-smoothstep(.08,.5,d);gl_FragColor=vec4(.72,.84,1.,a*light);}',
  }));
  scene.add(stars);
  const sky = new THREE.Color(getComputedStyle(journey).getPropertyValue('--atmosphere').trim());
  const rim = new THREE.DirectionalLight(sky, 2);
  rim.position.set(4, -1, -2); scene.add(rim);
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.018, 64, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { sky: { value: sky } },
    vertexShader: 'varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
    fragmentShader: 'uniform vec3 sky; varying vec3 n; varying vec3 v; void main(){float a=pow(max(0.,1.-abs(dot(normalize(n),normalize(v)))),3.);gl_FragColor=vec4(sky,a*.65);}',
  }));
  globe.add(atmosphere);
  // Two inexpensive shells give a bright limb and a soft outer haze without a bloom pass.
  const haze = new THREE.Mesh(new THREE.SphereGeometry(1.075, 64, 48), new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { sky: { value: sky } },
    vertexShader: atmosphere.material.vertexShader,
    fragmentShader: 'uniform vec3 sky; varying vec3 n; varying vec3 v; void main(){float f=abs(dot(normalize(n),normalize(v)));float a=smoothstep(0.,.3,f)*(1.-smoothstep(.15,.7,f));gl_FragColor=vec4(sky,a*.12);}',
  }));
  globe.add(haze);
  const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 160 }, (_, i) => { const p = lunarOrbit(i / 160 * lunarPeriod); return new THREE.Vector3(p.x, p.y, p.z); }),
  ), new THREE.LineBasicMaterial({ color: '#96b3cc', transparent: true, opacity: .11 }));
  scene.add(orbit);
  // Illustrative satellites: exaggerated size and compressed periods for legibility.
  const satellites = [0, 1].map(index => {
    const plane = new THREE.Group();
    plane.rotation.set(.55 + index * .7, index * .9, -.4 + index * .8);
    scene.add(plane);
    const radius = 1.23 + index * .14;
    const path = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 128 }, (_, i) => new THREE.Vector3(Math.cos(i / 128 * Math.PI * 2) * radius, 0, Math.sin(i / 128 * Math.PI * 2) * radius)),
    ), new THREE.LineBasicMaterial({ color: '#8bd5ff', transparent: true, opacity: .12, depthWrite: false }));
    plane.add(path);
    const craft = new THREE.Group();
    plane.add(craft);
    const body = new THREE.Mesh(new THREE.BoxGeometry(.045, .065, .045), new THREE.MeshPhongMaterial({ color: '#dfcaa0', shininess: 65 }));
    craft.add(body);
    const panelMaterial = new THREE.MeshPhongMaterial({ color: '#101e34', specular: '#6685a3', shininess: 95 });
    const cellMaterial = new THREE.LineBasicMaterial({ color: '#647b92', transparent: true, opacity: .22 });
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(.085, .065, .006), panelMaterial);
      panel.position.x = side * .08;
      craft.add(panel);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(.03, .006, .006), body.material);
      arm.position.x = side * .03;
      craft.add(arm);
      const cells: THREE.Vector3[] = [];
      for (let cell = -1; cell <= 1; cell++) {
        const x = side * .08 + cell * .025;
        cells.push(new THREE.Vector3(x, -.032, .004), new THREE.Vector3(x, .032, .004));
      }
      craft.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(cells), cellMaterial));
    }
    const antenna = new THREE.Mesh(new THREE.ConeGeometry(.018, .025, 12), new THREE.MeshPhongMaterial({ color: '#e4ecf2' }));
    antenna.position.y = .04;
    craft.add(antenna);
    // Metallic bus frame, radiator, optical instrument and parabolic antenna.
    const silver = new THREE.MeshPhongMaterial({ color: '#c8d6df', shininess: 100 });
    const dark = new THREE.MeshPhongMaterial({ color: '#101c2c', shininess: 90 });
    const frame = new THREE.LineSegments(new THREE.EdgesGeometry(body.geometry), new THREE.LineBasicMaterial({ color: '#a58c60', transparent: true, opacity: .28 }));
    craft.add(frame);
    const radiator = new THREE.Mesh(new THREE.BoxGeometry(.032, .038, .004), silver);
    radiator.position.set(0, -.006, .025); craft.add(radiator);
    for (let rib = 0; rib < 5; rib++) {
      const slit = new THREE.Mesh(new THREE.BoxGeometry(.027, .002, .002), dark);
      slit.position.set(0, -.02 + rib * .007, .028); craft.add(slit);
    }
    const instrument = new THREE.Mesh(new THREE.CylinderGeometry(.012, .014, .025, 16), silver);
    instrument.rotation.x = Math.PI / 2; instrument.position.set(0, -.035, .035); craft.add(instrument);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(.009, 16), new THREE.MeshPhongMaterial({ color: '#183755', emissive: '#123044', shininess: 120 }));
    lens.position.set(0, -.035, .049); craft.add(lens);
    const dish = new THREE.Mesh(new THREE.LatheGeometry(Array.from({ length: 12 }, (_, i) => {
      const r = i / 11 * .025; return new THREE.Vector2(r, r * r * 20);
    }), 24), new THREE.MeshPhongMaterial({ color: '#e6edf2', side: THREE.DoubleSide, shininess: 90 }));
    dish.rotation.x = Math.PI / 3; dish.position.set(.005, .05, .015); craft.add(dish);
    const feed = new THREE.Mesh(new THREE.CylinderGeometry(.002, .002, .035, 6), silver);
    feed.rotation.x = Math.PI / 3; feed.position.set(.005, .059, .03); craft.add(feed);
    for (const side of [-1, 1]) {
      const rails = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.09, .07, .008)), new THREE.LineBasicMaterial({ color: '#7e8b98', transparent: true, opacity: .3 }));
      rails.position.x = side * .08; craft.add(rails);
      for (let row = -2; row <= 2; row++) {
        const seam = new THREE.Mesh(new THREE.BoxGeometry(.084, .001, .001), silver);
        seam.position.set(side * .08, row * .012, .0045); craft.add(seam);
      }
    }
    craft.scale.setScalar(.45);
    return { craft, radius, phase: .7 + index * Math.PI, period: 46 + index * 21 };
  });
  const overlays = Object.values(places).map(place => {
    const overlay = createPlaceOverlay(geographicPoint(place.latitude, place.longitude, 1.035), place.kind);
    surface.add(overlay.group);
    return overlay;
  });
  let progress = 0;
  let paused = initiallyPaused;
  let visible = true;
  let raf = 0;
  let last = 0;
  let rotation = -1.15;
  let focus = 0;
  let orientation: THREE.Quaternion | undefined;
  let selectedPoint: THREE.Vector3 | undefined;
  const localView = new THREE.Vector3();
  const inverseAxis = globe.quaternion.clone().invert();
  let elapsed = 0;
  let transitioning = false;
  let selection: ReturnType<typeof animate> | undefined;
  const small = matchMedia('(max-width:960px)');
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)');
  journey.addEventListener('pointermove', event => {
    if (!finePointer.matches || paused) return;
    const bounds = stage.getBoundingClientRect();
    lightTarget.set(((event.clientX - bounds.left) / bounds.width * 2 - 1) * 5, (1 - (event.clientY - bounds.top) / bounds.height * 2) * 4, 3.5);
  });
  journey.addEventListener('pointerleave', () => { lightTarget.set(-3, 3, 3); });
  function pose() {
    const value = scenePose(progress, small.matches, focus);
    camera.position.set(value.x, value.y, value.z);
    camera.lookAt(value.x, value.y, 0);
    if (orientation) {
      if (selectedPoint && !transitioning && progress < .75) orientation.setFromUnitVectors(selectedPoint, localView.copy(camera.position).normalize().applyQuaternion(inverseAxis));
      surface.quaternion.copy(orientation);
    } else surface.rotation.set(0, rotation, 0);
    clouds.quaternion.copy(surface.quaternion);
    clouds.rotateY(.12 + elapsed * .009);
    const lunar = lunarOrbit(elapsed);
    moon.position.set(lunar.x, lunar.y, lunar.z);
    moon.lookAt(0, 0, 0);
    satellites.forEach(({ craft, radius, phase, period }) => {
      const angle = phase + elapsed / period * Math.PI * 2;
      craft.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      // Attitude follows the orbital plane, allowing natural foreshortening.
      craft.rotation.set(.35, -angle + Math.PI / 2, .15);
    });
    lightDirection.value.copy(sun.position).normalize();
    overlays.forEach(overlay => overlay.update(elapsed, lightDirection.value));
    stars.material.uniforms.time!.value = elapsed;
  }
  function render() {
    pose();
    renderer.render(scene, camera);
  }
  function frame(now: number) {
    raf = 0;
    // Ambient orbital motion needs 30 fps; keep input and scrolling on the browser clock.
    if (now - last < 1000 / 30 - 1) { schedule(); return; }
    const delta = Math.min((now - last) / 1000, .05);
    last = now;
    if (!paused) elapsed += delta;
    if (!paused && !transitioning && !orientation) rotation += delta * .035;
    if (!paused) sun.position.lerp(lightTarget, 1 - Math.exp(-delta * 8));
    render();
    if (visible && !document.hidden && !paused) raf = requestAnimationFrame(frame);
  }
  function schedule() {
    if (!raf && visible && !document.hidden && !paused) { raf = requestAnimationFrame(frame); }
  }
  function resize() {
    const width = stage.clientWidth, height = stage.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    schedule();
  }).observe(journey);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    schedule();
  });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); paused = true;
    if (raf) cancelAnimationFrame(raf);
    stage.classList.remove('ready'); journey.dataset.renderer = 'fallback';
  });
  function selectPlace(key: Place) {
    const place = places[key], point = geographicPoint(place.latitude, place.longitude, 1.025);
    selection?.stop();
    const startFocus = focus;
    const startOrientation = surface.quaternion.clone();
    selectedPoint = new THREE.Vector3(point.x, point.y, point.z).normalize();
    const closeup = scenePose(progress, small.matches, 1);
    localView.set(closeup.x, closeup.y, closeup.z).normalize().applyQuaternion(inverseAxis);
    const targetOrientation = new THREE.Quaternion().setFromUnitVectors(selectedPoint, localView);
    orientation = startOrientation.clone();
    transitioning = true;
    if (paused) { orientation.copy(targetOrientation); focus = 1; transitioning = false; render(); return; }
    selection = animate(0, 1, { duration: 1.1, ease: [.77, 0, .175, 1], onUpdate: value => {
      orientation!.slerpQuaternions(startOrientation, targetOrientation, value);
      focus = startFocus + (1 - startFocus) * value;
    }, onComplete: () => { transitioning = false; } });
    schedule();
  }
  function resetView() {
    selection?.stop();
    const startFocus = focus;
    const startOrientation = surface.quaternion.clone();
    const target = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotation, 0));
    selectedPoint = undefined;
    orientation = startOrientation.clone();
    transitioning = true;
    if (paused) { focus = 0; orientation = undefined; transitioning = false; render(); return; }
    selection = animate(0, 1, { duration: .8, ease: [.77, 0, .175, 1], onUpdate: value => {
      orientation!.slerpQuaternions(startOrientation, target, value);
      focus = startFocus * (1 - value);
    }, onComplete: () => { focus = 0; orientation = undefined; transitioning = false; } });
    schedule();
  }
  resize(); stage.classList.add('ready'); journey.dataset.renderer = 'webgl'; schedule();
  return {
    setProgress(value: number) {
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        progress = value;
        if (paused && visible) render();
        else schedule();
      }
    },
    setPaused(value: boolean) {
      paused = value;
      if (paused) { selection?.complete(); if (raf) { cancelAnimationFrame(raf); raf = 0; } render(); }
      else { last = performance.now(); schedule(); }
    },
    selectPlace,
    resetView,
  };
}
