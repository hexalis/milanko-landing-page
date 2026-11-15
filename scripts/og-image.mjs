// Renders the 1200×630 social preview images into public/. Run with `npm run og` after changing the copy below.
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

// Inlined as data URIs: a page created with setContent cannot load file:// resources.
const types = { '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const asset = (path) => `data:${types[extname(path)]};base64,${readFileSync(path).toString('base64')}`;
const font = (pkg, file) => asset(`node_modules/@fontsource/${pkg}/files/${file}`);

const variants = [
  { file: 'public/og-es.png', lang: 'es', line1: 'Explora la Tierra', line2: 'como detective.', motto: 'Observa. Pregunta. Comprueba.', tag: 'TIERRA · 23.5°' },
  { file: 'public/og-en.png', lang: 'en', line1: 'Explore Earth', line2: 'as a detective.', motto: 'Observe. Ask. Verify.', tag: 'EARTH · 23.5°' },
];

const page = (v) => `<!doctype html><html lang="${v.lang}"><head><meta charset="utf-8"><style>
@font-face{font-family:Plex;font-weight:500;src:url(${font('ibm-plex-sans', 'ibm-plex-sans-latin-500-normal.woff2')})}
@font-face{font-family:SourceSerif;font-weight:400;src:url(${font('source-serif-4', 'source-serif-4-latin-400-normal.woff2')})}
@font-face{font-family:Mono;font-weight:500;src:url(${font('jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2')})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;overflow:hidden;position:relative;color:#fff;font-family:Plex;
  background:#080c18 url(${asset('public/textures/milky-way.jpg')}) center/cover}
body::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#080c18 38%,rgba(8,12,24,.55) 70%,rgba(8,12,24,.2))}
.earth{position:absolute;width:640px;height:640px;right:-150px;top:-5px;border-radius:50%;
  background:url(${asset('public/textures/earth-day.jpg')}) 28% 50%/auto 100%;
  box-shadow:0 0 0 2px rgba(139,213,255,.35),0 0 80px 10px rgba(139,213,255,.28),inset -150px -40px 160px rgba(0,0,0,.92),inset 20px 10px 60px rgba(139,213,255,.25)}
.copy{position:absolute;left:72px;top:72px;bottom:64px;display:flex;flex-direction:column}
img{width:250px;height:auto}
.tag{font:500 15px Mono;letter-spacing:.14em;color:#b4bdd2;margin-top:auto}
h1{font-weight:500;font-size:84px;line-height:1.04;letter-spacing:-.05em;margin-top:18px}
h1 span{color:#ff8a4c}
p{font:400 28px SourceSerif;color:#dce1e8;margin-top:22px}
</style></head><body><div class="earth"></div><div class="copy">
<img src="${asset('public/imagotipo-horizontal.svg')}" alt="">
<div class="tag">${v.tag}</div><h1>${v.line1}<br><span>${v.line2}</span></h1><p>${v.motto}</p>
</div></body></html>`;

const browser = await chromium.launch();
try {
  const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const v of variants) {
    await tab.setContent(page(v), { waitUntil: 'load' });
    await tab.evaluate(() => document.fonts.ready);
    await tab.screenshot({ path: v.file, type: 'png' });
    console.log(`wrote ${v.file}`);
  }
} finally {
  await browser.close();
}
