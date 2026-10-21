/* ---------- Johto : capacités et talents de Germignon, Héricendre et Kaiminus ---------- */
const JMELEE = new Set(["machouille", "crocsgivre", "hydroqueue", "aquabreche"]); // Sans Limite (Kaiminus)
const jBoost = type => (type === "feu" && S.P.heat ? 1 + .4 * S.P.heat : 1) * (S.P.line === "kaiminus" && JMELEE.has(HIT_SRC) ? 1.15 : 1);
const dirFor = P => { // direction d'une ruée : le déplacement, sinon la visée, sinon l'ennemi le plus proche
  if (P.moving) return [P.mvx || 0, P.mvy || 0];
  if (P.aiming) return [P.fx, P.fy];
  const f = nearestFoes(1)[0]; return f ? [f.x - P.x, f.y - P.y] : [0, 0];
};
const serene = () => S.P && S.P.line === "togepi" ? 2 : 1; // Sérénité (Togepi) : effets secondaires ×2
function fear(f, ch, T) { if (f.hp > 0 && !f.d.boss && Math.random() < ch * serene()) { f.stunT = Math.max(f.stunT || 0, T); f.fearT = S.t + T; } } // apeuré : immobile
function charm(f, ch, T) { if (f.hp > 0 && !f.d.boss && Math.random() < ch * serene()) f.charmT = S.t + T; } // charmé : s'éloigne sans attaquer
const nearAim = P => { const f = nearestFoes(1)[0]; return P.aiming || !f ? Math.atan2(P.fy, P.fx) : Math.atan2(f.y - P.y, f.x - P.x); };
const JMOVE = {
  rouefeu(P, m, lv, dt) { // un arc de flammes d'un quart de cercle tourne autour d'Héricendre (comme Tranch'Herbe)
    m.t = 0; const spd = (lv >= 4 ? 5.5 : 4.5) * PSPD(), rad = ((lv >= 2 ? 62 : 52) + P.stage * 6) * AREA(), dmg = (14 + 3 * lv) * (lv >= 3 ? 1.4 : 1) * jBoost("feu");
    m.a = ((m.a ?? 0) + spd * dt) % (Math.PI * 2); m.rad = rad; m.arcs = lv >= 5 ? 2 : 1;
    for (const f of S.foes) {
      if (f.prop || f.d.rare || f.hp <= 0 || f.wheelT > S.t) continue;
      const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1; if (Math.abs(d - rad) > f.r + 16) continue;
      const fa = Math.atan2(dy, dx);
      for (let k = 0; k < m.arcs; k++) {
        const rel = (((m.a + k * Math.PI - fa) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2); // 0 = tête de la flamme, π/2 = bout de la traîne
        if (rel > Math.PI / 2) continue;
        f.wheelT = S.t + .3; hitFoe(f, dmg, "feu", dx / d * .4, dy / d * .4);
        if (lv >= 3) { f.burnT = 2 * DUR(); f.burnDps = Math.max(f.burnDps || 0, 3 + lv); }
        break;
      }
    }
  },
  nitrocharge(P, m, lv) { // ruée enflammée : brûle sur son passage, chaque ennemi touché accélère Héricendre
    const [dx, dy] = dirFor(P), l = Math.hypot(dx, dy); if (!l || P.dashT > 0) { m.t = .3; return; }
    m.t = (lv >= 4 ? 1.7 : 2.2) * P.cdMul;
    const dist = 170 + 20 * lv + (lv >= 2 ? 40 : 0);
    P.dashT = .3; P.dashBy = "nitrocharge"; P.dvx = dx / l * dist / .3; P.dvy = dy / l * dist / .3; P.inv = Math.max(P.inv, .4);
    m.hit = new Set(); m.ring = lv >= 5; m.pt = 0; m.nmax = 3 + (lv >= 3) + (lv >= 5);
  },
  brouillard(P, m, lv) {
    m.t = (lv >= 4 ? 6 : 8) * P.cdMul;
    const life = (lv >= 3 ? 4 : 3) * DUR();
    (S.smokes ||= []).push({ x:P.x, y:P.y, r:(120 + 18 * lv) * AREA(), life, max:life, miss:lv >= 3 ? .5 : .4, slow:lv >= 5, o:P, ph:Math.random() * 6 });
  },
  rebondifeu(P, m, lv) { // une boule de feu qui rebondit d'ennemi en ennemi et les brûle
    const pool = nearestFoes(12).filter(f => Math.hypot(f.x - P.x, f.y - P.y) < 420);
    if (!pool.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? 1.6 : 2) * P.cdMul;
    const n = 1 + (lv >= 3) + (lv >= 5) + EXTRA(), dmg = (16 + 4 * lv) * (lv >= 3 ? 1.4 : 1), bounce = 2 + (lv >= 2 ? 2 : 0) + (lv >= 5 ? 2 : 0);
    for (let i = 0; i < n; i++) {
      const f = pool[i % pool.length], a = Math.atan2(f.y - P.y, f.x - P.x) + (i ? (Math.random() - .5) * .3 : 0);
      S.shots.push({ kind:"blast", x:P.x, y:P.y, vx:Math.cos(a) * 380, vy:Math.sin(a) * 380, r:9 + P.stage, dmg, life:1.4, pierce:1, bounce, hit:new Set(), type:"feu",
        onHit:g => { g.burnT = 2.5 * DUR(); g.burnDps = Math.max(g.burnDps || 0, 4 + lv); emit(g.x, g.y, 6, "feu", { sp:120, life:.35 }); } });
    }
  },
  eruption(P, m, lv) {
    m.t = (lv >= 4 ? 5 : 6.5) * P.cdMul;
    const R0 = (150 + 20 * lv + (lv >= 2 ? 30 : 0)) * AREA(), dmg = (40 + 12 * lv) * (lv >= 3 ? 1.4 : 1) * (1 + 1.5 * Math.max(0, P.hp) / P.maxHp); // PV pleins : ×2,5
    S.fxs.push({ x:P.x, y:P.y, r:0, max:R0, life:.45, col:"rgba(255,120,40,", star:true }); S.shake = Math.max(S.shake, .3); emit(P.x, P.y, 40, "feu", { sp:R0 * 3, life:.6, r:4 });
    for (const f of S.foes) if (!f.d.rare && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2) { hitFoe(f, dmg, "feu", (f.x - P.x) / R0 * 4, (f.y - P.y) / R0 * 4); f.burnT = 3 * DUR(); f.burnDps = Math.max(f.burnDps || 0, 6 + lv); }
    if (lv >= 5) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; S.shots.push({ kind:"blast", x:P.x, y:P.y, vx:Math.cos(a) * 300, vy:Math.sin(a) * 300, r:11, dmg:dmg * .4, life:1.2, pierce:1, type:"feu", boom:true, boomR:70 * AREA(), boomMul:.7 }); }
    if (!m.said) { m.said = true; banner(`${pName()} utilise Éruption !`); }
  },
  machouille(P, m, lv) {
    const range = (105 + 10 * lv) * AREA(), ts = nearestFoes(2 + (lv >= 2) + (lv >= 4)).filter(f => Math.hypot(f.x - P.x, f.y - P.y) < range + f.r);
    if (!ts.length) { m.t = .12; if (S.t - (m.last ?? -9) > 1.6) P.frenzy = 0; return; }
    m.fr = S.t - (m.last ?? -9) < 1.6 ? Math.min(lv >= 5 ? 7 : 5, (m.fr || 0) + 1) : 0; m.last = S.t; P.frenzy = m.fr;
    m.t = (lv >= 4 ? .75 : .9) * (1 - .08 * m.fr) * P.cdMul;
    const dmg = (16 + 5 * lv) * (lv >= 3 ? 1.4 : 1);
    for (const f of ts) { hitFoe(f, dmg, "eau"); S.bites.push({ x:f.x, y:f.y, r:f.r + 8, life:.25 }); emit(f.x, f.y, 4, "eau", { sp:120, life:.3 }); }
  },
  crocsgivre(P, m, lv) {
    const a0 = nearAim(P), range = (100 + 12 * lv + (lv >= 2 ? 20 : 0)) * AREA();
    const hit = S.foes.filter(f => !f.prop && !f.d.rare && f.hp > 0 && Math.hypot(f.x - P.x, f.y - P.y) < range + f.r && Math.abs(((Math.atan2(f.y - P.y, f.x - P.x) - a0) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI) < .7);
    if (!hit.length) { m.t = .2; return; }
    m.t = (lv >= 4 ? 2.4 : 3.2) * P.cdMul;
    const dmg = (20 + 6 * lv) * (lv >= 3 ? 1.4 : 1), frz = (lv >= 5 ? 1.75 : lv >= 3 ? 1.25 : 1) * DUR();
    for (const f of hit) { const ft = f.d.boss ? .3 : frz; hitFoe(f, dmg, "glace"); f.stunT = Math.max(f.stunT || 0, ft); f.frozeT = S.t + ft; S.bites.push({ x:f.x, y:f.y, r:f.r + 8, life:.25 }); emit(f.x, f.y, 6, "glace", { sp:140, life:.4 }); }
    S.fxs.push({ x:P.x + Math.cos(a0) * range * .5, y:P.y + Math.sin(a0) * range * .5, r:0, max:range * .55, life:.25, col:"rgba(170,230,255," });
  },
  hydroqueue(P, m, lv) {
    const rad = (85 + 12 * lv + (lv >= 2 ? 15 : 0)) * AREA();
    if (!S.foes.some(f => !f.prop && !f.d.rare && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (rad + f.r) ** 2)) { m.t = .2; return; }
    m.t = (lv >= 4 ? 1.8 : 2.4) * P.cdMul;
    const dmg = (18 + 5 * lv) * (lv >= 3 ? 1.4 : 1);
    for (const f of S.foes) {
      if (f.prop || f.d.rare) continue; const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1; if (d > rad + f.r) continue;
      hitFoe(f, dmg, "eau", dx / d * 4, dy / d * 4); if (!f.d.boss) { f.kbx = dx / d * (300 + 30 * lv); f.kby = dy / d * (300 + 30 * lv); }
    }
    S.tails.push({ r:rad, life:.3, a:Math.random() * 6, water:true });
    if (lv >= 5) S.waves.push({ x:P.x, y:P.y, r:12, max:rad * 1.6, life:.55, dmg:dmg * .5, push:320, hit:new Set(), o:P });
  },
  aquabreche(P, m, lv) {
    const [dx, dy] = dirFor(P), l = Math.hypot(dx, dy); if (!l || P.dashT > 0) { m.t = .3; return; }
    m.t = (lv >= 4 ? 4 : 5) * P.cdMul;
    const dist = 260 + 30 * lv + (lv >= 2 ? 60 : 0);
    P.dashT = .3; P.dashBy = "aquabreche"; P.dvx = dx / l * dist / .3; P.dvy = dy / l * dist / .3; P.inv = Math.max(P.inv, .5); m.hit = new Set(); m.wave = lv >= 5;
  },
  feuillemagik(P, m, lv) {
    const n = 2 + (lv >= 2) + (lv >= 4) + (lv >= 5) + EXTRA(), tg = nearestFoes(n);
    if (!tg.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? .8 : 1) * P.cdMul;
    const dmg = (14 + 4 * lv) * (lv >= 3 ? 1.4 : 1);
    for (let i = 0; i < n; i++) {
      const f = tg[i % tg.length], a = Math.atan2(f.y - P.y, f.x - P.x) + (i - (n - 1) / 2) * .5;
      S.shots.push({ kind:"mleaf", x:P.x, y:P.y - 4, vx:Math.cos(a) * 340, vy:Math.sin(a) * 340, r:7, dmg, life:2.4, pierce:lv >= 3 ? 2 : 1, type:"plante", home:f, hit:new Set(), ph:Math.random() * 6 });
    }
  },
  protection(P, m, lv) {
    m.t = (lv >= 4 ? 6 : 8) * P.cdMul;
    const T = (1.5 + .25 * lv) * DUR(), ref = (20 + 6 * lv) * (lv >= 3 ? 1.4 : 1);
    for (const q of S.players) if (q === P || (lv >= 5 && !q.down && Math.hypot(q.x - P.x, q.y - P.y) < 160)) { q.shieldT = T; q.shieldRef = ref; q.shieldBy = P; }
  },
  synthese(P, m, lv) {
    m.t = (lv >= 4 ? 9 : 12) * P.cdMul;
    const k = .1 + .025 * lv, R0 = 280 * AREA();
    for (const q of S.players) if (!q.down && Math.hypot(q.x - P.x, q.y - P.y) < R0) {
      const v = Math.round(q.maxHp * k); q.hp = Math.min(q.maxHp, q.hp + v);
      S.fxs.push({ x:q.x, y:q.y, r:0, max:46, life:.5, col:"rgba(140,240,120," }); emit(q.x, q.y, 14, "plante", { sp:90, life:.7, up:60, r:2.6 });
      S.texts.push({ x:q.x, y:q.y - 30, txt:"+" + v, col:"#7dff8a", life:.8 });
    }
  },
  tapisfleuri(P, m, lv) {
    m.t = (lv >= 4 ? 4.5 : 6) * P.cdMul;
    const life = (4 + .5 * lv) * DUR();
    (S.carpets ||= []).push({ x:P.x, y:P.y, r:(80 + 12 * lv + (lv >= 2 ? 15 : 0)) * AREA(), life, max:life, dmg:(4 + 2 * lv) * (lv >= 3 ? 1.4 : 1), slow:lv >= 5 ? .45 : .6, heal:1 + .3 * lv, tk:0, o:P, seed:Math.floor(Math.random() * 1e6) });
  },
  ventfeerique(P, m, lv) {
    const n = 2 + (lv >= 2) + (lv >= 4) + EXTRA(), ts = nearestFoes(n);
    if (!ts.length && !P.aiming) { m.t = .2; return; }
    m.t = (lv >= 4 ? .85 : 1.05) * P.cdMul;
    const dmg = (11 + 3 * lv) * (lv >= 3 ? 1.4 : 1);
    for (let i = 0; i < n; i++) {
      const f = ts[i % Math.max(1, ts.length)], a = (f && !P.aiming ? Math.atan2(f.y - P.y, f.x - P.x) : Math.atan2(P.fy, P.fx)) + (i - (n - 1) / 2) * .16;
      S.shots.push({ kind:"fairy", x:P.x, y:P.y - 4, vx:Math.cos(a) * 380, vy:Math.sin(a) * 380, r:7 + P.stage, dmg, life:1.2, pierce:lv >= 5 ? 2 : 1, type:"fee", hit:new Set(), ph:Math.random() * 6, onHit:g => fear(g, .1, .6) });
    }
  },
  lamedair(P, m, lv) {
    if (!P.aiming && !nearestFoes(1).length) { m.t = .2; return; }
    m.t = (lv >= 4 ? 1.2 : 1.6) * P.cdMul;
    const a0 = nearAim(P), n = 1 + (lv >= 2) + (lv >= 5) + EXTRA(), dmg = (22 + 6 * lv) * (lv >= 3 ? 1.4 : 1);
    for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .28; S.shots.push({ kind:"airblade", x:P.x, y:P.y, vx:Math.cos(a) * 620, vy:Math.sin(a) * 620, r:15 + 2 * P.stage, dmg, life:.75, pierce:999, type:"vol", hit:new Set(), onHit:g => fear(g, .3, .6) }); }
  },
  aurasphere(P, m, lv) {
    const tg = nearestFoes(10).sort((a, b) => b.hp - a.hp); if (!tg.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? 2 : 2.6) * P.cdMul;
    const n = 1 + (lv >= 5) + EXTRA(), dmg = (45 + 12 * lv) * (lv >= 3 ? 1.4 : 1);
    for (let i = 0; i < n; i++) {
      const f = tg[i % tg.length], a = Math.atan2(f.y - P.y, f.x - P.x) + (i ? (i % 2 ? .7 : -.7) : 0);
      S.shots.push({ kind:"aura", x:P.x, y:P.y - 4, vx:Math.cos(a) * 300, vy:Math.sin(a) * 300, r:10 + (lv >= 2 ? 3 : 0) + P.stage, dmg, life:3, pierce:1, type:"combat", home:f, hit:new Set(), ph:Math.random() * 6, boom:lv >= 2, boomR:60 * AREA(), boomMul:.5 });
    }
  },
  eclatmagique(P, m, lv) {
    const R0 = (120 + 15 * lv + (lv >= 2 ? 25 : 0)) * AREA();
    if (!S.foes.some(f => !f.prop && !f.d.rare && f.hp > 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2)) { m.t = .25; return; }
    m.t = (lv >= 4 ? 3 : 4) * P.cdMul;
    const dmg = (20 + 6 * lv) * (lv >= 3 ? 1.4 : 1), ct = (lv >= 5 ? 2.5 : 1.5) * DUR();
    S.fxs.push({ x:P.x, y:P.y, r:0, max:R0, life:.4, col:"rgba(255,170,220," }); S.fxs.push({ x:P.x, y:P.y, r:0, max:R0 * .45, life:.4, star:true });
    emit(P.x, P.y, 26, "fee", { sp:R0 * 2.5, life:.5, r:3 });
    for (const f of S.foes) if (!f.prop && !f.d.rare && f.hp > 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2) { hitFoe(f, dmg, "fee"); charm(f, .2, ct); }
  },
  metronome(P, m, lv) { // Togepi : emprunte au hasard l'attaque d'un autre starter
    for (const id of m.cur || []) if (P.moves[id]?.tmp === "metronome") delete P.moves[id];
    const pool = METRO[[1, 2, 3, 3, 4][lv - 1]].filter(id => !P.moves[id]); m.cur = [];
    for (let i = 0; i < (lv >= 5 ? 2 : 1) && pool.length; i++) { const id = pool.splice(Math.random() * pool.length | 0, 1)[0]; P.moves[id] = { lv:Math.min(lv, MOVES[id].max), t:.1, tmp:"metronome", since:S.t }; m.cur.push(id); }
    m.t = lv >= 4 ? 5 : 6;
    S.texts.push({ x:P.x, y:P.y - P.r - 26, txt:m.cur.map(id => MOVES[id].name).join(" + "), col:"#ff9ac8", life:1.4, label:true });
  },
  tempeteflorale(P, m, lv) {
    m.t = (lv >= 4 ? 7 : 9) * P.cdMul;
    m.wave2 = lv >= 5 ? .45 : 0; jPetals(P, lv); S.petalT = 1;
  },
};
function jPetals(P, lv) { // Tempête Florale : tous les ennemis à l'écran
  const dmg = (25 + 8 * lv) * (lv >= 2 ? 1.15 : 1) * (lv >= 3 ? 1.4 : 1); HIT_SRC = "tempeteflorale";
  for (const f of S.foes) if (!f.prop && !f.d.rare && f.hp > 0 && Math.abs(f.x - P.x) < 560 && Math.abs(f.y - P.y) < 380) { hitFoe(f, dmg, "plante"); if (Math.random() < .5) emit(f.x, f.y, 3, "plante", { sp:90, life:.4 }); }
}
function updateJohto(P, dt) { // talents et effets continus des starters de Johto (appelé pour chaque joueur)
  if (P.line === "heri") { // Torche : la Chaleur monte en courant et retombe à l'arrêt
    P.heat = Math.max(0, Math.min(1, (P.heat || 0) + (P.moving ? .35 : -.5) * dt));
    if (P.heat > .4 && Math.random() < dt * 20 * P.heat) emit(P.x - (P.fx || 0) * 8, P.y - 10, 1, "feu", { sp:30, life:.4, up:40, r:2 });
  }
  if (P.nitroT > 0 && (P.nitroT -= dt) <= 0) P.nitro = 0;
  if (P.shieldT > 0) { // Protection : renvoie les coups aux ennemis qui touchent le bouclier
    P.shieldT -= dt; HIT_SRC = "protection"; const S0 = S.P; S.P = P.shieldBy || P;
    for (const f of S.foes) if (!f.prop && !f.d.rare && f.hp > 0 && !(f.reflT > S.t) && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (f.r + P.r + 12) ** 2) {
      f.reflT = S.t + .5; const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1; hitFoe(f, P.shieldRef || 20, "normal", dx / d * 4, dy / d * 4);
      if (!f.d.boss) { f.kbx = dx / d * 320; f.kby = dy / d * 320; }
    }
    S.P = S0;
  }
  if (P.line === "germignon" && !P.down) { // Feuille Garde : soigne les alliés proches, ralentit les ennemis
    const R0 = 140 * AREA(); P.guardR = R0;
    for (const q of S.players) if (!q.down && Math.hypot(q.x - P.x, q.y - P.y) < R0) q.hp = Math.min(q.maxHp, q.hp + (q === P ? .3 : .8) * dt);
    for (const f of S.foes) if (!f.d.boss && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2 && !(f.slowT > .2 && f.slowMul < .85)) { f.slowT = .2; f.slowMul = .85; }
  }
  const rf = P.moves.nitrocharge;
  if (rf?.hit) { // Nitrocharge : brûle sur son passage, sème des flammes et accélère à chaque ennemi touché
    HIT_SRC = "nitrocharge";
    if (P.dashT > 0 && P.dashBy === "nitrocharge") {
      const dmg = (14 + 4 * rf.lv) * (rf.lv >= 3 ? 1.4 : 1);
      for (const f of S.foes) if (!rf.hit.has(f) && f.hp > 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (f.r + P.r + 14) ** 2) { rf.hit.add(f); hitFoe(f, dmg, "feu", P.dvx / 900, P.dvy / 900); P.nitro = Math.min(rf.nmax || 3, (P.nitro || 0) + 1); P.nitroT = 4; }
      if ((rf.pt -= dt) <= 0) { rf.pt = .035; S.patches.push({ x:P.x, y:P.y + P.r * .5, r:16 * AREA(), life:1.6 * DUR(), max:1.6 * DUR(), dmg:3 + rf.lv, burn:rf.lv >= 3, ph:Math.random() * 6, src:"nitrocharge", o:P }); }
      if (Math.random() < .8) emit(P.x, P.y, 2, "feu", { sp:80, life:.35, r:2.6 });
    } else {
      if (rf.ring) {
        const R0 = 95 * AREA(), dmg = (14 + 4 * rf.lv) * 1.4 * .7;
        S.fxs.push({ x:P.x, y:P.y, r:0, max:R0, life:.35, col:"rgba(255,130,40," }); emit(P.x, P.y, 20, "feu", { sp:260, life:.45, r:3 });
        for (const f of S.foes) if (!f.d.rare && f.hp > 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2) { hitFoe(f, dmg, "feu"); f.burnT = 2.5 * DUR(); f.burnDps = Math.max(f.burnDps || 0, 5 + rf.lv); }
      }
      rf.hit = null;
    }
  }
  const ab = P.moves.aquabreche;
  if (ab?.hit) { // Aqua-Brèche : charge à travers la foule
    HIT_SRC = "aquabreche";
    if (P.dashT > 0 && P.dashBy === "aquabreche") {
      const dmg = (60 + 15 * ab.lv) * (ab.lv >= 3 ? 1.4 : 1), l = Math.hypot(P.dvx, P.dvy) || 1;
      for (const f of S.foes) if (!ab.hit.has(f) && f.hp > 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (f.r + P.r + 22) ** 2) {
        ab.hit.add(f); hitFoe(f, dmg, "eau", P.dvx / l * 4, P.dvy / l * 4);
        if (!f.d.boss) { const sx = f.x - P.x, sy = f.y - P.y, side = (sx * -P.dvy + sy * P.dvx) > 0 ? 1 : -1; f.kbx = -P.dvy / l * 380 * side + P.dvx / l * 200; f.kby = P.dvx / l * 380 * side + P.dvy / l * 200; }
      }
      if (Math.random() < .9) S.fxs.push({ x:P.x + (Math.random() - .5) * 34, y:P.y + (Math.random() - .5) * 34, r:0, max:9 + Math.random() * 8, life:.3, col:"rgba(120,190,255," });
    } else { if (ab.wave) S.waves.push({ x:P.x, y:P.y, r:12, max:170 * AREA(), life:.55, dmg:(60 + 15 * ab.lv) * .5, push:340, hit:new Set(), o:P, src:"aquabreche" }); ab.hit = null; }
  }
  if (S.smokes) { // Brouillard : les ennemis dans la fumée ratent leurs coups
    for (const sm of S.smokes) if (sm.o === P) {
      sm.life -= dt;
      for (const f of S.foes) if ((f.x - sm.x) ** 2 + (f.y - sm.y) ** 2 < (sm.r + f.r) ** 2) { f.blindT = S.t + .3; f.blindMiss = sm.miss; if (sm.slow && !f.d.boss && !(f.slowT > .2 && f.slowMul < .7)) { f.slowT = .2; f.slowMul = .7; } }
    }
    S.smokes = S.smokes.filter(sm => sm.life > 0);
  }
  if (S.carpets) { // Tapis Fleuri : enlise et blesse les ennemis, soigne les alliés
    for (const cp of S.carpets) if (cp.o === P) {
      cp.life -= dt; cp.tk -= dt; const tick = cp.tk <= 0; if (tick) cp.tk = .5; HIT_SRC = "tapisfleuri";
      for (const f of S.foes) if (!f.prop && !f.d.rare && f.hp > 0 && (f.x - cp.x) ** 2 + (f.y - cp.y) ** 2 < (cp.r + f.r * .5) ** 2) {
        if (!f.d.boss && !(f.slowT > .2 && f.slowMul < cp.slow)) { f.slowT = .2; f.slowMul = cp.slow; }
        if (tick) hitFoe(f, cp.dmg, "plante");
      }
      for (const q of S.players) if (!q.down && (q.x - cp.x) ** 2 + (q.y - cp.y) ** 2 < cp.r * cp.r) q.hp = Math.min(q.maxHp, q.hp + cp.heal * dt);
    }
    S.carpets = S.carpets.filter(cp => cp.life > 0);
  }
  const tf = P.moves.tempeteflorale; if (tf?.wave2 > 0 && (tf.wave2 -= dt) <= 0) { jPetals(P, tf.lv); S.petalT = 1; }
}
// boss de la Tour Chétiflor : Fouet Lianes (annoncé, puis claque) et Tranch'Herbe en cercle
function updateJohtoFoes(dt) {
  if (S.petalT > 0) S.petalT -= dt;
  for (const f of S.foes) {
    if (!f.d.vine && !f.d.leafRing) continue;
    if (f.hp <= 0 || f.sleepT > 0 || f.stunT > 0) { f.vine = null; continue; }
    const P = S.P = nearP(f.x, f.y), dx = P.x - f.x, dy = P.y - f.y, l = Math.hypot(dx, dy);
    if (f.d.vine) {
      const v = f.vine;
      if (v) {
        if (v.t > 0) {
          v.t -= dt;
          if (v.t <= 0) { // le fouet claque
            v.st = .25; S.shake = Math.max(S.shake, .12);
            for (const a of v.as) {
              const ex = Math.cos(a), ey = Math.sin(a), along = dx * ex + dy * ey, perp = Math.abs(dx * -ey + dy * ex);
              if (along > 0 && along < v.len + P.r && perp < v.w / 2 + P.r && P.inv <= 0) { if (hurtP(f.d.dmg * .8 * (1 + S.t / 900))) return true; break; }
            }
          }
        } else if ((v.st -= dt) <= 0) f.vine = null;
      } else if ((f.vnT = (f.vnT ?? 2) - dt) <= 0 && l < f.r + 260 && f.dashMode !== "go") {
        f.vnT = f.kind === "bossEmpiflor" ? 1.8 : 2.4;
        const a = Math.atan2(dy, dx); f.vine = { as:f.kind === "bossChetiflor" ? [a] : [a - .3, a + .3], t:.55, st:0, len:f.r + 230, w:26 };
        if (!f.saidV) { f.saidV = true; banner(`${f.d.name} utilise Fouet Lianes !`); }
      }
    }
    if (f.d.leafRing && f.dashMode !== "go" && (f.lrT = (f.lrT ?? 3) - dt) <= 0) {
      f.lrT = 3.5; const a0 = Math.random() * Math.PI * 2;
      for (let i = 0; i < 16; i++) { const a = a0 + i / 16 * Math.PI * 2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 210, vy:Math.sin(a) * 210, dmg:11, life:2.6, type:"plante", r:8 }); }
      if (!f.saidL) { f.saidL = true; banner(`${f.d.name} utilise Tranch'Herbe !`); }
    }
  }
  return false;
}
function drawJohtoUnder(t) { // sol : tapis de fleurs, aura de Germignon, chaleur d'Héricendre
  for (const cp of S.carpets || []) {
    const a = Math.min(1, cp.life * 1.5, (cp.max - cp.life) * 5 + .2); cx.save(); cx.globalAlpha = a;
    circ(cx, cp.x, cp.y, cp.r, "rgba(90,170,70,.22)");
    cx.strokeStyle = "rgba(170,230,120,.45)"; cx.lineWidth = 2; cx.beginPath(); cx.arc(cp.x, cp.y, cp.r, 0, Math.PI * 2); cx.stroke();
    const R = rng(cp.seed);
    for (let k = 0; k < 22; k++) {
      const an = R() * Math.PI * 2, rr = Math.sqrt(R()) * cp.r * .9, x = cp.x + Math.cos(an) * rr, y = cp.y + Math.sin(an) * rr, sz = 2.6 + Math.sin(t * 3 + k) * .4, col = ["#f4a6c8", "#fff3a0", "#ffffff", "#f6c845"][k % 4];
      for (let p = 0; p < 5; p++) circ(cx, x + Math.cos(p * 1.257) * sz, y + Math.sin(p * 1.257) * sz, sz * .75, col);
      circ(cx, x, y, sz * .55, "#e8b030");
    }
    cx.restore();
  }
  for (const P of S.players) if (!P.down) {
    if (P.guardR && P.line === "germignon") {
      circ(cx, P.x, P.y, P.guardR, "rgba(120,220,110,.06)");
      cx.save(); cx.setLineDash([4, 10]); cx.lineDashOffset = t * 20; cx.strokeStyle = "rgba(150,240,130,.4)"; cx.lineWidth = 2; cx.beginPath(); cx.arc(P.x, P.y, P.guardR, 0, Math.PI * 2); cx.stroke(); cx.restore();
    }
    if (P.heat > .05) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(P.x, P.y - 4, 26 + 30 * P.heat, "255,120,40", .35 * P.heat); cx.restore(); }
  }
}
function drawJohtoOver(t, CAM, vw, vh) { // au-dessus : fumée, boucliers, lianes, gel, pétales
  for (const sm of S.smokes || []) {
    const a = Math.min(1, sm.life, (sm.max - sm.life) * 3 + .2);
    for (let k = 0; k < 14; k++) { const an = k / 14 * Math.PI * 2 + sm.ph + t * .25, rr = sm.r * (.35 + .5 * ((k * 37) % 10) / 10); circ(cx, sm.x + Math.cos(an) * rr, sm.y + Math.sin(an) * rr, sm.r * .32, `rgba(150,148,160,${.15 * a})`); }
    circ(cx, sm.x, sm.y, sm.r * .7, `rgba(120,118,130,${.16 * a})`);
  }
  for (const P of S.players) if (P.shieldT > 0 && !P.down) {
    const k = Math.min(1, P.shieldT * 3), r = P.r + 16 + Math.sin(t * 8) * 1.5;
    const g2 = cx.createRadialGradient(P.x, P.y, r * .45, P.x, P.y, r); g2.addColorStop(0, "rgba(160,255,150,0)"); g2.addColorStop(1, `rgba(170,255,160,${.38 * k})`);
    cx.fillStyle = g2; cx.beginPath(); cx.arc(P.x, P.y, r, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = `rgba(235,255,225,${.85 * k})`; cx.lineWidth = 2; cx.beginPath(); cx.arc(P.x, P.y, r, 0, Math.PI * 2); cx.stroke();
    for (let h = 0; h < 6; h++) { const a = h / 6 * Math.PI * 2 + t * .8; circ(cx, P.x + Math.cos(a) * r * .72, P.y + Math.sin(a) * r * .72, 2.2, `rgba(235,255,225,${.6 * k})`); }
  }
  for (const P of S.players) { const rw = P.moves.rouefeu; if (!rw?.rad || P.down) continue; // Roue de Feu : traîne de flammes en quart de cercle
    cx.save(); cx.lineCap = "round";
    for (let k = 0; k < rw.arcs; k++) {
      const head = rw.a + k * Math.PI, N = 22;
      for (let i = N - 1; i >= 0; i--) { // de la traîne (rouge, fine) vers la tête (jaune, épaisse)
        const q = i / N, a0 = head - q * Math.PI / 2, a1 = head - (i + 1) / N * Math.PI / 2, w = 3 + 10 * (1 - q), fl = Math.sin(t * 30 + i) * 2;
        const col = q < .2 ? `rgba(255,240,170,${1 - q})` : q < .5 ? `rgba(255,170,60,${1 - q * .5})` : `rgba(235,80,35,${.95 - q * .45})`;
        cx.globalCompositeOperation = "lighter"; cx.strokeStyle = col; cx.lineWidth = w * 1.6; cx.globalAlpha = .2;
        cx.beginPath(); cx.arc(P.x, P.y, rw.rad + fl, a1, a0); cx.stroke();
        cx.globalCompositeOperation = "source-over"; cx.globalAlpha = 1; cx.lineWidth = w;
        cx.beginPath(); cx.arc(P.x, P.y, rw.rad + fl, a1, a0); cx.stroke();
      }
      const hx = P.x + Math.cos(head) * rw.rad, hy = P.y + Math.sin(head) * rw.rad;
      cx.globalCompositeOperation = "lighter"; glow(hx, hy, 15, "255,190,80", .55); cx.globalCompositeOperation = "source-over";
      circ(cx, hx, hy, 4, "#fff6c8");
      if (Math.random() < .6) emit(hx, hy, 1, "feu", { sp:40, life:.4, up:30, r:2.4 });
    }
    cx.restore();
  }
  for (const f of S.foes) if (f.vine) {
    const v = f.vine;
    for (const a of v.as) {
      const ex = f.x + Math.cos(a) * v.len, ey = f.y + Math.sin(a) * v.len;
      if (v.t > 0) { cx.save(); cx.setLineDash([10, 8]); cx.strokeStyle = `rgba(120,230,90,${.3 + .25 * Math.sin(t * 20)})`; cx.lineWidth = v.w; cx.beginPath(); cx.moveTo(f.x, f.y); cx.lineTo(ex, ey); cx.stroke(); cx.restore(); }
      else {
        const k = Math.max(0, v.st / .25), wob = 26 * Math.sin(t * 30), mx = (f.x + ex) / 2 - Math.sin(a) * wob, my = (f.y + ey) / 2 + Math.cos(a) * wob;
        cx.save(); cx.lineCap = "round";
        for (const [lw, col] of [[v.w * .7, `rgba(40,110,40,${k})`], [v.w * .38, `rgba(110,200,80,${k})`], [v.w * .12, `rgba(200,250,170,${k})`]]) { cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath(); cx.moveTo(f.x, f.y); cx.quadraticCurveTo(mx, my, ex, ey); cx.stroke(); }
        ell(cx, ex, ey, 12, 7, `rgba(110,200,80,${k})`, a); cx.restore();
      }
    }
  }
  for (const f of S.foes) if (f.hp > 0 && (f.charmT > S.t || f.fearT > S.t)) { // Togepi : charmé (cœur) ou apeuré (gouttes)
    const y = f.y - f.r - 14 + Math.sin(t * 6 + f.ph) * 2;
    if (f.charmT > S.t) { cx.save(); cx.translate(f.x, y); cx.scale(.9, .9); cx.fillStyle = "#ff7ab8"; cx.beginPath(); cx.moveTo(0, 5); cx.bezierCurveTo(-9, -2, -5, -10, 0, -5); cx.bezierCurveTo(5, -10, 9, -2, 0, 5); cx.fill(); cx.strokeStyle = "#fff"; cx.lineWidth = 1.2; cx.stroke(); cx.restore(); }
    else for (const s of [-1, 1]) ell(cx, f.x + s * (f.r * .6), y + 4, 2.4, 3.6, "rgba(150,210,255,.9)");
  }
  for (const f of S.foes) if (f.frozeT > S.t) { circ(cx, f.x, f.y - f.r * .3, f.r * 1.05, "rgba(170,230,255,.32)"); cx.strokeStyle = "rgba(230,250,255,.7)"; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(f.x, f.y - f.r * .3, f.r * 1.05, 0, Math.PI * 2); cx.stroke(); }
  if (S.petalT > 0) {
    const a = Math.min(1, S.petalT * 2);
    for (let k = 0; k < 80; k++) {
      const x = CAM.x - vw / 2 + ((k * 137 + t * (140 + k % 7 * 30)) % (vw + 40)) - 20, y = CAM.y - vh / 2 + ((k * 89 + t * (70 + k % 5 * 25)) % (vh + 40)) - 20;
      ell(cx, x, y, 5, 2.6, k % 3 ? `rgba(248,170,205,${.85 * a})` : `rgba(255,240,245,${.85 * a})`, t * 3 + k);
    }
  }
}
