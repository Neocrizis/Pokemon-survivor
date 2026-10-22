/* ---------- Ruines d'Alpha : salles intérieures (plus grandes dedans que dehors), d'après les salles de HeartGold/SoulSilver ---------- */
// chaque salle est rangée très loin à l'est de la carte ; entrer par la porte d'un bâtiment y emmène toute l'équipe, la sortie du bas ramène devant la porte
const IN_X0 = 1000000, IN_Y0 = 1000000, TILE = 48;
// # mur · . sol · S statue · T stèle gravée · A autel · o motif Zarbi au sol · , gravats · = marches · p dalle-puzzle · E sortie
const LAYS = [
  { name:"la Salle des Statues", floor:"brick", map:[
    "######################",
    "######################",
    "##.S..............S.##",
    "##..................##",
    "##......S....S......##",
    "##..,...............##",
    "##........TT........##",
    "##........==.....,..##",
    "##..................##",
    "##......S....S......##",
    "##..,...............##",
    "##.S........p.....S.##",
    "##..................##",
    "#########....#########",
    "#########....#########",
    "#########EEEE#########"] },
  { name:"le Grand Couloir", floor:"green", map:[
    "########################",
    "########################",
    "##S.S.S.S.S.S.S.S.S.S.##",
    "##....................##",
    "##....................##",
    "##....................##",
    "##....##################",
    "##....##################",
    "##....S.S.S.S.S.S.S.S.##",
    "##....................##",
    "##..........p.........##",
    "##....................##",
    "##################....##",
    "##################....##",
    "##S.S.S.S.S.S.S.S.....##",
    "##....................##",
    "##....................##",
    "##....................##",
    "#########......#########",
    "##########....##########",
    "##########EEEE##########"] },
  { name:"la Salle de l'Autel", floor:"brick", map:[
    "##################",
    "########TT########",
    "##..............##",
    "##.....AAAA.....##",
    "##..S..AAAA..S..##",
    "##..............##",
    "##.,............##",
    "##..........,...##",
    "##......p.......##",
    "##..............##",
    "##.,.........,..##",
    "##..............##",
    "##....S....S....##",
    "##..............##",
    "##..............##",
    "#######....#######",
    "#######....#######",
    "#######EEEE#######"] },
  { name:"la Salle des Zarbi", floor:"green", map:[
    "##################",
    "##################",
    "##..S...TT...S..##",
    "##..............##",
    "##..............##",
    "##...o......o...##",
    "##..............##",
    "##..............##",
    "##.......p......##",
    "##..............##",
    "##...o......o...##",
    "##..............##",
    "##..,.......,...##",
    "##..............##",
    "##..............##",
    "#######....#######",
    "#######....#######",
    "#######EEEE#######"] },
];
LAYS.forEach((L, k) => {
  L.x0 = IN_X0 + k * 6000; L.y0 = IN_Y0; L.w = L.map[0].length; L.h = L.map.length; L.x1 = L.x0 + L.w * TILE; L.y1 = L.y0 + L.h * TILE;
  L.floorT = []; L.exitY = 0; let ex = 0, en = 0;
  L.map.forEach((row, j) => [...row].forEach((ch, i) => {
    const x = L.x0 + (i + .5) * TILE, y = L.y0 + (j + .5) * TILE;
    if (ch === "E") { ex += x; en++; L.exitY = L.y0 + j * TILE; }
    if (ch === "p") L.puz = { x, y };
    if (".,o=pE".includes(ch) && ch !== "E") L.floorT.push({ x, y });
  }));
  L.entry = { x:ex / en, y:L.exitY - TILE * 1.6 };
});
const inZone = x => x > IN_X0 - 3000;
const layAt = (x, y) => LAYS.find(L => x >= L.x0 && x < L.x1 && y >= L.y0 && y < L.y1 + TILE) || null;
const layTile = (L, x, y) => { const i = Math.floor((x - L.x0) / TILE), j = Math.floor((y - L.y0) / TILE); return (L.map[j] || "")[i] || " "; };
const SOLID_T = "#STA";

