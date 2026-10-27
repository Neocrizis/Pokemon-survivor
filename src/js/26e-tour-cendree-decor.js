/* Tour Cendrée : plancher calciné (parquet de la Tour Chétiflor, HGSS, noirci), trous qui donnent sur le sous-sol, poutres brûlées, piliers, braises */
function burnedChunk(ci, cj) {
  const R = rng(Math.floor(hash(ci + 3000, cj - 3000) * 4294967295)), x0 = ci * CH, y0 = cj * CH;
  const holes = [], beams = [], pillars = [], planks = [], ashes = [], embers = [], solids = [];
  const far = (x, y, m) => Math.hypot(x, y - START_Y) > 300 + m;
  const inHole = (x, y, m) => holes.some(h => ((x - h.x) / (h.rx + m)) ** 2 + ((y - h.y) / (h.ry + m)) ** 2 < 1);
  if (R() < .5) { // un trou dans le plancher : on voit le sous-sol
    const x = x0 + 120 + R() * (CH - 240), y = y0 + 110 + R() * (CH - 220), rx = 100 + R() * 90, ry = 66 + R() * 46;
    if (far(x, y, rx)) { const pts = [], n = 22; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = .8 + R() * .26 + (i % 3 === 0 ? .08 : 0); pts.push(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k); }
      holes.push({ x, y, rx, ry, pts, sh:Math.floor(R() * 4) + 2, seed:R() }); }
  }
  for (let i = 0; i < 2; i++) if (R() < .6) { // poutres tombées, noircies par le feu
    const x = x0 + R() * CH, y = y0 + R() * CH, a = R() * Math.PI, len = 130 + R() * 100;
    if (!far(x, y, len / 2) || inHole(x, y, len / 2 + 20) || beams.some(b => Math.hypot(b.x - x, b.y - y) < 150)) continue;
    beams.push({ x, y, a, len, w:24 + R() * 10, seed:R() });
  }
  if (R() < .22) { const x = x0 + 60 + R() * (CH - 120), y = y0 + 80 + R() * (CH - 140); // un pilier calciné
    if (far(x, y, 60) && !inHole(x, y, 70) && !beams.some(b => Math.hypot(b.x - x, b.y - y) < b.len / 2 + 50)) pillars.push({ x, y, h:50 + R() * 40, seed:R() }); }
  for (let i = 0; i < 3; i++) { const x = x0 + R() * CH, y = y0 + R() * CH; if (!inHole(x, y, 30)) planks.push({ x, y, a:(R() - .5) * 1.2 + (R() < .3 ? Math.PI / 2 : 0), len:60 + R() * 40, burnt:R() }); }
  for (let i = 0; i < 2; i++) { const x = x0 + R() * CH, y = y0 + R() * CH; if (!inHole(x, y, 30)) ashes.push({ x, y, r:18 + R() * 20 }); }
  for (let i = 0; i < 2 + Math.floor(R() * 3); i++) { // braises qui couvent sous les planches
    const x = x0 + R() * CH, y = y0 + R() * CH, r = 36 + R() * 24;
    if (far(x, y, 60) && !inHole(x, y, r + 20) && !pillars.some(p => Math.hypot(p.x - x, p.y - y) < 70)) embers.push({ x, y, r, ph:R() * 6 });
  }
  for (const h of holes) { const span = Math.max(0, h.rx - h.ry) * .8; for (let k = -2; k <= 2; k++) solids.push({ x:h.x + k * span / 2, y:h.y, r:h.ry * .78, hole:true }); }
  for (const b of beams) for (let k = -2; k <= 2; k++) solids.push({ x:b.x + Math.cos(b.a) * k * b.len / 5, y:b.y + Math.sin(b.a) * k * b.len / 5, r:b.w * .65 });
  for (const p of pillars) solids.push({ x:p.x, y:p.y, r:28 });
  return { ponds:[], trees:[], rocks:[], logs:[], mounds:[], holes, beams, pillars, planks, ashes, embers, solids, canvas:null, used:0 };
}
function renderBurnedChunk(ci, cj) {
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH;
  const cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(-x0, -y0);
  g.beginPath(); g.rect(x0, y0, CH, CH); g.clip();
  // plancher : le parquet HGSS de la Tour Chétiflor, plus clair et cendré comme celui de la Tour Cendrée
  if (HG.img) { const K = HG.K, r = HG.R.floor, fw = r[2] * K, fh = r[3] * K;
    for (let ty = Math.floor(y0 / fh) * fh; ty < y0 + CH; ty += fh) for (let tx = Math.floor(x0 / fw) * fw; tx < x0 + CH; tx += fw) g.drawImage(HG.img, r[0], r[1], r[2], r[3], tx, ty, fw, fh);
    g.fillStyle = "rgba(196,170,140,.22)"; g.fillRect(x0, y0, CH, CH); }
  else { g.fillStyle = "#8a6a4a"; g.fillRect(x0, y0, CH, CH); }
  const G = 128; // traces de brûlure et planches carbonisées, sur une grille commune à tous les morceaux (pas de couture)
  for (let gy = Math.floor(y0 / G) - 1; gy <= Math.floor((y0 + CH) / G) + 1; gy++) for (let gx = Math.floor(x0 / G) - 1; gx <= Math.floor((x0 + CH) / G) + 1; gx++) {
    const h = hash(gx * 7 + 11, gy * 13 - 5), h2 = hash(gx - 99, gy + 77), x = (gx + h2) * G, y = (gy + hash(gx + 5, gy * 3)) * G;
    if (h < .32) { const r = 50 + h2 * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, "rgba(22,12,6,.55)"); gr.addColorStop(.6, "rgba(30,16,8,.25)"); gr.addColorStop(1, "rgba(30,16,8,0)");
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * .7, 0, 0, Math.PI * 2); g.fill(); }
    else if (h < .62) { const fh = HG.img ? HG.R.floor[3] * HG.K / 6 : 12, by = Math.floor(y / fh) * fh; g.fillStyle = `rgba(26,14,8,${.35 + h2 * .3})`; g.fillRect(x, by, 40 + h2 * 90, fh); // une planche brûlée
      g.fillStyle = "rgba(255,255,255,.06)"; g.fillRect(x, by, 40 + h2 * 90, 1.5); }
  }
  const all = { holes:[], beams:[], pillars:[], planks:[], ashes:[], embers:[] };
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const n = getChunk(ci + a, cj + b); for (const k in all) all[k].push(...(n[k] || [])); }
  for (const e of all.embers) { const gr = g.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 1.2); gr.addColorStop(0, "rgba(16,8,4,.85)"); gr.addColorStop(.7, "rgba(26,12,6,.5)"); gr.addColorStop(1, "rgba(26,12,6,0)"); // charbon sous les braises
    g.fillStyle = gr; g.beginPath(); g.ellipse(e.x, e.y, e.r * 1.2, e.r * .75, 0, 0, Math.PI * 2); g.fill(); }
  for (const h of all.holes) burnedHole(g, h);
  for (const a of all.ashes) { ell(g, a.x, a.y, a.r, a.r * .5, "rgba(70,66,62,.75)"); ell(g, a.x - a.r * .2, a.y - a.r * .12, a.r * .6, a.r * .28, "rgba(140,134,128,.6)"); }
  for (const p of all.planks) { g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(-p.len / 2 + 3, -4, p.len, 15);
    const gr = g.createLinearGradient(-p.len / 2, 0, p.len / 2, 0); gr.addColorStop(0, "#b08a62"); gr.addColorStop(Math.max(.05, p.burnt * .8), "#9a7450"); gr.addColorStop(1, "#1e120a");
    g.fillStyle = gr; g.fillRect(-p.len / 2, -7, p.len, 13); g.strokeStyle = "rgba(30,16,8,.8)"; g.lineWidth = 1.2; g.strokeRect(-p.len / 2, -7, p.len, 13); g.restore(); }
  const tall = [...all.beams.map(q => ({ q, k:"b" })), ...all.pillars.map(q => ({ q, k:"p" }))].sort((a, b) => a.q.y - b.q.y);
  for (const { q, k } of tall) k === "b" ? burnedBeam(g, q) : burnedPillar(g, q);
  c.canvas = cv2; return cv2;
}
function burnedHole(g, h) { // le trou : bord de planches cassées, et le sous-sol de pierre en contrebas
  const R = rng(h.seed * 1e9 | 0), path = () => { g.beginPath(); g.moveTo(h.pts[0], h.pts[1]); for (let i = 2; i < h.pts.length; i += 2) g.lineTo(h.pts[i], h.pts[i + 1]); g.closePath(); };
  g.save(); path(); g.fillStyle = "#3a4042"; g.fill(); g.clip();
  g.strokeStyle = "rgba(20,24,26,.6)"; g.lineWidth = 1.5; // dalles du sous-sol
  for (let y = h.y - h.ry; y < h.y + h.ry; y += 18) for (let x = h.x - h.rx + ((y / 18) % 2) * 14; x < h.x + h.rx; x += 28) g.strokeRect(x, y, 28, 18);
  for (let i = 0; i < h.sh; i++) { const x = h.x + (R() - .5) * h.rx * 1.3, y = h.y + R() * h.ry * .6; ell(g, x, y + 6, 12, 4, "rgba(0,0,0,.35)"); circ(g, x - 5, y, 8, "#1f4434"); circ(g, x + 5, y + 1, 8, "#21483a"); circ(g, x, y - 5, 8, "#2c5c48"); circ(g, x - 2, y - 7, 3, "#46806a"); } // buissons sombres
  const gr = g.createLinearGradient(0, h.y - h.ry, 0, h.y + h.ry); gr.addColorStop(0, "rgba(4,4,6,.92)"); gr.addColorStop(.45, "rgba(4,4,6,.35)"); gr.addColorStop(1, "rgba(4,4,6,.15)");
  g.fillStyle = gr; g.fillRect(h.x - h.rx * 1.2, h.y - h.ry * 1.2, h.rx * 2.4, h.ry * 2.4);
  g.restore();
  g.save(); path(); g.clip(); g.beginPath(); g.rect(h.x - h.rx * 2, h.y - h.ry * 2, h.rx * 4, h.ry * 4); // épaisseur du plancher, visible sur le bord du haut
  g.moveTo(h.pts[0], h.pts[1] + 11); for (let i = 2; i < h.pts.length; i += 2) g.lineTo(h.pts[i], h.pts[i + 1] + 11); g.closePath(); g.fillStyle = "#4a2c18"; g.fill("evenodd"); g.restore();
  path(); g.strokeStyle = "#1a0e06"; g.lineWidth = 5; g.stroke(); g.strokeStyle = "rgba(160,120,80,.5)"; g.lineWidth = 1.5; g.stroke();
  for (let i = 0; i < h.pts.length; i += 4) { // bouts de planches cassées qui dépassent
    const x = h.pts[i], y = h.pts[i + 1], a = Math.atan2(h.y - y, h.x - x), l = 10 + R() * 16, w = 7;
    g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = R() < .5 ? "#7a5a3c" : "#2a180e"; g.beginPath(); g.moveTo(-2, -w / 2); g.lineTo(l, -w / 2 + R() * 3); g.lineTo(l - 4, w / 2); g.lineTo(-2, w / 2); g.closePath(); g.fill();
    g.strokeStyle = "#140a04"; g.lineWidth = 1; g.stroke(); g.restore();
  }
}
function burnedBeam(g, b) { // poutre carbonisée : écailles de charbon et fentes rougeâtres
  const R = rng(b.seed * 1e9 | 0);
  g.save(); g.translate(b.x, b.y); g.rotate(b.a);
  g.fillStyle = "rgba(0,0,0,.3)"; g.fillRect(-b.len / 2 + 4, -b.w / 2 + 6, b.len, b.w);
  g.fillStyle = "#1e130c"; g.fillRect(-b.len / 2, -b.w / 2, b.len, b.w);
  g.fillStyle = "#3a2618"; g.fillRect(-b.len / 2, -b.w / 2, b.len, b.w * .38);
  g.strokeStyle = "#0c0704"; g.lineWidth = 1.4;
  for (let x = -b.len / 2 + 6; x < b.len / 2 - 4; x += 7 + R() * 6) { g.beginPath(); g.moveTo(x, -b.w / 2); g.lineTo(x + (R() - .5) * 4, b.w / 2); g.stroke(); }
  g.strokeStyle = "rgba(150,60,26,.75)"; g.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const x = (R() - .5) * b.len * .8; g.beginPath(); g.moveTo(x, -b.w * .1); g.lineTo(x + 6 + R() * 8, b.w * .2); g.stroke(); }
  for (const s of [-1, 1]) { g.fillStyle = "#120a06"; g.beginPath(); g.moveTo(s * b.len / 2, -b.w / 2); for (let k = 0; k <= 4; k++) g.lineTo(s * (b.len / 2 + (k % 2 ? 6 : 0)), -b.w / 2 + b.w * k / 4); g.closePath(); g.fill(); } // bouts déchiquetés
  g.strokeStyle = "rgba(0,0,0,.7)"; g.lineWidth = 1.5; g.strokeRect(-b.len / 2, -b.w / 2, b.len, b.w);
  g.restore();
}
function burnedPillar(g, p) { // tronçon de pilier calciné sur son socle de pierre
  const R = rng(p.seed * 1e9 | 0), r = 28, top = p.y - p.h;
  ell(g, p.x + 6, p.y + 6, r + 14, 12, "rgba(0,0,0,.3)");
  ell(g, p.x, p.y + 2, r + 10, 13, "#55524e"); ell(g, p.x, p.y - 2, r + 8, 11, "#7a7672");
  const gr = g.createLinearGradient(p.x - r, 0, p.x + r, 0); gr.addColorStop(0, "#1a0c06"); gr.addColorStop(.35, "#7a3a20"); gr.addColorStop(.55, "#8c4a2a"); gr.addColorStop(1, "#24120a");
  g.fillStyle = gr; g.fillRect(p.x - r, top, r * 2, p.h); ell(g, p.x, p.y - 2, r, 9, "#3a1a0e");
  g.strokeStyle = "rgba(20,8,4,.45)"; g.lineWidth = 1; for (let x = p.x - r + 6; x < p.x + r - 3; x += 6) { g.beginPath(); g.moveTo(x, top + 6); g.lineTo(x, p.y - 4); g.stroke(); }
  const gb = g.createLinearGradient(0, top, 0, top + p.h * .7); gb.addColorStop(0, "rgba(8,4,2,.95)"); gb.addColorStop(1, "rgba(8,4,2,0)"); g.fillStyle = gb; g.fillRect(p.x - r, top, r * 2, p.h * .7); // le haut, noirci
  g.fillStyle = "#0e0704"; g.beginPath(); g.moveTo(p.x - r, top + 6); for (let k = 0; k <= 8; k++) g.lineTo(p.x - r + r * 2 * k / 8, top + (k % 2 ? -10 - R() * 14 : 4 + R() * 6)); g.lineTo(p.x + r, top + 10); g.closePath(); g.fill(); // cassure déchiquetée
  ell(g, p.x, top + 4, r * .8, 6, "#060302");
}
