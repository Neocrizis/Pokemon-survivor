/* ---------- État de partie ---------- */
let S = null, state = "menu", last = 0;
const keys = new Set();
const touch = { on:false, ox:0, oy:0, x:0, y:0, id:null };

let secretShiny = false, titleClicks = 0; // secret : 10 clics sur le titre = starter chromatique
$("gameTitle").addEventListener("click", () => {
  if (secretShiny || ++titleClicks < 10) return;
  secretShiny = true; $("gameTitle").classList.add("shinyOn"); $("shinyHint").hidden = false;
});
let NUZ = false; try { NUZ = localStorage.getItem("pokesurv-nuz") === "1"; } catch (e) {}
function setNuz(on) { // mode Nuzlocke : pas de Rappel, pas de soin au sol
  NUZ = on; try { localStorage.setItem("pokesurv-nuz", on ? "1" : "0"); } catch (e) {}
  const b = document.getElementById("nuzBtn"); if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
  const tg = document.getElementById("nuzTag"); if (tg) tg.hidden = !on;
}
const PCOL = ["#f6c845", "#5aa9ff", "#6fdc6f", "#ff7ac8"]; // couleur de l'anneau de chaque joueur (J1 à J4)
const pTag = (p = S.P) => S.players.length > 1 ? `J${p.idx + 1} · ` : "";
function mkPlayer(line, idx, n) {
  const L = LINES[line];
  const P = { idx, x:(idx - (n - 1) / 2) * 44, y:START_Y, r:13, line, stage:0, hp:L.hp, maxHp:L.hp, baseSpeed:L.speed, lvl:1, xp:0, need:6, fx:1, fy:0, flip:false,
    inv:0, dmgMul:L.dmg || 1, cdMul:L.cd || 1, magnet:70, regen:L.regen || 0, moves:{}, items:{}, dealt:0, evoFlash:0, pendingLv:0, spiky: line === "pika" && Math.random() < 1/30, shiny: (idx === 0 && secretShiny) || Math.random() < 1/30 };
  P.moves[L.move] = { lv:1, t:.3 };
  P.dmgMul *= 1 + .02 * (shop.dmg || 0); P.baseSpeed *= 1 + .02 * (shop.spd || 0); P.maxHp = P.hp = Math.round(P.maxHp * (1 + .02 * (shop.hp || 0))); // achats du Marchand
  if (shop.rappel && !NUZ) P.revives = 1; // Rappel du Marchand
  if (P.spiky) P.moves.fatalfoudre = { lv:1, t:3 }; // 1 partie sur 30 avec Pichu
  return P;
}
function newGame(line, mapK) {
  if (LEVEL.rooms) setRoom(0);
  pickMap(mapK); // Oiseau Légendaire : une carte tirée au sort (imposée par l'hôte en ligne)
  const lines = Array.isArray(line) ? line : [line]; // multijoueur local : un starter par joueur (2 à 4)
  S = {
    t:0, nuz:NUZ, kills:0, spawnAcc:0, bossIdx:0, boss:null, nextRing:120, shake:0, msgs:[], chestQ:[],
    players:lines.map((l, i) => mkPlayer(l, i, lines.length)),
    foes:[], shots:[], eshots:[], waves:[], clouds:[], tornados:[], beams:[], tails:[], suns:[], sunbeams:[], gusts:[], slashes:[], patches:[], smokes:[], carpets:[], petalT:0, flames:[], gems:[], texts:[], fxs:[], parts:[], sludge:[], bolts:[], rocks:[], claws:[], eclaws:[], bites:[], ghosts:[], chains:[], falls:[], gas:[], muds:[], marks:[],
  };
  S.P = S.players[0]; S.cam = { x:0, y:START_Y }; S.rerolls = shop.reroll || 0;
  for (const p of S.players) if (p.spiky) { S.P = p; banner(`${pTag()}Un Pichu Troizépi ! Il n'évolue pas, mais maîtrise déjà Fatal-Foudre.`); }
  S.P = S.players[0];
  const ev = LEVEL.event; S.evAt = ev && Math.random() < (ev.chance ?? 1) ? ev.from + Math.random() * (ev.to - ev.from) : Infinity;
  if (LEVEL.maps) banner(`Carte tirée au sort : ${LEVEL.mapName} ! ${LEVEL.tip}`);
  if (LEVEL.league) { S.lgPh = "wild"; S.roomT = 0; S.nextRing = 60; banner(`Salle 1 sur 5 : ${LEVEL.member} (${LEVEL.mtype}). ${LEVEL.tip}`); }
  if (LEVEL.tower && !LEVEL.sprout && !scopeOn()) banner("Les Spectres sont impossibles à identifier… Il te faudrait le Scope Sylphe !");
  for (const p of S.players) if (p.shiny) { S.P = p; banner(`${pTag()}Waouh ! ${pName()} chromatique !` + (p.spiky ? " Et c'est un Pichu Troizépi !" : "")); p.evoFlash = 1.2; } // 1 partie sur 30
  S.P = S.players[0];
  if (S.players.length > 1) banner(`${S.players.length} joueurs ! Restez groupés : un coéquipier K.O. se relève si on reste 3 s à côté de lui.`);
  state = "play";
  $("hudLevel").textContent = `${LEVEL.name}${LEVEL.maps ? " · " + LEVEL.mapName : ""}${LEVEL.league ? " · Salle 1/5 · " + LEVEL.member : " · 10:00"}` + (S.nuz ? " · 💀 Nuzlocke" : "");
  for (const id of ["start","end","pause","levelup"]) $(id).hidden = true;
  $("hud").hidden = false; $("xpbar").hidden = false; $("boss").hidden = true;
  refreshHud();
}
const pKind = () => (S.P.spiky ? "pichuspiky" : S.P.eform || S.P.line) + (S.P.shiny ? "_s" : "");
const pName = () => S.P.spiky ? "Pichu Troizépi" : S.P.eform ? EEVEE[S.P.eform].name : LINES[S.P.line].names[S.P.stage];
const IT = id => S.P.items[id] || 0;
const AREA = () => 1 + .1 * IT("loupe") + .01 * (shop.loupe || 0) + .03 * IT("orbevie"), PSPD = () => 1 + .12 * IT("poudrevite") + .03 * IT("orbevie"), DUR = () => 1 + .12 * IT("lumargile") + .03 * IT("orbevie");
const EXTRA = () => IT("depipe") + (shop.depipe || 0), CURSE = () => 1 + .1 * IT("miel");
const MAX_ITEMS = 6, MAX_MOVES = () => 4 + (shop.slot || 0); // 4 capacités comme dans les jeux, +1 ou +2 achetées au Marchand
function hurtP(v) {
  const P = S.P;
  if (P.choosing) return false; // en ligne : intangible pendant son choix
  if (P.shieldT > 0) return false; // Protection (Germignon)
  if (P.line === "draco") v *= .9; // Multiécaille : −10 % de dégâts reçus
  P.hp -= Math.max(1, v - IT("veste") - (shop.veste || 0)); P.inv = .5; S.bossClean = false; sfx("hurt");
  try { (P.gp || pad.gp)?.vibrationActuator?.playEffect("dual-rumble", { duration:120, strongMagnitude:.35, weakMagnitude:.25 }); } catch (e) {}
  if (P.hp > 0) return false;
  if (P.revives > 0) {
    P.revives--; P.deaths = (P.deaths || 0) + 1; P.revived = (P.revived || 0) + 1; P.hp = Math.round(P.maxHp * .5); P.inv = 2.5; P.evoFlash = 1;
    for (const f of S.foes) { if (f.d.boss) continue; const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1; if (d < 320) { f.kbx = dx / d * 700; f.kby = dy / d * 700; } }
    S.fxs.push({ x:P.x, y:P.y, r:0, max:320, life:.5, col:"rgba(255,230,140," });
    banner(`Rappel ! ${pName()} revient au combat !`);
    return false;
  }
  if (S.players.some(p => p !== P && !p.down)) { // multijoueur : K.O., un coéquipier peut le relever
    P.deaths = (P.deaths || 0) + 1; P.hp = 0; P.down = true; P.revT = 0; P.inv = 1e9; P.kbx = P.kby = 0; P.dashT = 0;
    banner(`${pTag(P)}${pName()} est K.O. ! Reste 3 s à côté de lui pour le relever.`);
    return false;
  }
  P.deaths = (P.deaths || 0) + 1; P.hp = 0; endGame(false); return true;
}
function boomHit(x, y, R, dmg, type) { // souffle d'explosion ou impact : touche tous les joueurs dans la zone ; true si la partie est perdue (type : efficacité selon le Pokémon touché)
  const P0 = S.P;
  for (const q of S.players) { if (q.down || q.choosing || q.inv > 0 || Math.hypot(q.x - x, q.y - y) > R + q.r * .6) continue; S.P = q; if (hurtP(dmg * (type ? eff(type, [ptype()]) : 1) * (1 + S.t / 900))) return true; }
  S.P = P0; return false;
}
function paralyze(P, t) { // les Pokémon Électrik ne peuvent pas être paralysés
  if (ptype() === "electrik" || (P.parCd || 0) > S.t) return;
  P.parT = t; P.parCd = S.t + t + 1.2; S.texts.push({ x:P.x, y:P.y - P.r - 34, txt:"Paralysé !", col:"#f6d13a", life:1, label:true });
}
function statusHit(P, s) { // Glace : ralentit ; Cage-Éclair : paralyse
  if (s.type === "glace") { if (!(P.slowT > 0)) S.texts.push({ x:P.x, y:P.y - P.r - 34, txt:"Ralenti !", col:"#a8e4ff", life:1, label:true }); P.slowT = Math.max(P.slowT || 0, s.slow || 1.6); }
  if (s.para) paralyze(P, s.para);
  if (s.burn) burnP(P, s.burn);
}
function burnP(P, t) { // Lance-Flammes de Sulfura : brûlure (les Pokémon Feu ne brûlent pas)
  if (ptype() === "feu") return;
  if (!(P.burnT > 0)) S.texts.push({ x:P.x, y:P.y - P.r - 34, txt:"Brûlé !", col:"#ff9a4a", life:1, label:true });
  P.burnT = Math.max(P.burnT || 0, t);
}
const BIRD_COL = { ice:"150,220,255", elec:"255,230,90", fire:"255,140,50" };
function spawnBird() { // Oiseau Légendaire : l'oiseau de la carte arrive à 5:00
  S.birdOut = true; const P = S.P, a = Math.random() * Math.PI * 2, f = spawnFoe(LEVEL.bird, P.x + Math.cos(a) * 340, P.y + Math.sin(a) * 340);
  f.hp = f.maxHp = Math.round((6000 + S.t * 8) * (1 + .6 * (S.players.length - 1))); f.atkT = 2; f.atkI = 0; S.bird = f; sfx("boss"); S.shake = .5;
  const el = { ice:"glace", elec:"electrik", fire:"feu" }[f.d.bird];
  for (const g of S.foes) if (g !== f && !g.d.boss && !g.prop && !g.d.rare && Math.hypot(g.x - f.x, g.y - f.y) < 650) { g.hp = 0; emit(g.x, g.y, 4, el, { sp:120, life:.4 }); } // son arrivée balaie les Pokémon autour
  banner({ ice:"Un vent glacial souffle… ARTIKODIN fond sur toi depuis les hauteurs gelées !", elec:"Les générateurs grésillent… ÉLECTHOR surgit dans un éclair !", fire:"La roche se fend… SULFURA s'élève dans un torrent de flammes !" }[f.d.bird]);
  S.fxs.push({ x:f.x, y:f.y, r:0, max:400, life:.8, col:`rgba(${BIRD_COL[f.d.bird]},` }); emit(f.x, f.y, 40, el, { sp:300, life:.8, r:3.5 });
}
function laserTick(f, a0, dt) { // Laser Glace (Lamantine géant, Artikodin) : vise, puis balaie lentement ; ralentit. true si la partie est perdue
  const z = f.lz, scl = 1 + S.t / 900, W = z.w || 22; z.t -= dt; f.hold = .1;
  if (z.ph === "aim") { z.a = a0; if (z.t <= 0) { z.ph = "fire"; z.t = z.dur || 1.5; } }
  else {
    const da = ((a0 - z.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI, tr = z.turn || .45; z.a += Math.max(-tr * dt, Math.min(tr * dt, da));
    const ex = Math.cos(z.a), ey = Math.sin(z.a), sl = z.slow ?? 3, ty = z.type || "glace";
    for (const q of S.players) {
      if (q.down || q.choosing) continue;
      const k = Math.max(0, Math.min(900, (q.x - f.x) * ex + (q.y - f.y) * ey)), px = f.x + ex * k, py = f.y + ey * k;
      if (Math.hypot(q.x - px, q.y - py) < W + q.r) {
        S.P = q; if (q.inv <= 0) { if (sl) statusHit(q, { type:"glace", slow:sl }); if (hurtP((z.dmg || 11) * eff(ty, [ptype()]) * scl)) return true; } else if (sl) q.slowT = Math.max(q.slowT || 0, sl);
      }
    }
    if (Math.random() < dt * 30) { const k = Math.random() * 900; emit(f.x + ex * k, f.y + ey * k, 1, ty, { sp:60, life:.4, r:2.4 }); }
    if (z.t <= 0) { f.lz = null; f.lzT = 5.5; }
  }
  return false;
}
