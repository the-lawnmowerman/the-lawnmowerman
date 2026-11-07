// Generates the GitHub profile README art (SVGs): the "HUD / spec sheet" look.
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
ICONS.browser = () => rectSegs(-0.95, -0.75, 0.95, 0.75).concat([[-0.95, -0.4, 0.95, -0.4]],
  circleSegs(-0.78, -0.58, 0.07, 6), circleSegs(-0.6, -0.58, 0.07, 6), circleSegs(-0.42, -0.58, 0.07, 6),
  rectSegs(-0.75, -0.2, 0.05, 0.5), [[0.25, -0.2, 0.75, -0.2], [0.25, 0.05, 0.75, 0.05], [0.25, 0.3, 0.6, 0.3]]);

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

/* ---------- 5x7 dot-matrix glyphs for the wordmark ---------- */
const F = {
  F: '11111 10000 10000 11110 10000 10000 10000', L: '10000 10000 10000 10000 10000 10000 11111',
  I: '11111 00100 00100 00100 00100 00100 11111', C: '01110 10001 10000 10000 10000 10001 01110',
  K: '10001 10010 10100 11000 10100 10010 10001', S: '01111 10000 10000 01110 00001 00001 11110',
  Y: '10001 10001 01010 00100 00100 00100 00100', T: '11111 00100 00100 00100 00100 00100 00100',
  E: '11111 10000 10000 11110 10000 10000 11111', M: '10001 11011 10101 10101 10001 10001 10001'
};
function dotWord(word, pitch, gap) {
  const dots = [], adv = 5 * pitch + gap;
  [...word].forEach((ch, c) => F[ch].split(' ').forEach((r, j) => [...r].forEach((v, i) => { if (v === '1') dots.push([c * adv + i * pitch, j * pitch]); })));
  return { dots, width: (word.length - 1) * adv + 4 * pitch };
}

