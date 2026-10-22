/* ---------- Rendu ---------- */
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
/* ---------- Carte : Forêt de Jade, générée par morceaux de 512 px ---------- */
const CH = 512, CH_SCALE = 1.5;
const pathY = x => Math.sin(x / 520) * 260 + Math.sin(x / 190) * 60;
const nearPath = (x, y, m) => Math.abs(y - pathY(x)) < m;
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf*xf*(3-2*xf), v = yf*yf*(3-2*yf);
  const a = hash(xi, yi), b = hash(xi+1, yi), c = hash(xi, yi+1), d = hash(xi+1, yi+1);
  return a + (b-a)*u + (c-a)*v + (a-b-c+d)*u*v;
}
const fbm = (x, y) => vnoise(x, y) * .6 + vnoise(x*2.1 + 17, y*2.1 + 9) * .3 + vnoise(x*4.3 + 3, y*4.3 + 41) * .1;
const forestDensity = (x, y) => fbm(x / 700, y / 700);
const tallGrassAt = (x, y) => !LEVEL.cave && !nearPath(x, y, 70) && fbm(x / 260 + 50, y / 260 + 50) > (LEVEL.safari ? .52 : .62);
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const START_Y = pathY(0);

const chunkData = new Map();

/* Ligue Indigo : salles fermées façon Rouge Feu / Vert Feuille (cadre en bois, sol carrelé, terrain et cercle Poké Ball) */
const ARENA_W = 950, ARENA_H = 650, ARENA_WALL = 120;
const arena = () => LEVEL.league ? { x0:-ARENA_W, x1:ARENA_W, y0:START_Y - ARENA_H, y1:START_Y + ARENA_H } : null;
function arenaClamp(e, r = 12) {
  if (!LEVEL.league) return;
  const A = arena(); e.x = Math.max(A.x0 + r, Math.min(A.x1 - r, e.x)); e.y = Math.max(A.y0 + r, Math.min(A.y1 - r, e.y));
  if ((ARENA_PAL[LEVEL.theme] || {}).octa) { // coins coupés de l'octogone
    let ux = Math.abs(e.x), uy = Math.abs(e.y - START_Y); const lim = ARENA_W + ARENA_H - 2 * r - OCT * 1.0, ex = ux + uy - lim;
    if (ex > 0) { ux -= ex / 2; uy -= ex / 2; e.x = Math.sign(e.x) * ux; e.y = START_Y + Math.sign(e.y - START_Y) * uy; }
  }
}
const ARENA_PAL = {
  olga:   { floor:"#94c8ea", floor2:"#88bfe4", grid:"rgba(70,120,170,.38)", line:"rgba(255,255,255,.85)", wall:"#c8703a", wallDk:"#7a3c1c", wallHi:"#eea060", win:"#24305a", winLit:"#a8dcff", ball:["#9a7ad8", "#86dccc"], out:"#2a160c", deco:"ice" },
  aldo:   { floor:"#e2c872", floor2:"#d8bd66", grid:"rgba(150,120,40,.4)", line:"rgba(255,255,255,.9)", wall:"#c8703a", wallDk:"#7a3c1c", wallHi:"#eea060", win:"#24305a", winLit:"#ffd890", ball:["#5cc070", "#e8e8e8"], out:"#2a160c", deco:"stone", ring:true },
  agatha: { floor:"#4a3a62", floor2:"#42335a", grid:"rgba(16,6,30,.5)", line:"rgba(210,190,255,.55)", wall:"#3a2450", wallDk:"#160c22", wallHi:"#5e4280", win:"#0a0612", winLit:"#7a3ab0", ball:["#9a2a4a", "#8a9a3a"], out:"#06030a", deco:"candle", scary:true },
  peter:  { floor:"#5aa6a4", floor2:"#529c9a", grid:"rgba(20,70,70,.45)", line:"rgba(255,255,255,.85)", wall:"#c8703a", wallDk:"#7a3c1c", wallHi:"#eea060", win:"#24305a", winLit:"#ffd890", ball:["#8a4aa8", "#e08080"], out:"#2a160c", deco:"fang" },
  champ:  { octa:true, floor:"#b8d4d0", floor2:"#b0ccc8", grid:"rgba(110,150,146,.45)", line:"rgba(255,255,255,.6)", wall:"#7a3a9a", wallDk:"#3a1a4a", wallHi:"#b868d4", win:"#2a1a3a", winLit:"#fff2c0", ball:["#e8c838", "#ffffff"], out:"#16101e", deco:"lamp" },
};
function arenaDecor() { // obstacles : deux rangées de quatre le long des murs, comme dans les jeux
  const A = arena(), cy = START_Y, out = [];
  if ((ARENA_PAL[LEVEL.theme] || {}).octa) { for (const sx of [-1, 1]) for (const sy of [-1, 1]) out.push({ x:sx * (ARENA_W - 300), y:cy + sy * (ARENA_H - 250), r:30 }); return out; }
  for (const sx of [-1, 1]) for (const dy of [-420, -140, 140, 420]) out.push({ x:sx * (ARENA_W - 170), y:cy + dy, r:34 });
  return out;
}
function arenaChunk(ci, cj) {
  const x0 = ci * CH, y0 = cj * CH, inC = o => o.x >= x0 && o.x < x0 + CH && o.y >= y0 && o.y < y0 + CH;
  const deco = arenaDecor().filter(inC);
  return { ponds:[], trees:[], rocks:[], logs:[], walls:[], spikes:[], crystals:[], shrooms:[], lava:[], gates:[], deco, solids:deco.map(o => ({ x:o.x, y:o.y, r:o.r })), canvas:null, used:0 };
}
function drawArenaDeco(g, o, kind) {
  const { x, y } = o;
  g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.ellipse(x + 6, y + 30, 40, 14, 0, 0, Math.PI * 2); g.fill();
  if (kind === "ice") { // bloc de glace
    g.fillStyle = "#4e8fc0"; g.fillRect(x - 34, y - 30, 68, 64);
    const gr = g.createLinearGradient(x - 30, 0, x + 30, 0); gr.addColorStop(0, "#bfe8ff"); gr.addColorStop(.5, "#8ccaf0"); gr.addColorStop(1, "#6aaedc");
    g.fillStyle = gr; g.fillRect(x - 30, y - 18, 60, 48);
    g.fillStyle = "#e8f8ff"; g.fillRect(x - 30, y - 40, 60, 24); g.fillStyle = "#c8ecff"; g.fillRect(x - 30, y - 18, 60, 4);
    g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 20, y - 6); g.lineTo(x - 20, y + 20); g.moveTo(x - 10, y - 8); g.lineTo(x - 10, y + 2); g.stroke();
    g.strokeStyle = "#3a78a8"; g.lineWidth = 2; g.strokeRect(x - 30, y - 40, 60, 70);
  } else if (kind === "stone") { // pile de pierres (salle d'Aldo)
    for (let k = 0; k < 3; k++) { const yy = y + 18 - k * 22, w = 34 - k * 3;
      g.fillStyle = "#5a5e66"; g.beginPath(); g.ellipse(x, yy + 4, w, 14, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#a8acb4"; g.beginPath(); g.ellipse(x, yy, w, 13, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = "#d4d8de"; g.beginPath(); g.ellipse(x - w * .25, yy - 4, w * .5, 5, 0, 0, Math.PI * 2); g.fill(); }
  } else if (kind === "tomb") { // stèle et bougie (Agatha)
    g.fillStyle = "#2a2036"; g.fillRect(x - 30, y + 10, 60, 18);
    g.fillStyle = "#6a6080"; g.beginPath(); g.moveTo(x - 24, y + 14); g.lineTo(x - 24, y - 20); g.arc(x, y - 20, 24, Math.PI, 0); g.lineTo(x + 24, y + 14); g.fill();
    g.fillStyle = "#8a80a4"; g.fillRect(x - 24, y - 20, 8, 34);
    g.strokeStyle = "#3a3050"; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x, y + 2); g.moveTo(x - 10, y - 20); g.lineTo(x + 10, y - 20); g.stroke();
    g.fillStyle = "#e8e0c8"; g.fillRect(x + 26, y + 2, 7, 16); g.fillStyle = "#b080ff"; g.beginPath(); g.ellipse(x + 29.5, y - 3, 4, 7, 0, 0, Math.PI * 2); g.fill();
  } else if (kind === "candle") { // colonne violette et sa flamme (Agatha)
    g.fillStyle = "#1e1230"; g.fillRect(x - 24, y + 14, 48, 16);
    g.fillStyle = "#5a3a8a"; g.beginPath(); g.moveTo(x - 18, y + 16); g.lineTo(x - 18, y - 42); g.arc(x, y - 42, 18, Math.PI, 0); g.lineTo(x + 18, y + 16); g.fill();
    g.fillStyle = "#2a1640"; g.beginPath(); g.moveTo(x - 9, y + 8); g.lineTo(x - 9, y - 40); g.arc(x, y - 40, 9, Math.PI, 0); g.lineTo(x + 9, y + 8); g.fill();
    const fl = g.createLinearGradient(0, y - 40, 0, y + 6); fl.addColorStop(0, "#fff0a0"); fl.addColorStop(.5, "#e0a030"); fl.addColorStop(1, "#7a3a10");
    g.fillStyle = fl; g.fillRect(x - 5, y - 36, 10, 40); g.fillStyle = "#8a6ab8"; g.fillRect(x - 18, y - 6, 36, 5);
  } else if (kind === "fang") { // corne de dragon en ivoire sur socle (Peter)
    g.fillStyle = "#4a4a52"; g.beginPath(); g.ellipse(x, y + 18, 30, 13, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#8a8a94"; g.beginPath(); g.ellipse(x, y + 13, 28, 11, 0, 0, Math.PI * 2); g.fill();
    const sx = x < 0 ? 1 : -1; // la corne se recourbe vers le centre de la salle
    g.fillStyle = "#b8b0a0"; g.beginPath(); g.moveTo(x - 16, y + 12); g.quadraticCurveTo(x - 20, y - 30, x + sx * 26, y - 62); g.quadraticCurveTo(x + 4, y - 26, x + 16, y + 12); g.fill();
    g.fillStyle = "#f4efe2"; g.beginPath(); g.moveTo(x - 10, y + 10); g.quadraticCurveTo(x - 14, y - 26, x + sx * 26, y - 62); g.quadraticCurveTo(x - 2, y - 22, x + 6, y + 10); g.fill();
  } else if (kind === "lamp") { // lampadaire (salle du Champion)
    g.fillStyle = "#5a6a70"; g.fillRect(x - 26, y + 6, 52, 22); g.fillStyle = "#8a9aa0"; g.fillRect(x - 22, y - 40, 44, 50);
    g.fillStyle = "#c8d4d8"; g.fillRect(x - 16, y - 36, 10, 42);
    g.fillStyle = "#3a4448"; g.fillRect(x - 26, y - 50, 52, 12);
    const gl = g.createRadialGradient(x, y - 62, 2, x, y - 62, 30); gl.addColorStop(0, "#fffbe0"); gl.addColorStop(.5, "#f0e070"); gl.addColorStop(1, "rgba(240,224,112,0)");
    g.fillStyle = gl; g.beginPath(); g.arc(x, y - 62, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = "#f8e868"; g.beginPath(); g.arc(x, y - 62, 13, 0, Math.PI * 2); g.fill();
  } else if (kind === "dragon") { // statue de dragon sur socle (Peter)
    g.fillStyle = "#3a3448"; g.fillRect(x - 32, y + 2, 64, 28); g.fillStyle = "#5a5470"; g.fillRect(x - 32, y - 2, 64, 8);
    g.fillStyle = "#7a6a9a"; g.beginPath(); g.moveTo(x - 18, y); g.lineTo(x - 10, y - 46); g.lineTo(x + 2, y - 60); g.lineTo(x + 24, y - 52); g.lineTo(x + 12, y - 40); g.lineTo(x + 16, y); g.fill();
    g.fillStyle = "#9a8ac0"; g.beginPath(); g.moveTo(x - 10, y - 46); g.lineTo(x - 18, y - 66); g.lineTo(x - 2, y - 56); g.fill();
    g.fillStyle = "#ffb050"; g.beginPath(); g.arc(x + 12, y - 52, 3.5, 0, Math.PI * 2); g.fill();
  } else { // colonne de marbre (Champion)
    g.fillStyle = "#b8a878"; g.fillRect(x - 30, y + 14, 60, 16);
    const gr = g.createLinearGradient(x - 24, 0, x + 24, 0); gr.addColorStop(0, "#d8d0c0"); gr.addColorStop(.4, "#ffffff"); gr.addColorStop(1, "#b8b0a0");
    g.fillStyle = gr; g.fillRect(x - 22, y - 50, 44, 66);
    g.strokeStyle = "rgba(150,140,120,.6)"; g.lineWidth = 2; for (const dx of [-11, 0, 11]) { g.beginPath(); g.moveTo(x + dx, y - 46); g.lineTo(x + dx, y + 12); g.stroke(); }
    g.fillStyle = "#e0c060"; g.fillRect(x - 28, y - 58, 56, 10); g.fillRect(x - 26, y + 10, 52, 6);
  }
}
function drawArena(g, pal) { // tout le décor de la salle (dessiné une fois par morceau de carte)
  const A = arena(), Wl = ARENA_WALL, cy = START_Y;
  g.fillStyle = pal.out; g.fillRect(A.x0 - 1200, A.y0 - 1200, A.x1 - A.x0 + 2400, A.y1 - A.y0 + 2400);
  // cadre en bois avec fenêtres
  g.fillStyle = pal.wallDk; g.fillRect(A.x0 - Wl, A.y0 - Wl * 1.6, A.x1 - A.x0 + Wl * 2, A.y1 - A.y0 + Wl * 2.6);
  g.fillStyle = pal.wall; g.fillRect(A.x0 - Wl + 10, A.y0 - Wl * 1.6 + 10, A.x1 - A.x0 + Wl * 2 - 20, A.y1 - A.y0 + Wl * 2.6 - 20);
  g.fillStyle = pal.wallHi; for (const yy of [A.y0 - Wl * 1.6 + 10, A.y1 + Wl - 24]) g.fillRect(A.x0 - Wl + 10, yy, A.x1 - A.x0 + Wl * 2 - 20, 12);
  g.strokeStyle = pal.wallDk; g.lineWidth = 3; for (let x = A.x0 - Wl + 40; x < A.x1 + Wl; x += 64) { g.beginPath(); g.moveTo(x, A.y0 - Wl * 1.6 + 22); g.lineTo(x, A.y0 - 6); g.moveTo(x, A.y1 + 6); g.lineTo(x, A.y1 + Wl - 24); g.stroke(); }
  const win = (x, y, lit) => { g.fillStyle = pal.wallDk; g.fillRect(x - 17, y - 17, 34, 34); g.fillStyle = pal.win; g.fillRect(x - 13, y - 13, 26, 26); g.fillStyle = lit; g.fillRect(x - 9, y - 9, 8, 8); };
  for (let y = A.y0 + 60; y < A.y1 - 30; y += 130) { win(A.x0 - Wl / 2, y, pal.winLit); win(A.x1 + Wl / 2, y, pal.winLit); }
  for (let x = A.x0 + 40; x < A.x1; x += 150) if (Math.abs(x) > 140) { win(x, A.y0 - Wl * .8, pal.winLit); win(x, A.y1 + Wl / 2, pal.winLit); }
  // porte en haut (vers la salle suivante) et entrée en bas
  g.fillStyle = pal.wallDk; g.fillRect(-70, A.y0 - Wl * 1.6 + 6, 140, Wl * 1.6); g.fillStyle = "#1a1210"; g.fillRect(-52, A.y0 - Wl * 1.3, 104, Wl * 1.3);
  g.fillStyle = "#e8c860"; g.beginPath(); g.arc(0, A.y0 - Wl * 1.05, 22, 0, Math.PI * 2); g.fill(); g.fillStyle = "#c83a3a"; g.beginPath(); g.arc(0, A.y0 - Wl * 1.05, 22, Math.PI, 0); g.fill();
  g.strokeStyle = "#1a1210"; g.lineWidth = 4; g.beginPath(); g.moveTo(-22, A.y0 - Wl * 1.05); g.lineTo(22, A.y0 - Wl * 1.05); g.stroke(); g.fillStyle = "#fff"; g.beginPath(); g.arc(0, A.y0 - Wl * 1.05, 7, 0, Math.PI * 2); g.fill();
  g.fillStyle = pal.floor2; g.fillRect(-60, A.y1, 120, Wl); g.strokeStyle = pal.grid; g.lineWidth = 2; for (let y = A.y1 + 16; y < A.y1 + Wl; y += 18) { g.beginPath(); g.moveTo(-60, y); g.lineTo(60, y); g.stroke(); }
  // sol carrelé
  if (pal.octa) return drawChampArena(g, pal);
  g.save(); g.beginPath(); g.rect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); g.clip();
  const T = 64; g.fillStyle = pal.floor; g.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0);
  g.fillStyle = pal.floor2; for (let y = A.y0, j = 0; y < A.y1; y += T, j++) for (let x = A.x0, i = 0; x < A.x1; x += T, i++) if ((i + j) % 2) g.fillRect(x, y, T, T);
  g.strokeStyle = pal.grid; g.lineWidth = 2; g.beginPath();
  for (let x = A.x0; x <= A.x1; x += T) { g.moveTo(x, A.y0); g.lineTo(x, A.y1); } for (let y = A.y0; y <= A.y1; y += T) { g.moveTo(A.x0, y); g.lineTo(A.x1, y); } g.stroke();
  g.fillStyle = "rgba(0,0,0,.22)"; g.fillRect(A.x0, A.y0, A.x1 - A.x0, 26); g.fillRect(A.x0, A.y0, 18, A.y1 - A.y0);
  // terrain : grand carré, ligne médiane et cercle Poké Ball
  const hw = 520, hh = 420, R0 = 190;
  g.save(); g.beginPath(); g.arc(0, cy, R0, Math.PI, 0); g.fillStyle = pal.ball[0]; g.globalAlpha = .75; g.fill(); g.beginPath(); g.arc(0, cy, R0, 0, Math.PI); g.fillStyle = pal.ball[1]; g.fill(); g.restore();
  g.strokeStyle = pal.line; g.lineWidth = 7; g.strokeRect(-hw, cy - hh, hw * 2, hh * 2);
  g.beginPath(); g.moveTo(-hw, cy); g.lineTo(hw, cy); g.stroke(); g.beginPath(); g.arc(0, cy, R0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = pal.line; g.beginPath(); g.arc(0, cy, 46, 0, Math.PI * 2); g.fill(); g.fillStyle = pal.ball[1]; g.beginPath(); g.arc(0, cy, 30, 0, Math.PI * 2); g.fill();
  if (pal.ring) { // salle de boxe : ring avec cordes rouges et poteaux
    const rw = hw - 40, rh = hh - 40;
    g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(-rw, cy - rh, rw * 2, rh * 2);
    for (const [k, col] of [[0, "#c02a2a"], [14, "#ffffff"], [28, "#2a5ac0"]]) { g.strokeStyle = col; g.lineWidth = 6; g.strokeRect(-rw - k, cy - rh - k, (rw + k) * 2, (rh + k) * 2); }
    for (const [px, py, col] of [[-rw - 28, cy - rh - 28, "#c02a2a"], [rw + 28, cy - rh - 28, "#2a5ac0"], [-rw - 28, cy + rh + 28, "#2a5ac0"], [rw + 28, cy + rh + 28, "#c02a2a"]]) {
      g.fillStyle = "#2a2a2a"; g.beginPath(); g.arc(px + 3, py + 4, 16, 0, Math.PI * 2); g.fill(); g.fillStyle = col; g.beginPath(); g.arc(px, py, 14, 0, Math.PI * 2); g.fill(); g.fillStyle = "rgba(255,255,255,.6)"; g.beginPath(); g.arc(px - 4, py - 4, 5, 0, Math.PI * 2); g.fill();
    }
  }
  g.restore();
  for (const o of arenaDecor()) drawArenaDeco(g, o, pal.deco);
}
const OCT = 330; // salle du Champion : octogone (coins coupés)
function drawChampArena(g, pal) { // d'après la salle du Champion de Rouge Feu : octogone clair, gradins bleus, lampadaires, escalier et pont
  const A = arena(), cy = START_Y, Wl = ARENA_WALL;
  const oct = (m) => { const x0 = A.x0 - m, x1 = A.x1 + m, y0 = A.y0 - m, y1 = A.y1 + m, c = OCT + m * .41;
    g.beginPath(); g.moveTo(x0 + c, y0); g.lineTo(x1 - c, y0); g.lineTo(x1, y0 + c); g.lineTo(x1, y1 - c); g.lineTo(x1 - c, y1); g.lineTo(x0 + c, y1); g.lineTo(x0, y1 - c); g.lineTo(x0, y0 + c); g.closePath(); };
  // grand mur violet en haut
  for (const [k, col] of [[0, "#5a2a7a"], [1, "#7a3a9a"], [2, "#9a4ab8"], [3, "#b868d4"]]) { g.fillStyle = col; g.fillRect(A.x0 - Wl, A.y0 - Wl * 2.2 + k * Wl * .4, A.x1 - A.x0 + Wl * 2, Wl * .4 + 2); }
  oct(Wl * .8); g.fillStyle = "#3a4a52"; g.fill();
  oct(Wl * .55); g.fillStyle = "#e6f0ee"; g.fill();
  oct(Wl * .3); g.fillStyle = "#8aa8a4"; g.fill();
  // gradins bleus le long des murs
  g.fillStyle = "#2a50b0"; for (const sx of [-1, 1]) for (let y = A.y0 + OCT; y < A.y1 - OCT; y += 26) g.fillRect(sx < 0 ? A.x0 - Wl * .5 : A.x1 + Wl * .5 - 40, y, 40, 16);
  for (const sy of [-1, 1]) for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) { g.fillStyle = k % 2 ? "#3a64c8" : "#2a50b0"; g.fillRect(sx < 0 ? -A.x1 * .62 : A.x1 * .22, sy < 0 ? A.y0 - Wl * .5 + k * 16 : A.y1 + Wl * .5 - 44 + k * 16, A.x1 * .4, 12); }
  oct(0); g.fillStyle = pal.floor; g.fill();
  g.save(); oct(0); g.clip(); g.strokeStyle = pal.grid; g.lineWidth = 2; g.beginPath();
  for (let x = A.x0; x <= A.x1; x += 80) { g.moveTo(x, A.y0); g.lineTo(x, A.y1); } for (let y = A.y0; y <= A.y1; y += 80) { g.moveTo(A.x0, y); g.lineTo(A.x1, y); } g.stroke(); g.restore();
  oct(-40); g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 6; g.stroke();
  // escalier et porte en haut, pont en bas
  g.fillStyle = "#e8e8f0"; g.fillRect(-90, A.y0 - Wl * 1.7, 180, Wl * 1.7); g.fillStyle = "#b8b8c8"; for (let y = A.y0 - Wl * 1.6; y < A.y0; y += 22) g.fillRect(-90, y, 180, 5);
  g.fillStyle = "#c8703a"; g.fillRect(-70, A.y0 - Wl * 2.4, 140, Wl * .9); g.fillStyle = "#e8a060"; g.fillRect(-56, A.y0 - Wl * 2.3, 112, Wl * .75); g.fillStyle = "#1a1210"; g.fillRect(-40, A.y0 - Wl * 2.15, 80, Wl * .6);
  g.fillStyle = "#c8b060"; g.fillRect(-80, A.y1 + Wl * .5, 160, 900); g.fillStyle = "#a89040"; for (let y = A.y1 + Wl * .5; y < A.y1 + 900; y += 36) g.fillRect(-80, y, 160, 6);
  for (let y = A.y1 + Wl; y < A.y1 + 900; y += 150) for (const sx of [-1, 1]) { g.fillStyle = "#e8e8f0"; g.beginPath(); g.arc(sx * 125, y, 14, 0, Math.PI * 2); g.fill(); g.fillStyle = "#3a3a4a"; g.beginPath(); g.arc(sx * 125, y, 6, 0, Math.PI * 2); g.fill(); }
  // cercle central et flèches jaunes
  g.fillStyle = "rgba(255,255,255,.5)"; g.beginPath(); g.arc(0, cy, 120, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#6a8a86"; g.lineWidth = 5; g.stroke();
  g.fillStyle = "#e8c838"; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, px = Math.cos(a) * 165, py = cy + Math.sin(a) * 165;
    g.save(); g.translate(px, py); g.rotate(a + Math.PI); g.beginPath(); g.moveTo(22, 0); g.lineTo(-14, -16); g.lineTo(-14, 16); g.closePath(); g.fill(); g.restore(); }
  for (const o of arenaDecor()) drawArenaDeco(g, o, pal.deco);
}
function renderArenaChunk(ci, cj) {
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH, A = arena();
  const cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(-x0, -y0);
  g.beginPath(); g.rect(x0, y0, CH, CH); g.clip();
  drawArena(g, ARENA_PAL[LEVEL.theme] || ARENA_PAL.olga);
  c.canvas = cv2;
}
function getChunk(ci, cj) {
  const key = ci + "," + cj; let c = chunkData.get(key); if (c) return c;
  if (LEVEL.tower) { c = towerChunk(ci, cj); chunkData.set(key, c); return c; }
  if (LEVEL.manor) { c = manorChunk(ci, cj); chunkData.set(key, c); return c; }
  if (LEVEL.rocket) { c = rocketChunk(ci, cj); chunkData.set(key, c); return c; }
  if (LEVEL.league) { c = arenaChunk(ci, cj); chunkData.set(key, c); return c; }
  if (LEVEL.cave) { c = caveChunk(ci, cj); chunkData.set(key, c); return c; }
  const R = rng(Math.floor(hash(ci + 1000, cj - 1000) * 4294967295));
  const x0 = ci * CH, y0 = cj * CH, ponds = [], trees = [], rocks = [], logs = [], mounds = [], solids = [];
  const clear = (x, y, m) => Math.hypot(x, y - START_Y) > 260 && !nearPath(x, y, m);
  if (R() < (LEVEL.safari ? .42 : .24)) { const px = x0 + 130 + R() * 252, py = y0 + 130 + R() * 252; if (clear(px, py, 200)) ponds.push({ x:px, y:py, rx:85 + R()*70, ry:58 + R()*35, rot:(R() - .5) * .6, ph:R() * 6 }); }
  const inPond = (x, y, m) => ponds.some(p => ((x-p.x) / (p.rx + m))**2 + ((y-p.y) / (p.ry + m))**2 < 1);
  const tries = Math.round(3 + forestDensity(x0 + CH/2, y0 + CH/2) * 13);
  for (let i = 0; i < tries; i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (forestDensity(x, y) < (LEVEL.safari ? .64 : LEVEL.alph ? .36 : .45) || !clear(x, y, 125) || inPond(x, y, 50)) continue;
    if (trees.some(t => Math.hypot(t.x - x, t.y - y) < (LEVEL.safari ? 230 : 125))) continue;
    const r = 46 + R() * 30; trees.push({ x, y, r, trunk:r * .3, v:Math.floor(R() * (LEVEL.safari ? 3 : 6)), ph:R() * 6 });
  }
  if (LEVEL.alph) alphRuins(trees); // Ruines d'Alpha : salles, colonnes et murets à la place de la plupart des arbres
  for (let i = 0; i < (LEVEL.safari ? 5 : 4); i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH, k = R();
    if (!clear(x, y, 85) || inPond(x, y, 30) || trees.some(t => Math.hypot(t.x - x, t.y - y) < 75)) continue;
    if (LEVEL.safari) { if (k < .3) rocks.push({ x, y, r:14 + R() * 20 }); else if (k < .55) mounds.push({ x, y, r:12 + R() * 6, h:34 + R() * 22 }); continue; } // kopjes et termitières
    if (k < .45) rocks.push({ x, y, r:LEVEL.jade ? 8 + R() * 6 : 12 + R() * 13 }); // Forêt de Jade : petits rochers moussus
    else if (k < .6) { const a = R() * Math.PI, len = 70 + R() * 50; if (!LEVEL.jade && !LEVEL.alph) logs.push({ x, y, a, len }); } // pas de troncs couchés dans la Forêt de Jade ni aux Ruines d'Alpha
  }
  for (const t of trees) solids.push({ x:t.x, y:t.y, r:t.trunk });
  for (const r of rocks) solids.push({ x:r.x, y:r.y, r:r.r });
  for (const m of mounds) solids.push({ x:m.x, y:m.y, r:m.r });
  for (const l of logs) for (let k = -2; k <= 2; k++) solids.push({ x:l.x + Math.cos(l.a) * k * l.len / 5, y:l.y + Math.sin(l.a) * k * l.len / 5, r:12 });
  for (const p of ponds) {
    const span = Math.max(0, p.rx - p.ry);
    for (let k = -2; k <= 2; k++) solids.push({ x:p.x + Math.cos(p.rot) * k * span / 2, y:p.y + Math.sin(p.rot) * k * span / 2, r:p.ry * .9, pond:true });
  }
  c = { ponds, trees, rocks, logs, mounds, solids, canvas:null, used:0 };
  chunkData.set(key, c); return c;
}
/* Tour Pokémon : dalles, rangées de tombes, colonnes et bougies */
