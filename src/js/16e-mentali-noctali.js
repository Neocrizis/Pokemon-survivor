/* ---------- Mentali et Noctali : formes d'Évoli débloquées par le succès « Purificateur » (10 000 Pokémon Obscurs) ---------- */
const SHADOW_GOAL = 10000;
const shadowKills = () => Object.keys(FOES).reduce((n, k) => n + (FOES[k].shadow ? dexKills[k] || 0 : 0), 0); // K.O. de Pokémon Obscurs, toutes parties
const eeveeOpen = id => !EEVEE[id].ach || !!achs[EEVEE[id].ach];
const eeveeForms = () => Object.keys(EEVEE).filter(eeveeOpen);
const nightLv = () => !!(LEVEL.ilex || LEVEL.cave || LEVEL.tower); // Bois aux Chênes, grottes et Tour Pokémon : il fait nuit
const fleeing = f => f.charmT > S.t || f.fearT > S.t || f.confT > S.t; // Poursuite : double dégâts
const foeOk = f => !f.prop && !f.d.rare && !f.under && f.hp > 0;
function eShield(P, lv, key, col) { // Mur Lumière (projectiles et lasers) / Protection (contact) : bouclier de quelques secondes
  const T = (3 + .5 * lv) * DUR(), k = lv >= 3 ? .4 : .5; // part des dégâts qui passe
  for (const q of S.players) if (q === P || (lv >= 5 && !q.down && Math.hypot(q.x - P.x, q.y - P.y) < 180)) { q[key + "T"] = T; q[key + "K"] = k; q[key + "Max"] = T; }
  S.fxs.push({ x:P.x, y:P.y, r:0, max:60, life:.35, col });
}
function eHeal(P, lv, strong) { // Aurore (de jour) / Clair de Lune (de nuit)
  const k = (.06 + .015 * lv) * (strong ? 1.5 : 1), R0 = 200 * AREA();
  for (const q of S.players) if (!q.down && (q === P || (lv >= 5 && Math.hypot(q.x - P.x, q.y - P.y) < R0))) {
    const v = Math.round(q.maxHp * k); q.hp = Math.min(q.maxHp, q.hp + v);
    S.fxs.push({ x:q.x, y:q.y, r:0, max:50, life:.5, col: strong ? "rgba(255,240,170," : "rgba(230,230,255," });
    S.texts.push({ x:q.x, y:q.y - 30, txt:"+" + v, col:"#7dff8a", life:.8 });
  }
}
const EMOVE = {
  // ---- Mentali (Psy) ----
  rafalepsy(P, m, lv) { // un rayon psychique qui transperce tous les ennemis en ligne
    const near = nearestFoes(1)[0]; if (!near && !P.aiming) { m.t = .25; return; }
    m.t = (lv >= 4 ? 1.1 : 1.4) * P.cdMul;
    const a0 = P.aiming ? P.aimA : Math.atan2(near.y - P.y, near.x - P.x), len = 520, w = (lv >= 2 ? 30 : 22) * AREA(), dmg = (12 + 4 * lv) * (lv >= 3 ? 1.3 : 1), hit = new Set();
    for (const a of lv >= 5 ? [a0 - .3, a0, a0 + .3] : [a0]) {
      const ex = P.x + Math.cos(a) * len, ey = P.y + Math.sin(a) * len; S.beams.push({ sx:P.x, sy:P.y, ex, ey, w, life:.3, psy:true });
      for (const f of S.foes) {
        if (hit.has(f) || !foeOk(f)) continue;
        const t2 = Math.max(0, Math.min(1, ((f.x - P.x) * (ex - P.x) + (f.y - P.y) * (ey - P.y)) / (len * len))), qx = P.x + (ex - P.x) * t2, qy = P.y + (ey - P.y) * t2;
        if ((f.x - qx) ** 2 + (f.y - qy) ** 2 < (w / 2 + f.r) ** 2) { hit.add(f); hitFoe(f, dmg, "psy", Math.cos(a) * 2, Math.sin(a) * 2); }
      }
    }
  },
  psyko(P, m, lv) { // un gros orbe psychique s'abat sur l'ennemi le plus costaud
    const pool = S.foes.filter(f => foeOk(f) && Math.hypot(f.x - P.x, f.y - P.y) < 450).sort((a, b) => b.hp - a.hp);
    if (!pool.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? 2 : 2.6) * P.cdMul;
    const dmg = (30 + 9 * lv) * (lv >= 3 ? 1.3 : 1), R0 = (70 + 10 * lv) * AREA();
    for (const f of pool.slice(0, lv >= 5 ? 2 : 1)) (S.psyOrbs ||= []).push({ f, x:f.x, y:f.y, t:.45, max:.45, dmg, R:R0, o:P, src:HIT_SRC });
  },
  murlumiere(P, m, lv) { m.t = (lv >= 4 ? 7 : 9) * P.cdMul; eShield(P, lv, "lscr", "rgba(255,230,150,"); },
  aurore(P, m, lv) {
    if (P.hp >= P.maxHp && !(lv >= 5 && S.players.some(q => !q.down && q.hp < q.maxHp))) { m.t = .5; return; } // inutile à PV pleins
    m.t = (lv >= 4 ? 9 : 12) * P.cdMul; eHeal(P, lv, !nightLv());
  },
  prescienceM(P, m, lv) { CMOVE.prescience(P, m, lv); }, // la même que Celebi, en attaque rare
  // ---- Noctali (Ténèbres) ----
  feinte(P, m, lv) { // des coups sombres qui vont chercher leur cible et ne la ratent jamais
    const n = 2 + (lv >= 2) + (lv >= 4) + EXTRA(), tg = nearestFoes(n);
    if (!tg.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? .9 : 1.1) * P.cdMul;
    const dmg = (9 + 3 * lv) * (lv >= 3 ? 1.3 : 1);
    for (let i = 0; i < n; i++) { const f = tg[i % tg.length], a = Math.atan2(f.y - P.y, f.x - P.x) + (i - (n - 1) / 2) * .6;
      S.shots.push({ kind:"dark", x:P.x, y:P.y - 4, vx:Math.cos(a) * 300, vy:Math.sin(a) * 300, r:7, dmg, life:2.6, pierce:lv >= 5 ? 2 : 1, type:"tenebres", home:f, homeTurn:9, homeSpeed:460, hit:new Set(), ph:Math.random() * 6 }); }
  },
  poursuite(P, m, lv) { // des ombres rapides traquent les ennemis, en priorité ceux qui fuient (double dégâts)
    const pool = nearestFoes(14); if (!pool.length) { m.t = .3; return; }
    pool.sort((a, b) => fleeing(b) - fleeing(a));
    m.t = (lv >= 4 ? 1.3 : 1.6) * P.cdMul;
    const n = 1 + (lv >= 2) + (lv >= 5) + EXTRA(), dmg = (14 + 4 * lv) * (lv >= 3 ? 1.3 : 1);
    for (let i = 0; i < n; i++) { const f = pool[i % pool.length], a = Math.atan2(f.y - P.y, f.x - P.x);
      S.shots.push({ kind:"dark", big:true, x:P.x, y:P.y - 4, vx:Math.cos(a) * 520, vy:Math.sin(a) * 520, r:9, dmg, life:1.8, pierce:1, type:"tenebres", home:f, homeTurn:12, homeSpeed:620, hit:new Set(), ph:Math.random() * 6,
        onHit:g => { if (fleeing(g) && g.hp > 0) { hitFoe(g, dmg, "tenebres"); maybeMsg(g, "Poursuite !", "#c9a8e8"); } } }); }
  },
  ondefolie(P, m, lv) { // une onde étrange : les ennemis touchés sont confus et s'attaquent entre eux
    const R0 = (120 + 15 * lv) * AREA(), tg = S.foes.filter(f => foeOk(f) && !f.d.boss && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2)
      .sort((a, b) => ((a.x - P.x) ** 2 + (a.y - P.y) ** 2) - ((b.x - P.x) ** 2 + (b.y - P.y) ** 2)).slice(0, 3 + lv + EXTRA());
    if (!tg.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? 4 : 5) * P.cdMul;
    const T = (lv >= 5 ? 4 : 2 + .25 * lv) * DUR(), dmg = (8 + 3 * lv) * (lv >= 3 ? 1.3 : 1);
    S.fxs.push({ x:P.x, y:P.y, r:0, max:R0, life:.45, col:"rgba(190,120,255," });
    for (const f of tg) { f.confT = S.t + T; f.confDmg = dmg; f.confBy = P; f.confTk = 0; }
  },
  protectionN(P, m, lv) { m.t = (lv >= 4 ? 7 : 9) * P.cdMul; eShield(P, lv, "refl", "rgba(150,190,255,"); },
  clairdelune(P, m, lv) {
    if (P.hp >= P.maxHp && !(lv >= 5 && S.players.some(q => !q.down && q.hp < q.maxHp))) { m.t = .5; return; }
    m.t = (lv >= 4 ? 9 : 12) * P.cdMul; eHeal(P, lv, nightLv());
  },
  vibrobscur(P, m, lv) { // une onde de ténèbres part de Noctali et s'élargit ; elle peut apeurer
    if (!nearestFoes(1).length) { m.t = .3; return; }
    m.t = (lv >= 4 ? 2.5 : 3.2) * P.cdMul;
    const max = (180 + 20 * lv) * AREA(), dmg = (28 + 8 * lv) * (lv >= 3 ? 1.3 : 1);
    (S.dpulses ||= []).push({ o:P, r:10, max, dmg, hit:new Set(), src:HIT_SRC, delay:0 });
    if (lv >= 5) S.dpulses.push({ o:P, r:10, max, dmg:dmg * .6, hit:new Set(), src:HIT_SRC, delay:.35 });
  },
};
function updateEvoliObscur(P, dt) { // boucliers, orbes de Psyko, ondes de Vibrobscur, ennemis confus
  for (const k of ["lscr", "refl"]) if (P[k + "T"] > 0) P[k + "T"] -= dt;
  if (P.eform === "mentali") updateFutures(P, dt); // Prescience
  if (P !== S.players[0]) return; // le reste est commun à la partie : une fois par image
  if (S.psyOrbs) {
    for (const o of S.psyOrbs) { if (o.f.hp > 0) { o.x = o.f.x; o.y = o.f.y; } o.t -= dt;
      if (o.t <= 0) { const keep = S.P; S.P = o.o; HIT_SRC = o.src; S.fxs.push({ x:o.x, y:o.y, r:0, max:o.R * 1.2, life:.35, col:"rgba(240,100,190," }); emit(o.x, o.y, 18, "psy", { sp:240, life:.45 }); S.shake = Math.max(S.shake, .1);
        for (const f of S.foes) if (foeOk(f) && (f.x - o.x) ** 2 + (f.y - o.y) ** 2 < (o.R + f.r) ** 2) hitFoe(f, o.dmg, "psy"); S.P = keep; } }
    S.psyOrbs = S.psyOrbs.filter(o => o.t > 0);
  }
  if (S.dpulses) {
    for (const w of S.dpulses) { if ((w.delay -= dt) > 0) continue; const o = w.o; w.r += 520 * dt; const keep = S.P; S.P = o; HIT_SRC = w.src;
      for (const f of S.foes) { if (w.hit.has(f) || !foeOk(f)) continue; const d = Math.hypot(f.x - o.x, f.y - o.y); if (Math.abs(d - w.r) > f.r + 14) continue;
        w.hit.add(f); hitFoe(f, w.dmg, "tenebres", (f.x - o.x) / (d || 1) * 3, (f.y - o.y) / (d || 1) * 3); fear(f, .2, .8); }
      S.P = keep; }
    S.dpulses = S.dpulses.filter(w => w.r < w.max);
  }
  for (const f of S.foes) { // Onde Folie : un ennemi confus frappe les Pokémon sauvages qu'il touche
    if (!(f.confT > S.t) || f.hp <= 0 || (f.confTk -= dt) > 0) continue; f.confTk = .5;
    const keep = S.P; S.P = f.confBy || keep; HIT_SRC = "ondefolie";
    for (const g of S.foes) if (g !== f && foeOk(g) && (g.x - f.x) ** 2 + (g.y - f.y) ** 2 < (g.r + f.r + 6) ** 2) { hitFoe(g, f.confDmg || 10, "normal"); emit(g.x, g.y, 4, "tenebres", { sp:90, life:.3 }); }
    S.P = keep;
  }
}
function confSteer(f) { // un ennemi confus fonce vers le Pokémon sauvage le plus proche au lieu du joueur
  let best = null, bd = 260 * 260;
  for (const g of S.foes) { if (g === f || !foeOk(g)) continue; const d = (g.x - f.x) ** 2 + (g.y - f.y) ** 2; if (d < bd) { bd = d; best = g; } }
  if (!best) { const w = S.t * 3 + f.ph; return [Math.cos(w), Math.sin(w)]; }
  const l = Math.sqrt(bd) || 1; return [(best.x - f.x) / l, (best.y - f.y) / l];
}
function drawEvoliObscur(t) {
  for (const P of S.players) if (!P.down) {
    if (P.lscrT > 0) { const k = Math.min(1, P.lscrT / .5); cx.save(); cx.globalAlpha = .55 * k; cx.strokeStyle = "#ffe08a"; cx.lineWidth = 3; cx.setLineDash([10, 6]); cx.lineDashOffset = -t * 30;
      cx.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2 + t * .6, R = P.r + 16; i ? cx.lineTo(P.x + Math.cos(a) * R, P.y + Math.sin(a) * R * .9) : cx.moveTo(P.x + Math.cos(a) * R, P.y + Math.sin(a) * R * .9); } cx.stroke();
      cx.globalAlpha = .12 * k; cx.fillStyle = "#ffe8a0"; cx.fill(); cx.restore(); }
    if (P.reflT > 0) { const k = Math.min(1, P.reflT / .5); cx.save(); cx.globalAlpha = .55 * k; cx.strokeStyle = "#9cc4ff"; cx.lineWidth = 3;
      cx.beginPath(); cx.arc(P.x, P.y, P.r + 14, 0, Math.PI * 2); cx.stroke(); cx.globalAlpha = .14 * k; cx.fillStyle = "#a8c8ff"; cx.fill();
      cx.globalAlpha = .7 * k; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(P.x, P.y, P.r + 14, t * 2, t * 2 + 1.2); cx.stroke(); cx.restore(); }
  }
  for (const o of S.psyOrbs || []) { const k = 1 - o.t / o.max, r = 10 + 14 * k; // l'orbe grossit au-dessus de la cible puis éclate
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(o.x, o.y - 40 * (1 - k), r * 2.4, "240,100,190", .7); cx.restore(); circ(cx, o.x, o.y - 40 * (1 - k), r, "rgba(255,190,235,.9)");
    cx.save(); cx.strokeStyle = "rgba(240,100,190,.5)"; cx.setLineDash([4, 5]); cx.beginPath(); cx.arc(o.x, o.y, o.R, 0, Math.PI * 2); cx.stroke(); cx.restore(); }
  for (const w of S.dpulses || []) if (w.delay <= 0) { const k = 1 - w.r / w.max; cx.save(); cx.strokeStyle = `rgba(60,20,90,${.75 * k})`; cx.lineWidth = 16; cx.beginPath(); cx.arc(w.o.x, w.o.y, w.r, 0, Math.PI * 2); cx.stroke();
    cx.strokeStyle = `rgba(190,120,255,${.8 * k})`; cx.lineWidth = 3; cx.stroke(); cx.restore(); }
  for (const s of S.shots) if (s.kind === "dark") { const r = s.r * (s.big ? 1.2 : 1);
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, r * 2.6, "150,80,220", .55); cx.restore();
    circ(cx, s.x, s.y, r, "#2a1838"); cx.strokeStyle = "#c79bff"; cx.lineWidth = 1.6; cx.beginPath(); cx.arc(s.x, s.y, r, s.ph + t * 8, s.ph + t * 8 + 4); cx.stroke(); }
  for (const f of S.foes) if (f.confT > S.t && f.hp > 0) { const y = f.y - f.r - 14; // confus : petits oiseaux qui tournent
    for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; circ(cx, f.x + Math.cos(a) * (f.r * .7), y + Math.sin(a) * 3, 2.6, i % 2 ? "#ffe27a" : "#d8b4ff"); } }
}
