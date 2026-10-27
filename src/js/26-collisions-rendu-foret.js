function around(x, y, fn, pad = 1) {
  const ci = Math.floor(x / CH), cj = Math.floor(y / CH);
  for (let a = -pad; a <= pad; a++) for (let b = -pad; b <= pad; b++) fn(getChunk(ci + a, cj + b));
}
const nearCache = new Map();
function solidsNear(x, y) {
  const key = Math.floor(x / CH) + "," + Math.floor(y / CH); let l = nearCache.get(key);
  if (!l) { l = []; around(x, y, c => l.push(...c.solids)); nearCache.set(key, l); if (nearCache.size > 200) nearCache.delete(nearCache.keys().next().value); }
  return l;
}
function collide(e, r, swim) {
  for (const o of solidsNear(e.x, e.y)) {
    if (swim && o.pond) continue;
    if (o.gate) { if (gateOn(o.gate)) gatePush(e, r, o.gate); continue; } // barrière électrique : un mur seulement quand elle est allumée
    const dx = e.x - o.x, dy = e.y - o.y, min = r * .7 + o.r;
    if (dx*dx + dy*dy < min*min) { const d = Math.hypot(dx, dy) || .01; e.x = o.x + dx / d * min; e.y = o.y + dy / d * min; }
  }
  if (LEVEL.safari) szCollide(e, r, swim); // Parc Safari : falaises, arbres, clôtures et eau des biomes
  collideFalls(e, r);
}
// stalactites et rochers tombés : obstacles temporaires
function collideFalls(e, r) {
  if (!S || !S.falls) return;
  for (const o of S.falls) { if (o.t > 0 || o.life < .4) continue; const dx = e.x - o.x, dy = e.y - o.y, min = r * .7 + o.r * .8; if (dx*dx + dy*dy < min*min) { const d = Math.hypot(dx, dy) || .01; e.x = o.x + dx / d * min; e.y = o.y + dy / d * min; } }
}
const gateOn = g => (S.t + g.ph) % g.per < g.on;
function gateDist(e, g) { // distance au segment de la barrière, et point le plus proche
  const vx = g.x2 - g.x1, vy = g.y2 - g.y1, k = Math.max(0, Math.min(1, ((e.x - g.x1) * vx + (e.y - g.y1) * vy) / (vx * vx + vy * vy))), px = g.x1 + vx * k, py = g.y1 + vy * k;
  return [Math.hypot(e.x - px, e.y - py), px, py];
}
function gatePush(e, r, g) { const [d, px, py] = gateDist(e, g), min = r * .7 + 8; if (d < min) { const dd = d || .01; e.x = px + (e.x - px) / dd * min; e.y = py + (e.y - py) / dd * min; } }
// le point (x, y) est-il pris par un obstacle pour un Pokémon de rayon r ? (mêmes obstacles que collide)
function blockedAt(x, y, r, swim) {
  if (LEVEL.safari && szBlocked(x, y, swim)) return true;
  for (const o of solidsNear(x, y)) {
    if ((swim && o.pond) || o.gate) continue;
    const min = r * .7 + o.r; if ((x - o.x) ** 2 + (y - o.y) ** 2 < min * min) return true;
  }
  return false;
}
// IA des Pokémon sauvages : si un obstacle barre la route vers le joueur, on tourne du côté libre (et on y reste un moment pour ne pas hésiter)
const STEER_A = [.5, 1, 1.5, 2.1];
function steer(f, ax, ay, dt, P) {
  if (LEVEL.safari && P && !f.d.swim) { // Parc Safari : vrai chemin dans le labyrinthe des biomes (carte des distances autour du joueur)
    const l = Math.hypot(P.x - f.x, P.y - f.y) || 1;
    if ((ax * (P.x - f.x) + ay * (P.y - f.y)) / l > .3) { const d = szFlowDir(f, P); if (d) return d; } // seulement s'il se dirige vers le joueur
  }
  f.stT = (f.stT || 0) - dt;
  if (f.stT <= 0) {
    f.stT = .15 + Math.random() * .05; const look = f.r + 22, swim = !!f.d.swim;
    if (!blockedAt(f.x + ax * look, f.y + ay * look, f.r, swim)) { f.stA = 0; if (!(--f.stHold > 0)) f.stSide = 0; }
    else {
      f.stA = 0; const sides = f.stSide ? [f.stSide, -f.stSide] : Math.random() < .5 ? [1, -1] : [-1, 1];
      search: for (const a of STEER_A) for (const s of sides) {
        const c = Math.cos(a * s), sn = Math.sin(a * s), bx = ax * c - ay * sn, by = ax * sn + ay * c;
        if (!blockedAt(f.x + bx * look, f.y + by * look, f.r, swim)) { f.stA = a * s; f.stSide = s; f.stHold = 6; break search; }
      }
    }
  }
  if (!f.stA) return [ax, ay];
  const c = Math.cos(f.stA), s = Math.sin(f.stA); return [ax * c - ay * s, ax * s + ay * c];
}
const inWater = (x, y) => LEVEL.safari ? szAt(x, y) === "~" : solidsNear(x, y).some(o => o.pond && (x-o.x)**2 + (y-o.y)**2 < o.r*o.r);

