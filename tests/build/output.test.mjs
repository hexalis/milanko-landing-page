import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

test('Spanish and English routes, local resources and alternates exist', async () => {
  for (const route of ['dist/index.html', 'dist/en/index.html', 'dist/404.html']) {
    const html = await readFile(route, 'utf8');
    assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1);
    assert.match(html, route.includes('/en/') ? /<html lang="en"/ : /<html lang="es"/);
    assert.match(html, /Milanko/);
    assert.doesNotMatch(html, /ABC Astro|\/landing\/saas/);
    if (!route.endsWith('/404.html')) {
      assert.match(html, /hreflang="es"/);
      assert.match(html, /hreflang="en"/);
      assert.match(html, /href="\/(?:en\/)?"/);
      assert.ok(html.indexOf('class="closing') < html.indexOf('id="preguntas"'));
    }
    assert.match(html, /name="robots" content="noindex, follow"/);
    for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      const url = new URL(href.replaceAll('&amp;', '&'), 'https://example.com');
      await access('dist' + url.pathname + (url.pathname.endsWith('/') ? 'index.html' : ''));
      if (route.endsWith('/index.html') && url.hash && url.pathname === (route.includes('/en/') ? '/en/' : '/')) assert.ok(html.includes('id="' + url.hash.slice(1) + '"'));
    }
  }
});
