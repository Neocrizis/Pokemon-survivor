function towerChunk(ci, cj) {
  const R = rng(Math.floor(hash(ci + 7000, cj - 3000) * 4294967295));
  const x0 = ci * CH, y0 = cj * CH, graves = [], pillars = [], candles = [], solids = [];
  const clear = (x, y, m) => Math.hypot(x, y - START_Y) > 260 && !nearPath(x, y, m);
  for (let gy = 0; gy < CH; gy += 92) for (let gx = 0; gx < CH; gx += 74) {
    const x = x0 + gx + 37 + (R() - .5) * 10, y = y0 + gy + 46 + (R() - .5) * 8;
    if (forestDensity(x, y) < .48 || !clear(x, y, 105) || R() < .3) continue;
    graves.push({ x, y, v:Math.floor(R() * 3), ph:R() * 6, fl:R() < .3, gi:gx / 74, gj:gy / 92 });
  }
  for (let i = 0; i < 2; i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (R() < .45 || !clear(x, y, 130) || graves.some(g => Math.hypot(g.x - x, g.y - y) < 70) || pillars.some(q => Math.hypot(q.x - x, q.y - y) < 160)) continue;
    pillars.push({ x, y, r:24 + R() * 6 });
  }
  for (let i = 0; i < 4; i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (!clear(x, y, 75) || graves.some(g => Math.hypot(g.x - x, g.y - y) < 36) || pillars.some(q => Math.hypot(q.x - x, q.y - y) < q.r + 20)) continue;
    candles.push({ x, y, ph:R() * 6, blue:R() < .6 });
  }
  let hgWalls = [];
  if (LEVEL.tower && !LEVEL.sprout) pokeTowerRows(x0, y0, graves, pillars, candles); // Tour Pokémon : rangées de tombes façon Let's Go (24d-tour-pokemon.js)
  if (LEVEL.sprout) { // moins de statues que de tombes, et de longues barrières de bois (24b-tour-chetiflor.js)
    for (let i = graves.length - 1; i >= 0; i--) if (hash(graves[i].x * .7, graves[i].y * 1.3) > .45) graves.splice(i, 1);
    hgWalls = sproutWalls(R, x0, y0, graves, pillars, candles);
    for (const w of hgWalls) for (let k = 10; k < w.len; k += 20) solids.push({ x:w.x + k, y:w.y - 14, r:14 });
  }
  for (const g of graves) if (!g.row) solids.push({ x:g.x, y:g.y, r:14 });
  for (const g of graves) if (g.row && g.next) for (let k = 0; k <= 74; k += 25) solids.push({ x:g.x + k, y:g.y - 4, r:15 }); else if (g.row) solids.push({ x:g.x, y:g.y - 4, r:16 });
  for (const q of pillars) solids.push({ x:q.x, y:q.y, r:q.r });
  if (LEVEL.sprout) { // Tour Chétiflor : le grand pilier central, au-dessus du point de départ
    for (const c of candles) c.blue = false;
    const px = 0, py = START_Y - 300; if (px >= x0 && px < x0 + CH && py >= y0 && py < y0 + CH) { pillars.push({ x:px, y:py, r:58, big:true }); solids.push({ x:px, y:py, r:58 }); }
  }
  for (const c of candles) solids.push({ x:c.x, y:c.y, r:6 });
  const fogs = LEVEL.tower && !LEVEL.sprout ? pokeTowerFogs(x0, y0, graves) : [];
  return { ponds:[], trees:[], rocks:[], logs:[], walls:[], spikes:[], crystals:[], shrooms:[], graves, pillars, candles, hgWalls, fogs, solids, canvas:null, used:0 };
}
function renderTowerChunk(ci, cj) {
  if (LEVEL.sprout && HG.img) return renderSproutChunk(ci, cj);
  if (pokeTowerOn()) return renderPokeTowerChunk(ci, cj);
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH;
  const cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(-x0, -y0);
  const R = rng(Math.floor(hash(ci - 777, cj + 333) * 4294967295)), T = 32;
  if (LEVEL.sprout) { // Tour Chétiflor : plancher de bois
    for (let ty = y0, row = 0; ty < y0 + CH; ty += 16, row++) for (let tx = x0 - (row % 2) * 40; tx < x0 + CH; tx += 80) {
      const n = fbm(tx / 300, ty / 300), v = (hash(tx / 80 + row * 3.1, ty / 16) - .5) * 16;
      g.fillStyle = `rgb(${132 + n * 22 + v},${92 + n * 14 + v * .8},${54 + n * 8 + v * .5})`; g.fillRect(tx, ty, 80, 16);
      g.fillStyle = "rgba(255,230,190,.07)"; g.fillRect(tx + 1, ty + 1, 78, 2);
      g.fillStyle = "rgba(40,20,8,.35)"; g.fillRect(tx, ty + 15, 80, 1); g.fillRect(tx + 79, ty, 1, 16);
      if (hash(tx + 3, ty - 7) < .12) circ(g, tx + 20 + hash(ty, tx) * 40, ty + 8, 2, "rgba(60,30,10,.4)"); // nœud du bois
    }
  } else
  // dalles de pierre violacées
  for (let ty = y0; ty < y0 + CH; ty += T) for (let tx = x0; tx < x0 + CH; tx += T) {
    const n = fbm(tx / 300, ty / 300), v = (hash(tx / T, ty / T) - .5) * 10;
    g.fillStyle = `rgb(${62 + n * 18 + v},${56 + n * 14 + v},${74 + n * 18 + v})`; g.fillRect(tx, ty, T, T);
    g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(tx + 1, ty + 1, T - 2, 2);
    g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(tx, ty + T - 1.5, T, 1.5); g.fillRect(tx + T - 1.5, ty, 1.5, T);
  }
  // fissures et poussière
  g.strokeStyle = "rgba(20,14,28,.5)"; g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) { let x = x0 + R() * CH, y = y0 + R() * CH, a = R() * 6; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 4; k++) { a += (R() - .5) * 1.4; x += Math.cos(a) * 12; y += Math.sin(a) * 12; g.lineTo(x, y); } g.stroke(); }
  for (let i = 0; i < 120; i++) circ(g, x0 + R() * CH, y0 + R() * CH, .6 + R() * 1.2, "rgba(190,180,210,.18)");
  // tapis pourpre le long du chemin
  const band = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "butt"; g.beginPath(); for (let x = x0 - 40; x <= x0 + CH + 40; x += 16) x === x0 - 40 ? g.moveTo(x, pathY(x)) : g.lineTo(x, pathY(x)); g.stroke(); };
  if (LEVEL.sprout) { band(118, "rgba(30,16,4,.35)"); band(108, "#5a3a18"); band(100, "#c8b878"); band(84, "#b6a462"); } // tatamis
  else { band(118, "rgba(20,8,20,.35)"); band(108, "#c9a24a"); band(100, "#6a2440"); band(84, "#7c2c4c"); }
  for (let x = x0; x < x0 + CH; x += 48) { const y = pathY(x); poly(g, [x, y - 20, x + 10, y, x, y + 20, x - 10, y], "rgba(201,162,74,.35)"); }
  const all = { graves:[], pillars:[], candles:[] };
  for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) { const n = getChunk(ci + a, cj + b2); for (const k in all) all[k].push(...(n[k] || [])); }
  // colonnes vues de dessus
  for (const q of all.pillars) {
    if (LEVEL.sprout) { // poteaux de bois, et le grand pilier ceint d'une corde sacrée
      ell(g, q.x + 10, q.y + 10, q.r * 1.25, q.r * 1.1, "rgba(20,10,4,.45)");
      circ(g, q.x, q.y, q.r + 4, "#3e2410"); circ(g, q.x, q.y, q.r, "#7a4e26"); circ(g, q.x - 3, q.y - 3, q.r * .8, "#94603a");
      g.strokeStyle = "rgba(60,32,12,.55)"; g.lineWidth = 1.3; for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(q.x - 3, q.y - 3, q.r * .18 * k, 0, Math.PI * 2); g.stroke(); }
      if (q.big) { g.strokeStyle = "#e8dcb0"; g.lineWidth = 7; g.beginPath(); g.arc(q.x, q.y, q.r + 3, 0, Math.PI * 2); g.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.fillStyle = "#f4f0e0"; g.fillRect(q.x + Math.cos(a) * (q.r + 7) - 3, q.y + Math.sin(a) * (q.r + 7), 6, 12); } }
      continue;
    }
    ell(g, q.x + 10, q.y + 10, q.r * 1.25, q.r * 1.1, "rgba(8,4,14,.45)");
    circ(g, q.x, q.y, q.r + 5, "#4a4256"); circ(g, q.x, q.y, q.r, "#7a7088"); circ(g, q.x - 3, q.y - 3, q.r * .78, "#9890a6");
    g.strokeStyle = "rgba(40,30,50,.5)"; g.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; g.beginPath(); g.moveTo(q.x + Math.cos(a) * q.r * .45, q.y + Math.sin(a) * q.r * .45); g.lineTo(q.x + Math.cos(a) * q.r, q.y + Math.sin(a) * q.r); g.stroke(); }
    circ(g, q.x - 3, q.y - 3, q.r * .4, "#b2aac0");
  }
  // tombes
  for (const gr of all.graves) {
    if (LEVEL.sprout) { // pots de jeunes pousses
      const x = gr.x, y = gr.y; ell(g, x + 5, y + 8, 16, 6, "rgba(20,10,4,.45)");
      g.fillStyle = "#6a4a2a"; g.beginPath(); g.moveTo(x - 12, y - 6); g.lineTo(x + 12, y - 6); g.lineTo(x + 9, y + 8); g.lineTo(x - 9, y + 8); g.closePath(); g.fill();
      ell(g, x, y - 6, 12, 4, "#8a6238"); ell(g, x, y - 6, 9, 2.6, "#3a2410");
      for (let k = -1; k <= 1; k++) ell(g, x + k * 5, y - 14 - (k ? 0 : 4), 3, 7, "#6cc24a", k * .5);
      if (gr.fl) circ(g, x, y - 23, 3, "#f4a6c8");
      continue;
    }
    const x = gr.x, y = gr.y, w = [13, 11, 15][gr.v], h = [22, 26, 18][gr.v];
    ell(g, x + 6, y + 8, w + 6, 6, "rgba(8,4,14,.45)");
    g.fillStyle = "#4e4858"; g.fillRect(x - w - 3, y + 2, (w + 3) * 2, 7);
    const sg = g.createLinearGradient(x - w, 0, x + w, 0); sg.addColorStop(0, "#a8a2b4"); sg.addColorStop(1, "#6c6678");
    g.fillStyle = sg; g.beginPath();
    if (gr.v === 1) { g.moveTo(x - 4, y + 4); g.lineTo(x - 4, y - h + 9); g.lineTo(x - w, y - h + 9); g.lineTo(x - w, y - h + 3); g.lineTo(x - 4, y - h + 3); g.lineTo(x - 4, y - h - 2); g.lineTo(x + 4, y - h - 2); g.lineTo(x + 4, y - h + 3); g.lineTo(x + w, y - h + 3); g.lineTo(x + w, y - h + 9); g.lineTo(x + 4, y - h + 9); g.lineTo(x + 4, y + 4); }
    else { g.moveTo(x - w, y + 4); g.lineTo(x - w, y - h + w); g.arc(x, y - h + w, w, Math.PI, 0); g.lineTo(x + w, y + 4); }
    g.closePath(); g.fill(); g.strokeStyle = "rgba(30,22,40,.75)"; g.lineWidth = 1.5; g.stroke();
    if (gr.v !== 1) { g.strokeStyle = "rgba(40,32,52,.55)"; g.lineWidth = 1.4; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(x - w * .55, y - h + w + 3 + k * 4); g.lineTo(x + w * .55, y - h + w + 3 + k * 4); g.stroke(); } }
    if (gr.fl) for (let k = 0; k < 3; k++) { circ(g, x - 6 + k * 6, y + 7, 2.4, ["#e8d070", "#f0f0f0", "#d070b0"][k]); circ(g, x - 6 + k * 6, y + 7, .9, "#fff8d0"); }
  }
  // bougeoirs (les flammes sont animées dans drawCaveLight)
  for (const cd of all.candles) { ell(g, cd.x + 3, cd.y + 4, 8, 3.5, "rgba(8,4,14,.4)"); ell(g, cd.x, cd.y + 1, 6, 3, "#8a6a30"); g.fillStyle = "#e8e0d0"; g.fillRect(cd.x - 2.5, cd.y - 10, 5, 11); }
  c.canvas = cv2; return cv2;
}
/* Manoir Pokémon : parquet brûlé, murs effondrés, bibliothèques, statues interrupteurs et grilles de feu */
function manorChunk(ci, cj) {
  const R = rng(Math.floor(hash(ci + 5300, cj - 6100) * 4294967295));
  const x0 = ci * CH, y0 = cj * CH, mwalls = [], shelves = [], statues = [], fires = [], solids = [];
  const clear = (x, y, m) => Math.hypot(x, y - START_Y) > 300 && !nearPath(x, y, m);
  const free = (x, y, m) => !mwalls.some(w => Math.hypot(w.x - x, w.y - y) < w.len / 2 + m) && !shelves.some(q => Math.hypot(q.x - x, q.y - y) < 60 + m) && !statues.some(q => Math.hypot(q.x - x, q.y - y) < m + 30);
  for (let i = 0; i < 2; i++) { const x = x0 + 60 + R() * (CH - 120), y = y0 + 60 + R() * (CH - 120), len = 110 + R() * 120;
    if (R() < .3 || !clear(x, y, 150) || !free(x, y, 60)) continue; mwalls.push({ x, y, len, a:R() < .5 ? 0 : Math.PI / 2, broken:R() }); }
  for (let i = 0; i < 2; i++) { const x = x0 + R() * CH, y = y0 + R() * CH;
    if (R() < .4 || !clear(x, y, 110) || !free(x, y, 40)) continue; shelves.push({ x, y, v:Math.floor(R() * 3) }); }
  if (R() < .4) { const x = x0 + 80 + R() * (CH - 160), y = y0 + 80 + R() * (CH - 160); if (clear(x, y, 90) && free(x, y, 50)) statues.push({ x, y, ph:R() * 6 }); }
  for (let i = 0; i < 2; i++) { const x = x0 + 50 + R() * (CH - 100), y = y0 + 50 + R() * (CH - 100);
    if (R() < .35 || Math.hypot(x, y - START_Y) < 380 || !free(x, y, 30)) continue; fires.push({ x, y, len:120 + R() * 90, a:R() * Math.PI }); }
  for (const w of mwalls) for (let k = -3; k <= 3; k++) { if (w.broken > .5 && k === 1) continue; solids.push({ x:w.x + Math.cos(w.a) * k * w.len / 7, y:w.y + Math.sin(w.a) * k * w.len / 7, r:13 }); }
  for (const q of shelves) for (let k = -1; k <= 1; k++) solids.push({ x:q.x + k * 22, y:q.y, r:13 });
  for (const q of statues) solids.push({ x:q.x, y:q.y, r:15 });
  return { ponds:[], trees:[], rocks:[], logs:[], walls:[], spikes:[], crystals:[], shrooms:[], mwalls, shelves, statues, fires, solids, canvas:null, used:0 };
}
function renderManorChunk(ci, cj) {
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH;
  const cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(-x0, -y0);
  const R = rng(Math.floor(hash(ci - 515, cj + 919) * 4294967295)), PH = 18;
  // parquet en lattes, assombri et brûlé par endroits
  for (let ty = y0; ty < y0 + CH; ty += PH) { const row = Math.floor(ty / PH), off = (row % 3) * 37;
    for (let tx = x0 - off; tx < x0 + CH; tx += 74) {
      const n = fbm(tx / 260, ty / 260), burn = Math.max(0, fbm(tx / 140 + 9, ty / 140 + 4) - .55) * 3, v = (hash(tx, row) - .5) * 14;
      g.fillStyle = `rgb(${110 + n * 30 + v - burn * 70},${74 + n * 20 + v * .7 - burn * 50},${46 + n * 12 + v * .5 - burn * 30})`; g.fillRect(tx, ty, 73, PH - 1);
      g.fillStyle = "rgba(255,230,190,.06)"; g.fillRect(tx, ty, 73, 2);
      g.fillStyle = "rgba(20,10,4,.4)"; g.fillRect(tx + 72, ty, 1.5, PH); circ(g, tx + 6, ty + PH / 2, 1, "rgba(30,15,6,.6)"); circ(g, tx + 66, ty + PH / 2, 1, "rgba(30,15,6,.6)");
    } }
  // trous dans le plancher et gravats
  for (let i = 0; i < 2; i++) { const hx = x0 + R() * CH, hy = y0 + R() * CH; if (nearPath(hx, hy, 70)) continue; ell(g, hx, hy, 18 + R() * 14, 10 + R() * 8, "#1a0e08"); ell(g, hx - 2, hy - 2, 12, 6, "#0c0604"); }
  for (let i = 0; i < 26; i++) { const dx = x0 + R() * CH, dy = y0 + R() * CH; ell(g, dx, dy, 2 + R() * 4, 1.5 + R() * 3, R() < .5 ? "#7a6a5a" : "#5a4a3c", R() * 3); }
  // tapis rouge le long du couloir principal
  const band = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = "butt"; g.beginPath(); for (let x = x0 - 40; x <= x0 + CH + 40; x += 16) x === x0 - 40 ? g.moveTo(x, pathY(x)) : g.lineTo(x, pathY(x)); g.stroke(); };
  band(112, "rgba(10,4,2,.35)"); band(104, "#b8913e"); band(96, "#6a1e1a"); band(80, "#82261e");
  for (let x = x0; x < x0 + CH; x += 30) { if (R() < .3) ell(g, x + R() * 20, pathY(x) + (R() - .5) * 60, 10 + R() * 12, 6 + R() * 6, "rgba(30,12,6,.55)"); } // brûlures
  const all = { mwalls:[], shelves:[], statues:[], fires:[] };
  for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) { const n = getChunk(ci + a, cj + b2); for (const k in all) all[k].push(...(n[k] || [])); }
  // grilles des portes de feu (les flammes sont animées dans drawCaveLight)
  for (const f of all.fires) { g.save(); g.translate(f.x, f.y); g.rotate(f.a);
    g.fillStyle = "#2a2420"; g.fillRect(-f.len / 2, -9, f.len, 18); g.strokeStyle = "#5a524a"; g.lineWidth = 2; g.strokeRect(-f.len / 2, -9, f.len, 18);
    for (let k = -f.len / 2 + 8; k < f.len / 2; k += 10) { g.beginPath(); g.moveTo(k, -8); g.lineTo(k, 8); g.stroke(); }
    g.restore(); }
  // murs effondrés en briques
  for (const w of all.mwalls) { g.save(); g.translate(w.x, w.y); g.rotate(w.a);
    const L = w.len / 2; ell(g, 8, 14, L + 8, 16, "rgba(8,4,2,.45)");
    for (let k = -L; k < L; k += 16) { if (w.broken > .5 && k > L * .15 && k < L * .45) continue; const h = 22 + (hash(k, w.x) - .5) * 6;
      g.fillStyle = (Math.floor(k / 16) & 1) ? "#8a7a6a" : "#9a8a78"; g.fillRect(k, -h / 2, 15, h); g.fillStyle = "rgba(255,240,220,.15)"; g.fillRect(k, -h / 2, 15, 3); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(k + 14, -h / 2, 1.5, h); }
    if (w.broken > .5) for (let q = 0; q < 6; q++) ell(g, L * .3 + (hash(q, w.y) - .5) * 30, (hash(w.x, q) - .5) * 30, 4 + q % 3 * 2, 3, "#7a6a5a");
    g.restore(); }
  // bibliothèques renversées
  for (const q of all.shelves) {
    ell(g, q.x + 6, q.y + 12, 46, 10, "rgba(8,4,2,.45)");
    g.fillStyle = "#4a2e1a"; g.fillRect(q.x - 38, q.y - 16, 76, 30); g.fillStyle = "#6a4428"; g.fillRect(q.x - 35, q.y - 13, 70, 24);
    const BR = rng(Math.floor(q.x * 7 + q.y));
    for (let k = -32; k < 32; k += 6) { g.fillStyle = ["#8a2a2a", "#2a4a7a", "#3a6a3a", "#8a6a2a", "#5a3a6a"][Math.floor(BR() * 5)]; g.fillRect(q.x + k, q.y - 11 + BR() * 3, 5, 20 - BR() * 4); }
    for (let k = 0; k < 3; k++) { g.fillStyle = "#e8dcc0"; g.save(); g.translate(q.x - 30 + BR() * 60, q.y + 20 + BR() * 10); g.rotate(BR() * 3); g.fillRect(-5, -4, 10, 8); g.restore(); }
  }
  // statues interrupteurs
  for (const q of all.statues) {
    ell(g, q.x + 8, q.y + 10, 26, 10, "rgba(8,4,2,.5)");
    g.fillStyle = "#5a5660"; g.fillRect(q.x - 20, q.y - 6, 40, 18); g.fillStyle = "#77737e"; g.fillRect(q.x - 17, q.y - 3, 34, 12);
    const sg = g.createLinearGradient(q.x - 14, 0, q.x + 14, 0); sg.addColorStop(0, "#c0bcc8"); sg.addColorStop(1, "#7a7684");
    g.fillStyle = sg; g.beginPath(); g.moveTo(q.x - 10, q.y + 2); g.quadraticCurveTo(q.x - 14, q.y - 22, q.x - 6, q.y - 34); g.lineTo(q.x - 9, q.y - 44); g.lineTo(q.x - 2, q.y - 38);
    g.lineTo(q.x + 2, q.y - 38); g.lineTo(q.x + 9, q.y - 44); g.lineTo(q.x + 6, q.y - 34); g.quadraticCurveTo(q.x + 14, q.y - 22, q.x + 10, q.y + 2); g.closePath(); g.fill();
    g.strokeStyle = "rgba(30,26,36,.6)"; g.lineWidth = 1.2; g.stroke(); circ(g, q.x - 3, q.y - 32, 1.5, "#3a3640"); circ(g, q.x + 3, q.y - 32, 1.5, "#3a3640");
  }
  c.canvas = cv2; return cv2;
}
/* Repaire Rocket : sol métallique, caisses, machines et flèches qui entraînent */
function rocketChunk(ci, cj) {
  const R = rng(Math.floor(hash(ci + 9100, cj - 4100) * 4294967295));
  const x0 = ci * CH, y0 = cj * CH, crates = [], machines = [], spinners = [], solids = [];
  const clear = (x, y, m) => Math.hypot(x, y - START_Y) > 260 && !nearPath(x, y, m);
  const free = (x, y, m) => !crates.some(q => Math.hypot(q.x - x, q.y - y) < m) && !machines.some(q => Math.abs(q.x - x) < q.w / 2 + m * .6 && Math.abs(q.y - y) < q.h / 2 + m * .6);
  for (let i = 0; i < 2; i++) {
    const x = x0 + 60 + R() * (CH - 120), y = y0 + 60 + R() * (CH - 120), w = 90 + R() * 70, h = 46 + R() * 20;
    if (forestDensity(x, y) < .45 || !clear(x, y, 140) || !free(x, y, 120)) continue;
    machines.push({ x, y, w, h, ph:R() * 6, v:Math.floor(R() * 2) });
  }
  for (let i = 0; i < 7; i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (forestDensity(x, y) < .4 || !clear(x, y, 100) || !free(x, y, 48)) continue;
    crates.push({ x, y, n:1 + Math.floor(R() * 3), ph:R() });
  }
  if (R() < .55) { // couloir de flèches
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], [dx, dy] = dirs[Math.floor(R() * 4)], n = 3 + Math.floor(R() * 3);
    let x = x0 + 120 + R() * (CH - 240), y = y0 + 120 + R() * (CH - 240);
    if (clear(x, y, 90) && free(x, y, 70)) for (let k = 0; k < n; k++) { spinners.push({ x:x + dx * k * 52, y:y + dy * k * 52, dx, dy }); }
  }
  // un peu de variété : tonneaux et étagères de Poké Balls volées, halos de lampes
  const props = [], lamps = [];
  for (let i = 0; i < 2; i++) {
    const x = x0 + 50 + R() * (CH - 100), y = y0 + 50 + R() * (CH - 100), kind = R() < .55 ? "barrels" : "shelf", r = kind === "shelf" ? 46 : 30;
    if (forestDensity(x, y) < .4 || !clear(x, y, r + 60) || !free(x, y, r + 30) || props.some(q => Math.hypot(q.x - x, q.y - y) < r + q.r + 30) || spinners.some(q => Math.hypot(q.x - x, q.y - y) < r + 30)) continue;
    const q = { kind, x, y, r };
    if (kind === "barrels") { q.bs = []; const n = 2 + Math.floor(R() * 2); for (let k = 0; k < n; k++) { const a = R() * 6.28, d = k ? 16 + R() * 8 : 0; q.bs.push({ x:x + Math.cos(a) * d, y:y + Math.sin(a) * d, red:R() < .5 }); } }
    props.push(q);
  }
  for (let i = 0; i < 2; i++) lamps.push({ x:x0 + R() * CH, y:y0 + R() * CH, r:110 + R() * 50 });
  // générateurs électriques et cages de Pokémon capturés (tirés après le reste pour garder la disposition)
  const gens = [], cages = [], busy = (x, y, m) => machines.some(q => Math.abs(q.x - x) < q.w / 2 + m * .6 && Math.abs(q.y - y) < q.h / 2 + m * .6) || props.some(q => Math.hypot(q.x - x, q.y - y) < q.r + m) || spinners.some(q => Math.hypot(q.x - x, q.y - y) < m + 30) || gens.some(q => Math.abs(q.x - x) < 130 + m && Math.abs(q.y - 50 - y) < 70 + m) || cages.some(q => Math.hypot(q.x - x, q.y - y) < m + 34);
  for (let i = 0; i < 2; i++) if (R() < .4) { const x = x0 + 150 + R() * (CH - 300), y = y0 + 150 + R() * (CH - 220);
    if (forestDensity(x, y) > .4 && clear(x, y - 50, 150) && !busy(x, y - 60, 120) && !busy(x, y - 130, 90) && !busy(x - 105, y, 40) && !busy(x + 105, y, 40)) gens.push({ x, y, ph:R() * 6 }); }
  const CAPT = ["evoli", "evoli", "pikachu", "goupix", "caninos", "psykokwak", "melofee"];
  for (let i = 0; i < 2; i++) { const x = x0 + 80 + R() * (CH - 160), y = y0 + 80 + R() * (CH - 160), n = 1 + Math.floor(R() * 3), k0 = Math.floor(R() * 99);
    if (R() < .55 || forestDensity(x, y) < .4) continue;
    const row = []; for (let k = 0; k < n; k++) row.push({ x:x + (k - (n - 1) / 2) * 72, y, kind:CAPT[(k0 + k * 3) % CAPT.length], ph:R() * 6 });
    if (row.every(q => clear(q.x, q.y, 80) && !busy(q.x, q.y, 50))) cages.push(...row); }
  for (let k = crates.length - 1; k >= 0; k--) { const q = crates[k]; // les cartons cèdent la place
    if (gens.some(o => Math.abs(o.x - q.x) < 150 && q.y > o.y - 150 && q.y < o.y + 30) || cages.some(o => Math.abs(o.x - q.x) < 56 && Math.abs(o.y - 25 - q.y) < 60)) crates.splice(k, 1); }
  for (const q of gens) { solids.push({ x:q.x - 30, y:q.y - 34, r:36 }, { x:q.x + 30, y:q.y - 34, r:36 }); for (const s of [-1, 1]) solids.push({ x:q.x + s * 105, y:q.y - 8, r:15 }); }
  for (const q of cages) solids.push({ x:q.x - 14, y:q.y - 12, r:20 }, { x:q.x + 14, y:q.y - 12, r:20 });
  for (const q of props) {
    if (q.kind === "shelf") for (const o of [-28, 0, 28]) solids.push({ x:q.x + o, y:q.y, r:15 });
    else for (const b of q.bs) solids.push({ x:b.x, y:b.y, r:13 });
  }
  for (const q of crates) solids.push({ x:q.x, y:q.y, r:19 });
  for (const m of machines) { const k = Math.max(1, Math.round(m.w / m.h)); for (let i = 0; i < k; i++) solids.push({ x:m.x - m.w / 2 + m.h / 2 + i * (m.w - m.h) / Math.max(1, k - 1), y:m.y, r:m.h * .55 }); }
  return { ponds:[], trees:[], rocks:[], logs:[], walls:[], spikes:[], crystals:[], shrooms:[], crates, machines, spinners, solids, props, lamps, gens, cages, canvas:null, used:0 };
}
function pokeBallIcon(g, x, y, r) {
  circ(g, x, y, r, "#f2f2f2"); g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fillStyle = "#e23a3a"; g.fill();
  g.strokeStyle = "#1a1a1a"; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke(); circ(g, x, y, r * .35, "#f2f2f2");
}
function drawRocketProp(g, q) { // objets du Repaire Rocket, peints dans le sol du morceau de carte
  const { x, y } = q;
  if (q.kind === "tank") { // cuve de labo
    ell(g, x + 6, y + 9, 30, 26, "rgba(8,8,12,.45)"); circ(g, x, y, 29, "#3a404c"); circ(g, x, y, 25, "#20242c");
    const lg = g.createRadialGradient(x - 7, y - 7, 2, x, y, 22); lg.addColorStop(0, "rgba(190,255,225,.95)"); lg.addColorStop(1, "rgba(30,150,110,.9)"); circ(g, x, y, 22, lg);
    ell(g, x - 8, y - 9, 7, 4, "rgba(255,255,255,.4)", -.6);
    g.strokeStyle = "#8a929e"; g.lineWidth = 2; for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) { g.beginPath(); g.moveTo(x + Math.cos(a) * 22, y + Math.sin(a) * 22); g.lineTo(x + Math.cos(a) * 28, y + Math.sin(a) * 28); g.stroke(); }
  } else if (q.kind === "shelf") { // étagère de Poké Balls volées
    const w = 84, h = 30; g.fillStyle = "rgba(8,8,12,.45)"; g.fillRect(x - w / 2 + 6, y - h / 2 + 8, w, h);
    g.fillStyle = "#5a6272"; g.fillRect(x - w / 2, y - h / 2, w, h); g.fillStyle = "#262a32"; g.fillRect(x - w / 2 + 3, y - h / 2 + 3, w - 6, h - 6);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) pokeBallIcon(g, x - w / 2 + 10 + i * 12.8, y - h / 2 + 9 + r * 12, 4.6);
    g.fillStyle = "#7a8292"; g.fillRect(x - w / 2, y - 1, w, 2);
  } else if (q.kind === "statue") { // statue de Persian
    g.fillStyle = "rgba(8,8,12,.45)"; g.fillRect(x - 20 + 6, y - 20 + 8, 40, 40);
    g.fillStyle = "#6a6e78"; g.fillRect(x - 20, y - 20, 40, 40); g.fillStyle = "#555a64"; g.fillRect(x - 16, y - 16, 32, 32);
    g.fillStyle = "#c89a38"; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * 13, y - 4); g.lineTo(x + s * 15, y - 19); g.lineTo(x + s * 4, y - 10); g.closePath(); g.fill(); }
    ell(g, x, y, 14, 12, "#d8b04a"); ell(g, x - 4, y - 5, 6, 3, "rgba(255,240,180,.5)", -.3);
    circ(g, x, y - 7, 3.4, "#d02a3a"); circ(g, x - .8, y - 7.8, 1, "#ffc0c8");
    g.fillStyle = "#4a3410"; ell(g, x - 5, y - 1, 1.6, 3, "#4a3410"); ell(g, x + 5, y - 1, 1.6, 3, "#4a3410");
    g.strokeStyle = "rgba(90,60,20,.8)"; g.lineWidth = 1; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + s * 4, y + 5); g.lineTo(x + s * 17, y + 3); g.moveTo(x + s * 4, y + 6); g.lineTo(x + s * 17, y + 9); g.stroke(); }
  } else if (q.kind === "barrels") { // tonneaux
    for (const b of q.bs) { circ(g, b.x + 4, b.y + 6, 13, "rgba(8,8,12,.4)"); circ(g, b.x, b.y, 13, b.red ? "#9a2a26" : "#2e4e7e"); g.strokeStyle = "rgba(0,0,0,.45)"; g.lineWidth = 2; g.beginPath(); g.arc(b.x, b.y, 9, 0, Math.PI * 2); g.stroke();
      circ(g, b.x - 5, b.y - 5, 2, "rgba(255,255,255,.35)");
      if (b.red) { g.fillStyle = "#f0c030"; g.beginPath(); g.moveTo(b.x, b.y - 5); g.lineTo(b.x + 5, b.y + 4); g.lineTo(b.x - 5, b.y + 4); g.closePath(); g.fill(); g.fillStyle = "#1a1a1a"; g.fillRect(b.x - .7, b.y - 2, 1.4, 3.5); } }
  } else if (q.kind === "lift") { // chariot élévateur
    g.save(); g.translate(x, y); g.rotate(q.a);
    g.fillStyle = "rgba(8,8,12,.45)"; g.fillRect(-18 + 5, -15 + 7, 50, 30);
    g.fillStyle = "#8a929e"; g.fillRect(16, -11, 16, 4); g.fillRect(16, 7, 16, 4); g.fillStyle = "#3a3e46"; g.fillRect(13, -14, 4, 28);
    g.fillStyle = "#1a1c22"; for (const [wx, wy] of [[-14, -16], [6, -16], [-14, 12], [6, 12]]) g.fillRect(wx, wy, 8, 4);
    g.fillStyle = "#e0b030"; g.fillRect(-18, -14, 31, 28); g.fillStyle = "#b88a20"; g.fillRect(-18, -14, 8, 28);
    g.fillStyle = "#22252c"; g.fillRect(-8, -9, 14, 18); g.fillStyle = "rgba(255,255,255,.25)"; g.fillRect(-18, -14, 31, 3);
    g.restore();
  } else if (q.kind === "sign") { // affiche Team Rocket sur pied
    g.fillStyle = "rgba(8,8,12,.45)"; g.fillRect(x - 15 + 5, y - 20 + 7, 30, 40);
    g.fillStyle = "#1c1e24"; g.fillRect(x - 15, y - 20, 30, 40); g.strokeStyle = "#c03030"; g.lineWidth = 2; g.strokeRect(x - 14, y - 19, 28, 38);
    g.fillStyle = "#e23a3a"; g.font = "900 22px 'Pixelify Sans', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("R", x, y - 4);
    g.fillStyle = "#f0f0f0"; g.font = "700 6px 'Rubik', sans-serif"; g.fillText("ROCKET", x, y + 12);
  }
}
function renderRocketChunk(ci, cj) {
  if (rocketHG()) return renderRocketHG(ci, cj); // décor style HGSS (24c-repaire-rocket.js)
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH;
  const cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(-x0, -y0);
  const R = rng(Math.floor(hash(ci - 999, cj + 444) * 4294967295)), T = 64;
  // plaques de métal rivetées
  for (let ty = y0; ty < y0 + CH; ty += T) for (let tx = x0; tx < x0 + CH; tx += T) {
    const v = (hash(tx / T + 3, ty / T - 5) - .5) * 8;
    const pg = g.createLinearGradient(tx, ty, tx + T, ty + T); pg.addColorStop(0, `rgb(${92 + v},${98 + v},${108 + v})`); pg.addColorStop(1, `rgb(${74 + v},${80 + v},${90 + v})`);
    g.fillStyle = pg; g.fillRect(tx, ty, T, T);
    g.strokeStyle = "rgba(20,24,32,.6)"; g.lineWidth = 2; g.strokeRect(tx + 1, ty + 1, T - 2, T - 2);
    g.strokeStyle = "rgba(255,255,255,.08)"; g.lineWidth = 1; g.beginPath(); g.moveTo(tx + 3, ty + T - 3); g.lineTo(tx + 3, ty + 3); g.lineTo(tx + T - 3, ty + 3); g.stroke();
    for (const [rx, ry] of [[7, 7], [T - 7, 7], [7, T - 7], [T - 7, T - 7]]) { circ(g, tx + rx, ty + ry, 2.2, "#4a505c"); circ(g, tx + rx - .6, ty + ry - .6, 1, "#b8c0cc"); }
    if (hash(tx / T - 11, ty / T + 7) < .12) { g.strokeStyle = "rgba(30,34,42,.55)"; g.lineWidth = 1.5; for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo(tx + 10, ty + k * 10.5); g.lineTo(tx + T - 10, ty + k * 10.5); g.stroke(); } } // grille d'aération
  }
  for (let i = 0; i < 10; i++) ell(g, x0 + R() * CH, y0 + R() * CH, 6 + R() * 14, 3 + R() * 7, "rgba(20,20,26,.18)", R() * 3); // taches d'huile
  { g.globalCompositeOperation = "lighter"; // halos doux des lampes du plafond
    for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) for (const l of getChunk(ci + a, cj + b2).lamps || []) {
      const lg = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r); lg.addColorStop(0, "rgba(255,240,205,.11)"); lg.addColorStop(1, "rgba(255,240,205,0)"); g.fillStyle = lg; g.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
    g.globalCompositeOperation = "source-over"; }
  // allée centrale bordée de bandes de sécurité
  const band = (w, col, dash) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); for (let x = x0 - 40; x <= x0 + CH + 40; x += 16) x === x0 - 40 ? g.moveTo(x, pathY(x)) : g.lineTo(x, pathY(x)); g.stroke(); g.setLineDash([]); };
  band(122, "#e8c032"); band(122, "#22242a", [14, 14]); band(104, "#3c424e"); band(100, "#4a505e");
  for (let x = Math.ceil(x0 / 360) * 360; x < x0 + CH; x += 360) { // logo R au sol
    const y = pathY(x); g.save(); g.translate(x, y); g.rotate(Math.atan2(pathY(x + 1) - y, 1));
    circ(g, 0, 0, 30, "rgba(200,30,40,.85)"); circ(g, 0, 0, 25, "#2a2c34");
    g.fillStyle = "#e23a3a"; g.font = "900 34px 'Pixelify Sans', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("R", 0, 2); g.restore();
  }
  const all = { crates:[], machines:[], spinners:[] };
  for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) { const n = getChunk(ci + a, cj + b2); for (const k in all) all[k].push(...(n[k] || [])); }
  // flèches (le dessin animé des chevrons se fait en direct)
  for (const sp of all.spinners) { g.fillStyle = "#2a3040"; g.fillRect(sp.x - 25, sp.y - 25, 50, 50); g.strokeStyle = "#5a6a8a"; g.lineWidth = 2; g.strokeRect(sp.x - 24, sp.y - 24, 48, 48); }
  // machines
  for (const m of all.machines) {
    const x = m.x - m.w / 2, y = m.y - m.h / 2;
    g.fillStyle = "rgba(10,10,16,.45)"; g.fillRect(x + 8, y + 10, m.w, m.h);
    const mg = g.createLinearGradient(0, y, 0, y + m.h); mg.addColorStop(0, "#7a8496"); mg.addColorStop(1, "#4a5262");
    g.fillStyle = mg; g.fillRect(x, y, m.w, m.h); g.strokeStyle = "#262a34"; g.lineWidth = 2; g.strokeRect(x, y, m.w, m.h);
    g.fillStyle = "#1c2a24"; g.fillRect(x + 8, y + 7, m.w * .45, m.h - 14); // écran
    g.fillStyle = "rgba(90,230,140,.6)"; for (let k = 0; k < 4; k++) g.fillRect(x + 12, y + 11 + k * 6, (m.w * .45 - 10) * (.4 + hash(m.x + k, m.y) * .6), 2);
    for (let k = 0; k < 4; k++) { circ(g, x + m.w * .62 + (k % 2) * 14, y + 13 + Math.floor(k / 2) * 14, 4, "#2a2e38"); }
    g.fillStyle = "#5a6272"; for (let k = 0; k < 5; k++) g.fillRect(x + m.w * .82, y + 6 + k * (m.h - 12) / 5, m.w * .12, 2.5);
  }
  for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) for (const q of getChunk(ci + a, cj + b2).props || []) drawRocketProp(g, q);
  // caisses empilées
  for (const q of all.crates) for (let k = 0; k < q.n; k++) {
    const x = q.x + (k === 1 ? 6 : k === 2 ? -5 : 0), y = q.y - k * 14, s = 17 - k;
    g.fillStyle = "rgba(10,10,16,.35)"; g.fillRect(x - s + 6, y - s + 8, s * 2, s * 2);
    g.fillStyle = "#9a6e3e"; g.fillRect(x - s, y - s, s * 2, s * 2); g.strokeStyle = "#5a3e20"; g.lineWidth = 2; g.strokeRect(x - s, y - s, s * 2, s * 2);
    g.beginPath(); g.moveTo(x - s, y - s); g.lineTo(x + s, y + s); g.moveTo(x + s, y - s); g.lineTo(x - s, y + s); g.stroke();
    g.fillStyle = "rgba(255,230,180,.15)"; g.fillRect(x - s + 2, y - s + 2, s * 2 - 4, 3);
    if (k === q.n - 1 && q.ph < .35) { circ(g, x, y, 8, "#3a2a18"); g.fillStyle = "#d83030"; g.font = "900 12px 'Pixelify Sans', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("R", x, y + 1); } // tampon Rocket
  }
  c.canvas = cv2; return cv2;
}
/* Mont Sélénite : massifs rocheux, stalagmites et Pierres Lune */
