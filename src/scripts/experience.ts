import { scroll } from 'motion';
import { places, type Place } from '../lib/earth-state';
import { placeCopy, ui, type Locale } from '../lib/i18n';

const journey = document.querySelector<HTMLElement>('#recorrido');
if (journey) {
  const locale: Locale = document.documentElement.lang === 'en' ? 'en' : 'es';
  const copy = ui[locale];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector<HTMLButtonElement>('#motion-toggle')!;
  // Keep the fixed control outside the isolated, clipped Earth scene.
  document.body.append(toggle);
  const label = document.querySelector<HTMLElement>('#motion-label')!;
  let paused = reduced.matches;
  let progress = 0;
  let selectedPlace: Place | undefined;
  let earth: Awaited<ReturnType<typeof import('./earth')['createEarth']>> | undefined;
  const updatePause = () => {
    document.documentElement.dataset.motion = paused ? 'paused' : 'playing';
    toggle.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? copy.resume : copy.pause;
    toggle.title = label.textContent;
    toggle.querySelector('[aria-hidden="true"]')!.textContent = paused ? '▶' : 'Ⅱ';
    earth?.setPaused(paused);
    if (paused) document.querySelectorAll('.reveal').forEach(element => element.classList.add('is-visible'));
  };
  toggle.hidden = false;
  updatePause();
  toggle.addEventListener('click', () => { paused = !paused; updatePause(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; updatePause(); });

  const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    reveals.unobserve(entry.target);
  }), { rootMargin: '0px 0px -4% 0px' });
  document.querySelectorAll<HTMLElement>('.reveal').forEach(element => {
    [...element.children].forEach((child, index) => {
      if (child instanceof HTMLElement) child.style.setProperty('--reveal-delay', Math.min(index, 5) * 50 + 'ms');
    });
    if (!paused) element.classList.add('is-pending');
    reveals.observe(element);
  });

  const picker = document.querySelector<HTMLFieldSetElement>('.location-picker')!;
  const reset = document.querySelector<HTMLButtonElement>('#reset-view')!;
  function updateLocation(key?: Place) {
    selectedPlace = key;
    const place = key ? places[key] : undefined;
    journey!.dataset.view = place?.kind ?? 'global';
    picker.querySelectorAll<HTMLButtonElement>('button').forEach(item => item.setAttribute('aria-pressed', String(item.dataset.place === key)));
    document.querySelector('#place-coordinates')!.textContent = key ? placeCopy[locale][key][1] : copy.global;
    document.querySelector('#place-description')!.textContent = key ? placeCopy[locale][key][2] : copy.chooseHint;
    reset.hidden = !key;
  }
  updateLocation();
  picker.disabled = false;
  picker.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.place;
      if (!key || !(key in places)) return;
      updateLocation(key as Place);
      earth?.selectPlace(key as Place);
    });
  });
  reset.addEventListener('click', () => {
    const previous = picker.querySelector<HTMLButtonElement>('[aria-pressed=true]');
    updateLocation();
    earth?.resetView();
    previous?.focus({ preventScroll: true });
  });
  const caption = journey.querySelector<HTMLElement>('.planet-caption')!;
  scroll(value => {
    progress = value;
    journey.dataset.chapter = value > .15 ? 'story' : 'hero';
    caption.hidden = value > .15;
    earth?.setProgress(value);
  }, { target: journey, offset: ['start start', 'end end'] });
  import('./earth').then(async ({ createEarth }) => {
    earth = await createEarth(journey, paused);
    updatePause();
    earth?.setProgress(progress);
    if (selectedPlace) earth?.selectPlace(selectedPlace);
  }).catch(() => {
    // Keep the local image and complete text usable when WebGL or its bundle is unavailable.
    journey.dataset.renderer = 'fallback';
  });
}
