/* Lac Colère : décor tiré de la carte 3D du Lac Colère de HeartGold / SoulSilver (textures d'origine, arbres noyés rendus depuis le modèle ; voir CREDITS.md) */
const LK = { img:null, K:1.5, R:{"grass":[0,0,32,32],"tuft":[34,0,13,11],"water":[49,0,32,32],"tshade":[119,0,32,32],"tree":[153,0,42,43],"rock":[197,0,30,30],"bushG":[229,0,14,16],"bushD":[0,45,14,15],"stoneB":[16,45,14,14],"stoneG":[32,45,14,14],"log":[48,45,32,32],"lily":[82,45,32,28],"branch":[116,45,32,23],"spark":[150,45,26,21],"whalo":[178,45,60,64],"wtop":[0,111,40,25],"bank":[42,111,32,16]} };
(() => { const im = new Image(); im.onload = () => { LK.img = im; LK.pat = {}; canopyCache.clear(); if (LEVEL.rage) for (const c of chunkData.values()) c.canvas = null; }; im.src = "data:image/png;base64,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"; })();
const LK_T = 32 * LK.K; // une case de la carte (32 px d'origine)
const lakeOn = () => LEVEL.rage && LK.img;
function lkSpr(g, n, x, y, k = LK.K, flip = false) { const q = LK.R[n]; if (!flip) return g.drawImage(LK.img, q[0], q[1], q[2], q[3], x, y, q[2] * k, q[3] * k); g.save(); g.translate(x + q[2] * k, y); g.scale(-1, 1); g.drawImage(LK.img, q[0], q[1], q[2], q[3], 0, 0, q[2] * k, q[3] * k); g.restore(); }
function lkPat(g, n) { // motif répété (herbe, eau), calé sur le monde : pas de couture entre les morceaux
  if (!LK.pat[n]) { const q = LK.R[n], c = document.createElement("canvas"); c.width = q[2] * LK.K; c.height = q[3] * LK.K; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.drawImage(LK.img, q[0], q[1], q[2], q[3], 0, 0, c.width, c.height); LK.pat[n] = c; }
  return g.createPattern(LK.pat[n], "repeat");
}
// le lac : grandes nappes d'eau tirées du bruit, case par case ; toujours la terre ferme autour du départ
const lkMemo = new Map();
function lakeWet(i, j) {
  const key = i + "," + j; let v = lkMemo.get(key); if (v !== undefined) return v;
  const x = (i + .5) * LK_T, y = (j + .5) * LK_T;
  v = Math.hypot(x, y - START_Y) > 420 && fbm(x / 1500 + 31, y / 1500 - 17) + Math.max(0, .3 * (1 - Math.hypot(x, y - START_Y + 1500) / 1700)) > (LK_WED ? .56 : .5); // le grand lac, juste au nord du départ, puis des étangs çà et là ; le mercredi, l'eau baisse
  if (lkMemo.size > 80000) lkMemo.clear(); lkMemo.set(key, v); return v;
}
const lakeAt = (x, y) => lakeWet(Math.floor(x / LK_T), Math.floor(y / LK_T));
function lakeTreeAt(i, j) { // arbres noyés : une case sur deux, en bosquets, jamais contre la berge (comme sur la carte)
  if ((i & 1) || (j & 1) || fbm(i / 9 - 9, j / 9 + 4) < .54) return false;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (!lakeWet(i + a, j + b)) return false;
  return true;
}
function lakeChunk(ci, cj) {
  const R = rng(Math.floor(hash(ci + 4000, cj - 4000) * 4294967295)), x0 = ci * CH, y0 = cj * CH, T = LK_T;
  const trees = [], rocks = [], bits = [], solids = [];
  const dry = (x, y, m) => { for (let a = -m; a <= m; a += T) for (let b = -m; b <= m; b += T) if (lakeAt(x + a, y + b)) return false; return true; };
  for (let j = Math.floor(y0 / T); j * T < y0 + CH; j++) for (let i = Math.floor(x0 / T); i * T < x0 + CH; i++) {
    const x = (i + .5) * T, y = (j + .5) * T; if (x < x0 || y < y0) continue;
    if (lakeTreeAt(i, j)) trees.push({ x, y:y + 8, r:30, trunk:16, v:0, ph:R() * 6, wet:true });
    else if (lakeWet(i, j) && R() < .05) bits.push({ x:x + (R() - .5) * 20, y:y + (R() - .5) * 20, n:["lily", "lily", "log", "branch", "spark", "spark"][R() * 6 | 0], flip:R() < .5 }); // nénuphars, bois flotté, reflets
  }
  for (let i = 0; i < 3 + forestDensity(x0 + CH / 2, y0 + CH / 2) * 12; i++) { // forêt de la berge : un à trois arbres serrés
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (forestDensity(x, y) < .42 || Math.hypot(x, y - START_Y) < 260 || !dry(x, y, T * 2)) continue;
    if (trees.some(t => Math.hypot(t.x - x, t.y - y) < 120)) continue;
    const r = 46 + R() * 30; trees.push({ x, y, r, trunk:r * .3, v:Math.floor(R() * 6), ph:R() * 6 });
  }
  for (let i = 0; i < 3; i++) { const x = x0 + R() * CH, y = y0 + R() * CH, k = R();
    if (!dry(x, y, T) || Math.hypot(x, y - START_Y) < 200 || trees.some(t => Math.hypot(t.x - x, t.y - y) < 80)) continue;
    if (k < .3) rocks.push({ x, y, r:14 }); else bits.push({ x, y, n:["bushG", "bushD", "stoneB", "stoneG"][R() * 4 | 0], flip:R() < .5, land:true }); }
  for (const t of trees) solids.push({ x:t.x, y:t.y, r:t.trunk });
  for (const r of rocks) solids.push({ x:r.x, y:r.y, r:r.r });
  return { ponds:[], trees, rocks, logs:[], mounds:[], bits, solids, canvas:null, used:0 };
}
function renderLakeChunk(ci, cj) {
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH, K = LK.K, T = LK_T;
  const cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(-x0, -y0); g.imageSmoothingEnabled = false;
  g.beginPath(); g.rect(x0, y0, CH, CH); g.clip();
  if (!LK.img) { g.fillStyle = "#6ad6a8"; g.fillRect(x0, y0, CH, CH); c.canvas = cv2; return cv2; }
  g.fillStyle = lkPat(g, "grass"); g.fillRect(x0, y0, CH, CH);
  const i0 = Math.floor(x0 / T) - 1, i1 = Math.floor((x0 + CH) / T) + 1, j0 = Math.floor(y0 / T) - 1, j1 = Math.floor((y0 + CH) / T) + 1;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { // hautes herbes : touffes de la carte
    if (lakeWet(i, j) || !tallGrassAt((i + .5) * T, (j + .5) * T)) continue;
    for (let k = 0; k < 3; k++) lkSpr(g, "tuft", i * T + hash(i + k, j) * (T - 20), j * T + hash(i, j + k) * (T - 16));
  }
  g.fillStyle = lkPat(g, "water");
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if (lakeWet(i, j)) g.fillRect(i * T, j * T, T, T);
  const all = { trees:[], rocks:[], bits:[] };
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const n = getChunk(ci + a, cj + b); for (const k in all) all[k].push(...(n[k] || [])); }
  for (const t of all.trees) if (t.wet) lkSpr(g, "whalo", t.x - 30 * K, t.y - 8 - 34 * K); // halo sombre de l'arbre noyé (le feuillage est dessiné avec les arbres)
  for (const o of all.bits) if (!o.land) { const q = LK.R[o.n]; lkSpr(g, o.n, o.x - q[2] * K / 2, o.y - q[3] * K / 2, K, o.flip); }
  const q = LK.R.bank, bh = q[3] * K, bank = (i, j, side) => { // berge : la bande de terre de la carte, tournée vers l'eau
    g.save(); g.translate((i + .5) * T, (j + .5) * T); g.rotate(side * Math.PI / 2); g.drawImage(LK.img, q[0], q[1], q[2], q[3], -T / 2, -T / 2, T, bh); g.restore(); };
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    if (!lakeWet(i, j)) continue;
    if (!lakeWet(i, j - 1)) bank(i, j, 0); if (!lakeWet(i + 1, j)) bank(i, j, 1); if (!lakeWet(i, j + 1)) bank(i, j, 2); if (!lakeWet(i - 1, j)) bank(i, j, 3);
    for (const [di, dj, side] of [[-1, -1, 0], [1, -1, 1], [1, 1, 2], [-1, 1, 3]]) if (lakeWet(i + di, j) && lakeWet(i, j + dj) && !lakeWet(i + di, j + dj)) { // coin rentrant : un bout de berge
      g.save(); g.beginPath(); g.rect(di < 0 ? i * T : (i + 1) * T - bh, dj < 0 ? j * T : (j + 1) * T - bh, bh, bh); g.clip(); bank(i, j, side); bank(i, j, (side + 3) % 4); g.restore(); }
  }
  for (const o of all.bits) if (o.land) { const q2 = LK.R[o.n]; ell(g, o.x, o.y + q2[3] * K * .4, q2[2] * K * .45, 4, "rgba(20,60,40,.25)"); lkSpr(g, o.n, o.x - q2[2] * K / 2, o.y - q2[3] * K / 2, K, o.flip); }
  for (const r of all.rocks) { const q2 = LK.R.rock; lkSpr(g, "rock", r.x - q2[2] * K * .4, r.y + r.r * .7 - q2[3] * K * .8, K * .8); }
  c.canvas = cv2; return cv2;
}
function lakeTreeSprite(t) { // arbre de la berge (un à trois, avec leur ombre) ou feuillage d'un arbre noyé
  const rb = t.wet ? 0 : Math.round(t.r / 6) * 6, key = "lk" + (t.wet ? "w" : rb + "_" + t.v); let s = canopyCache.get(key); if (s) return s;
  const size = 240, K = LK.K, cv2 = document.createElement("canvas"); cv2.width = cv2.height = size * CH_SCALE;
  const g = cv2.getContext("2d"); g.imageSmoothingEnabled = false; g.scale(CH_SCALE, CH_SCALE);
  if (t.wet) { const q = LK.R.wtop; g.drawImage(LK.img, q[0], q[1], q[2], q[3], size / 2 - 18 * K, size / 2 + t.r * .55 - 8 - 12 * K, q[2] * K, q[3] * K); }
  else {
    const base = size / 2 + rb * .55 + 4, n = rb < 58 ? 1 : rb < 68 ? 2 : 3, tr = LK.R.tree;
    const spots = n === 1 ? [[0, 0]] : n === 2 ? [[-14, -2], [14, 2]] : [[0, -12], [-16, 3], [16, 3]], R = rng(rb * 13 + t.v * 101 + 11);
    for (const [dx, dy] of spots) { const sc = K * (.92 + R() * .16), fx = size / 2 + dx * K, by = base + dy * K;
      g.save(); g.translate(fx, by); if (R() < .5) g.scale(-1, 1);
      g.fillStyle = "rgba(20,70,60,.35)"; g.beginPath(); g.ellipse(0, -2 * sc, 19 * sc, 6 * sc, 0, 0, Math.PI * 2); g.fill();
      g.drawImage(LK.img, tr[0], tr[1], tr[2], tr[3], -tr[2] * sc / 2, -(tr[3] - 1) * sc, tr[2] * sc, tr[3] * sc); g.restore(); }
  }
  s = { cv:cv2, size }; canopyCache.set(key, s); return s;
}
function lakeSpawn(f, placed) { // jamais dans l'eau, sauf ceux qui n'en sortent pas (Magicarpe, Léviator)
  const want = !!(f.d.aqua || f.d.gyara); if ((placed && !want) || lakeAt(f.x, f.y) === want) return; // les Léviator boss surgissent du lac
  if (lakeMove(f, want)) return;
  if (f.d.aqua) { const d = FOES.hoothootO, k = f.maxHp / f.d.hp; f.kind = "hoothootO"; f.d = d; f.r = d.r; f.hp = f.maxHp = d.hp * k; } // pas d'eau tout près : un Hoothoot à la place
}
function lakeMove(f, want) { // vers la case la plus proche, sur la rive ou en pleine eau
  for (let d = LK_T; d < 900; d += LK_T) for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d;
    if (lakeAt(x, y) === want && (!want || lakeAt(x + LK_T, y) && lakeAt(x - LK_T, y))) { f.x = x; f.y = y; return true; } }
  return false;
}
