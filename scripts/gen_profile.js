// Generates the GitHub profile README art (SVGs) in the flick.systems style.
// usage: node gen_profile.js <path-to-flick-index.html> <out-assets-dir>
const fs = require('fs'), path = require('path');
const [, , SRC, OUT] = process.argv;
fs.mkdirSync(OUT, { recursive: true });

/* ---------- reuse the carousel's icon drawings from flick.systems ---------- */
const html = fs.readFileSync(SRC, 'utf8');
const a = html.indexOf('  var ICON_TINT'), b = html.indexOf('  function initSchematic');
function rectSegs(x1, y1, x2, y2) { return [[x1, y1, x2, y1], [x2, y1, x2, y2], [x2, y2, x1, y2], [x1, y2, x1, y1]]; }
function circleSegs(cx, cy, r, n) { const s = []; for (let i = 0; i < n; i++) { const p = i / n * 6.283, q = (i + 1) / n * 6.283; s.push([cx + Math.cos(p) * r, cy + Math.sin(p) * r, cx + Math.cos(q) * r, cy + Math.sin(q) * r]); } return s; }
function arcSegs(cx, cy, r, a0, a1, n) { const s = []; for (let i = 0; i < n; i++) { const p = a0 + (a1 - a0) * i / n, q = a0 + (a1 - a0) * (i + 1) / n; s.push([cx + Math.cos(p) * r, cy + Math.sin(p) * r, cx + Math.cos(q) * r, cy + Math.sin(q) * r]); } return s; }
const ICONS = new Function('rectSegs', 'circleSegs', 'arcSegs', html.slice(a, b) + '\nreturn ICONS;')(rectSegs, circleSegs, arcSegs);
// one extra for the services panel: a browser window
ICONS.browser = () => rectSegs(-0.95, -0.75, 0.95, 0.75).concat([[-0.95, -0.4, 0.95, -0.4]],
  circleSegs(-0.78, -0.58, 0.07, 6), circleSegs(-0.6, -0.58, 0.07, 6), circleSegs(-0.42, -0.58, 0.07, 6),
  rectSegs(-0.75, -0.2, 0.05, 0.5), [[0.25, -0.2, 0.75, -0.2], [0.25, 0.05, 0.75, 0.05], [0.25, 0.3, 0.6, 0.3]]);

// dots evenly along an icon's strokes, so the static art looks crisp
function iconDots(name, cx, cy, S, pitch) {
  const pts = [];
  for (const g of ICONS[name]()) {
    const x1 = cx + g[0] * S, y1 = cy + g[1] * S, x2 = cx + g[2] * S, y2 = cy + g[3] * S;
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / pitch));
    for (let i = 0; i <= n; i++) {
      const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n;
      if (!pts.some(p => Math.hypot(p[0] - x, p[1] - y) < pitch * 0.6)) pts.push([x, y]);
    }
  }
  return pts;
}

/* ---------- a 5x7 dot-matrix font (the Doto look, as plain circles) ---------- */
const F = {
  A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
  0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
  2: '01110 10001 00001 00010 00100 01000 11111', 3: '11110 00001 00001 01110 00001 00001 11110',
  4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
  6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
  8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
  _: '00000 00000 00000 00000 00000 00000 11111', '[': '01110 01000 01000 01000 01000 01000 01110',
  ']': '01110 00010 00010 00010 00010 00010 01110', '.': '00000 00000 00000 00000 00000 01100 01100',
  '/': '00001 00010 00010 00100 01000 01000 10000', '-': '00000 00000 00000 11111 00000 00000 00000',
  '>': '01000 00100 00010 00001 00010 00100 01000', '&': '01100 10010 10100 01000 10101 10010 01101',
  ' ': '00000 00000 00000 00000 00000 00000 00000'
};
// dots for a line of text; returns {dots, width}
function dotText(text, x0, y0, pitch, track = 1) {
  const dots = []; let x = x0;
  for (const ch of text.toUpperCase()) {
    const rows = (F[ch] || F[' ']).split(' ');
    rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === '1') dots.push([x + i * pitch, y0 + j * pitch]); }));
    x += (5 + track) * pitch;
  }
  return { dots, width: x - x0 - track * pitch };
}
const textWidth = (t, pitch, track = 1) => t.length * (5 + track) * pitch - track * pitch;

