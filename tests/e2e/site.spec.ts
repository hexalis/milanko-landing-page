import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

declare global {
  interface Window { renderCounts: { total: number } }
}

async function solveRainfallCase(page: Page) {
  const desk = page.locator('#case-desk');
  await desk.locator('[data-question-set="1"] [value="0"]').click();
  await desk.locator('[data-region=pacific]').click();
  await desk.locator('[data-close]').click();
  await page.locator('[data-atlas] > summary').click();
}

test('the question leads to evidence, then the event, then the late invitation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/en/']) {
    await page.goto(route);
    await page.locator('.hero-actions [href="#observa"]').click();
    const desk = page.locator('#case-desk');
    const invitation = page.locator('[data-invitation]');
    for (const [topic, direction, key, example, verdict] of [
      ['1','0','pacific','50 mm',/tormenta|storm/i],
      ['0','1','canada','3 °C',/nieve|snow/i],
      ['0','2','sahara','32 °C',/polvo|dust/i],
    ] as const) {
      await expect(invitation).toBeHidden();
      await expect(page.locator('[data-atlas]')).toBeHidden();
      await desk.locator(`input[value="${topic}"]`).check();
      const open = desk.locator(`[data-question-set="${topic}"] [value="${direction}"]`);
      const question = (await open.innerText()).replace('→','').trim();
      expect(question).not.toMatch(/hurricane|huracán|tormenta|storm|nieve|snow|polvo|dust/i);
      await open.press('Enter');
      await expect(desk.locator('[data-close]')).toBeHidden();
      if (direction === '0') {
        await desk.locator('[data-region=atlantic]').press('Enter');
        await expect(desk.locator('[data-notice]')).toContainText(/Prueba|Try/);
        const next = desk.locator('[data-region=atlantic] + [data-feedback] [data-compare]');
        await expect(next).toHaveText(/Pacífico|Pacific/);
        await expect(desk.locator('[data-close]')).toBeHidden();
        await next.press('Enter');
      } else {
        await desk.locator(`[data-region="${key}"]`).press('Enter');
      }
      await expect(desk.locator(`[data-region="${key}"] + [data-feedback] [data-close]`)).toBeVisible();
      await desk.locator('.hand-lens summary').press('Enter');
      await expect(desk.locator('[data-lens-note]')).toContainText(example);
      await desk.locator('[data-close]').press('Enter');
      await expect(desk.locator('[data-final-question]')).toHaveText(question);
      await expect(desk.locator('[data-verdict]')).toHaveText(verdict);
      await expect(invitation).toBeVisible();
      await expect(page.locator('#historia .real-case')).toContainText(/Svalbard/);
      await expect(page.locator('#historia .case-action')).toHaveAttribute('href', '/app');
      await desk.locator('[data-reset]:visible').press('Enter');
    }
  }
});

test('landing is accessible, complete and contained', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page).toHaveTitle(/Milanko/);
  await expect(page.locator('#recorrido')).toHaveAttribute('data-renderer', /webgl|fallback/, { timeout: 30000 });
  await page.locator('#motion-toggle').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});
test('locations update context and motion can be stopped', async ({ page }) => {
  await page.goto('/#observa');
  await expect(page.locator('[data-place]')).toHaveCount(5);
  await expect(page.getByRole('button', { name: /Nicaragua|ALMA/ })).toHaveCount(0);
  await solveRainfallCase(page);
  const dust = page.locator('[data-place=sahara]');
  await dust.click();
  await expect(dust).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Volver a la vista global', exact: false }).click();
  await expect(page.locator('#recorrido')).toHaveAttribute('data-view', 'global');
  await expect(page.locator('#place-coordinates')).toHaveText('Vista global');
  await expect(page.locator('[data-place][aria-pressed=true]')).toHaveCount(0);
  await expect(page.locator('#reset-view')).toBeHidden();
  await expect(dust).toBeFocused();
  await expect(page.getByRole('button', { name: 'La Palma', exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'Huracán', exact: false }).click();
  await expect(page.locator('#recorrido')).toHaveAttribute('data-view', 'hurricane');
  await expect(page.locator('#place-coordinates')).toHaveText('22.00° N · 45.00° O');
  await page.getByRole('button', { name: 'Polvo', exact: false }).click();
  await expect(page.locator('#recorrido')).toHaveAttribute('data-view', 'dust');
  await expect(page.locator('#place-description')).toContainText('no una detección actual');
  await page.getByRole('button', { name: 'Tormenta tropical', exact: false }).click();
  await expect(page.locator('#recorrido')).toHaveAttribute('data-view', 'tropical');
  await expect(page.locator('#place-description')).toContainText('No representa un fenómeno real');
  await page.getByRole('button', { name: 'Nieve', exact: false }).click();
  await expect(page.locator('#recorrido')).toHaveAttribute('data-view', 'snow');
  await page.getByRole('button', { name: 'Incendio', exact: false }).click();
  await expect(page.locator('#recorrido')).toHaveAttribute('data-view', 'fire');
  await expect(page.locator('#place-description')).toContainText('No indican un incendio activo');
  const toggle = page.locator('#motion-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toContainText('Reanudar movimiento');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.locator('summary').filter({ hasText: '¿Ya puedo usar Milanko?' }).click();
  await expect(page.locator('#preguntas details[open]')).toContainText('sin conexión a datos en vivo');
});
test('reduced motion starts paused and remains readable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#motion-toggle')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('h1')).toBeVisible();
});

