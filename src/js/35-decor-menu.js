/* Écran de choix : les côtés vides prennent le décor du niveau choisi (vrai sol du niveau, arbres, etc.) */
const DECO = { cvs:[], key:"" };
function decoSide(side) {
  let c = DECO.cvs[side];
  if (!c) { c = document.createElement("canvas"); c.className = "sideDeco " + (side ? "r" : "l"); c.setAttribute("aria-hidden", "true"); $("start").prepend(c); DECO.cvs[side] = c; }
  return c;
}
function drawDeco(force) {
  const ov = $("start"); if (!ov || ov.hidden) return;
  const sh = ov.querySelector(".sheet").getBoundingClientRect(), W = Math.floor(Math.max(0, sh.left - 8)), H = innerHeight;
  const key = LEVELS.indexOf(LEVEL) + ":" + W + "x" + H;
  for (let s = 0; s < 2; s++) decoSide(s).hidden = W < 140;
  if (W < 140 || (!force && key === DECO.key)) return; DECO.key = key;
  const Z = .8; // un peu dézoomé : on voit plus du niveau
  for (let s = 0; s < 2; s++) {
    const c = decoSide(s); c.width = W; c.height = H; const g = c.getContext("2d");
    if (LEVEL.league) leagueDeco(g, s, W, H, Z);
    else if (LEVEL.maps) birdDeco(g, s, W, H, Z);
    else paintView(g, s ? 900 : -900 - W / Z, START_Y - 1400 - H / Z / 2, W, H, Z); // loin du départ, là où le niveau est bien garni
    g.fillStyle = "rgba(10,18,13,.38)"; g.fillRect(0, 0, W, H); // assombri : le starter reste la vedette
  }
}
function paintView(g, camX, camY, W, H, Z) {
  const vw = W / Z, vh = H / Z;
  g.save(); g.scale(Z, Z); g.translate(-camX, -camY);
  g.fillStyle = LEVEL.rocket ? "#4a505c" : LEVEL.tower ? (LEVEL.sprout ? "#6a4a2c" : "#3a3446") : LEVEL.manor ? "#4a3020" : LEVEL.theme ? (CAVE_PAL[LEVEL.theme] || {}).base || "#2c2834" : LEVEL.cave ? "#2c2834" : LEVEL.safari ? "#b89a50" : "#3d6e38";
  g.fillRect(camX, camY, vw, vh);
  const i0 = Math.floor(camX / CH), j0 = Math.floor(camY / CH), i1 = Math.floor((camX + vw) / CH), j1 = Math.floor((camY + vh) / CH);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const ch = getChunk(i, j); if (!ch.canvas) renderChunk(i, j); if (ch.canvas) g.drawImage(ch.canvas, i * CH, j * CH, CH, CH); }
  if (!LEVEL.cave && !LEVEL.tower && !LEVEL.manor && !LEVEL.rocket && !LEVEL.league) // cimes des arbres (forêt, safari)
    for (let j = j0 - 1; j <= j1 + 1; j++) for (let i = i0 - 1; i <= i1 + 1; i++) for (const tr of getChunk(i, j).trees || []) {
      const sp = LEVEL.safari ? acaciaSprite(tr.r, tr.v) : canopySprite(tr.r, tr.v); g.drawImage(sp.cv, tr.x - sp.size / 2, tr.y - tr.r * .55 - sp.size / 2, sp.size, sp.size);
    }
  g.restore();
}
function leagueDeco(g, s, W, H, Z) { // Ligue : la salle du Champion, vue de l'intérieur (dehors, il n'y a rien)
  const A = arena(), k0 = LEVEL.roomIdx || 0;
  setRoom(LEVEL.rooms.length - 1); paintView(g, s ? A.x1 - 60 - W / Z : A.x0 + 60, START_Y - H / Z / 2, W, H, Z); setRoom(k0);
}
function birdDeco(g, s, W, H, Z) { // Oiseau Légendaire : les trois cartes en bandes, de chaque côté
  const k0 = LEVEL.mapIdx || 0, n = LEVEL.maps.length;
  for (let b = 0; b < n; b++) {
    const y0 = Math.round(b * H / n), h = Math.round((b + 1) * H / n) - y0, mp = LEVEL.maps[b];
    pickMap(b); g.save(); g.beginPath(); g.rect(0, y0, W, h); g.clip(); g.translate(0, y0);
    paintView(g, s ? 900 : -900 - W / Z, START_Y - 1400 - h / Z / 2, W, h, Z); g.restore();
    if (b) { g.fillStyle = "rgba(120,140,210,.75)"; g.fillRect(0, y0 - 2, W, 4); }
    g.font = "bold 13px Outfit, sans-serif"; g.textAlign = s ? "right" : "left"; g.fillStyle = "rgba(220,230,255,.95)";
    g.fillText(mp.mapName, s ? W - 16 : 16, y0 + (b ? 22 : 64));
  }
  pickMap(k0);
}