/* ---------- palette (from the mockup) ---------- */
const G = '#00e676', MAG = '#ff2a85', CY = '#00f0ff';
const BG = '#080c11', PANEL = '#0b1017', CARD = '#0a0f15', LINE = '#23312d', RULE = '#1c262b', HEAD = '#071d14';
const INK = '#e6edf3', BODY = '#adbac7', MUTE = '#7d8590', CHIP = '#161b22', CHIPLINE = '#30363d';
const MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n1 = v => +v.toFixed(1);
const write = (name, svg) => { fs.writeFileSync(path.join(OUT, name), svg.replace(/\n\s*/g, '\n')); console.log('wrote', name, (svg.length / 1024).toFixed(1) + 'KB'); };
const CSS = `
text{font-family:${MONO}}
.sans{font-family:${SANS}}
.led{animation:led 2.4s ease-in-out infinite}@keyframes led{0%,100%{opacity:1}50%{opacity:.35}}
.cur{animation:blink 1.1s steps(1) infinite}@keyframes blink{50%{opacity:0}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}`;
const grid = (id, w, h, x = 0, y = 0) => `<defs><pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#fff" stroke-opacity=".035"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id})"/>`;
// a terminal title bar: [LABEL] ▋ on the left, ——— [TAG] on the right
const headBar = (label, tag, W, y = 0, h = 46) => `
<rect x="2" y="${y + 2}" width="${W - 4}" height="${h - 2}" fill="${HEAD}"/>
<rect x="2" y="${y + 2}" width="5" height="${h - 2}" fill="${G}"/>
<line x1="2" y1="${y + h}" x2="${W - 2}" y2="${y + h}" stroke="#1c2e26"/>
<text x="24" y="${y + h / 2 + 7}" fill="${G}" font-size="17" font-weight="700" letter-spacing="1.5">${label} <tspan class="cur">▋</tspan></text>
<text x="${W - 24}" y="${y + h / 2 + 5}" text-anchor="end" fill="${G}" font-size="12" opacity=".85">—————— ${tag}</text>`;
// pill chips; the first one can be lit
function chips(list, x, y, { size = 10, lit = true, gap = 7 } = {}) {
  let cx = x, svg = '';
  list.forEach((c, i) => {
    const t = c.toUpperCase(), w = t.length * size * 0.62 + 18, on = lit && i === 0;
    svg += `<rect x="${n1(cx)}" y="${y}" width="${n1(w)}" height="${size + 12}" rx="4" fill="${on ? '#0d1c18' : CHIP}" stroke="${on ? G : CHIPLINE}" stroke-opacity="${on ? 0.55 : 1}"/>`
      + `<text x="${n1(cx + w / 2)}" y="${y + size + 3.5}" text-anchor="middle" font-size="${size}" font-weight="${on ? 700 : 500}" fill="${on ? G : '#8b949e'}" letter-spacing=".4">${esc(t)}</text>`;
    cx += w + gap;
  });
  return svg;
}
function wrap(s, n) { const out = []; let line = ''; for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > n) { out.push(line); line = w; } else line = (line + ' ' + w).trim(); } if (line) out.push(line); return out; }
// an icon drawn in dots inside a small lit tile
function iconTile(icon, x, y, s, color = G) {
  const dots = iconDots(icon, x + s / 2, y + s / 2, s * 0.33, s * 0.058);
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="8" fill="#0d1c18" stroke="${color}" stroke-opacity=".38"/>`
    + `<g class="ic" fill="${color}">${dots.map((p, i) => `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${n1(s * 0.022)}" style="animation-delay:-${((i * 0.29) % 3.2).toFixed(2)}s"/>`).join('')}</g>`;
}
// a fake rollover: GitHub images can't see the mouse, so the "hover" state plays on a loop.
// period P seconds, this element's turn starts d seconds in; lit for ~1.5s of the loop.
function roll(P, d, travel = 330) {
  const on = 0.25 / P * 100, hold = 1.5 / P * 100, off = hold + 0.4 / P * 100, sweep = 0.9 / P * 100;
  const p = v => v.toFixed(2) + '%';
  return `
.hov{animation:hov ${P}s ${d}s infinite both}
@keyframes hov{0%{opacity:0}${p(on)},${p(hold)}{opacity:1}${p(off)},100%{opacity:0}}
.arr{animation:arr ${P}s ${d}s infinite both}
@keyframes arr{0%,${p(off)},100%{transform:translate(0,0)}${p(on)},${p(hold)}{transform:translate(3px,-3px)}}
.bar{animation:bar ${P}s ${d}s infinite both;transform-box:fill-box;transform-origin:center}
@keyframes bar{0%,${p(off)},100%{transform:scaleY(1)}${p(on)},${p(hold)}{transform:scaleY(1.45)}}
.shine{animation:shine ${P}s ${d}s infinite both}
@keyframes shine{0%{transform:skewX(-18deg) translateX(0)}${p(sweep)},100%{transform:skewX(-18deg) translateX(${travel}px)}}`;
}
const ICON_CSS =`.ic circle{animation:tw 3.2s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.45}}`;

/* ---------- 1. hero: HUD frame + chromatic dot-matrix wordmark ---------- */
(function hero() {
  const W = 880, H = 290;
  const big = dotWord('FLICK', 11.5, 22), small = dotWord('SYSTEMS', 5.8, 13);
  const bx = (W - big.width) / 2, by = 76, sx = (W - small.width) / 2, sy = by + 6 * 11.5 + 30;
  const B = big.dots.map(p => [p[0] + bx, p[1] + by]), S = small.dots.map(p => [p[0] + sx, p[1] + sy]);
  const layer = (pts, r, dx, dy, fill, op = 1) => pts.map(p => `<circle cx="${n1(p[0] + dx)}" cy="${n1(p[1] + dy)}" r="${r}" fill="${fill}"${op < 1 ? ` opacity="${op}"` : ''}/>`).join('');
  const core = (pts, r) => pts.map((p, i) => `<circle cx="${n1(p[0])}" cy="${n1(p[1])}" r="${r}" style="animation-delay:-${((i * 0.37) % 3).toFixed(2)}s"/>`).join('');
  const cross = [[22, 62], [W - 22, 62], [22, H - 22], [W - 22, H - 22]].map(([x, y]) => `<path d="M${x - 6} ${y}h12M${x} ${y - 6}v12" stroke="#30363d" stroke-width="1.5"/>`).join('');
  write('hud-hero.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="FLICK SYSTEMS: brand architecture, full-stack Next.js, AI production">
<style>${CSS}
.tw circle{animation:tw 3s ease-in-out infinite}@keyframes tw{0%,100%{opacity:1}50%{opacity:.62}}
.ab{animation:ab 6s steps(1) infinite}@keyframes ab{0%,86%,100%{transform:translate(0,0)}87%{transform:translate(-6px,1px)}89%{transform:translate(5px,-1px)}91%{transform:translate(-2px,0)}93%{transform:translate(0,0)}}
.sweep{animation:sw 7s linear infinite}@keyframes sw{from{transform:translateY(40px)}to{transform:translateY(${H}px)}}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${BG}" stroke="${LINE}" stroke-width="2"/>
${grid('g', W - 4, H - 42, 2, 40)}
<rect class="sweep" x="2" y="0" width="${W - 4}" height="2" fill="${G}" opacity=".07"/>
<path d="M2 38V13Q2 2 13 2H${W - 13}Q${W - 2} 2 ${W - 2} 13V38Z" fill="${PANEL}"/>
<line x1="2" y1="38" x2="${W - 2}" y2="38" stroke="${RULE}"/>
<text x="22" y="24" font-size="11"><tspan fill="${G}" font-weight="700">SYS.ID //</tspan><tspan fill="#c9d1d9"> FLICK_SYSTEMS_OS</tspan><tspan fill="${MUTE}">  |  BUILD_2026.11</tspan></text>
<text x="${W - 152}" y="24" text-anchor="end" font-size="11" fill="${MUTE}">LOC // <tspan fill="#c9d1d9">OKC_USA [35.47°N]</tspan></text>
<circle class="led" cx="${W - 136}" cy="20" r="4" fill="${G}"/>
<text x="${W - 22}" y="24" text-anchor="end" font-size="11" font-weight="700" fill="${G}">STATUS // ONLINE</text>
${cross}
<g class="ab">
<g>${layer(B, 3.9, 2.6, 1.5, MAG, 0.85)}${layer(S, 2.1, 1.6, 1, MAG, 0.85)}</g>
<g>${layer(B, 3.9, -2.4, -1.2, CY, 0.85)}${layer(S, 2.1, -1.6, -0.8, CY, 0.85)}</g>
</g>
<g class="tw" fill="#f0f6fc">${core(B, 3.7)}${core(S, 1.9)}</g>
<rect x="${W / 2 - 205}" y="${H - 58}" width="410" height="28" rx="14" fill="#111822" stroke="#22303c"/>
<circle class="led" cx="${W / 2 - 184}" cy="${H - 44}" r="3.5" fill="${G}"/>
<text x="${W / 2 + 8}" y="${H - 40}" text-anchor="middle" font-size="11" fill="#8b949e" letter-spacing=".5">BRAND ARCHITECTURE  /  FULL-STACK NEXT.JS  /  AI PRODUCTION</text>
</svg>`);
})();