function interiorChunk(ci, cj) { // murs et objets des salles : des cercles de collision, marqués « mur » pour arrêter les projectiles
  const x0 = ci * CH, y0 = cj * CH, solids = [];
  for (const L of LAYS) {
    if (L.x1 < x0 || L.x0 > x0 + CH || L.y1 < y0 || L.y0 > y0 + CH) continue;
    L.map.forEach((row, j) => [...row].forEach((ch, i) => {
      const x = L.x0 + (i + .5) * TILE, y = L.y0 + (j + .5) * TILE;
      if (x < x0 || x >= x0 + CH || y < y0 || y >= y0 + CH || !SOLID_T.includes(ch)) return;
      solids.push({ x, y:ch === "S" ? y + 4 : y, r:ch === "#" ? TILE * .62 : ch === "S" ? 17 : TILE * .55, wall:true });
    }));
  }
  return { ponds:[], trees:[], rocks:[], logs:[], mounds:[], ruins:[], tablets:[], solids, canvas:null, used:0 };
}
const INC = { // couleurs des salles HGSS
  brick:{ base:["#6a4e2c", "#6e522e", "#644a2a", "#6c502d", "#5e4628"], mortar:"#4c361e", hi:"#7c5e38", face:"#3a2c1c", panel:"#4a3a28", panelHi:"#5e4a32", lip:"#2a2014" },
  green:{ base:["#5a6a3c", "#566638", "#627242"], mortar:"#36442a", hi:"#74844e", face:"#24281a", panel:"#3a4024", panelHi:"#8a8a40", lip:"#8a8a40" },
};
function drawTile(g, L, i, j, R) {
  const ch = L.map[j][i], x = L.x0 + i * TILE, y = L.y0 + j * TILE, P = 3, C = INC[L.floor], at = (a, b) => (L.map[j + b] || "")[i + a] || " ";
  const floor = () => { // sol : briques brunes ou dalles vertes, ombre sous le mur du dessus
    g.save(); g.beginPath(); g.rect(x, y, TILE, TILE); g.clip();
    if (L.floor === "brick") for (let r = 0; r < 4; r++) for (let c = -1; c < 3; c++) {
      const bx = x + (c * 8 + (r % 2 ? 4 : 0)) * P, by = y + r * 4 * P, bw = 8 * P;
      g.fillStyle = C.mortar; g.fillRect(bx, by, bw, 4 * P); g.fillStyle = C.base[Math.floor(R() * C.base.length)]; g.fillRect(bx, by, bw - P, 3 * P); g.fillStyle = C.hi; g.fillRect(bx, by, bw - P, P);
    } else {
      g.fillStyle = C.mortar; g.fillRect(x, y, TILE, TILE); g.fillStyle = C.base[(i + j) % 2 ? 0 : 1]; g.fillRect(x + P, y + P, TILE - 2 * P, TILE - 2 * P);
      g.fillStyle = C.hi; g.fillRect(x + P, y + P, TILE - 2 * P, P); g.fillRect(x + P, y + P, P, TILE - 2 * P);
      if (R() < .3) { g.fillStyle = C.base[2]; g.fillRect(x + (2 + Math.floor(R() * 10)) * P, y + (2 + Math.floor(R() * 10)) * P, 2 * P, P); }
    }
    g.restore();
    if (at(0, -1) === "#") { g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x, y, TILE, 3 * P); }
  };
  if (ch === "#") {
    if (".,o=pESTA".includes(at(0, 1))) { // face du mur, vue de la salle
      g.fillStyle = C.face; g.fillRect(x, y, TILE, TILE);
      g.fillStyle = C.panel; g.fillRect(x + P, y + 2 * P, TILE - 2 * P, TILE - 4 * P); g.fillStyle = C.panelHi; g.fillRect(x + P, y + 2 * P, TILE - 2 * P, P);
      if (L.floor === "brick" && (i + j) % 2 === 0) { g.strokeStyle = "#806848"; g.lineWidth = P; g.beginPath(); g.arc(x + TILE / 2, y + TILE / 2 - P, 3 * P, 0, Math.PI * 2); g.stroke(); g.fillStyle = "#806848"; g.fillRect(x + TILE / 2 - P / 2, y + TILE / 2 + 2 * P, P, 4 * P); } // Zarbi gravés
      g.fillStyle = C.lip; g.fillRect(x, y, TILE, P);
    } else { // dessus du mur : sombre, avec un liseré là où il borde le sol
      g.fillStyle = "#120c06"; g.fillRect(x, y, TILE, TILE); g.fillStyle = C.lip;
      if (".,o=pE".includes(at(-1, 0))) g.fillRect(x, y, P, TILE);
      if (".,o=pE".includes(at(1, 0))) g.fillRect(x + TILE - P, y, P, TILE);
    }
    return;
  }
  if (ch === "T" && at(0, -1) === "#" && j <= 1) { g.fillStyle = C.face; g.fillRect(x, y, TILE, TILE); } else floor();
  if (ch === "E") { g.fillStyle = "rgba(255,230,170,.18)"; g.fillRect(x, y, TILE, TILE); }
  if (ch === ",") { g.fillStyle = "rgba(20,12,4,.45)"; g.beginPath(); g.ellipse(x + TILE / 2, y + TILE / 2, TILE * .45, TILE * .28, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = "#8a8070"; g.fillRect(x + 6 * P, y + 5 * P, 3 * P, 2 * P); g.fillRect(x + 10 * P, y + 9 * P, 2 * P, 2 * P); }
  if (ch === "=") for (let k = 0; k < 4; k++) { g.fillStyle = k % 2 ? "#5a4630" : "#8a7050"; g.fillRect(x + P, y + k * 4 * P, TILE - 2 * P, 3 * P); }
  if (ch === "o") { g.strokeStyle = "#c86878"; g.lineWidth = 2 * P; g.beginPath(); g.arc(x + TILE / 2, y + TILE / 2, 5 * P, 0, Math.PI * 2); g.stroke(); g.fillStyle = "#f0a0a8"; g.fillRect(x + TILE / 2 - P, y + TILE / 2 - P, 2 * P, 2 * P); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .6; g.fillRect(x + TILE / 2 + Math.cos(a) * 8 * P - P, y + TILE / 2 + Math.sin(a) * 8 * P - P, 2 * P, 2 * P); } }
  if (ch === "A") { // autel de pierre claire
    const top = at(0, -1) !== "A", bot = at(0, 1) !== "A";
    g.fillStyle = "#b0a078"; g.fillRect(x, y, TILE, TILE); g.fillStyle = "#d8c8a0"; g.fillRect(x, y, TILE, bot ? TILE - 5 * P : TILE);
    if (top) { g.fillStyle = "#efe2bc"; g.fillRect(x, y, TILE, P); }
    if (at(-1, 0) !== "A") { g.fillStyle = "#8a7c58"; g.fillRect(x, y, P, TILE); } if (at(1, 0) !== "A") { g.fillStyle = "#8a7c58"; g.fillRect(x + TILE - P, y, P, TILE); }
  }
  if (ch === "T") { // stèle gravée de Zarbi
    g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(x + 2 * P, y + 12 * P, TILE - 3 * P, 4 * P);
    g.fillStyle = "#6a6458"; g.fillRect(x + 2 * P, y - 4 * P, TILE - 4 * P, 16 * P); g.fillStyle = "#9a9284"; g.fillRect(x + 3 * P, y - 3 * P, TILE - 6 * P, 13 * P);
    g.fillStyle = "#5a5246"; for (let k = 0; k < 3; k++) { g.fillRect(x + 5 * P, y + (-1 + k * 4) * P, 3 * P, P); g.fillRect(x + 9 * P, y + (k * 4) * P, 2 * P, 2 * P); }
  }
  if (ch === "S") { // statue de pierre sur son socle (déborde vers le haut)
    g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.ellipse(x + TILE / 2, y + 13 * P, 7 * P, 2.5 * P, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#2e2e2c"; g.fillRect(x + 2 * P, y + 5 * P, 12 * P, 8 * P); g.fillStyle = "#6c6c6a"; g.fillRect(x + 3 * P, y + 6 * P, 10 * P, 6 * P); g.fillStyle = "#9a9a96"; g.fillRect(x + 3 * P, y + 6 * P, 10 * P, P);
    g.fillStyle = "#3a3a38"; g.fillRect(x + 3 * P, y - 9 * P, 10 * P, 15 * P); g.fillStyle = "#a8a8a0"; g.fillRect(x + 4 * P, y - 8 * P, 8 * P, 13 * P);
    g.fillStyle = "#d0d0c8"; g.fillRect(x + 5 * P, y - 7 * P, 6 * P, 4 * P); g.fillStyle = "#3a3a38"; g.fillRect(x + 6 * P, y - 6 * P, P, P); g.fillRect(x + 9 * P, y - 6 * P, P, P);
    g.fillStyle = "#78786e"; g.fillRect(x + 4 * P, y + 2 * P, 8 * P, P); g.fillStyle = "#a8a8a0"; g.fillRect(x + 2 * P, y - 11 * P, 2 * P, 3 * P); g.fillRect(x + 12 * P, y - 11 * P, 2 * P, 3 * P);
  }
}
function renderInteriorChunk(ci, cj) {
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH, cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE); g.translate(-x0, -y0); g.imageSmoothingEnabled = false;
  g.fillStyle = "#050302"; g.fillRect(x0, y0, CH, CH);
  for (const L of LAYS) {
    if (L.x1 < x0 || L.x0 > x0 + CH || L.y1 + TILE < y0 || L.y0 > y0 + CH + TILE) continue;
    for (let j = 0; j < L.h; j++) for (let i = 0; i < L.w; i++) {
      const tx = L.x0 + i * TILE, ty = L.y0 + j * TILE;
      if (tx + TILE < x0 || tx > x0 + CH || ty + TILE < y0 || ty - TILE > y0 + CH) continue;
      drawTile(g, L, i, j, rng(Math.floor(hash(i + L.x0, j * 7 + 3) * 4294967295)));
    }
  }
  c.canvas = cv2; return cv2;
}
function alphPlace(f) { // un Pokémon apparu dans le vide ou dans un mur d'une salle : posé sur une dalle libre, loin des joueurs
  const P = nearP(f.x, f.y), L = P && inZone(P.x) ? layAt(P.x, P.y) : null;
  if (!L) return;
  if (layAt(f.x, f.y) === L && ".,o=p".includes(layTile(L, f.x, f.y))) return;
  let best = null, bd = -1;
  for (let k = 0; k < 24; k++) { const t = L.floorT[Math.random() * L.floorT.length | 0], d = Math.min(...S.players.map(q => Math.hypot(q.x - t.x, q.y - t.y))); if (d > bd) { bd = d; best = t; } if (d > 420) break; }
  if (!best) return;
  f.x = best.x + (Math.random() - .5) * 20; f.y = best.y + (Math.random() - .5) * 20;
  if (!f.prop) S.fxs.push({ x:f.x, y:f.y, r:0, max:f.r * 2, life:.3, col:"rgba(200,170,255," });
}
function teleportTeam(x, y) { // toute l'équipe passe la porte ensemble ; les tirs en vol disparaissent
  S.players.forEach((q, k) => { q.x = x + (k - (S.players.length - 1) / 2) * 34; q.y = y; q.inv = Math.max(q.inv, .6); q.doorCd = .8; });
  S.cam = { x, y }; S.eshots = []; S.blackT = .45;
}
function updateDoors(dt) { // entrer dans un bâtiment par sa porte, ressortir par le bas de la salle
  const P = S.players.find(q => !q.down);
  if (!P) return;
  for (const q of S.players) q.doorCd = Math.max(0, (q.doorCd || 0) - dt);
  if (P.doorCd > 0) return;
  if (inZone(P.x)) {
    const L = layAt(P.x, P.y);
    if (L && P.y > L.exitY + TILE * .35) { const o = S.inside && S.inside.ruin; if (o) teleportTeam(o.ax, o.box.y1 + 46); else teleportTeam(0, START_Y); S.inside = null; }
    return;
  }
  let door = null;
  around(P.x, P.y, c => { for (const o of c.ruins || []) if (Math.abs(P.x - o.ax) < BL_DOOR * BL.U && P.y > o.box.y1 - 10 && P.y < o.box.y1 + 34) door = o; });
  if (!door) return;
  const L = LAYS[door.lay];
  S.inside = { ruin:door, lay:door.lay }; teleportTeam(L.entry.x, L.entry.y);
  banner(`Tu entres dans ${L.name}.`);
}
const alphWall = (x, y) => solidsNear(x, y).some(o => o.wall && (x - o.x) ** 2 + (y - o.y) ** 2 < o.r * o.r);
