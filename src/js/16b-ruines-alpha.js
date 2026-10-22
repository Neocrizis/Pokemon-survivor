/* ---------- Johto : Ruines d'Alpha (Zarbi en formation, boue de Maraiste, Futur Sens, dalle-puzzle, Carnet Zarbi) ---------- */
const ZARBI_WORDS = ["SORTIE", "LUMIERE", "EAU", "HO OH", "AMITIE", "POKEMON"]; // inscriptions des salles des ruines (HeartGold/SoulSilver)
const PUZZLES = [ // les quatre dalles et les Zarbi qu'elles réveillent (HeartGold/SoulSilver), avec le message gravé dans leur salle secrète
  { name:"Kabuto",  from:"A", to:"J", msg:"NOUS CLAN GRAVE ICI MOTS", col:"#c89a50" },
  { name:"Amonita", from:"K", to:"Q", msg:"ILS ONT POUVOIR SENTIR LE ESPRIT", col:"#6aa8d8" },
  { name:"Ptéra",   from:"R", to:"V", msg:"NOUS SCULPTONS ROCS COMME POKEMON", col:"#b08ac8" },
  { name:"Ho-Oh",   from:"W", to:"Z", msg:"HUMAINS NOUS MARCHER AVEC EUX", col:"#e07848" },
];
const PUZ_NEED = 6, PUZ_R = 62; // secondes à tenir sur la dalle, rayon de la dalle
const zarbiRange = p => ZARBI_L.slice(ZARBI_L.indexOf(p.from), ZARBI_L.indexOf(p.to) + 1);
function alphSpawn(f, placed) { // à l'apparition : lettre du Zarbi, Axoloto et Maraiste sortent d'un étang proche
  if (f.d.zarbi) { const L = S.zl && S.zl.length ? S.zl : ZARBI_L.slice(0, 26); f.spr = "zarbi_" + L[Math.random() * L.length | 0]; }
  if (f.d.pond && !placed && Math.random() < .6) {
    const c = spawnNear(), ci = Math.floor(c.x / CH), cj = Math.floor(c.y / CH), ponds = [];
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const pd of getChunk(ci + a, cj + b).ponds) { const d = Math.hypot(pd.x - c.x, pd.y - c.y); if (d > 300 && d < 900) ponds.push(pd); }
    const pd = ponds[Math.random() * ponds.length | 0];
    if (pd) { const a = Math.random() * Math.PI * 2; f.x = pd.x + Math.cos(a) * pd.rx * .4; f.y = pd.y + Math.sin(a) * pd.ry * .4; S.fxs.push({ x:f.x, y:f.y, r:0, max:f.r * 2.2, life:.35, col:"rgba(150,200,255," }); }
  }
}
function zarbiWord(P) { // des Zarbi s'alignent au-dessus du joueur pour écrire un mot, puis foncent tout droit vers le bas
  const w = ZARBI_WORDS[Math.random() * ZARBI_WORDS.length | 0], sy = -1, gap = 36, x0 = P.x - (w.length - 1) * gap / 2, y = P.y + sy * 235;
  [...w].forEach((c, i) => {
    if (c === " ") return;
    const f = spawnFoe("zarbi", x0 + i * gap, y); f.spr = "zarbi_" + c; f.hold = 1.8; f.run = { dx:0, dy:-sy, t:1.8 + 2.4 };
    S.fxs.push({ x:f.x, y:f.y, r:0, max:30, life:.3, col:"rgba(200,170,255," });
  });
  banner(`Des Zarbi s'alignent et écrivent « ${w} »… Écarte-toi !`);
}
function startPuzzle() {
  const P = S.P, k = Math.random() * PUZZLES.length | 0;
  let x = P.x + 380, y = P.y;
  for (let n = 0; n < 40; n++) { const a = Math.random() * Math.PI * 2, d = 340 + Math.random() * 120; x = P.x + Math.cos(a) * d; y = P.y + Math.sin(a) * d;
    if (!solidsNear(x, y).some(o => Math.hypot(o.x - x, o.y - y) < o.r * 2 + PUZ_R + 10)) break; } // loin des salles et des colonnes
  S.puz = { x, y, k, prog:0, t:60, spT:0 };
  banner(`Une dalle-puzzle de ${PUZZLES[k].name} sort du sol ! Tiens-toi dessus pour la résoudre.`); sfx("ach");
}
function updatePuzzle(dt) {
  const z = S.puz, pz = PUZZLES[z.k];
  if (z.done) { if ((z.t -= dt) <= 0) S.puz = null; return; }
  const on = S.players.some(p => !p.down && Math.hypot(p.x - z.x, p.y - z.y) < PUZ_R);
  z.prog = on ? z.prog + dt : Math.max(0, z.prog - dt * .5);
  if (on) { S.zl = zarbiRange(pz); // les Zarbi de ce puzzle se réveillent et accourent
    if ((z.spT -= dt) <= 0) { z.spT = .45; const a = Math.random() * Math.PI * 2; spawnFoe("zarbi", z.x + Math.cos(a) * 460, z.y + Math.sin(a) * 460); } }
  if (z.prog >= PUZ_NEED) {
    z.done = true; z.t = 4; S.zl = zarbiRange(pz); S.zlT = 40; sfx("chest");
    S.gems.push({ x:z.x, y:z.y, pick:"chest" }, { x:z.x - 30, y:z.y + 20, pick:"sitrus" }, { x:z.x + 30, y:z.y + 20, pick:"sitrus" });
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; spawnFoe("zarbi", z.x + Math.cos(a) * 520, z.y + Math.sin(a) * 520); }
    S.fxs.push({ x:z.x, y:z.y, r:0, max:180, life:.6, col:"rgba(255,230,150," });
    banner(`Puzzle de ${pz.name} résolu ! Les Zarbi ${pz.from} à ${pz.to} se réveillent…`);
    S.seq = [...(S.seq || []), [S.t + 3, `Une inscription apparaît : « ${pz.msg} »`]];
    return;
  }
  if ((z.t -= dt) <= 0) { S.puz = null; S.zl = null; banner("La dalle-puzzle s'enfonce dans le sol… Trop tard !"); }
}
function zarbiCarnet(f) { // Carnet Zarbi : chaque lettre vaincue est notée (gardée avec les succès, donc synchronisée en ligne)
  const c = f.spr && f.spr.slice(6); if (!c || !/^[A-Z]$/.test(c) || achs["zb_" + c]) return;
  achs["zb_" + c] = true; try { localStorage.setItem("pokesurv-ach", JSON.stringify(achs)); } catch (e) {} cloudSoon();
  const n = ZARBI_L.slice(0, 26).filter(l => achs["zb_" + l]).length;
  S.texts.push({ x:f.x, y:f.y - 34, txt:`Carnet Zarbi : ${c} (${n}/26)`, col:"#d8c0ff", life:1.4, label:true });
  if (n >= 26) achGet("zarbi");
}
function updateAlph(dt) {
  if (!LEVEL.alph) return false;
  for (const m of S.muds) m.life -= dt; S.muds = S.muds.filter(m => m.life > 0);
  for (const mk of S.marks) { mk.t -= dt; if (mk.t <= 0 && !mk.hit) { mk.hit = true; S.fxs.push({ x:mk.x, y:mk.y, r:0, max:mk.r * 1.3, life:.35, col:"rgba(230,130,255," }); emit(mk.x, mk.y, 14, "psy", { sp:220, life:.45, r:3 }); S.shake = Math.max(S.shake, .15); if (boomHit(mk.x, mk.y, mk.r, mk.dmg, "psy")) return true; } }
  S.marks = S.marks.filter(mk => mk.t > -.3);
  if (S.zlT > 0 && (S.zlT -= dt) <= 0) S.zl = null;
  if (S.puz) updatePuzzle(dt);
  if (S.t > 60 && (S.wdT = (S.wdT ?? 75) - dt) <= 0) { S.wdT = 38 + Math.random() * 16; zarbiWord(nearP(S.cam.x, S.cam.y)); }
  for (const f of S.foes) {
    if (f.hp <= 0 || f.prop || f.sleepT > 0 || f.stunT > 0) continue;
    const P = S.P = nearP(f.x, f.y), dx = P.x - f.x, dy = P.y - f.y, l = Math.hypot(dx, dy);
    if (f.d.mud && (f.mdT = (f.mdT ?? Math.random()) - dt) <= 0) { // Maraiste : flaques de boue qui ralentissent
      f.mdT = f.d.boss ? .3 : 2.5;
      if (S.muds.length < 140) S.muds.push({ x:f.x, y:f.y + f.r * .4, r:f.r * (f.d.boss ? 1 : 1.4), life:5, max:5, ph:Math.random() * 6 });
    }
    if (f.d.aquaFan && (f.afT = (f.afT ?? 2) - dt) <= 0 && l < 700) { // Axoloto géant : Pistolet à O en éventail
      f.afT = 2.4; const a0 = Math.atan2(dy, dx);
      for (let i = -2; i <= 2; i++) { const a = a0 + i * .2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 250, vy:Math.sin(a) * 250, dmg:12, life:2.6, type:"eau", r:8 }); }
      if (!f.saidA) { f.saidA = true; banner(`${f.d.name} utilise Pistolet à O et couvre le sol de boue !`); }
    }
    if (f.d.future && (f.fsT = (f.fsT ?? 2.5) - dt) <= 0 && l < 800) { // Xatu géant : Futur Sens, l'impact tombe là où tu étais
      f.fsT = 3.2;
      for (const q of S.players) if (!q.down) for (let i = 0; i < 3; i++) S.marks.push({ x:q.x + (i ? (Math.random() - .5) * 260 : 0), y:q.y + (i ? (Math.random() - .5) * 200 : 0), r:66, t:1.5, max:1.5, dmg:f.d.dmg });
      if (!f.saidF) { f.saidF = true; banner(`${f.d.name} utilise Futur Sens ! Ne reste pas dans les cercles.`); }
    }
    if (f.d.zarbiBoss) { // Zarbi ? et ! géants : Puissance Cachée en spirale, et des Zarbi en formation
      if ((f.hcT = (f.hcT ?? 1.5) - dt) <= 0) {
        f.hcT = f.d.zarbiBoss === "!" ? .18 : 2.6; f.hcA = (f.hcA || 0) + (f.d.zarbiBoss === "!" ? .5 : .26);
        const n = f.d.zarbiBoss === "!" ? 2 : 12;
        for (let i = 0; i < n; i++) { const a = f.hcA + i / n * Math.PI * 2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 190, vy:Math.sin(a) * 190, dmg:11, life:3, type:"psy", r:7 }); }
        if (!f.saidH) { f.saidH = true; banner(`${f.d.name} utilise Puissance Cachée !`); }
      }
      if (f.d.zarbiBoss === "?" && (f.wbT = (f.wbT ?? 5) - dt) <= 0) { f.wbT = 9; zarbiWord(P); }
    }
    if (f.d.sketch && !f.skT && l < 450) { // Queulorior : Gribouille copie le type du joueur le plus proche
      f.skT = ptype(); banner(`Queulorior utilise Gribouille et copie tes attaques ${TYPE_NAMES[f.skT] || ""} !`);
      S.texts.push({ x:f.x, y:f.y - f.r - 24, txt:"Gribouille !", col:TYPE_COLORS[f.skT] || "#fff", life:1.2, label:true });
    }
  }
  return false;
}
function drawAlphUnder(t) { // sol : boue, cercles de Futur Sens, dalle-puzzle
  if (!LEVEL.alph) return;
  for (const m of S.muds) {
    const a = Math.min(1, m.life * 1.5, (m.max - m.life) * 4);
    ell(cx, m.x, m.y, m.r, m.r * .62, `rgba(92,64,38,${.8 * a})`); ell(cx, m.x - m.r * .2, m.y - m.r * .12, m.r * .55, m.r * .28, `rgba(134,98,60,${.7 * a})`);
    circ(cx, m.x + Math.sin(S.t * 1.5 + m.ph) * m.r * .4, m.y, 2 + Math.abs(Math.sin(S.t * 2 + m.ph)) * 1.6, `rgba(170,130,84,${.7 * a})`);
  }
  if (S.puz) drawPuzzle(S.puz, t);
  for (const mk of S.marks) {
    if (mk.t <= 0) continue; const k = 1 - mk.t / mk.max;
    ell(cx, mk.x, mk.y, mk.r, mk.r * .62, `rgba(180,60,220,${.12 + .2 * k})`);
    cx.save(); cx.strokeStyle = `rgba(240,160,255,${.5 + .4 * Math.sin(t * 25)})`; cx.lineWidth = 3; cx.beginPath(); cx.ellipse(mk.x, mk.y, mk.r, mk.r * .62, 0, 0, Math.PI * 2); cx.stroke();
    cx.beginPath(); cx.ellipse(mk.x, mk.y, mk.r * k, mk.r * .62 * k, 0, 0, Math.PI * 2); cx.stroke(); cx.restore();
  }
}
function drawPuzzle(z, t) { // dalle de pierre 4×4 : les pièces se remettent en place pendant qu'on tient dessus
  const pz = PUZZLES[z.k], S4 = PUZ_R * 1.6, c = S4 / 4, x0 = z.x - S4 / 2, y0 = z.y - S4 / 2, ok = z.done ? 16 : Math.floor(z.prog / PUZ_NEED * 16);
  cx.fillStyle = "rgba(0,0,0,.3)"; cx.fillRect(x0 + 5, y0 + 7, S4, S4);
  cx.fillStyle = "#6a6458"; cx.fillRect(x0 - 6, y0 - 6, S4 + 12, S4 + 12); cx.fillStyle = "#8c8574"; cx.fillRect(x0 - 3, y0 - 3, S4 + 6, S4 + 6);
  const order = [5, 10, 0, 15, 6, 9, 3, 12, 1, 14, 7, 8, 2, 13, 4, 11];
  for (let i = 0; i < 16; i++) {
    const gx = i % 4, gy = i / 4 | 0, placed = order.indexOf(i) < ok, wob = placed ? 0 : Math.sin(t * 3 + i) * 1.5;
    const px = x0 + gx * c + wob, py = y0 + gy * c + (placed ? 0 : 3);
    cx.fillStyle = placed ? "#c8b48a" : "#9a8c70"; cx.fillRect(px + 2, py + 2, c - 4, c - 4);
    cx.fillStyle = placed ? "#e2d2a8" : "#ad9f82"; cx.fillRect(px + 2, py + 2, c - 4, 4);
    if (placed) { // motif du fossile : un disque gravé dont chaque pièce porte un morceau
      cx.save(); cx.beginPath(); cx.rect(px + 2, py + 2, c - 4, c - 4); cx.clip();
      cx.strokeStyle = pz.col; cx.lineWidth = 5; cx.beginPath(); cx.arc(z.x, z.y, S4 * .3, 0, Math.PI * 2); cx.stroke();
      cx.lineWidth = 3; cx.beginPath(); cx.moveTo(z.x - S4 * .3, z.y); cx.lineTo(z.x + S4 * .3, z.y); cx.moveTo(z.x, z.y - S4 * .3); cx.lineTo(z.x, z.y + S4 * .3); cx.stroke();
      circ(cx, z.x, z.y, S4 * .1, pz.col); cx.restore();
    }
  }
  if (!z.done) { // anneau de progression et nom de la dalle
    cx.save(); cx.strokeStyle = "rgba(0,0,0,.35)"; cx.lineWidth = 6; cx.beginPath(); cx.arc(z.x, z.y, PUZ_R + 14, 0, Math.PI * 2); cx.stroke();
    cx.strokeStyle = pz.col; cx.beginPath(); cx.arc(z.x, z.y, PUZ_R + 14, -Math.PI / 2, -Math.PI / 2 + z.prog / PUZ_NEED * Math.PI * 2); cx.stroke(); cx.restore();
    cx.font = "10px 'Press Start 2P', monospace"; cx.textAlign = "center"; cx.lineWidth = 3; cx.strokeStyle = "rgba(0,0,0,.75)";
    const lab = `Dalle ${pz.name} · ${Math.ceil(z.t)} s`; cx.strokeText(lab, z.x, y0 - 18); cx.fillStyle = "#f4ead0"; cx.fillText(lab, z.x, y0 - 18); cx.textAlign = "left";
  } else { cx.save(); cx.globalCompositeOperation = "lighter"; glow(z.x, z.y, S4, "255,220,140", .5 * Math.min(1, z.t)); cx.restore(); }
}
function drawAlphOver(t, CAM, vw, vh) { // flèche vers la dalle-puzzle quand elle est hors de l'écran
  if (!LEVEL.alph || !S.puz || S.puz.done) return;
  const z = S.puz, hx = vw / 2 - 34, hy = vh / 2 - 44, dx = z.x - CAM.x, dy = z.y - CAM.y;
  if (Math.abs(dx) < hx && Math.abs(dy) < hy) return;
  const k = Math.min(hx / Math.abs(dx || 1), hy / Math.abs(dy || 1)), x = CAM.x + dx * k, y = CAM.y + dy * k, a = Math.atan2(dy, dx);
  cx.save(); cx.translate(x, y); cx.rotate(a); cx.globalAlpha = .8 + .2 * Math.sin(t * 8);
  cx.fillStyle = PUZZLES[z.k].col; cx.strokeStyle = "#1a1408"; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(18, 0); cx.lineTo(-10, -13); cx.lineTo(-4, 0); cx.lineTo(-10, 13); cx.closePath(); cx.stroke(); cx.fill(); cx.restore();
}
/* décor : salles de pierre, colonnes et murets à la place d'une partie des arbres, sentier dallé */
function alphRuins(trees) {
  for (const t of trees) { const k = hash(Math.round(t.x), Math.round(t.y)); if (k < .72) { t.ruin = k < .3 ? 1 : k < .55 ? 2 : 3; t.trunk = t.r * (t.ruin === 1 ? .62 : t.ruin === 2 ? .3 : .42); } }
}
function alphPath(g, x0, y0) { // dalles beiges le long du sentier
  const T = 32;
  for (let ty = Math.floor(y0 / T) * T; ty < y0 + CH; ty += T) for (let tx = Math.floor(x0 / T) * T; tx < x0 + CH; tx += T) {
    const d = Math.abs(ty + T / 2 - pathY(tx + T / 2)); if (d > 50) continue;
    const h = hash(tx / T | 0, ty / T | 0), sh = 150 + h * 26 | 0;
    if (d > 38 && h < .45) continue; // bords irréguliers
    g.fillStyle = "#6c6450"; g.fillRect(tx, ty, T, T);
    g.fillStyle = `rgb(${sh + 30},${sh + 18},${sh - 14})`; g.fillRect(tx + 1, ty + 1, T - 3, T - 3);
    g.fillStyle = `rgb(${sh + 46},${sh + 34},${sh})`; g.fillRect(tx + 1, ty + 1, T - 3, 3);
    if (h > .8) { g.strokeStyle = "rgba(80,70,50,.55)"; g.lineWidth = 1; g.beginPath(); g.moveTo(tx + 6, ty + 8); g.lineTo(tx + 14, ty + 16); g.lineTo(tx + 12, ty + 24); g.stroke(); }
    if (h < .12) ell(g, tx + 22, ty + 22, 5, 3, "#6f9a48");
  }
}
const ALPH_GLYPH = [[0,1,1,1,0, 1,0,1,0,1, 1,1,1,1,1, 0,1,0,1,0], [1,0,0,0,1, 0,1,1,1,0, 0,1,0,1,0, 0,1,1,1,0], [0,1,1,1,0, 1,1,0,1,1, 0,1,1,1,0, 0,0,1,0,0]]; // motifs de Zarbi gravés (5×4)
function alphBlocks(g, x, y, w, h, R, top) { // pan de mur en blocs de pierre
  g.fillStyle = "#5e5444"; g.fillRect(x, y, w, h);
  for (let ry = 0, row = 0; ry < h; ry += 12, row++) for (let rx = -(row % 2) * 9; rx < w; rx += 18) {
    const bx = Math.max(x, x + rx), bw = Math.min(x + rx + 17, x + w) - bx, bh = Math.min(11, h - ry); if (bw <= 1) continue;
    const s = 168 + R() * 26 | 0; g.fillStyle = `rgb(${s + 22},${s + 8},${s - 30})`; g.fillRect(bx, y + ry, bw, bh);
    g.fillStyle = `rgb(${s + 40},${s + 28},${s - 6})`; g.fillRect(bx, y + ry, bw, 2);
  }
  if (top) { g.fillStyle = "#e4d4a8"; g.fillRect(x - 3, y - 6, w + 6, 7); g.fillStyle = "#b8a478"; g.fillRect(x - 3, y, w + 6, 2); }
}
function alphRuinSprite(t) {
  const rb = Math.round(t.r / 6) * 6, key = "al" + t.ruin + "_" + rb + "_" + (t.v % 3); let s = canopyCache.get(key); if (s) return s;
  const R = rng(rb * 13 + t.ruin * 101 + t.v), W = Math.ceil(rb * 2.4), H = Math.ceil(rb * 2.6), cv2 = document.createElement("canvas"); cv2.width = W * CH_SCALE; cv2.height = H * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); const mx = W / 2, base = H - 8;
  ell(g, mx + 6, base, W * .44, 9, "rgba(10,25,10,.35)");
  if (t.ruin === 1) { // petite salle des ruines : façade en blocs, porte sombre, Zarbi gravés
    const w = rb * 2, h = rb * 1.5, x = mx - w / 2, y = base - h;
    g.fillStyle = "#cfc09a"; g.fillRect(x - 4, y - rb * .5, w + 8, rb * .5); g.fillStyle = "#a8986e"; g.fillRect(x - 4, y - 4, w + 8, 4); // toit plat vu de dessus
    for (let k = 0; k < 4; k++) { g.fillStyle = "rgba(120,104,70,.35)"; g.fillRect(x + k * w / 4, y - rb * .5, 2, rb * .5 - 4); }
    alphBlocks(g, x, y, w, h, R, false);
    const dw = rb * .5, dh = h * .62; g.fillStyle = "#1c140c"; g.beginPath(); g.moveTo(mx - dw / 2, base); g.lineTo(mx - dw / 2, base - dh + dw / 2); g.arc(mx, base - dh + dw / 2, dw / 2, Math.PI, 0); g.lineTo(mx + dw / 2, base); g.fill();
    g.fillStyle = "#3a2c1c"; g.fillRect(mx - dw / 2 - 3, base - 2, dw + 6, 3);
    const gl = ALPH_GLYPH[t.v % 3]; for (const sx of [-1, 1]) for (let i = 0; i < 20; i++) if (gl[i]) { g.fillStyle = "#5a4c34"; g.fillRect(mx + sx * w * .3 - 7 + (i % 5) * 3, y + h * .3 + (i / 5 | 0) * 3, 3, 3); }
  } else if (t.ruin === 2) { // colonne, parfois brisée
    const w = rb * .7, h = rb * (1.3 + R() * .7), x = mx - w / 2, y = base - h, broken = R() < .5;
    g.fillStyle = "#8a7a58"; g.fillRect(x - 6, base - 10, w + 12, 10); g.fillStyle = "#cfc09a"; g.fillRect(x - 6, base - 12, w + 12, 3);
    const cg = g.createLinearGradient(x, 0, x + w, 0); cg.addColorStop(0, "#e2d2a8"); cg.addColorStop(.45, "#c8b484"); cg.addColorStop(1, "#8e7c56");
    g.fillStyle = cg; g.fillRect(x, y, w, h - 10);
    g.strokeStyle = "rgba(90,76,52,.5)"; g.lineWidth = 1.5; for (let ry = y + 14; ry < base - 12; ry += 14) { g.beginPath(); g.moveTo(x, ry); g.lineTo(x + w, ry); g.stroke(); }
    if (broken) { g.fillStyle = "#5e5444"; g.beginPath(); g.moveTo(x, y); g.lineTo(x + w * .3, y - 6); g.lineTo(x + w * .55, y + 4); g.lineTo(x + w, y - 3); g.lineTo(x + w, y + 4); g.lineTo(x, y + 4); g.fill(); }
    else { g.fillStyle = "#e4d4a8"; g.fillRect(x - 5, y - 8, w + 10, 9); g.fillStyle = "#a8986e"; g.fillRect(x - 5, y, w + 10, 2); }
    if (R() < .5) ell(g, x + w * .3, y + h * .5, 6, 3, "#6f9a48");
  } else { // muret effondré et blocs tombés
    const w = rb * 2, h = rb * .55, x = mx - w / 2, y = base - h;
    alphBlocks(g, x, y, w * .7, h, R, true); alphBlocks(g, x + w * .74, y + h * .45, w * .26, h * .55, R, true);
    for (let k = 0; k < 2; k++) { const bx = x + w * (.2 + R() * .6), by = base + 2 + R() * 4; g.fillStyle = "#8e7c56"; g.fillRect(bx, by - 8, 14, 9); g.fillStyle = "#cfc09a"; g.fillRect(bx, by - 8, 14, 3); }
    ell(g, x + w * .2, y + 2, 9, 4, "#6f9a48");
  }
  s = { cv:cv2, W, H, base }; canopyCache.set(key, s); return s;
}