/* ---------- 2. docked nav cards ---------- */
[['portfolio', '01', 'NODE', 'PORTFOLIO', 'chaos.flick.systems'], ['studio', '02', 'CORE', 'STUDIO', 'flick.systems'],
 ['resume', '03', 'DOSSIER', 'RÉSUMÉ', 'flick.systems/resume'], ['linkedin', '04', 'NETWORK', 'LINKEDIN', 'connect // direct']].forEach(([id, num, kind, label, sub], i) => {
  const W = 210, H = 84, d = i * 2;   // an 8s loop; each button takes its turn being "hovered"
  write(`hud-nav-${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}: ${sub}">
<style>${CSS}${roll(8, d)}</style>
<defs><clipPath id="c"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="9"/></clipPath>
<linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="${G}" stop-opacity="0"/><stop offset=".5" stop-color="${G}" stop-opacity=".22"/><stop offset="1" stop-color="${G}" stop-opacity="0"/></linearGradient></defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="9" fill="${PANEL}" stroke="${LINE}" stroke-width="1.5"/>
<g class="hov" opacity="0"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="9" fill="${G}" fill-opacity=".07" stroke="${G}" stroke-width="1.5"/></g>
<g clip-path="url(#c)"><rect class="shine" x="-70" y="0" width="70" height="${H}" fill="url(#sh)" transform="skewX(-18)"/></g>
<rect class="bar" x="1" y="16" width="3" height="${H - 32}" rx="1.5" fill="${G}" opacity=".8"/>
<text x="16" y="24" font-size="10" fill="${MUTE}" letter-spacing=".6"><tspan fill="${G}">${num}</tspan> // ${kind}</text>
<text class="arr" x="${W - 14}" y="25" text-anchor="end" font-size="13" fill="${G}">↗</text>
<text x="16" y="52" font-size="15" font-weight="700" fill="${INK}" letter-spacing="1">${label}</text>
<text class="hov" x="16" y="52" font-size="15" font-weight="700" fill="${G}" letter-spacing="1" opacity="0">${label}</text>
<text x="16" y="70" font-size="10.5" fill="${MUTE}">${sub}</text>
</svg>`);
});