test('the whole space scene freezes when motion is paused', async ({ page }) => {
  await page.addInitScript(() => {
    const renderCounts = { total: 0 };
    window.renderCounts = renderCounts;
    for (const context of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const original = context.prototype.drawElements;
      context.prototype.drawElements = function (...args: Parameters<typeof original>) {
        renderCounts.total++;
        return original.apply(this, args);
      };
    }
  });
  await page.goto('/#observa');
  await expect(page.locator('#recorrido')).toHaveAttribute('data-renderer', 'webgl', { timeout: 30000 });
  await solveRainfallCase(page);
  await page.getByRole('button', { name: 'Huracán', exact: false }).click();
  await page.waitForLoadState('networkidle');
  await expect.poll(() => page.evaluate(() => ['moon.jpg', 'earth-clouds.jpg', 'earth-night.jpg', 'milky-way.jpg'].every(name => performance.getEntriesByType('resource').some(item => item.name.endsWith('/textures/' + name))))).toBe(true);
  await page.locator('#motion-toggle').click();
  await page.locator('#inicio').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' }));
  const canvas = page.locator('#earth-canvas');
  const first = await canvas.screenshot();
  const second = await canvas.screenshot();
  expect(second.equals(first)).toBe(true);
  const rendered = () => page.evaluate(() => window.renderCounts.total);
  const beforeResume = await rendered();
  await page.locator('#motion-toggle').click();
  await expect.poll(rendered).toBeGreaterThan(beforeResume);
});
test('WebGL failure leaves a real image and working content', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof getContext>) {
      if (String(args[0]).includes('webgl')) return null;
      return getContext.apply(this, args);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(page.locator('#recorrido')).toHaveAttribute('data-renderer', 'fallback');
  await expect(page.locator('.planet-fallback')).toBeVisible();
  await solveRainfallCase(page);
  await page.getByRole('button', { name: 'Huracán', exact: false }).click();
  await expect(page.locator('#place-description')).toContainText('Atlántico');
});
test('no-script visitors can read the proposal and open questions', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.planet-fallback')).toBeVisible();
  await expect(page.locator('[data-place=atlantic]')).toBeDisabled();
  await page.locator('summary').filter({ hasText: '¿Ya puedo usar Milanko?' }).click();
  await expect(page.locator('#preguntas details[open]')).toContainText('practicar');
  await expect(page.locator('[data-invitation]')).toBeHidden();
  await page.locator('.static-case summary').click();
  await expect(page.locator('.static-case a')).toBeVisible();
  await expect(page.locator('[data-invitation]')).toBeVisible();
  await context.close();
});
test('observatory destinations work with keyboard and without script', async ({ page, browser }) => {
  await page.goto('/#evidencia');
  const name = page.locator('.discovery-milanko .discovery-name');
  await expect(name).toHaveCSS('opacity', '0');
  const telescope = page.locator('#observatory-field').getByRole('button', { name: 'Usar la lupa' });
  await telescope.click();
  await expect(page.locator('#observatory-field')).toHaveClass(/is-active/);
  const milanko = page.getByRole('button', { name: 'Tengo una pregunta', exact: true });
  await milanko.focus();
  await expect(name).toHaveCSS('opacity', '1');
  await milanko.press('Enter');
  await expect(milanko).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#discovery-title')).toHaveText('Tengo una pregunta');
  await expect(page.locator('.observatory-detail')).toBeInViewport();
  await expect(page.locator('.observatory-detail a')).toHaveAttribute('href', 'https://milanko.hexalis.org/app/ask');
  await page.locator('#preguntas').evaluate(element => element.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await expect(page.locator('.observatory-detail')).toBeHidden();
  await page.locator('#observatory-field').evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await expect(page.locator('.observatory-detail')).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar descubrimiento' }).click();
  await expect(page.locator('.observatory-detail')).toBeHidden();
  await expect(milanko).toBeFocused();
  const noScript = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noScript.newPage();
  await staticPage.goto('http://127.0.0.1:4321/#evidencia');
  await expect(staticPage.locator('#telescope-toggle')).toBeHidden();
  await expect(staticPage.locator('#discovery-title')).toHaveText('Globo 3D');
  await expect(staticPage.locator('.module-list details')).toHaveCount(4);
  await noScript.close();
});
test('English route translates the journey and keeps language navigation', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Explore Earthas a detective.');
  await expect(page.getByRole('link', { name: 'ES', exact: true })).toHaveAttribute('href', '/');
  await solveRainfallCase(page);
  await page.getByRole('button', { name: 'Hurricane', exact: false }).click();
  await expect(page.locator('#place-description')).toContainText('Atlantic');
  await page.getByRole('button', { name: 'I have a question', exact: true }).click();
  await expect(page.locator('.observatory-detail a')).toHaveAttribute('href', 'https://milanko.hexalis.org/app/ask');
});
