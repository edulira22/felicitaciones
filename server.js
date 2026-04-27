const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

const sigSub = (o) => o === 'condolencias' ? 'Con sentido pésame' : o === 'extraordinaria' ? 'Sinceras felicitaciones' : 'Con mucho cariño';
const occClass = (o) => o === 'condolencias' ? 'is-cond' : o === 'extraordinaria' ? 'is-extra' : '';
const photo = (src) => src ? '' : '<div class="ph-placeholder">Foto</div>';
const bgPhoto = (src) => src
  ? `background-image:url('${src}');background-size:cover;background-position:center`
  : '';
const star = (size, x, y, op, rot = 0) => `<svg class="star" style="left:${x}px;top:${y}px;width:${size}px;height:${size}px;opacity:${op};transform:rotate(${rot}deg)" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1 L14.5 9 L23 12 L14.5 15 L12 23 L9.5 15 L1 12 L9.5 9 Z"/></svg>`;

function constelacion(d, occ) {
  const ey = occ === 'condolencias' ? 'En memoria de' : occ === 'extraordinaria' ? 'Una ocasión para celebrar' : null;
  return `<div class="card tpl-constelacion ${occClass(occ)}">
  <div class="starfield"></div><div class="grain"></div>
  ${star(38,90,260,.9)}${star(22,180,360,.55,20)}${star(30,920,290,.8,15)}${star(18,860,420,.5)}
  ${star(26,100,1080,.7,30)}${star(36,940,1120,.85,-10)}${star(20,140,1540,.55)}${star(28,900,1580,.7,45)}
  ${star(16,500,180,.4)}${star(14,580,1780,.4)}
  <div class="ornament-top"><span class="line"></span><span class="dot"></span><span class="line"></span></div>
  ${ey ? `<div class="eyebrow">${ey}</div>` : ''}
  <div class="headline">${d.headline}</div>
  <div class="photo-ring"><div class="photo-frame" style="${bgPhoto(d.photo)}">${photo(d.photo)}</div></div>
  <div class="name">${d.name || 'Nombre Apellido'}</div>
  <div class="name-rule"><span class="l"></span><span class="s">★</span><span class="l"></span></div>
  <div class="message">${d.message}</div>
  <div class="signature"><div class="sig-name">${d.signName}</div><div class="sig-sub">${sigSub(occ)}</div></div>
  <div class="vignette"></div>
</div>`;
}

function atelier(d, occ) {
  const ey = occ === 'condolencias' ? 'In Memoriam' : occ === 'extraordinaria' ? 'Una Ocasión Memorable' : 'Una Felicitación Para';
  return `<div class="card tpl-atelier ${occClass(occ)}">
  <div class="paper-tex"></div>
  <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
  <div class="eyebrow">${ey}</div>
  <div class="headline">${d.headline}</div>
  <div class="divider"><span class="l"></span><span class="d"></span><span class="l"></span></div>
  <div class="photo-frame" style="${bgPhoto(d.photo)}">${photo(d.photo)}</div>
  <div class="name">${d.name || 'Nombre Apellido'}</div>
  <div class="message">"${d.message}"</div>
  <div class="signature"><div class="sig-name">${d.signName}</div><div class="sig-sub">${sigSub(occ)}</div></div>
</div>`;
}

function editorial(d, occ) {
  const num = occ === 'condolencias' ? '∞' : occ === 'extraordinaria' ? '★' : 'N°';
  const ml = occ === 'condolencias' ? 'Homenaje · En Memoria' : occ === 'extraordinaria' ? 'Honor al Mérito' : 'Día Especial';
  const mr = occ === 'condolencias' ? 'Con respeto' : occ === 'extraordinaria' ? 'Edición especial' : 'Edición íntima';
  const cl = occ === 'condolencias' ? 'En memoria de' : 'Dedicado a';
  const words = (d.headline || '').split(' ');
  const mid = Math.ceil(words.length / 2);
  return `<div class="card tpl-editorial ${occClass(occ)}">
  <div class="grain"></div>
  <div class="masthead"><div class="left">${ml}</div><div class="right">${mr}</div></div>
  <div class="number">${num}<small></small></div>
  <div class="headline">${words.slice(0,mid).join(' ')}<br><em>${words.slice(mid).join(' ')}</em></div>
  <div class="photo-frame" style="${bgPhoto(d.photo)}">${photo(d.photo)}</div>
  <div class="photo-caption">
    <div class="cap-label">${cl}</div>
    <div class="cap-name">${d.name || 'Nombre Apellido'}</div>
    <div class="cap-text">"${d.message}"</div>
  </div>
  <div class="folio">
    <div><div class="sig">${d.signName}</div><div class="sig-sub">${sigSub(occ)}</div></div>
    <div class="meta">Morelia · Michoacán<br>MMXXVI</div>
  </div>
</div>`;
}

function retrato(d, occ) {
  const ey = occ === 'condolencias' ? 'Descanse en paz' : occ === 'extraordinaria' ? 'Una distinción merecida' : 'Hoy celebramos a';
  const tag = occ === 'condolencias' ? 'HOMENAJE' : occ === 'extraordinaria' ? 'ENHORABUENA' : 'FELICITACIÓN';
  return `<div class="card tpl-retrato ${occClass(occ)}">
  <div class="photo-full" style="${bgPhoto(d.photo)}">${photo(d.photo)}</div>
  <div class="scrim"></div>
  <div class="corner-deco">
    <div class="cd-l"><span class="bar"></span><span class="tx">${tag}</span></div>
    <div class="cd-r">Michoacán<br>MMXXVI</div>
  </div>
  <div class="headline">${d.headline}</div>
  <div class="bottom-block">
    <div class="eyebrow">${ey}</div>
    <div class="name">${d.name || 'Nombre Apellido'}</div>
    <div class="message">${d.message}</div>
    <div class="signature">
      <div><div class="sig-name">${d.signName}</div></div>
      <div class="sig-sub">${sigSub(occ)}</div>
    </div>
  </div>
</div>`;
}

const TPLS = { constelacion, atelier, editorial, retrato };

app.post('/render', async (req, res) => {
  const { template, occasion, name, headline, message, signName, photo: photoData } = req.body;
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8');
  const cardHtml = (TPLS[template] || constelacion)({ name, headline, message, signName, photo: photoData }, occasion);

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Allura&family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Serif+Display&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}html,body{margin:0;padding:0;width:1080px;height:1920px;overflow:hidden;background:#0e0e10;font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased}
.card{border-radius:0!important}
${css}</style></head><body>${cardHtml}</body></html>`;

  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 1000));
    const shot = await page.screenshot({ type: 'png', clip: { x:0, y:0, width:1080, height:1920 } });
    res.setHeader('Content-Type', 'image/png');
    res.send(shot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(3001, () => console.log('✓ Render server listo → http://localhost:3001'));
