/* ---------- Combat ---------- */
let HIT_SRC = null; // capacité à qui attribuer les dégâts (statistiques de fin de partie)
function evolveFoe(f, kind) { // un Pokémon sauvage qui a survécu assez longtemps évolue (PV gardés en proportion)
  const d = FOES[kind], k = f.maxHp / f.d.hp, ratio = f.hp / f.maxHp, from = f.d.name;
  f.kind = kind; f.d = d; f.r = d.r; f.maxHp = d.hp * k; f.hp = f.maxHp * Math.max(.5, ratio); f.evoT = undefined;
  S.fxs.push({ x:f.x, y:f.y, r:0, max:f.r * 3, life:.5, col:"rgba(255,255,230," });
  S.texts.push({ x:f.x, y:f.y - f.r - 20, txt:`${from} évolue en ${d.name} !`, col:"#ffe9a8", life:1.6, label:true });
}
function hitFoe(f, base, type, kx = 0, ky = 0, forceCrit = false) {
  if (f.under) return; // Sablaireau sous terre : intouchable
  if (f.prop) { f.hp = 0; return; } // arbre à baies / rocher : se casse au premier coup
  if (f.d.rare) return; // Noeunoeuf / Scarabrute : il faut les toucher, pas les attaquer
  if (f.d.mother && !scopeOn()) { maybeMsg(f, "Aucun effet…", "#c9c9c9"); return; } // Mère Ossatueur : intouchable sans Scope Sylphe
  S.P.orbHit = true;
  const m = eff(type, f.d.types);
  const crit = forceCrit || Math.random() < .05 * IT("lentilscope") + .01 * (shop.lentil || 0) + (LINES[S.P.line].crit || 0);
  const dmg = (veiled(f.d) ? .5 : 1) * base * S.P.dmgMul * (S.P.dracoT > 0 ? S.P.dracoMul : 1) * m * (.9 + Math.random() * .2) * (crit ? 2 : 1) * (f.leerT > 0 ? f.leerMul : 1) * (S.P.ancT > 0 ? 1.2 : 1) * (f.shieldT > 0 ? .15 : 1) * (f.d.armor || 1) * (f.d.solidRock && m > 1 ? .75 : 1) * jBoost(type) * wxMul(type); // Rhinoféros / Rhinastoc : blindés
  if (m === 0) { maybeMsg(f, "Aucun effet…", "#c9c9c9"); return; }
  f.hp -= dmg; f.hurt = .12; S.P.dealt += dmg; sfx("hit");
  if (S.P.line === "kaiminus" && JMELEE.has(HIT_SRC) && !S.P.down) S.P.hp = Math.min(S.P.maxHp, S.P.hp + Math.min(.2, dmg * .003)); // Sans Limite : chaque coup soigne un tout petit peu
  if (S.parts.length < 450) emit(f.x, f.y - f.r * .2, 3, type, { sp:170, life:.3, jit:f.r * .6 });
  const src = HIT_SRC || "autre", real = Math.min(dmg, Math.max(0, f.hp + dmg)); (S.dmgBy ||= {})[src] = (S.dmgBy[src] || 0) + real;
  if (S.P.line === "magicarpe" && S.P.stage > 0 && !S.P.down) S.P.hp = Math.min(S.P.maxHp, S.P.hp + real * .01);
  const pb = (S.P.dmgBy ||= {}); pb[src] = (pb[src] || 0) + real; f.lastBy = S.P.idx; // récap par joueur
  if (!f.d.boss && !f.d.heavy) { f.x += kx * 6; f.y += ky * 6; }
  S.texts.push({ x:f.x + (Math.random()-.5)*10, y:f.y - f.r, txt:Math.round(dmg), col: crit ? "#ff8a3d" : m > 1 ? "#ffd84a" : m < 1 ? "#a9b4a6" : "#fff", life:.6, big:m > 1 || crit });
  if (crit) maybeMsg(f, "Coup critique !", "#ff8a3d");
  if (m > 1) maybeMsg(f, "Super efficace !", "#ffd84a");
  else if (m < 1) maybeMsg(f, "Pas très efficace…", "#a9b4a6");
}
let msgCool = 0;
function usePick(k) {
  const P = S.P, say = (txt, col) => S.texts.push({ x:P.x, y:P.y - 30, txt, col, life:1.2, label:true });
  sfx(k === "aimant" ? "magnet" : k === "flute" ? "flute" : k === "chest" ? "chest" : "heal");
  if (k === "sitrus" || k === "potion") { P.hp = Math.min(P.maxHp, P.hp + 30); say(`${PICKS[k].name} +30 PV`, "#7fe08a"); }
  else if (k === "chest") S.chestQ.push(P); // c'est le joueur qui ramasse la Poké Ball qui l'ouvre
  else if (k === "aimant") { for (const g of S.gems) if (!g.pick) g.pull = true; banner("Aimant géant ! Tous les bonbons Exp. accourent."); }
  else if (k === "flute") {
    for (const f of S.foes) if (!f.prop && Math.abs(f.x - P.x) < 760 && Math.abs(f.y - P.y) < 460) f.sleepT = Math.max(f.sleepT || 0, f.d.boss ? 1.5 : 5);
    banner("Poké Flûte ! Les Pokémon sauvages s'endorment…");
  }
}
function maybeMsg(f, txt, col) {
  if (msgCool > 0) return; msgCool = 1.4;
  S.texts.push({ x:f.x, y:f.y - f.r - 18, txt, col, life:1.1, label:true });
}
function nearestFoes(n) {
  const P = S.P;
  return S.foes.filter(f => !f.under && !f.prop && !f.d.rare).map(f => [f, (f.x-P.x)**2 + (f.y-P.y)**2]).filter(a => a[1] < 520*520).sort((a,b) => a[1]-b[1]).slice(0, n).map(a => a[0]);
}

function updateMetro(P, dt) {
  for (let k = 1; k <= 6; k++) {
    const mt = P.moves["metro" + k]; if (!mt) continue;
    if ((mt.left = (mt.left ?? 0) - dt) > 0) continue;
    for (const id of mt.cur || []) if (P.moves[id]?.tmp === "metro" + k) delete P.moves[id];
    const pool = METRO[k - 1].filter(id => !P.moves[id]), n = 1; mt.cur = [];
    for (let i = 0; i < n && pool.length; i++) { const id = pool.splice(Math.random() * pool.length | 0, 1)[0]; P.moves[id] = { lv:Math.min(mt.lv, MOVES[id].max), t:.1, tmp:"metro" + k, since:S.t }; mt.cur.push(id); }
    mt.left = [6, 5.5, 5, 4.5, 4][mt.lv - 1] || 5;
    S.texts.push({ x:P.x + (k % 2 ? -1 : 1) * 30, y:P.y - P.r - 26 - (k - 1) * 13, txt:mt.cur.map(id => MOVES[id].name).join(" + "), col:"#ff9ac8", life:1.4, label:true });
  }
}
const realMoves = P => Object.entries(P.moves).filter(([id, m]) => !m.tmp); // sans les attaques prêtées par Métronome