function renderChunk(ci, cj) {
  if (LEVEL.tower) return renderTowerChunk(ci, cj);
  if (LEVEL.manor) return renderManorChunk(ci, cj);
  if (LEVEL.rocket) return renderRocketChunk(ci, cj);
  if (LEVEL.league) return renderArenaChunk(ci, cj);
  if (LEVEL.cave) return renderCaveChunk(ci, cj);
  if (LEVEL.alph) return renderAlphChunk(ci, cj);
  if (LEVEL.burned) return renderBurnedChunk(ci, cj);
  if (LEVEL.safari) return renderSafariChunk(ci, cj);
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH;
  const cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE);
  // sol : couleur douce issue du bruit, sentier fondu
  const N = 32, cell = CH / N, lo = document.createElement("canvas"); lo.width = lo.height = N + 2;
  const lg = lo.getContext("2d"), img = lg.createImageData(N + 2, N + 2);
  for (let j = 0; j < N + 2; j++) for (let i = 0; i < N + 2; i++) {
    const wx = x0 + (i - .5) * cell, wy = y0 + (j - .5) * cell, n = fbm(wx / 180, wy / 180), dn = forestDensity(wx, wy);
    let r = 80 + n * 40 - dn * 34, gr = 128 + n * 40 - dn * 42, b = 56 + n * 14 - dn * 12;
    if (LEVEL.safari) { r = 196 + n * 34 - dn * 26; gr = 166 + n * 28 - dn * 26; b = 88 + n * 16 - dn * 8; } // herbe sèche de savane
    if (tallGrassAt(wx, wy)) { r -= 16; gr -= 10; b -= 6; }
    const pt = Math.max(0, Math.min(1, (64 - Math.abs(wy - pathY(wx))) / 24));
    if (LEVEL.safari) { r += (184 + n * 22 - r) * pt; gr += (112 + n * 16 - gr) * pt; b += (66 + n * 10 - b) * pt; } // piste de latérite
    else { r += (156 + n * 26 - r) * pt; gr += (130 + n * 20 - gr) * pt; b += (86 + n * 12 - b) * pt; }
    const k = (j * (N + 2) + i) * 4; img.data[k] = r; img.data[k+1] = gr; img.data[k+2] = b; img.data[k+3] = 255;
  }
  lg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(lo, 1, 1, N, N, 0, 0, CH, CH);
  g.translate(-x0, -y0);
  const R = rng(Math.floor(hash(ci - 333, cj + 777) * 4294967295)), jade = jadeOn();
  if (jade) jadeGround(g, x0, y0, R); // Forêt de Jade : tuiles de Rouge Feu (26b-foret-jade.js)
  const all = { ponds:[], trees:[], rocks:[], logs:[], mounds:[] };
  for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) { const n = getChunk(ci + a, cj + b2); for (const k in all) all[k].push(...n[k]); }
  // ombres portées des arbres (dessinées avant le reste)
  if (!jade) for (const t of all.trees) {
    const sg = g.createRadialGradient(t.x + 18, t.y + 4, t.r * .2, t.x + 18, t.y + 4, t.r * 1.15);
    sg.addColorStop(0, "rgba(8,30,12,.42)"); sg.addColorStop(1, "rgba(8,30,12,0)");
    g.fillStyle = sg; g.beginPath(); g.ellipse(t.x + 18, t.y + 4, t.r * 1.15, t.r * .9, 0, 0, Math.PI * 2); g.fill();
  }
  if (LEVEL.safari) for (let i = 0; i < 5; i++) { // terre nue craquelée
    const px = x0 + R() * CH, py = y0 + R() * CH, rx = 26 + R() * 40, ry = rx * (.45 + R() * .25);
    if (nearPath(px, py, 60) || tallGrassAt(px, py)) continue;
    ell(g, px, py, rx, ry, "rgba(170,112,62,.32)"); ell(g, px, py, rx * .7, ry * .7, "rgba(186,128,74,.3)");
    g.strokeStyle = "rgba(120,74,40,.35)"; g.lineWidth = 1;
    for (let k = 0; k < 6; k++) { const a = R() * Math.PI * 2; g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * rx * .6, py + Math.sin(a) * ry * .6); g.lineTo(px + Math.cos(a + .3) * rx * .85, py + Math.sin(a + .3) * ry * .85); g.stroke(); }
  }
  // brins d'herbe
  if (!jade) for (let i = 0; i < 900; i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (nearPath(x, y, 58)) { if (R() < .25) { ell(g, x, y, 2 + R() * 3, 1.5 + R() * 2, R() < .5 ? "#8a7552" : "#b8a27a"); } continue; }
    const h = 5 + R() * 7, sway = (R() - .5) * 4, shade = R();
    g.strokeStyle = LEVEL.safari ? (shade < .33 ? "#9a7a34" : shade < .66 ? "#c4a24c" : "#e2c870") : shade < .33 ? "#3f7a36" : shade < .66 ? "#5a9a46" : "#78b455"; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sway * .3, y - h * .6, x + sway, y - h); g.stroke();
  }
  // feuilles mortes
  for (let i = 0; i < (LEVEL.safari || jade ? 0 : 100); i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH;
    const col = ["#e0892e", "#c8502a", "#e9b740", "#a8401f", "#d97a2a"][Math.floor(R() * 5)];
    ell(g, x, y, 4 + R() * 2.5, 2.2 + R() * 1.2, col, R() * Math.PI);
  }
  // hautes herbes : touffes serrées
  if (!jade) for (let y = y0 + 4; y < y0 + CH; y += 11) for (let x = x0 + 4; x < x0 + CH; x += 11) {
    const jx = x + (R() - .5) * 8, jy = y + (R() - .5) * 8;
    if (!tallGrassAt(jx, jy)) continue;
    for (let k = 0; k < 3; k++) {
      const bx = jx + (k - 1) * 4, h = 12 + R() * 8, lean = (R() - .5) * 6;
      g.fillStyle = LEVEL.safari ? (k === 1 ? "#e0be5a" : "#a8823a") : k === 1 ? "#4d9645" : "#2f6b33";
      g.beginPath(); g.moveTo(bx - 3, jy); g.quadraticCurveTo(bx + lean * .4, jy - h * .6, bx + lean, jy - h); g.quadraticCurveTo(bx + lean * .2 + 1, jy - h * .5, bx + 3, jy); g.fill();
    }
  }
  // fleurs et champignons
  for (let i = 0; i < (LEVEL.safari || jade ? 0 : 7); i++) {
    const cx0 = x0 + R() * CH, cy0 = y0 + R() * CH; if (nearPath(cx0, cy0, 70) || tallGrassAt(cx0, cy0)) continue;
    const col = ["#f4f1e4", "#f6d45a", "#f19ab8", "#b9a6f0"][Math.floor(R() * 4)];
    for (let k = 0; k < 6; k++) { const fx = cx0 + (R() - .5) * 40, fy = cy0 + (R() - .5) * 26; g.strokeStyle = "#3f7a36"; g.lineWidth = 1; g.beginPath(); g.moveTo(fx, fy + 5); g.lineTo(fx, fy); g.stroke(); for (let q = 0; q < 5; q++) circ(g, fx + Math.cos(q * 1.26) * 2.6, fy + Math.sin(q * 1.26) * 2.6, 2, col); circ(g, fx, fy, 1.5, "#e98a3a"); }
  }
  for (let i = 0; i < (LEVEL.safari || jade ? 0 : 3); i++) { const mx = x0 + R() * CH, my = y0 + R() * CH; if (nearPath(mx, my, 60)) continue; ell(g, mx + 3, my + 4, 7, 3, "rgba(0,0,0,.25)"); g.fillStyle = "#efe2c4"; g.fillRect(mx - 2, my - 4, 4, 7); ell(g, mx, my - 5, 7, 4.5, "#d8483a"); circ(g, mx - 3, my - 6, 1.2, "#fff"); circ(g, mx + 2, my - 7, 1, "#fff"); }
  // étangs
  for (const p of all.ponds) {
    if (ilexOn()) { ilexPond(g, p); continue; }
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
    ell(g, 3, 6, p.rx + 12, p.ry + 10, "rgba(20,40,20,.35)");
    if (LEVEL.safari) { ell(g, 0, 0, p.rx + 22, p.ry + 18, "#8a6438"); ell(g, 0, 0, p.rx + 12, p.ry + 10, "#6e4c2a"); } // berge de boue piétinée
    else ell(g, 0, 0, p.rx + 10, p.ry + 9, "#6d6a45");
    const wg = g.createRadialGradient(-p.rx * .2, -p.ry * .2, 4, 0, 0, p.rx);
    if (LEVEL.safari) { wg.addColorStop(0, "#3a5e58"); wg.addColorStop(.7, "#4f7c70"); wg.addColorStop(1, "#86a07a"); }
    else { wg.addColorStop(0, "#2a6688"); wg.addColorStop(.7, "#3b86a4"); wg.addColorStop(1, "#6fb4bf"); }
    g.fillStyle = wg; g.beginPath(); g.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, p.rx - 3, p.ry - 3, 0, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    const LR = rng(Math.floor(p.ph * 1e6));
    for (let k = 0; k < (LEVEL.safari ? 0 : 5); k++) {
      const a = LR() * Math.PI * 2, d = .3 + LR() * .5, lx = Math.cos(a) * p.rx * d, ly = Math.sin(a) * p.ry * d, lr = 7 + LR() * 6;
      g.fillStyle = "#4f9a46"; g.beginPath(); g.arc(lx, ly, lr, a + .4, a + Math.PI * 2 - .1); g.lineTo(lx, ly); g.fill();
      if (k === 0) { for (let q = 0; q < 6; q++) ell(g, lx + Math.cos(q) * 3, ly + Math.sin(q) * 3 - 2, 3.5, 2, "#f6b6cf", q); circ(g, lx, ly - 2, 2, "#f6d45a"); }
    }
    for (let k = 0; k < 9; k++) { const a = LR() * Math.PI * 2, sx = Math.cos(a) * (p.rx + 6), sy = Math.sin(a) * (p.ry + 5); g.strokeStyle = LEVEL.safari ? "#8a7a3a" : "#5b8a3a"; g.lineWidth = 2; for (let q = -1; q <= 1; q++) { g.beginPath(); g.moveTo(sx + q * 3, sy); g.lineTo(sx + q * 4, sy - 14 - LR() * 6); g.stroke(); } ell(g, sx + 4, sy - 16, 1.6, 4, "#6e4a2a"); }
    g.restore();
  }
  // troncs couchés
  for (const l of all.logs) {
    g.save(); g.translate(l.x, l.y); g.rotate(l.a);
    ell(g, 4, 9, l.len / 2 + 6, 12, "rgba(10,25,10,.35)");
    const lgd = g.createLinearGradient(0, -12, 0, 12); lgd.addColorStop(0, "#9a7046"); lgd.addColorStop(.5, "#7a5434"); lgd.addColorStop(1, "#4f3420");
    g.fillStyle = lgd; g.beginPath(); g.roundRect(-l.len / 2, -12, l.len, 24, 12); g.fill();
    ell(g, l.len / 2 - 4, 0, 7, 11, "#c9a777"); ell(g, l.len / 2 - 4, 0, 4, 7, "#a8855a");
    for (let k = -2; k <= 1; k++) ell(g, k * l.len / 6, -6, 6, 3, "#5a8a3a");
    g.restore();
  }
  // rochers
  for (const r of all.rocks) {
    if (ilexOn()) { ilexRock(g, r); continue; }
    if (jade) { jadeRock(g, r); continue; }
    ell(g, r.x + 5, r.y + r.r * .55, r.r * 1.1, r.r * .5, "rgba(10,25,10,.35)");
    const rg = g.createRadialGradient(r.x - r.r * .35, r.y - r.r * .5, 2, r.x, r.y, r.r * 1.1);
    if (LEVEL.safari) { rg.addColorStop(0, "#e2cdaa"); rg.addColorStop(.6, "#b0916e"); rg.addColorStop(1, "#6f5a46"); }
    else { rg.addColorStop(0, "#c9c3b3"); rg.addColorStop(.6, "#8f8a7c"); rg.addColorStop(1, "#5f5b52"); }
    g.fillStyle = rg; g.beginPath(); g.ellipse(r.x, r.y, r.r, r.r * .82, 0, 0, Math.PI * 2); g.fill();
    if (LEVEL.safari) { g.strokeStyle = "rgba(90,66,46,.45)"; g.lineWidth = 1.2; g.beginPath(); g.moveTo(r.x - r.r * .5, r.y - r.r * .1); g.lineTo(r.x + r.r * .1, r.y + r.r * .2); g.lineTo(r.x + r.r * .5, r.y - r.r * .3); g.stroke(); }
    else ell(g, r.x - r.r * .3, r.y - r.r * .55, r.r * .45, r.r * .2, "#6f9a48");
  }
  for (const m of all.mounds) { // termitière
    ell(g, m.x + 8, m.y + 4, m.r * 1.5, m.r * .6, "rgba(60,30,10,.3)");
    const mg = g.createLinearGradient(m.x - m.r, 0, m.x + m.r, 0); mg.addColorStop(0, "#d48a52"); mg.addColorStop(.55, "#b0633a"); mg.addColorStop(1, "#7a3e22");
    g.fillStyle = mg; g.beginPath(); g.moveTo(m.x - m.r * 1.2, m.y + 4); g.quadraticCurveTo(m.x - m.r * .8, m.y - m.h * .5, m.x - m.r * .25, m.y - m.h); g.quadraticCurveTo(m.x, m.y - m.h - 5, m.x + m.r * .3, m.y - m.h * .92);
    g.quadraticCurveTo(m.x + m.r * .9, m.y - m.h * .45, m.x + m.r * 1.2, m.y + 4); g.closePath(); g.fill();
    ell(g, m.x + m.r * .55, m.y - m.h * .55, m.r * .35, m.r * .5, "#a85a34"); ell(g, m.x - m.r * .6, m.y - m.h * .25, m.r * .3, m.r * .4, "#c47a48");
  }
  // troncs et racines (les acacias du Safari ont leur tronc dans le sprite)
  if (!LEVEL.safari && !jade) for (const t of all.trees) {
    g.strokeStyle = "#4a3322"; g.lineWidth = 5; g.lineCap = "round";
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + t.ph; g.beginPath(); g.moveTo(t.x, t.y); g.quadraticCurveTo(t.x + Math.cos(a) * t.trunk * 1.3, t.y + Math.sin(a) * t.trunk * .9, t.x + Math.cos(a) * t.trunk * 1.9, t.y + Math.sin(a) * t.trunk * 1.3); g.stroke(); }
    const tg = g.createRadialGradient(t.x - t.trunk * .3, t.y - t.trunk * .3, 1, t.x, t.y, t.trunk);
    tg.addColorStop(0, "#8a6440"); tg.addColorStop(1, "#4a3322");
    g.fillStyle = tg; g.beginPath(); g.arc(t.x, t.y, t.trunk, 0, Math.PI * 2); g.fill();
  }
  c.canvas = cv2; return cv2;
}
const canopyCache = new Map();
function canopySprite(r, v) {
  const rb = Math.round(r / 6) * 6, key = rb + "_" + v; let s = canopyCache.get(key); if (s) return s;
  const size = Math.ceil(rb * 2.5), cv2 = document.createElement("canvas"); cv2.width = cv2.height = size * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(size / 2, size / 2);
  const R = rng(rb * 31 + v * 7 + 1), pal = [["#173d20", "#21552a", "#2f7034", "#4f9a45"], ["#2a3f1a", "#4a5e22", "#7a8a2e", "#b5b84a"], ["#163a26", "#1f5233", "#2c6b3f", "#4c9658"], ["#5a2a12", "#8a3e16", "#c4621e", "#f0a040"], ["#4a1a14", "#7a2618", "#b23a22", "#e66a3a"], ["#5a4210", "#8a6418", "#c9962a", "#f4cf5a"]][v];
  const blobs = [];
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + R() * .4, d = rb * (.42 + R() * .12); blobs.push([Math.cos(a) * d, Math.sin(a) * d * .9, rb * (.42 + R() * .14)]); }
  blobs.push([0, 0, rb * .6]);
  for (const [x, y, r2] of blobs) circ(g, x + 3, y + 5, r2, "rgba(5,20,8,.35)");
  for (const [x, y, r2] of blobs) circ(g, x, y, r2, pal[0]);
  for (const [x, y, r2] of blobs) circ(g, x - r2 * .12, y - r2 * .16, r2 * .82, pal[1]);
  for (const [x, y, r2] of blobs) { const hg = g.createRadialGradient(x - r2 * .35, y - r2 * .4, 1, x - r2 * .2, y - r2 * .25, r2 * .75); hg.addColorStop(0, pal[3]); hg.addColorStop(.55, pal[2]); hg.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = hg; g.beginPath(); g.arc(x - r2 * .2, y - r2 * .25, r2 * .75, 0, Math.PI * 2); g.fill(); }
  for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, d = R() * rb * .85; ell(g, Math.cos(a) * d, Math.sin(a) * d, 3, 1.6, R() < .5 ? pal[3] : pal[1], R() * 3); }
  s = { cv:cv2, size }; canopyCache.set(key, s); return s;
}
function acaciaSprite(r, v) { // acacia parasol : tronc fin, couronne plate et large
  const rb = Math.round(r / 6) * 6, key = "ac" + rb + "_" + v; let s = canopyCache.get(key); if (s) return s;
  const size = Math.ceil(rb * 3), cv2 = document.createElement("canvas"); cv2.width = cv2.height = size * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(size / 2, size / 2);
  const R = rng(rb * 17 + v * 5 + 3), pal = [["#2f3814", "#4a5620", "#6a7a2c", "#9aa848"], ["#3a3a14", "#5a5a1e", "#80802a", "#b8b048"], ["#283a1a", "#3e5426", "#5c7434", "#8aa050"]][v % 3];
  g.strokeStyle = "#4a3422"; g.lineCap = "round";
  g.lineWidth = rb * .12; g.beginPath(); g.moveTo(0, rb * .55); g.quadraticCurveTo(rb * .05, rb * .1, 0, -rb * .15); g.stroke();
  g.lineWidth = rb * .07; for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(0, -rb * .1); g.quadraticCurveTo(sx * rb * .25, -rb * .3, sx * rb * .65, -rb * .38); g.stroke(); }
  const cy0 = -rb * .45, blobs = [];
  for (let i = 0; i < 11; i++) { const k = i / 10 - .5; blobs.push([k * rb * 2.3 + (R() - .5) * rb * .2, cy0 + (R() - .5) * rb * .18 + Math.abs(k) * rb * .12, rb * (.32 + R() * .12)]); }
  for (const [x, y, r2] of blobs) ell(g, x + 4, y + 6, r2 * 1.2, r2 * .55, "rgba(30,20,5,.3)");
  for (const [x, y, r2] of blobs) ell(g, x, y, r2 * 1.2, r2 * .55, pal[0]);
  for (const [x, y, r2] of blobs) ell(g, x - r2 * .1, y - r2 * .12, r2 * 1.05, r2 * .44, pal[1]);
  for (const [x, y, r2] of blobs) ell(g, x - r2 * .2, y - r2 * .22, r2 * .7, r2 * .26, pal[2]);
  for (let i = 0; i < 50; i++) { const x = (R() - .5) * rb * 2.4, y = cy0 + (R() - .6) * rb * .4; ell(g, x, y, 2.6, 1.3, R() < .5 ? pal[3] : pal[1], R() * 3); }
  s = { cv:cv2, size }; canopyCache.set(key, s); return s;
}