const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";
const G = '#3dff8a', G2 = '#2fbf6a', INK = '#e9f2ec', MUTE = '#7f9c89', RULE = '#173a22', BAR = '#0d2414';
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const circles = (pts, r, extra = '') => pts.map(p => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}"${extra}/>`).join('');
const scan = (w, h) => `<defs><pattern id="sl" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#fff" opacity=".035"/></pattern></defs><rect width="${w}" height="${h}" fill="url(#sl)" class="scan"/>`;
const write = (name, svg) => { fs.writeFileSync(path.join(OUT, name), svg.replace(/\n\s*/g, '\n')); console.log('wrote', name, (svg.length / 1024).toFixed(1) + 'KB'); };
const COMMON_CSS = `
.scan{animation:flick 7s steps(1) infinite}
@keyframes flick{0%,100%{opacity:1}46%{opacity:.5}47%{opacity:1}81%{opacity:.75}82%{opacity:1}}
.cur{animation:blink 1.05s steps(1) infinite}@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

/* ---------- hero ---------- */
(function hero() {
  const W = 1200, H = 470;
  const big = dotText('FLICK', 0, 0, 22), small = dotText('SYSTEMS', 0, 0, 9.5, 2.2);
  const bx = (W - big.width) / 2, by = 120, sx = (W - small.width) / 2, sy = by + 7 * 22 + 30;
  const bigDots = big.dots.map(p => [p[0] + bx, p[1] + by]), smallDots = small.dots.map(p => [p[0] + sx, p[1] + sy]);
  // each dot twinkles on its own rhythm
  const tw = (pts, r) => pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" style="animation-delay:-${((i * 0.37) % 3).toFixed(2)}s"/>`).join('');
  // background: faint dot field, and a few columns of falling binary
  let field = '';
  for (let y = 18; y < H; y += 18) for (let x = 18; x < W; x += 18) field += `<circle cx="${x}" cy="${y}" r="1"/>`;
  let rain = '';
  const cols = [70, 150, 245, 330, 905, 990, 1075, 1150];
  cols.forEach((x, k) => {
    let col = ''; for (let j = 0; j < 28; j++) col += `<text x="${x}" y="${j * 22}">${(k * 7 + j * 3) % 5 < 2 ? 1 : 0}</text>`;
    rain += `<g class="rain" style="animation-duration:${6 + (k % 4) * 1.7}s;animation-delay:-${k * 1.3}s" fill="${k % 3 === 2 ? '#4cc9ff' : G}">${col}</g>`;
  });
  write('hero.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Flick Systems — Jason Flick">
<style>${COMMON_CSS}
.tw circle{animation:tw 3s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.55}}
.rain{animation:fall linear infinite;opacity:.22}@keyframes fall{from{transform:translateY(-616px)}to{transform:translateY(${H}px)}}
.gl{animation:gl 5.5s steps(1) infinite;mix-blend-mode:screen}
.gr{animation:gr 5.5s steps(1) infinite;mix-blend-mode:screen}
@keyframes gl{0%,88%,100%{transform:translate(0,0);opacity:0}89%{transform:translate(-7px,0);opacity:.9}91%{transform:translate(5px,2px);opacity:.9}93%{transform:translate(-3px,0);opacity:.9}94%{opacity:0}}
@keyframes gr{0%,88%,100%{transform:translate(0,0);opacity:0}89%{transform:translate(7px,0);opacity:.9}91%{transform:translate(-5px,-2px);opacity:.9}93%{transform:translate(3px,0);opacity:.9}94%{opacity:0}}
.tear{animation:tear 5.5s steps(1) infinite}@keyframes tear{0%,88%,100%{transform:translateX(0)}89%{transform:translateX(26px)}91%{transform:translateX(-18px)}93%{transform:translateX(0)}}
text{font-family:${MONO}}
</style>
<rect width="${W}" height="${H}" rx="18" fill="#000"/>
<g fill="#fff" opacity=".07">${field}</g>
<g font-size="15" font-weight="700">${rain}</g>
<g fill="${G2}" font-size="13"><circle cx="34" cy="34" r="6" fill="#ff5f57"/><circle cx="56" cy="34" r="6" fill="#febc2e"/><circle cx="78" cy="34" r="6" fill="#28c840"/>
<text x="100" y="39" fill="${MUTE}">flick.systems // github</text></g>
<g font-size="13" fill="${G}" text-anchor="end"><text x="${W - 30}" y="39">root@flick:~$ ./run profile</text><text x="${W - 30}" y="58" fill="${G2}">pts 16000  sig 0x3FA2</text></g>
<g class="tear">
<g class="gl" fill="#ff2d78">${circles(bigDots, 8.2)}${circles(smallDots, 3.5)}</g>
<g class="gr" fill="#00f0ff">${circles(bigDots, 8.2)}${circles(smallDots, 3.5)}</g>
<g class="tw" fill="${INK}">${tw(bigDots, 8.2)}${tw(smallDots, 3.5)}</g>
</g>
<text x="${W / 2}" y="${H - 58}" text-anchor="middle" font-size="19" fill="${G}">&gt; JASON FLICK // DESIGNER → DEVELOPER // FOUNDER, HEXA TECHNOLOGIES // OKLAHOMA<tspan class="cur"> ▌</tspan></text>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="18" fill="none" stroke="${RULE}"/>
${scan(W, H)}
</svg>`);
})();

/* ---------- nav buttons ---------- */
[['portfolio', 'PORTFOLIO', 'chaos.flick.systems'], ['studio', 'STUDIO', 'flick.systems'],
 ['resume', 'RÉSUMÉ', 'flick.systems/resume'], ['linkedin', 'LINKEDIN', 'connect']].forEach(([id, label, sub]) => {
  const W = 270, H = 76;
  write(`nav-${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
<style>text{font-family:${MONO}}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="${(H - 2) / 2}" fill="#000" stroke="${G}" stroke-width="2"/>
<text x="${W / 2}" y="34" text-anchor="middle" font-size="18" font-weight="700" fill="${G}" letter-spacing="2">${label} ↗</text>
<text x="${W / 2}" y="55" text-anchor="middle" font-size="13" fill="${MUTE}">${sub}</text>
</svg>`);
});

/* ---------- section bars ---------- */
[['about', '[00_ABOUT]'], ['work', '[01_SELECTED_WORK]'], ['toolbox', '[02_TOOLBOX]'], ['services', '[03_SERVICES]']].forEach(([id, t]) => {
  const W = 1200, H = 84, pitch = 5;
  const tx = dotText(t, 34, (H - 6 * pitch) / 2, pitch);
  write(`h-${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${t}">
<style>${COMMON_CSS}</style>
<rect width="${W}" height="${H}" rx="10" fill="${BAR}"/><rect width="8" height="${H}" rx="3" fill="${G}"/>
<g fill="${G}">${circles(tx.dots, 2.1)}</g>
<rect x="${34 + tx.width + 14}" y="${(H - 6 * pitch) / 2}" width="${pitch * 3}" height="${pitch * 6.5}" fill="${G}" class="cur"/>
${scan(W, H)}
</svg>`);
});

/* ---------- project cards ---------- */
function wrap(s, n) { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } if (line) out.push(line); return out; }
function chips(list, x, y, size) {
  let cx = x, svg = '';
  for (const c of list) {
    const w = c.length * size * 0.62 + 22;
    svg += `<rect x="${cx}" y="${y}" width="${w.toFixed(0)}" height="${size + 14}" rx="${(size + 14) / 2}" fill="none" stroke="${RULE}" stroke-width="1.5"/><text x="${(cx + w / 2).toFixed(0)}" y="${y + size + 3}" text-anchor="middle" font-size="${size}" fill="${INK}">${esc(c)}</text>`;
    cx += w + 8;
  }
  return svg;
}
const PROJECTS = [
  ['industrial', 'sparkle', 'Industrial Cleaning Services', 'Marketing site, online booking system, and admin CRM with SMS notifications.', ['Next.js', 'Supabase', 'Twilio'], 'industrial-cleaning-services.vercel.app'],
  ['campmack', 'cookie', 'Camp Mack Cookie Co.', 'Brand and online ordering for an Arkansas cookie bakery.', ['Next.js', 'TypeScript', 'Tailwind'], 'campmackcookies.vercel.app'],
  ['dillyrays', 'bus', "Dilly Ray's Sweet Heat", 'BBQ food truck site with online ordering, themed around the double-decker bus.', ['Next.js', 'Supabase'], 'dilly-rays-sweet-heat.vercel.app'],
  ['taxguy', 'dollar', 'Tax Guy OKC', 'Site for an Oklahoma City tax and bookkeeping practice run by a former IRS agent.', ['HTML', 'CSS'], 'taxguyokc.vercel.app'],
  ['r3dpill', 'pill', 'R3DPILL AI', 'AI studio landing page with an animated hero and motion graphics.', ['Next.js', 'TypeScript'], 'r3dpill-ai.vercel.app'],
  ['automax', 'car', 'AutoMax Auto Group', 'Premium car dealership website concept with inventory presentation.', ['React', 'Vite'], 'automax-eosin.vercel.app']
];
PROJECTS.forEach(([id, icon, title, desc, stack, domain]) => {
  const W = 600, H = 300, red = icon === 'pill', ic = red ? '#ff4250' : G;
  const box = 150, bx = 26, byy = 26, cx = bx + box / 2, cy = byy + box / 2;
  const dots = iconDots(icon, cx, cy, 52, 5.2);
  const lines = wrap(desc, 27);
  const ttl = title.length > 22 ? 22 : 26;
  write(`card-${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}: ${esc(desc)}">
<style>${COMMON_CSS}
text{font-family:${MONO}}
.ic circle{animation:tw 3.2s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.5}}
.led{animation:led 1.6s ease-in-out infinite}@keyframes led{50%{opacity:.35}}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="#050b07" stroke="${RULE}" stroke-width="2"/>
<rect x="${bx}" y="${byy}" width="${box}" height="${box}" rx="12" fill="#000" stroke="${RULE}" stroke-width="2"/>
${[-1, 0, 1].map(q => `<line x1="${cx + q * 34}" y1="${byy - 10}" x2="${cx + q * 34}" y2="${byy}" stroke="${RULE}" stroke-width="3"/><line x1="${cx + q * 34}" y1="${byy + box}" x2="${cx + q * 34}" y2="${byy + box + 10}" stroke="${RULE}" stroke-width="3"/>`).join('')}
<g class="ic" fill="${ic}">${dots.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.3" style="animation-delay:-${((i * 0.29) % 3.2).toFixed(2)}s"/>`).join('')}</g>
<text x="200" y="62" font-size="${ttl}" font-weight="700" fill="${INK}">${esc(title)}</text>
${lines.map((l, i) => `<text x="200" y="${100 + i * 28}" font-size="20" fill="#a9c4b2">${esc(l)}</text>`).join('')}
${chips(stack, 26, 210, 16)}
<circle cx="34" cy="${H - 34}" r="5" fill="${G}" class="led"/>
<text x="48" y="${H - 29}" font-size="15" fill="${G}">LIVE // ${esc(domain)} ↗</text>
${scan(W, H)}
</svg>`);
});

/* ---------- toolbox ---------- */
(function toolbox() {
  const W = 1200, H = 250;
  const rows = [['BUILD', ['TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Supabase', 'Stripe', 'Vercel', 'Cloudflare', 'Resend', 'Twilio']],
                ['DESIGN', ['Adobe Creative Cloud', 'Photoshop', 'Lightroom', 'Firefly', 'Brand identity', 'Logo design', 'Motion design']],
                ['AI', ['Claude', 'Prompt architecture', 'Custom assistants', 'AI-assisted workflows']]];
  let body = '';
  rows.forEach(([k, list], i) => {
    const y = 34 + i * 70;
    body += `<text x="34" y="${y + 22}" font-size="16" font-weight="700" fill="${G}">${k}:</text>${chips(list, 150, y, 15)}`;
    if (i < rows.length - 1) body += `<line x1="34" y1="${y + 50}" x2="${W - 34}" y2="${y + 50}" stroke="${RULE}"/>`;
  });
  write('toolbox.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Toolbox">
<style>${COMMON_CSS}text{font-family:${MONO}}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="#050b07" stroke="${RULE}" stroke-width="2"/>
${body}
${scan(W, H)}
</svg>`);
})();