/* Diorama vivant posé sur ce décor : ce que le niveau choisi réserve.
   Les Pokémon sauvages s'y promènent ; les boss attendent près du bord.
   Jamais battu : silhouette noire, comme au Pokédex. Survol : nom et K.O. */
const LIFE = { cv:[], pills:[], mobs:[[], []], key:"", mx:-1, my:-1, last:0 };
const LIFE_COL = () => LEVEL.league ? "224,176,64" : LEVEL.rocket ? "200,64,64" : LEVEL.manor ? "210,100,50" : LEVEL.safari ? "200,160,64" : LEVEL.tower ? (LEVEL.sprout ? "190,140,80" : "150,110,190") : LEVEL.cave ? "120,140,210" : "110,190,90";
function panelKinds() { // Oiseau Légendaire : les trois cartes ; Ligue : toutes les salles
  const wild = new Set(), boss = new Set(), add = k => { if (FOES[k] && !FOES[k].hideDex && !FOES[k].prop) (dexBoss(FOES[k]) ? boss : wild).add(k); };
  for (const src of LEVEL.maps || LEVEL.rooms || [LEVEL]) {
    if (src.table) for (let m = 0; m <= 10; m += .5) { const o = []; src.table(m, o); for (const [k] of o) add(k); }
    for (const k of src.rings || []) add(k);
    for (const b of src.bosses || []) boss.add(b.kind);
    for (const k of [src.boss, src.bird, src.finalBoss]) if (k && FOES[k]) boss.add(k);
  }
  return { wild:[...wild], boss:[...boss] };
}
function buildPanels() {
  const ov = $("start"); if (!ov || ov.hidden) return;
  const sh = ov.querySelector(".sheet").getBoundingClientRect(), W = Math.floor(Math.max(0, sh.left - 8)), H = innerHeight;
  for (let s = 0; s < 2; s++) if (!LIFE.cv[s]) {
    const c = document.createElement("canvas"); c.className = "sideLife " + (s ? "r" : "l"); c.setAttribute("aria-hidden", "true"); ov.prepend(c); LIFE.cv[s] = c;
    const p = document.createElement("div"); p.className = "lifePill " + (s ? "r" : "l"); ov.prepend(p); LIFE.pills[s] = p;
  }
  const show = W >= 140; for (const e of [...LIFE.cv, ...LIFE.pills]) e.hidden = !show; if (!show) return;
  const key = LEVELS.indexOf(LEVEL) + ":" + W + "x" + H; if (key === LIFE.key) return; LIFE.key = key;
  const { wild, boss } = panelKinds(), seen = k => (dexKills[k] || 0) > 0, col = LIFE_COL();
  for (const c of LIFE.cv) { c.width = W; c.height = H; }
  const R = rng(LEVELS.indexOf(LEVEL) * 7919 + 13), mix = wild.slice().sort(() => R() - .5);
  const walker = (k, x0, x1) => ({ k, x:x0 + R() * (x1 - x0), y:120 + R() * (H - 210), tx:0, ty:0, wait:R() * 2, x0, x1, sp:22 + R() * 22, dir:R() * 8 | 0, mv:false,
    h:Math.min(56, Math.max(34, (FOES[k].r || 14) * 2.6)), boss:false });
  const nw = Math.max(4, Math.min(14, Math.round(W * H / 26000)));
  LIFE.mobs[0] = mix.slice(0, nw).map(k => walker(k, 24, W - 70));
  const nb = boss.length, bh = (H - 200) / Math.max(1, nb); // boss : en colonne le long du bord, en quinconce
  const bH = Math.max(40, Math.min(nb > 4 ? 84 : 130, bh * (nb > 4 ? 1.2 : nb > 2 ? 1.5 : .8)));
  LIFE.mobs[1] = boss.map((k, i) => ({ k, boss:true, dir:6, mv:false, x:W * (nb > 2 ? (i % 2 ? .62 : .3) : .45), y:110 + bh * (i + .5) + bH / 2, h:bH }));
  LIFE.mobs[1].push(...mix.slice(nw, nw + (nb > 4 ? 0 : Math.min(6, Math.round(nw / 2)))).map(k => walker(k, W * .62, W - 70)));
  LIFE.pills[0].innerHTML = `<b>${wild.filter(seen).length}</b> / ${wild.length} Pokémon sauvages vus`;
  LIFE.pills[1].innerHTML = `<b>${boss.filter(seen).length}</b> / ${boss.length} boss vaincus`;
  for (const p of LIFE.pills) p.style.setProperty("--pc", col);
}
const LIFE_BOX = new Map(); // zone réellement dessinée de chaque planche (les cadres PMD ont beaucoup de vide autour)
function sheetBox(sh) {
  let b = LIFE_BOX.get(sh); if (b) return b;
  const n = sh.dur.length, c = document.createElement("canvas"); c.width = sh.fw * n; c.height = sh.fh;
  const g = c.getContext("2d"); g.drawImage(sh.img, 0, 0, sh.fw * n, sh.fh, 0, 0, sh.fw * n, sh.fh);
  let x0 = sh.fw, y0 = sh.fh, x1 = 0, y1 = 0;
  try { const d = g.getImageData(0, 0, c.width, c.height).data;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) { const fx = x % sh.fw; if (fx < x0) x0 = fx; if (fx > x1) x1 = fx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  } catch (e) { x0 = 0; y0 = 0; x1 = sh.fw - 1; y1 = sh.fh - 1; }
  if (x1 < x0) { x0 = 0; y0 = 0; x1 = sh.fw - 1; y1 = sh.fh - 1; }
  b = { x0, y0, w:x1 - x0 + 1, h:y1 - y0 + 1 }; LIFE_BOX.set(sh, b); return b;
}
const LIFE_TMP = document.createElement("canvas"); LIFE_TMP.width = LIFE_TMP.height = 320;
function drawLifeMob(g, m, t, hot) { // m.y = les pieds ; m.h = hauteur visée, quelle que soit la planche
  const sp = FOES[m.k].sprite || m.k, sh = sheetFor(sp, 0), unseen = !(dexKills[m.k] > 0), col = LIFE_COL();
  if (!sh) return;
  const bx = sheetBox(sh), sc = Math.min(m.h / bx.h, m.h * 1.4 / bx.w), bob = m.boss ? Math.sin(t * 2 + m.y) * 1.5 : 0;
  let tick = m.mv || m.boss ? Math.floor(t * 60) % sh.total : 0, f = 0; while (tick >= sh.dur[f]) { tick -= sh.dur[f]; f++; }
  const w = bx.w * sc;
  if (m.boss) { const gr = g.createRadialGradient(m.x, m.y, 2, m.x, m.y, w * .8); gr.addColorStop(0, `rgba(${col},.4)`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.beginPath(); g.ellipse(m.x, m.y, w * .8, w * .28, 0, 0, Math.PI * 2); g.fill(); }
  ell(g, m.x, m.y - 1, w * .36, Math.max(2, w * .1), "rgba(0,0,0,.35)");
  const tg = LIFE_TMP.getContext("2d"), fw = sh.fw * sc, fh = sh.fh * sc, ox = 160 - (bx.x0 + bx.w / 2) * sc, oy = 300 - (bx.y0 + bx.h) * sc;
  tg.globalCompositeOperation = "source-over"; tg.clearRect(0, 0, 320, 320); tg.imageSmoothingEnabled = false;
  tg.drawImage(sh.img, f * sh.fw, (m.dir % (sh.img.naturalHeight / sh.fh | 0 || 1)) * sh.fh, sh.fw, sh.fh, Math.round(ox), Math.round(oy), Math.round(fw), Math.round(fh));
  if (unseen) { tg.globalCompositeOperation = "source-in"; tg.fillStyle = "rgba(6,8,10,.78)"; tg.fillRect(0, 0, 320, 320); }
  g.drawImage(LIFE_TMP, Math.round(m.x - 160), Math.round(m.y - 300 + bob));
  m.top = m.y - m.h; m.hw = w / 2;
  if (hot) {
    const n = dexKills[m.k] || 0, nm = unseen ? "???" : (FOES[m.k].name || m.k).replace(" géant", ""), sub = unseen ? "pas encore rencontré" : `${n} K.O.`;
    g.font = "700 13px Outfit, sans-serif"; const bw = Math.max(g.measureText(nm).width, 90) + 20, y = m.top - 44;
    g.fillStyle = "rgba(12,18,14,.9)"; g.beginPath(); g.roundRect(m.x - bw / 2, y, bw, 34, 10); g.fill();
    g.strokeStyle = `rgba(${col},.8)`; g.lineWidth = 1.5; g.stroke();
    g.textAlign = "center"; g.fillStyle = "#f2efe4"; g.fillText(nm, m.x, y + 15); g.font = "600 10px Outfit, sans-serif"; g.fillStyle = "rgba(242,239,228,.6)"; g.fillText(sub, m.x, y + 28);
  }
}
function drawPanels(t) {
  if ($("start").hidden || !LIFE.cv[0] || LIFE.cv[0].hidden) return;
  const dt = Math.min(.05, t - LIFE.last || 0); LIFE.last = t;
  for (let s = 0; s < 2; s++) {
    const c = LIFE.cv[s], g = c.getContext("2d"), H = c.height, rc = c.getBoundingClientRect(); g.clearRect(0, 0, c.width, H);
    for (const m of LIFE.mobs[s]) if (!m.boss) { // promenade : un but au hasard, une pause, un autre but
      if (m.wait > 0) { m.wait -= dt; m.mv = false; if (m.wait <= 0) { m.tx = m.x0 + Math.random() * (m.x1 - m.x0); m.ty = 120 + Math.random() * (H - 210); } continue; }
      const dx = m.tx - m.x, dy = m.ty - m.y, d = Math.hypot(dx, dy);
      if (d < 4) { m.wait = 1 + Math.random() * 3; continue; }
      m.mv = true; m.x += dx / d * m.sp * dt; m.y += dy / d * m.sp * dt; m.dir = (2 - Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 16) % 8;
    }
    const mx = LIFE.mx - rc.left, my = LIFE.my - rc.top, list = LIFE.mobs[s].slice().sort((a, b) => a.y - b.y);
    let hot = null; for (const m of list) if (m.top != null && Math.abs(mx - m.x) < m.hw + 4 && my > m.top - 4 && my < m.y + 4) hot = m;
    for (const m of list) drawLifeMob(g, m, t, m === hot);
  }
}
(function panelLoop(ts) { drawPanels(ts / 1000); requestAnimationFrame(panelLoop); })(0);
addEventListener("pointermove", e => { LIFE.mx = e.clientX; LIFE.my = e.clientY; }, { passive:true });
function refreshSides(force) { if (force) LIFE.key = ""; drawDeco(); buildPanels(); }
addEventListener("resize", () => refreshSides(true));
// à chaque ouverture de l'écran de choix : K.O. et boss vaincus à jour
new MutationObserver(() => { if (!$("start").hidden) refreshSides(true); }).observe($("start"), { attributes:true, attributeFilter:["hidden"] });
