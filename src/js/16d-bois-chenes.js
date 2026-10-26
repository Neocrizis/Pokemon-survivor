/* ---------- Johto : Bois aux Chênes (Pokémon Obscurs, Canarticho, Celebi Obscur à purifier et capturer) ---------- */
// La Dark Ball a corrompu la forêt : tous les Pokémon sauvages sont Obscurs (aura sombre, leur propre entrée au Pokédex)
const ILEX_TREE_TINTS = [[24, .8, .62], [6, .85, .55], [40, .7, .6]]; // feuillage assombri : sapin sombre, vert de nuit, bleu-vert
function ilexSpawn(f, placed) { // Pomdepik et Foretress tombent d'un arbre proche
  if (!f.d.fall || placed || Math.random() < .3) return;
  const c = spawnNear(), trees = [];
  around(c.x, c.y, ch => { for (const t of ch.trees || []) { const d = Math.hypot(t.x - c.x, t.y - c.y); if (d > 260 && d < 620) trees.push(t); } }, 2);
  const t = trees[Math.random() * trees.length | 0]; if (!t) return;
  f.x = t.x + (Math.random() - .5) * 30; f.y = t.y + t.trunk + 14; f.jz = 150; f.hold = .7; f.fall = true;
}
// ---- Canarticho : il traîne dans le bois à chaque partie ; touche-le 3 fois et il te suit (Coupe, Tranche) ----
const FARF_NEED = 3, FARF_T = 45;
function startFarf() {
  const P = nearP(S.cam.x, S.cam.y); let x = P.x + 330, y = P.y;
  for (let k = 0; k < 40; k++) { const a = Math.random() * Math.PI * 2; x = P.x + Math.cos(a) * 330; y = P.y + Math.sin(a) * 330; if (!solidsNear(x, y).some(o => Math.hypot(o.x - x, o.y - y) < o.r + 30)) break; }
  S.farf = { x, y, st:"wild", hits:0, t:FARF_T, cd:0, hop:null, ph:Math.random() * 6, a:Math.random() * 6, slashT:1 };
  banner("Un Canarticho fugueur traverse le Bois aux Chênes, son poireau à la main ! Touche-le 3 fois pour qu'il te suive.");
  sfx("ach");
}
function updateFarf(dt) {
  const c = S.farf; c.cd -= dt;
  if (c.st === "gone") { c.t -= dt; c.x += c.vx * dt; c.y += c.vy * dt; if (c.t <= 0) S.farf = null; return; }
  if (c.st === "wild") {
    const P = nearP(c.x, c.y), dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) || 1;
    c.t -= dt;
    if (c.hop) { c.hop.t -= dt; c.x += c.hop.vx * dt; c.y += c.hop.vy * dt; if (c.hop.t <= 0) c.hop = null; }
    else { // il s'éloigne quand on approche, sinon il flâne
      c.a += (Math.random() - .5) * 3 * dt; const near = d < 180, sp = near ? 125 : 55;
      const ax = near ? dx / d + Math.cos(c.a) * .4 : Math.cos(c.a), ay = near ? dy / d + Math.sin(c.a) * .4 : Math.sin(c.a), l = Math.hypot(ax, ay) || 1;
      c.x += ax / l * sp * dt; c.y += ay / l * sp * dt; c.flip = ax < 0;
      if (d > 620) { c.x -= dx / d * 140 * dt; c.y -= dy / d * 140 * dt; } // il ne s'enfuit pas trop loin
    }
    collide(c, 12, false);
    if (c.cd <= 0 && d < P.r + 20) { // touché !
      c.hits++; c.cd = .8; const a = Math.atan2(dy, dx) + (Math.random() - .5);
      c.hop = { vx:Math.cos(a) * 340, vy:Math.sin(a) * 340, t:.45 }; sfx("hit");
      S.fxs.push({ x:c.x, y:c.y, r:0, max:40, life:.3, col:"rgba(255,240,170," });
      if (c.hits >= FARF_NEED) {
        c.st = "buddy"; c.o = P; c.hop = null; sfx("evo"); teamAch("farf");
        S.fxs.push({ x:c.x, y:c.y, r:0, max:110, life:.5, col:"rgba(140,255,150," }); emit(c.x, c.y, 18, "normal", { sp:160, life:.5, r:3 });
        banner(`Canarticho veut te suivre ! Il coupera les arbustes et tranchera les Pokémon Obscurs avec son poireau.`);
      } else S.texts.push({ x:c.x, y:c.y - 30, txt:`Canarticho ${c.hits}/${FARF_NEED}`, col:"#ffe0a0", life:1, label:true });
    }
    if (c.t <= 0) { const a = Math.random() * Math.PI * 2; c.st = "gone"; c.t = 2; c.vx = Math.cos(a) * 260; c.vy = Math.sin(a) * 260 - 80; banner("Canarticho s'est envolé dans les arbres…"); }
    return;
  }
  // compagnon : suit son dresseur, tranche l'ennemi proche, coupe les arbustes
  let P = c.o; if (!P || P.down || !S.players.includes(P)) P = c.o = nearP(c.x, c.y);
  if (c.dash) { c.dash.t -= dt; c.x += c.dash.vx * dt; c.y += c.dash.vy * dt; if (c.dash.t <= 0) c.dash = null; }
  else {
    const bx = P.x - (P.fx || 1) * 34, by = P.y - (P.fy || 0) * 34 + 6, dx = bx - c.x, dy = by - c.y, d = Math.hypot(dx, dy);
    if (d > 900) { c.x = bx; c.y = by; }
    else if (d > 6) { const sp = Math.min(d * 4, 320); c.x += dx / d * sp * dt; c.y += dy / d * sp * dt; c.flip = dx < 0; }
  }
  if ((c.slashT -= dt) <= 0) {
    c.slashT = 1.1; const S0 = S.P; S.P = P; HIT_SRC = "farf";
    const tg = S.foes.filter(f => f.hp > 0 && !f.d.rare && !f.d.celebiO && Math.hypot(f.x - c.x, f.y - c.y) < (f.prop ? 90 : 190) + f.r).sort((a, b) => Math.hypot(a.x - c.x, a.y - c.y) - Math.hypot(b.x - c.x, b.y - c.y))[0];
    if (tg) {
      const a = Math.atan2(tg.y - c.y, tg.x - c.x), d = Math.hypot(tg.x - c.x, tg.y - c.y);
      c.dash = { vx:Math.cos(a) * d / .12, vy:Math.sin(a) * d / .12, t:.12 }; c.flip = Math.cos(a) < 0;
      if (tg.prop) { tg.hp = 0; S.texts.push({ x:tg.x, y:tg.y - 30, txt:"Coupe !", col:"#cfe8a0", life:.8, label:true }); }
      else hitFoe(tg, 14 + 1.2 * P.lvl, "normal", Math.cos(a) * 3, Math.sin(a) * 3);
      (S.farfSl ||= []).push({ x:tg.x, y:tg.y, a, life:.25 });
    }
    S.P = S0;
  }
}
function drawFarf(t) {
  const c = S.farf; if (!c) return;
  const bob = c.st === "gone" ? -(2 - c.t) * 60 : Math.abs(Math.sin(t * 8 + c.ph)) * (c.hop ? 10 : 2);
  if (c.st === "wild") { cx.save(); cx.globalCompositeOperation = "lighter"; glow(c.x, c.y, 34, "255,230,120", .3 + .15 * Math.sin(t * 6)); cx.restore(); }
  cx.save(); if (c.st === "gone") cx.globalAlpha = Math.max(0, c.t / 2);
  drawMon(cx, "canarticho", c.x, c.y - bob, 13, c.flip, t + c.ph, 0, null, true); cx.restore();
  if (c.st === "wild") { // jauge : touches et temps restant
    cx.font = "600 13px Rubik, sans-serif"; cx.textAlign = "center"; cx.lineWidth = 3; cx.strokeStyle = "rgba(0,0,0,.75)";
    const txt = `${"●".repeat(c.hits)}${"○".repeat(FARF_NEED - c.hits)} · ${fmt(Math.max(0, c.t))}`; cx.strokeText(txt, c.x, c.y - 34); cx.fillStyle = "#fff3c8"; cx.fillText(txt, c.x, c.y - 34);
  }
  for (const s of S.farfSl || []) { // coup de poireau
    const k = s.life / .25; cx.save(); cx.translate(s.x, s.y); cx.rotate(s.a); cx.strokeStyle = `rgba(230,255,200,${k})`; cx.lineWidth = 4; cx.lineCap = "round";
    cx.beginPath(); cx.arc(0, 0, 22, -1.1 + (1 - k) * .6, .9 + (1 - k) * .6); cx.stroke(); cx.restore();
  }
}
// ---- Celebi Obscur : contrôlé par la Dark Ball ; quand ses PV sont presque à zéro, il se purifie et on peut le capturer ----
const CEL_CAP_R = 78, CEL_NEED = 5, CEL_CAP_T = 25, CEL_SEQ = ["feuilles", "racines", "tele", "feuilles", "darkball", "racines", "tele"];
function startCelebiO() {
  const P = nearP(S.cam.x, S.cam.y), a = Math.random() * Math.PI * 2;
  const f = spawnFoe("celebiO", P.x + Math.cos(a) * 300, P.y + Math.sin(a) * 300);
  f.atkT = 2; f.atkI = 0; f.hist = []; f.histT = 0; f.life = 150;
  S.celO = { f, cap:0, t:CEL_CAP_T };
  S.fxs.push({ x:f.x, y:f.y, r:0, max:160, life:.6, col:"rgba(150,60,200," }); emit(f.x, f.y, 30, "tenebres", { sp:220, life:.6, r:3.5 });
  S.seq = [...(S.seq || []), [S.t + 3.2, "Ses yeux sont noirs et vides : la Dark Ball le contrôle. Affaiblis-le pour le libérer !"]];
  banner("Un chant brisé résonne dans le bois… Celebi Obscur surgit d'entre les arbres !"); sfx("boss"); S.shake = .4;
}
function celebiTreeSpot(P) { // un arbre à bonne distance du joueur, sinon un point au hasard
  const trees = []; around(P.x, P.y, ch => { for (const t of ch.trees || []) { const d = Math.hypot(t.x - P.x, t.y - P.y); if (d > 200 && d < 380) trees.push(t); } }, 1);
  const t = trees[Math.random() * trees.length | 0]; if (t) return { x:t.x, y:t.y + t.trunk + 22 };
  const a = Math.random() * Math.PI * 2; return { x:P.x + Math.cos(a) * 280, y:P.y + Math.sin(a) * 280 };
}
function celebiAttack(f, P) {
  const rage = f.rewound, atk = CEL_SEQ[f.atkI++ % CEL_SEQ.length];
  if (atk === "tele") {
    emit(f.x, f.y, 16, "psy", { sp:160, life:.4 }); const s = celebiTreeSpot(P); f.x = s.x; f.y = s.y; f.appear = .35;
    S.fxs.push({ x:f.x, y:f.y, r:0, max:70, life:.35, col:"rgba(170,90,230," }); emit(f.x, f.y, 16, "tenebres", { sp:160, life:.4 });
    if (!f.saidT) { f.saidT = true; banner("Celebi Obscur se téléporte d'arbre en arbre !"); }
  } else if (atk === "feuilles") { // Tranch'Feuille : un éventail de feuilles
    const a0 = Math.atan2(P.y - f.y, P.x - f.x), n = rage ? 9 : 7;
    for (let k = 0; k < (rage ? 2 : 1); k++) for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .17 + k * .085; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * (250 + k * 60), vy:Math.sin(a) * (250 + k * 60), dmg:13, life:2.6, type:"plante", r:8 }); }
    if (!f.saidF) { f.saidF = true; banner("Celebi Obscur utilise Tranch'Feuille !"); }
  } else if (atk === "racines") { // des racines jaillissent sous chaque joueur, annoncées par un cercle rouge
    for (const q of S.players) if (!q.down) {
      const n = rage ? 5 : 3;
      for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, d = i ? 60 + Math.random() * 90 : 0; (S.roots ||= []).push({ x:q.x + Math.cos(a) * d + (q.mvx || 0) * 40, y:q.y + Math.sin(a) * d + (q.mvy || 0) * 40, r:44, t:1.1, max:1.1, ph:Math.random() * 6 }); }
    }
    if (!f.saidR) { f.saidR = true; banner("Des racines vont jaillir du sol ! Sors des cercles rouges !"); }
  } else if (atk === "darkball") { // il appelle des Pokémon de la forêt avec la Dark Ball
    const kinds = ["papilusionO", "dardargnanO", "noarfangO"];
    for (let i = 0; i < (rage ? 4 : 3); i++) { const a = Math.random() * Math.PI * 2, g = spawnFoe(kinds[i % kinds.length], f.x + Math.cos(a) * 90, f.y + Math.sin(a) * 90); g.appear = .4; emit(g.x, g.y, 10, "tenebres", { sp:140, life:.4 }); }
    S.fxs.push({ x:f.x, y:f.y, r:0, max:120, life:.4, col:"rgba(120,40,170," });
    if (!f.saidD) { f.saidD = true; banner("Celebi Obscur lance des Dark Ball : les Pokémon de la forêt accourent !"); }
  }
  f.atkT = (rage ? 1.5 : 2.1) + Math.random() * .4;
}
function celebiPurify(f) { // appelé quand ses PV tombent à zéro (ou presque) : il se libère de la Dark Ball
  f.hp = Math.max(1, f.hp);
  if (f.pure) return;
  f.pure = true; f.hp = Math.max(1, Math.round(f.maxHp * .05)); S.roots = [];
  for (const s of S.eshots) if (s.type === "plante") s.life = 0;
  S.fxs.push({ x:f.x, y:f.y, r:0, max:200, life:.6, col:"rgba(160,255,170," }); emit(f.x, f.y, 34, "fee", { sp:240, life:.7, r:3.5 }); sfx("evo"); S.shake = .3;
  banner("La Dark Ball se brise ! Celebi est purifié… Reste 5 s dans le cercle de lumière pour le capturer !");
}
function updateCelebiO(dt) {
  const c = S.celO, f = c.f;
  if (!S.foes.includes(f)) { S.celO = null; return false; }
  f.hold = 1; // il se déplace seul (téléportation)
  const P = S.P = nearP(f.x, f.y);
  if (!f.pure) {
    if ((f.histT -= dt) <= 0) { f.histT = .5; f.hist.push(f.hp); if (f.hist.length > 12) f.hist.shift(); }
    if (!f.rewound && f.hp < f.maxHp * .5 && f.hist.length >= 10) { // Retour Temporel : une seule fois, il revient 5 s en arrière
      f.rewound = true; f.hp = Math.min(f.maxHp * .8, Math.max(f.hp, f.hist[0])); f.rewT = 1.2; S.shake = .35; sfx("evo");
      S.fxs.push({ x:f.x, y:f.y, r:0, max:240, life:.8, col:"rgba(140,255,200," });
      banner("Celebi Obscur remonte le temps de quelques secondes et récupère ses PV ! Il devient enragé…");
    }
    if (f.rewT > 0) f.rewT -= dt;
    if ((f.life -= dt) <= 0) { f.gone = true; f.hp = 0; banner("Celebi Obscur disparaît dans le temps… La Dark Ball l'a emporté."); return false; }
    if (f.appear > 0) return false;
    if ((f.atkT -= dt) <= 0) celebiAttack(f, P);
    if (f.hp < f.maxHp * .1) celebiPurify(f);
    return false;
  }
  // purifié : le cercle de lumière
  c.t -= dt;
  const on = S.players.some(q => !q.down && Math.hypot(q.x - f.x, q.y - f.y) < CEL_CAP_R);
  c.cap = on ? c.cap + dt : Math.max(0, c.cap - dt * .5);
  if (c.cap >= CEL_NEED) {
    const shiny = Math.random() < 1 / 20;
    f.gone = true; f.hp = 0; S.celO = null; S.white = .8; sfx("win");
    S.gems.push({ x:f.x, y:f.y, pick:"chest" });
    teamAch("celebi");
    if (shiny && !achs.celebiS) { achs.celebiS = true; try { localStorage.setItem("pokesurv-ach", JSON.stringify(achs)); } catch (e) {} cloudSoon(); }
    banner(shiny ? "Incroyable ! C'est un Celebi chromatique, tout rose ! Il rejoint ton équipe." : "Celebi est capturé ! Il rejoint ton équipe : tu peux le choisir parmi les starters secrets.");
    S.celCaught = { x:f.x, y:f.y, t:1.6, shiny };
    return false;
  }
  if (c.t <= 0) { f.gone = true; f.hp = 0; S.celO = null; S.gems.push({ x:f.x, y:f.y, pick:"chest" }); banner("Celebi utilise Voyage Temporel et disparaît… Il te laisse un cadeau en remerciement."); }
  return false;
}
// ---- boss Obscurs ----
function updateIlexBosses(dt) {
  for (const f of S.foes) {
    if (f.hp <= 0 || !f.d.boss || f.sleepT > 0) continue;
    const P = S.P = nearP(f.x, f.y), dx = P.x - f.x, dy = P.y - f.y, l = Math.hypot(dx, dy) || 1;
    if (f.d.spores) { // Parasect géant : nuages de Para-Spore autour du joueur
      if ((f.spT = (f.spT ?? 2.5) - dt) <= 0) {
        f.spT = 4; for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2, d = i ? 90 + Math.random() * 120 : 20; (S.spores ||= []).push({ x:P.x + Math.cos(a) * d, y:P.y + Math.sin(a) * d, r:0, max:78, t:5, ph:Math.random() * 6 }); }
        if (!f.said) { f.said = true; banner(`${f.d.name} répand des Para-Spore ! Ne reste pas dans les nuages.`); }
      }
      if ((f.sumT = (f.sumT ?? 9) - dt) <= 0) { f.sumT = 12; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2; spawnFoe("parasO", f.x + Math.cos(a) * 80, f.y + Math.sin(a) * 80); } }
    }
    if (f.d.spikes) { // Foretress géant : Picots, puis Explosion annoncée
      if ((f.pkT = (f.pkT ?? 3) - dt) <= 0) {
        f.pkT = 5; for (let i = 0; i < 6; i++) { const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 220; (S.spikes ||= []).push({ x:P.x + Math.cos(a) * d, y:P.y + Math.sin(a) * d, life:14, ph:Math.random() * 6 }); }
        if (S.spikes.length > 60) S.spikes.splice(0, S.spikes.length - 60);
        if (!f.saidP) { f.saidP = true; banner(`${f.d.name} sème des Picots partout !`); }
      }
      if (f.boomT > 0) { f.hold = 1; if ((f.boomT -= dt) <= 0) {
        const R = 210; S.fxs.push({ x:f.x, y:f.y, r:0, max:R, life:.45, col:"rgba(255,170,80," }); emit(f.x, f.y, 36, "feu", { sp:R * 3, life:.6, r:4 }); S.shake = .5; sfx("break");
        if (boomHit(f.x, f.y, R, f.d.dmg * 1.3)) return true;
      } }
      else if ((f.exT = (f.exT ?? 8) - dt) <= 0 && l < 420) { f.exT = 9; f.boomT = 1.6; banner(`${f.d.name} se prépare à exploser ! Éloigne-toi !`); }
    }
    if (f.d.night) { // Noarfang géant : la nuit tombe, Hypnose
      if (!S.night) S.night = 0;
      if ((f.hyT = (f.hyT ?? 3) - dt) <= 0) {
        f.hyT = 3.4; const a0 = Math.atan2(dy, dx);
        for (let i = -1; i <= 1; i++) S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a0 + i * .35) * 190, vy:Math.sin(a0 + i * .35) * 190, dmg:8, life:3.2, type:"psy", r:13, hypno:true });
        if (!f.saidH) { f.saidH = true; banner(`${f.d.name} utilise Hypnose ! Évite les ondes violettes.`); }
      }
    }
  }
  return false;
}
function updateIlex(dt) {
  if (!LEVEL.ilex) return false;
  if (S.farfAt === undefined) S.farfAt = 100 + Math.random() * 30; // Canarticho : à chaque partie, vers 2:00
  if (S.t >= S.farfAt) { S.farfAt = Infinity; startFarf(); }
  if (S.farf) updateFarf(dt);
  for (const s of S.farfSl || []) s.life -= dt; if (S.farfSl) S.farfSl = S.farfSl.filter(s => s.life > 0);
  for (const f of S.foes) if (f.fall) { f.jz = Math.max(0, f.jz - 330 * dt); if (!f.jz) { f.fall = false; emit(f.x, f.y, 8, "sol", { sp:110, life:.35 }); } }
  if (S.celO && updateCelebiO(dt)) return true;
  if (S.celCaught && (S.celCaught.t -= dt) <= 0) S.celCaught = null;
  if (updateIlexBosses(dt)) return true;
  const night = S.foes.some(f => f.d.night && f.hp > 0); S.night = Math.max(0, Math.min(1, (S.night || 0) + (night ? .5 : -.5) * dt));
  for (const r of S.roots || []) if (r.t > 0 && (r.t -= dt) <= 0) { // les racines jaillissent
    emit(r.x, r.y, 10, "plante", { sp:140, life:.4, r:3 }); S.shake = Math.max(S.shake, .12);
    if (boomHit(r.x, r.y, r.r, 16, "plante")) return true;
  }
  if (S.roots) { for (const r of S.roots) if (r.t <= 0) r.t -= dt; S.roots = S.roots.filter(r => r.t > -.6); }
  for (const sp of S.spores || []) { sp.t -= dt; sp.r += (sp.max - sp.r) * Math.min(1, dt * 3);
    for (const q of S.players) if (!q.down && Math.hypot(q.x - sp.x, q.y - sp.y) < sp.r) { q.slowT = Math.max(q.slowT || 0, .3); if (Math.random() < dt * .6) { const S0 = S.P; S.P = q; paralyze(q, .7); S.P = S0; } } }
  if (S.spores) S.spores = S.spores.filter(sp => sp.t > 0);
  for (const k of S.spikes || []) { k.life -= dt;
    for (const q of S.players) if (!q.down && q.inv <= 0 && !flyP(q) && Math.hypot(q.x - k.x, q.y - k.y) < q.r + 8) { const S0 = S.P; S.P = q; k.life = 0; if (hurtP(7 * (1 + S.t / 900))) return true; S.P = S0; } }
  if (S.spikes) S.spikes = S.spikes.filter(k => k.life > 0);
  return false;
}
function hypnoHit(P) { // Hypnose de Noarfang : endormi un court instant
  if ((P.parCd || 0) > S.t) return;
  P.parT = 1.1; P.parCd = S.t + 2.6; S.texts.push({ x:P.x, y:P.y - P.r - 34, txt:"Endormi !", col:"#d8b0ff", life:1, label:true });
}
// ---- dessin ----
function shadowAura(f, t) { // aura des Pokémon Obscurs (façon Colosseum) : halo violet sombre et flammes noires qui montent
  const r = (f.d.sprR || f.r), y = f.y - (f.jz || 0), fl = Math.sin(t * 6 + f.ph);
  cx.save(); glow(f.x, y - r * .25, r * 2.6, "70,10,110", .9 + .1 * fl); glow(f.x, y - r * .3, r * 1.6, "130,50,190", .55 + .1 * fl); cx.restore();
  for (let k = 0; k < 3; k++) { // langues de flamme sombre autour du corps
    const a = t * 2.2 + f.ph + k * 2.1, ph = (t * 1.6 + k / 3 + f.ph) % 1, fx = f.x + Math.cos(a) * r * .75, fy = y + r * .4 - ph * r * 1.7;
    ell(cx, fx, fy, r * .22 * (1 - ph), r * .42 * (1 - ph), `rgba(40,0,60,${.55 * (1 - ph)})`);
  }
  if (Math.random() < (r > 20 ? .6 : .12)) emit(f.x + (Math.random() - .5) * r * 1.2, y - Math.random() * r, 1, "tenebres", { sp:20, life:.6, up:50, r:2 + r / 20 });
}
function drawIlexUnder(t) {
  if (!LEVEL.ilex) return;
  for (const sp of S.spores || []) { const a = Math.min(1, sp.t); for (let k = 0; k < 9; k++) { const an = k / 9 * Math.PI * 2 + sp.ph + t * .3, rr = sp.r * (.35 + .4 * ((k * 37) % 10) / 10); circ(cx, sp.x + Math.cos(an) * rr, sp.y + Math.sin(an) * rr, sp.r * .35, `rgba(230,200,90,${.13 * a})`); }
    cx.strokeStyle = `rgba(250,220,110,${.45 * a})`; cx.lineWidth = 2; cx.beginPath(); cx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2); cx.stroke(); }
  for (const k of S.spikes || []) { const a = Math.min(1, k.life); for (let i = 0; i < 3; i++) { const an = i * 2.1 + k.ph; poly(cx, [k.x + Math.cos(an) * 7, k.y + Math.sin(an) * 4, k.x + Math.cos(an + .5) * 3, k.y + Math.sin(an + .5) * 2 - 9, k.x + Math.cos(an + 1) * 7, k.y + Math.sin(an + 1) * 4], `rgba(150,150,170,${a})`); } circ(cx, k.x, k.y, 2.5, `rgba(80,80,96,${a})`); }
  for (const r of S.roots || []) {
    if (r.t > 0) { const k = 1 - r.t / r.max; cx.save(); cx.fillStyle = `rgba(226,81,63,${.12 + .14 * k})`; cx.strokeStyle = `rgba(226,81,63,${.5 + .4 * k})`; cx.lineWidth = 2.5;
      cx.beginPath(); cx.ellipse(r.x, r.y, r.r, r.r * .62, 0, 0, Math.PI * 2); cx.fill(); cx.stroke(); cx.beginPath(); cx.ellipse(r.x, r.y, r.r * k, r.r * .62 * k, 0, 0, Math.PI * 2); cx.stroke(); cx.restore(); }
    else { const k = Math.min(1, (r.t + .6) / .3), h = 34 * Math.min(1, -r.t * 8); cx.save(); cx.globalAlpha = k; // racines tordues qui sortent du sol
      for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2 + r.ph, bx = r.x + Math.cos(an) * r.r * .5, by = r.y + Math.sin(an) * r.r * .3;
        cx.strokeStyle = "#3a2414"; cx.lineWidth = 7; cx.lineCap = "round"; cx.beginPath(); cx.moveTo(bx, by); cx.quadraticCurveTo(bx + Math.cos(an) * 10, by - h * .6, bx + Math.cos(an) * 4, by - h); cx.stroke();
        cx.strokeStyle = "#6a4a2a"; cx.lineWidth = 3; cx.stroke(); }
      cx.restore(); }
  }
  const c = S.celO;
  if (c && c.f.pure) { // cercle de lumière de la capture
    const f = c.f, k = c.cap / CEL_NEED, pul = 1 + Math.sin(t * 4) * .04;
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(f.x, f.y, CEL_CAP_R * 1.6, "255,240,170", .35 + .25 * k); cx.restore();
    cx.fillStyle = "rgba(255,245,190,.16)"; cx.beginPath(); cx.arc(f.x, f.y, CEL_CAP_R * pul, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = "rgba(255,240,170,.85)"; cx.lineWidth = 3; cx.stroke();
    cx.strokeStyle = "#7dff8a"; cx.lineWidth = 6; cx.beginPath(); cx.arc(f.x, f.y, CEL_CAP_R + 8, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2); cx.stroke();
  }
}
function drawIlexOver(t) {
  if (!LEVEL.ilex) return;
  drawFarf(t);
  const c = S.celO;
  if (c) { // jauge de Celebi
    const f = c.f, bw = 70, by = f.y - f.r - 30;
    cx.font = "600 13px Rubik, sans-serif"; cx.textAlign = "center"; cx.lineWidth = 3; cx.strokeStyle = "rgba(0,0,0,.75)";
    const txt = f.pure ? `Capture · ${fmt(Math.max(0, c.t))}` : "Celebi Obscur";
    cx.strokeText(txt, f.x, by - 8); cx.fillStyle = f.pure ? "#fff3c8" : "#d8b0ff"; cx.fillText(txt, f.x, by - 8);
    if (!f.pure) { const kk = Math.max(0, f.hp / f.maxHp); cx.fillStyle = "rgba(0,0,0,.6)"; cx.fillRect(f.x - bw / 2 - 2, by - 2, bw + 4, 9); cx.fillStyle = "#9a5ad8"; cx.fillRect(f.x - bw / 2, by, bw * kk, 5); cx.fillStyle = "rgba(255,255,255,.6)"; cx.fillRect(f.x - bw / 2 + bw * .1, by, 1.5, 5); }
    if (f.rewT > 0) { const k = f.rewT / 1.2; cx.save(); cx.strokeStyle = `rgba(160,255,210,${k})`; cx.lineWidth = 3; cx.beginPath(); cx.arc(f.x, f.y, f.r + 30 * (1 - k) + 10, 0, Math.PI * 2); cx.stroke();
      cx.beginPath(); cx.moveTo(f.x, f.y); cx.lineTo(f.x + Math.cos(-t * 12) * (f.r + 6), f.y + Math.sin(-t * 12) * (f.r + 6)); cx.stroke(); cx.restore(); } // aiguille d'horloge qui tourne à l'envers
  }
  const cc = S.celCaught;
  if (cc) { const k = cc.t / 1.6; cx.save(); cx.globalCompositeOperation = "lighter"; glow(cc.x, cc.y - (1 - k) * 90, 50, cc.shiny ? "255,150,210" : "150,255,160", k); cx.restore();
    cx.save(); cx.globalAlpha = k; drawMon(cx, cc.shiny ? "celebi_s" : "celebi", cc.x, cc.y - (1 - k) * 90, 15, false, t, 0, 0, true); cx.restore(); }
}
function drawIlexTop(camX, camY, vw, vh, t) { // sous-bois sombre, et la nuit de Noarfang
  if (!LEVEL.ilex) return;
  const P = S.cam, r0 = Math.min(vw, vh) * (.34 - .12 * (S.night || 0)), r1 = Math.max(vw, vh) * (.66 - .1 * (S.night || 0));
  const g = cx.createRadialGradient(P.x, P.y, r0, P.x, P.y, r1);
  g.addColorStop(0, "rgba(4,14,10,0)"); g.addColorStop(1, `rgba(4,14,10,${.5 + .38 * (S.night || 0)})`);
  cx.fillStyle = g; cx.fillRect(camX - 60, camY - 60, vw + 120, vh + 120);
  if (S.night > 0) { cx.fillStyle = `rgba(10,6,30,${.32 * S.night})`; cx.fillRect(camX - 60, camY - 60, vw + 120, vh + 120); }
}
// ---- Celebi jouable : capacités et talent Voyage Temporel ----
const CMOVE = {
  gigasangsue(P, m, lv) { // des feuilles aspirent les PV des ennemis les plus proches
    const n = 2 + (lv >= 2) + (lv >= 4) + EXTRA(), tg = nearestFoes(n);
    if (!tg.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? .85 : 1.05) * P.cdMul;
    const dmg = (10 + 3 * lv) * (lv >= 3 ? 1.35 : 1), drain = lv >= 5 ? .12 : .07;
    for (let i = 0; i < n; i++) {
      const f = tg[i % tg.length], a = Math.atan2(f.y - P.y, f.x - P.x) + (i - (n - 1) / 2) * .4;
      S.shots.push({ kind:"mleaf", x:P.x, y:P.y - 4, vx:Math.cos(a) * 340, vy:Math.sin(a) * 340, r:7, dmg, life:2.4, pierce:1, type:"plante", home:f, hit:new Set(), ph:Math.random() * 6,
        onHit:g => { if (!P.down) { const v = Math.min(3, dmg * drain); P.hp = Math.min(P.maxHp, P.hp + v); emit(g.x, g.y, 3, "plante", { sp:60, life:.5 }); } } });
    }
  },
  chocmental(P, m, lv) { // une onde psychique autour de Celebi ; les ennemis touchés sont désorientés
    const R0 = (110 + 14 * lv + (lv >= 2 ? 20 : 0)) * AREA();
    if (!S.foes.some(f => !f.prop && !f.d.rare && f.hp > 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2)) { m.t = .25; return; }
    m.t = (lv >= 4 ? 2 : 2.6) * P.cdMul;
    const dmg = (18 + 5 * lv) * (lv >= 3 ? 1.4 : 1);
    S.fxs.push({ x:P.x, y:P.y, r:0, max:R0, life:.4, col:"rgba(240,110,180," }); emit(P.x, P.y, 18, "psy", { sp:R0 * 2.4, life:.45, r:3 });
    for (const f of S.foes) if (!f.prop && !f.d.rare && f.hp > 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2) {
      hitFoe(f, dmg, "psy"); if (!f.d.boss && Math.random() < (lv >= 5 ? .5 : .3)) f.charmT = S.t + 1; // désorienté : il s'éloigne un instant
    }
  },
  pouvoirantique(P, m, lv) { // des rochers anciens filent vers les ennemis ; parfois, toutes les stats montent
    const tg = nearestFoes(3); if (!tg.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? 1.8 : 2.4) * P.cdMul;
    const n = 3 + (lv >= 2) + (lv >= 5) + EXTRA(), dmg = (20 + 6 * lv) * (lv >= 3 ? 1.4 : 1);
    for (let i = 0; i < n; i++) { const f = tg[i % tg.length], a = Math.atan2(f.y - P.y, f.x - P.x) + (i - (n - 1) / 2) * .3;
      S.shots.push({ kind:"blast", x:P.x, y:P.y - 6, vx:Math.cos(a) * 330, vy:Math.sin(a) * 330, r:9, dmg, life:1.4, pierce:1, hit:new Set(), type:"roche" }); }
    if (Math.random() < .12) { P.ancT = 6 * DUR(); S.texts.push({ x:P.x, y:P.y - P.r - 26, txt:"Toutes les stats montent !", col:"#e8d088", life:1.4, label:true }); }
  },
  prescience(P, m, lv) { // des marques psychiques sur les ennemis ; elles explosent 2 s plus tard
    const tg = nearestFoes(12).filter(f => !f.prop && Math.hypot(f.x - P.x, f.y - P.y) < 520).sort((a, b) => b.hp - a.hp).slice(0, 2 + (lv >= 2) + (lv >= 4) + EXTRA());
    if (!tg.length) { m.t = .3; return; }
    m.t = (lv >= 4 ? 2.6 : 3.4) * P.cdMul;
    const dmg = (40 + 12 * lv) * (lv >= 3 ? 1.4 : 1), R0 = (lv >= 5 ? 90 : 60) * AREA();
    for (const f of tg) (S.futures ||= []).push({ f, x:f.x, y:f.y, t:2, dmg, R:R0, o:P });
  },
  dansefleur(P, m, lv) { // Danse-Fleur : Celebi tourbillonne, une tornade de pétales fauche tout autour
    m.t = (lv >= 4 ? 6 : 8) * P.cdMul;
    P.petalT = (2.4 + .2 * lv) * DUR(); P.petalLv = lv; P.petalTk = 0;
    if (!m.said) { m.said = true; banner(`${pName()} utilise Danse-Fleur !`); }
  },
};
function celebiTalent(P, dt) { // historique des PV et de la position (Voyage Temporel), Pouvoir Antique, Danse-Fleur
  if ((P.histT = (P.histT || 0) - dt) <= 0) { P.histT = .5; (P.hist ||= []).push({ hp:P.hp, x:P.x, y:P.y }); if (P.hist.length > 10) P.hist.shift(); }
  if (P.ancT > 0) P.ancT -= dt;
  if (P.petalT > 0) {
    P.petalT -= dt; P.petalTk -= dt; const R0 = (95 + 15 * P.petalLv) * AREA();
    if (P.petalTk <= 0) { P.petalTk = .25; HIT_SRC = "dansefleur"; const dmg = (9 + 3 * P.petalLv) * (P.petalLv >= 3 ? 1.4 : 1);
      for (const f of S.foes) if (!f.prop && !f.d.rare && f.hp > 0 && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (R0 + f.r) ** 2) hitFoe(f, dmg, "plante"); }
    P.petalR = R0;
  } else P.petalR = 0;
  if (S.futures) { // Prescience : les marques explosent
    for (const fu of S.futures) if (fu.o === P) { fu.t -= dt; if (fu.f.hp > 0) { fu.x = fu.f.x; fu.y = fu.f.y; }
      if (fu.t <= 0) { HIT_SRC = "prescience"; S.fxs.push({ x:fu.x, y:fu.y, r:0, max:fu.R * 1.3, life:.35, col:"rgba(240,110,200," }); emit(fu.x, fu.y, 14, "psy", { sp:200, life:.4 });
        for (const f of S.foes) if (!f.prop && !f.d.rare && f.hp > 0 && (f.x - fu.x) ** 2 + (f.y - fu.y) ** 2 < (fu.R + f.r) ** 2) hitFoe(f, fu.dmg, "psy"); } }
    S.futures = S.futures.filter(fu => fu.t > 0);
  }
}
function celebiRewind(P) { // Voyage Temporel : une fois par partie, au lieu d'être K.O., Celebi revient 5 s en arrière
  if (P.rewound || !P.hist || !P.hist.length) return false;
  const h = P.hist[0]; P.rewound = true; P.hp = Math.max(Math.round(P.maxHp * .35), Math.round(h.hp)); P.x = h.x; P.y = h.y; P.inv = 2; P.evoFlash = 1; S.white = .5;
  S.fxs.push({ x:P.x, y:P.y, r:0, max:160, life:.6, col:"rgba(140,255,200," }); sfx("evo");
  banner(`Voyage Temporel ! ${pName()} remonte le temps et revient 5 s en arrière !`);
  return true;
}
function drawCelebiP(t) { // Danse-Fleur et marques de Prescience
  for (const P of S.players) if (P.petalR > 0 && !P.down) {
    for (let k = 0; k < 18; k++) { const a = k / 18 * Math.PI * 2 + t * 5, rr = P.petalR * (.45 + .5 * ((k * 7) % 5) / 5); ell(cx, P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr * .8, 5, 2.6, k % 3 ? "rgba(248,170,205,.9)" : "rgba(255,240,245,.9)", a + t * 4); }
  }
  for (const fu of S.futures || []) { const k = fu.t / 2; cx.save(); cx.strokeStyle = `rgba(240,110,200,${.9 - k * .5})`; cx.lineWidth = 2; cx.setLineDash([5, 5]); cx.lineDashOffset = t * 30;
    cx.beginPath(); cx.arc(fu.x, fu.y, fu.R * (.4 + .6 * (1 - k)), 0, Math.PI * 2); cx.stroke(); cx.restore(); }
}