/* ---------- services ---------- */
(function services() {
  const W = 1200, H = 300, cw = (W - 34 * 2 - 3 * 20) / 4;
  const items = [['chaos', 'BRAND IDENTITY', ['Logos, marks, and', 'full visual systems.']],
                 ['browser', 'WEBSITES', ['Designed and coded by', 'one person: nothing', 'lost in handoff.']],
                 ['hub', 'BUSINESS TOOLS', ['Booking, ordering,', 'admin dashboards, SMS', 'and email automations.']],
                 ['sparkle', 'AI INTEGRATION', ['Custom assistants and', 'workflows for small', 'businesses.']]];
  let body = '';
  items.forEach(([icon, t, lines], i) => {
    const x = 34 + i * (cw + 20);
    body += `<rect x="${x}" y="24" width="${cw.toFixed(0)}" height="${H - 48}" rx="12" fill="#000" stroke="${RULE}" stroke-width="2"/>`;
    body += `<g class="ic" fill="${G}">${iconDots(icon, x + cw / 2, 90, 40, 4.6).map((p, j) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2" style="animation-delay:-${((j * 0.31) % 3.2).toFixed(2)}s"/>`).join('')}</g>`;
    body += `<text x="${(x + cw / 2).toFixed(0)}" y="170" text-anchor="middle" font-size="17" font-weight="700" fill="${INK}" letter-spacing="1">${t}</text>`;
    lines.forEach((l, j) => body += `<text x="${(x + cw / 2).toFixed(0)}" y="${202 + j * 24}" text-anchor="middle" font-size="16" fill="#a9c4b2">${esc(l)}</text>`);
  });
  write('services.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Services: brand identity, websites, business tools, AI integration">
<style>${COMMON_CSS}text{font-family:${MONO}}
.ic circle{animation:tw 3.2s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.5}}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="#050b07" stroke="${RULE}" stroke-width="2"/>
${body}
${scan(W, H)}
</svg>`);
})();

/* ---------- footer ---------- */
(function footer() {
  const W = 1200, H = 170, pitch = 4.4;
  const t = dotText('OPEN FOR FREELANCE WORK', 0, 0, pitch);
  const tx = (W - t.width) / 2;
  write('footer.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Open for freelance work: chaos.flick.systems">
<style>${COMMON_CSS}text{font-family:${MONO}}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="16" fill="#000" stroke="${RULE}" stroke-width="2"/>
<g fill="${G}">${circles(t.dots.map(p => [p[0] + tx, p[1] + 46]), 1.9)}</g>
<text x="${W / 2}" y="124" text-anchor="middle" font-size="17" fill="${INK}">→ chaos.flick.systems  ·  flick.systems/resume  ·  jasonflick333@gmail.com<tspan class="cur" fill="${G}"> ▌</tspan></text>
${scan(W, H)}
</svg>`);
})();