/* ---------- 3. [00_ABOUT] bento spec sheet ---------- */
(function about() {
  const W = 880, H = 306, X = 548;
  const spec = [['ROLE', 'Full-Stack &amp; Brand', INK], ['STUDIO', 'Hexa Technologies', INK], ['STACK', 'Next.js · Supabase', G],
                ['DEPLOY', 'Vercel · Stripe · Edge', INK], ['PIPELINE', 'AI-Augmented Prod', INK]];
  let rows = '';
  spec.forEach(([k, v, c], i) => {
    const y = 108 + i * 30;
    rows += `<text x="${X + 24}" y="${y}" font-size="12" fill="${MUTE}">${k.padEnd(9, ' ')}//</text><text x="${W - 26}" y="${y}" text-anchor="end" font-size="12" font-weight="700" fill="${c}">${v}</text>`;
    if (i < spec.length - 1) rows += `<line x1="${X + 24}" y1="${y + 11}" x2="${W - 26}" y2="${y + 11}" stroke="#161f29"/>`;
  });
  write('hud-about.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="00_ABOUT: 25+ years in brand identity and visual design. Now I design and build the whole thing: websites, booking systems, online ordering, and AI-powered tools for small businesses. One person from logo to launch.">
<style>${CSS}
.bar{animation:fill 2.4s cubic-bezier(.16,1,.3,1) .4s both}@keyframes fill{from{transform:scaleX(0)}to{transform:scaleX(1)}}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
${headBar('[00_ABOUT]', '[SYS.BIO // VER 25.0]', W)}
<line x1="${X}" y1="46" x2="${X}" y2="${H - 2}" stroke="${RULE}" stroke-width="1.5"/>
<text x="26" y="78" font-size="11" fill="${MUTE}" letter-spacing="1.5">// OPERATOR PROFILE</text>
<g class="sans" font-size="15.5" fill="${BODY}">
<text class="sans" x="26" y="110">I've spent <tspan fill="#fff" font-weight="700">25+ years in brand identity and visual design</tspan>.</text>
<text class="sans" x="26" y="133">Now I design <tspan fill="${G}" font-weight="700">AND</tspan> build the whole thing: websites, booking</text>
<text class="sans" x="26" y="156">systems, online ordering, and AI-powered tools for</text>
<text class="sans" x="26" y="179">small businesses.</text>
</g>
<rect x="26" y="198" width="496" height="40" rx="7" fill="#0d1c18" stroke="${G}" stroke-opacity=".38"/>
<text x="42" y="223" font-size="13.5" font-weight="700" fill="${G}">&gt; ONE PERSON FROM LOGO TO LAUNCH.</text>
<rect x="424" y="208" width="86" height="20" rx="4" fill="${G}" fill-opacity=".14"/>
<text x="467" y="222" text-anchor="middle" font-size="9.5" font-weight="700" fill="${G}" letter-spacing=".6">END-TO-END</text>
<text x="26" y="264" font-size="12" fill="${MUTE}">I design it, build it with modern AI-assisted</text>
<text x="26" y="282" font-size="12" fill="${MUTE}">workflows, and ship it to production.</text>
<text x="${X + 24}" y="78" font-size="11" fill="${MUTE}" letter-spacing="1.5">// ARCHITECTURE SPECS</text>
<circle class="led" cx="${W - 78}" cy="74" r="3.5" fill="${G}"/>
<text x="${W - 26}" y="78" text-anchor="end" font-size="11" font-weight="700" fill="${G}">READY</text>
${rows}
<text x="${X + 24}" y="${H - 34}" font-size="10" fill="${MUTE}" letter-spacing=".5">DESIGN_TO_PROD_SYNTHESIS</text>
<text x="${W - 26}" y="${H - 34}" text-anchor="end" font-size="10" font-weight="700" fill="${G}">100%</text>
<rect x="${X + 24}" y="${H - 24}" width="${W - X - 50}" height="6" rx="3" fill="${CHIP}"/>
<rect class="bar" x="${X + 24}" y="${H - 24}" width="${W - X - 50}" height="6" rx="3" fill="${G}" style="transform-origin:${X + 24}px 0"/>
</svg>`);
})();

/* ---------- 4. section title bars ---------- */
[['work', '[01_SELECTED_WORK]', '[SHOWING 06 // PROD NODES]']].forEach(([id, label, tag]) => {
  const W = 880, H = 52;
  write(`hud-${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${label}">
<style>${CSS}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="${HEAD}" stroke="${LINE}" stroke-width="2"/>
<rect x="2" y="2" width="5" height="${H - 4}" rx="2" fill="${G}"/>
<text x="24" y="32" fill="${G}" font-size="17" font-weight="700" letter-spacing="1.5">${label} <tspan class="cur">▋</tspan></text>
<text x="${W - 24}" y="31" text-anchor="end" fill="${G}" font-size="12" opacity=".85">—————— ${tag}</text>
</svg>`);
});

/* ---------- 5. project cards: deployment nodes ---------- */
const PROJECTS = [
  ['industrial', 'sparkle', 'PROD', 'Industrial Cleaning Services', 'Marketing site, online booking system, and admin CRM with SMS notifications.', ['Next.js', 'Supabase', 'Twilio']],
  ['campmack', 'cookie', 'PROD', 'Camp Mack Cookie Co.', 'Brand and online ordering for an Arkansas cookie bakery.', ['Next.js', 'TypeScript', 'Tailwind']],
  ['dillyrays', 'bus', 'PROD', "Dilly Ray's Sweet Heat", 'BBQ food truck site with online ordering, themed around the double-decker bus.', ['Next.js', 'Supabase']],
  ['taxguy', 'dollar', 'PROD', 'Tax Guy OKC', 'Site for an Oklahoma City tax and bookkeeping practice run by a former IRS agent.', ['HTML', 'CSS']],
  ['r3dpill', 'pill', 'AI', 'R3DPILL AI', 'AI studio landing page with an animated hero and motion graphics.', ['Next.js', 'TypeScript', 'Motion']],
  ['automax', 'car', 'CONCEPT', 'AutoMax Auto Group', 'Premium car dealership website concept with inventory presentation.', ['React', 'Vite']]
];
PROJECTS.forEach(([id, icon, kind, title, desc, stack], k) => {
  const W = 430, H = 212, red = icon === 'pill', ac = red ? '#ff4250' : G;
  const lines = wrap(desc, 42);
  write(`hud-card-${id}.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}: ${esc(desc)}">
<style>${CSS}${ICON_CSS}${roll(12, 1 + k * 2, 620)}</style>
<defs><clipPath id="c"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10"/></clipPath>
<linearGradient id="sh" x1="0" x2="1"><stop offset="0" stop-color="${ac}" stop-opacity="0"/><stop offset=".5" stop-color="${ac}" stop-opacity=".14"/><stop offset="1" stop-color="${ac}" stop-opacity="0"/></linearGradient></defs>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="${PANEL}" stroke="${LINE}" stroke-width="1.5"/>
<g class="hov" opacity="0"><rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="10" fill="${ac}" fill-opacity=".045" stroke="${ac}" stroke-opacity=".75" stroke-width="1.5"/></g>
<g clip-path="url(#c)"><rect class="shine" x="-120" y="0" width="120" height="${H}" fill="url(#sh)" transform="skewX(-18)"/></g>
<circle class="led" cx="18" cy="19" r="3.5" fill="${G}"/>
<text x="29" y="23" font-size="10.5" font-weight="700" fill="${G}" letter-spacing=".6">NODE_${String(k + 1).padStart(2, '0')} <tspan fill="${MUTE}" font-weight="500">// ${kind}</tspan></text>
<text x="${W - 30}" y="23" text-anchor="end" font-size="10.5" fill="${MUTE}" letter-spacing=".6">DEPLOYED</text>
<text class="hov" x="${W - 30}" y="23" text-anchor="end" font-size="10.5" font-weight="700" fill="${G}" letter-spacing=".6" opacity="0">DEPLOYED</text>
<text class="arr" x="${W - 16}" y="23" text-anchor="end" font-size="11" fill="${G}">↗</text>
<line x1="2" y1="36" x2="${W - 2}" y2="36" stroke="${RULE}"/>
${iconTile(icon, 18, 54, 62, ac)}
<text x="96" y="74" font-size="15" font-weight="700" fill="${INK}">${esc(title)}</text>
${lines.map((l, i) => `<text class="sans" x="96" y="${97 + i * 19}" font-size="13" fill="#8b949e">${esc(l)}</text>`).join('')}
${chips(stack, 18, 168)}
</svg>`);
});

/* ---------- 6. [02_TOOLBOX] ---------- */
(function toolbox() {
  const W = 880, H = 222;
  const rows = [['BUILD', ['TypeScript', 'React', 'Next.js', 'Tailwind', 'Supabase', 'Stripe', 'Vercel', 'Cloudflare', 'Resend', 'Twilio']],
                ['DESIGN', ['Adobe CC', 'Photoshop', 'Lightroom', 'Firefly', 'Brand identity', 'Logo design', 'Motion design']],
                ['AI', ['Claude', 'Prompt architecture', 'Custom assistants', 'AI-assisted workflows']]];
  let body = '';
  rows.forEach(([k, list], i) => {
    const y = 74 + i * 48;
    body += `<text x="26" y="${y + 15}" font-size="12" fill="${MUTE}">${k.padEnd(7, ' ')}//</text>${chips(list, 118, y, { size: 9.5, gap: 6 })}`;
    if (i < rows.length - 1) body += `<line x1="26" y1="${y + 34}" x2="${W - 26}" y2="${y + 34}" stroke="#161f29"/>`;
  });
  write('hud-toolbox.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Toolbox. Build: TypeScript, React, Next.js, Tailwind, Supabase, Stripe, Vercel, Cloudflare, Resend, Twilio. Design: Adobe Creative Cloud, Photoshop, Lightroom, Firefly, brand identity, logo and motion design. AI: Claude, prompt architecture, custom assistants, AI-assisted workflows.">
<style>${CSS}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
${headBar('[02_TOOLBOX]', '[STACK.MANIFEST]', W)}
${body}
</svg>`);
})();

/* ---------- 7. [03_SERVICES] ---------- */
(function services() {
  const W = 880, H = 250, cw = (W - 52 - 3 * 14) / 4;
  const items = [['chaos', 'BRAND IDENTITY', ['Logos, marks, and full', 'visual systems.']],
                 ['browser', 'WEBSITES', ['Designed and coded by one', 'person: nothing lost', 'in handoff.']],
                 ['hub', 'BUSINESS TOOLS', ['Booking, ordering, admin', 'dashboards, SMS and', 'email automations.']],
                 ['sparkle', 'AI INTEGRATION', ['Custom assistants and', 'workflows for small', 'businesses.']]];
  let body = '';
  items.forEach(([icon, t, lines], i) => {
    const x = 26 + i * (cw + 14);
    body += `<rect x="${n1(x)}" y="64" width="${n1(cw)}" height="${H - 88}" rx="9" fill="${PANEL}" stroke="${LINE}" stroke-width="1.5"/>`;
    body += `<text x="${n1(x + 14)}" y="84" font-size="9.5" fill="${MUTE}" letter-spacing=".6"><tspan fill="${G}">0${i + 1}</tspan> // MODULE</text>`;
    body += iconTile(icon, n1(x + 14), 96, 44);
    body += `<text x="${n1(x + 14)}" y="164" font-size="12.5" font-weight="700" fill="${INK}" letter-spacing=".6">${t}</text>`;
    lines.forEach((l, j) => body += `<text class="sans" x="${n1(x + 14)}" y="${184 + j * 16}" font-size="12" fill="#8b949e">${esc(l)}</text>`);
  });
  write('hud-services.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Services: brand identity, websites, business tools, AI integration">
<style>${CSS}${ICON_CSS}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${CARD}" stroke="${LINE}" stroke-width="2"/>
${headBar('[03_SERVICES]', '[CAPABILITIES // 04]', W)}
${body}
</svg>`);
})();

/* ---------- 8. footer: open-for-work + EOF strip ---------- */
(function footer() {
  const W = 880, H = 118;
  write('hud-footer.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Open for freelance work: chaos.flick.systems, flick.systems/resume, jasonflick333@gmail.com">
<style>${CSS}</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${BG}" stroke="${LINE}" stroke-width="2"/>
${grid('g', W - 4, 72, 2, 2)}
<text x="26" y="38" font-size="15" font-weight="700" fill="${G}" letter-spacing="1">&gt; OPEN FOR FREELANCE WORK <tspan class="cur">▋</tspan></text>
<text x="26" y="62" font-size="12" fill="#c9d1d9">chaos.flick.systems  <tspan fill="${MUTE}">·</tspan>  flick.systems/resume  <tspan fill="${MUTE}">·</tspan>  jasonflick333@gmail.com</text>
<text x="${W - 26}" y="38" text-anchor="end" font-size="13" fill="${G}">↗</text>
<line x1="2" y1="76" x2="${W - 2}" y2="76" stroke="${RULE}"/>
<text x="26" y="102" font-size="10.5" fill="${MUTE}" letter-spacing=".8">EOF // ALL SYSTEMS NOMINAL</text>
<circle class="led" cx="${W - 222}" cy="98" r="3" fill="${G}"/>
<text x="${W - 26}" y="102" text-anchor="end" font-size="10.5" font-weight="700" fill="${G}" letter-spacing=".8">HEXA TECHNOLOGIES, LLC · OKC</text>
</svg>`);
})();
