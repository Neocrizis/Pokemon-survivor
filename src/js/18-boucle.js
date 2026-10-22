/* ---------- Boucle ---------- */
// en ligne, chaque joueur a sa propre caméra, centrée sur lui (sur le même écran, la caméra reste commune)
const SPLIT = () => NET.role === "host" && NET.started && S.players.length > 1;
function camClamp(cx0, cy0) {
  if (LEVEL.league) { const A = arena(), hx = W / ZOOM / 2, hy = H / ZOOM / 2, mx = ARENA_WALL + 20;
    cx0 = hx * 2 >= A.x1 - A.x0 + mx * 2 ? 0 : Math.max(A.x0 - mx + hx, Math.min(A.x1 + mx - hx, cx0));
    cy0 = hy * 2 >= A.y1 - A.y0 + mx * 2.6 ? START_Y : Math.max(A.y0 - mx * 1.6 + hy, Math.min(A.y1 + mx - hy, cy0)); }
  return { x:cx0, y:cy0 };
}
const camFor = p => camClamp(p.x, p.y);
function spawnNear() { // autour de qui faire apparaître : la caméra commune, ou en ligne un joueur debout au hasard
  if (!SPLIT()) return S.cam || S.P;
  const up = S.players.filter(p => !p.down && !p.choosing); return up.length ? up[Math.random() * up.length | 0] : S.cam;
}
function update(dt) {
  let P = S.P;
  S.t += dt; msgCool -= dt;
  if (S.winAt && S.t >= S.winAt) return endGame(true);
  if (S.t >= GAME_LEN && !LEVEL.league) { // Ligue Indigo : pas de chrono, il faut battre le Champion
    if (!LEVEL.finalBoss) return endGame(true);
    if (!S.finalOut) { // Caverne Azurée : à 10:00, Mewtwo arrive et il faut le battre
      S.finalOut = true; const P0 = S.P, a = Math.random() * Math.PI * 2, f = spawnFoe(LEVEL.finalBoss, P0.x + Math.cos(a) * 320, P0.y + Math.sin(a) * 320);
      f.hp = f.maxHp = Math.round((12000 + S.t * 16) * (1 + .6 * (S.players.length - 1))); f.atkT = 2.5; f.atkI = 0; S.mewtwo = f; sfx("boss"); S.shake = .6; S.white = .9;
      for (const g of S.foes) if (!g.d.boss && Math.hypot(g.x - f.x, g.y - f.y) < 380) g.hp = 0;
      banner("Mewtwo : « Nous nous retrouvons… Cette fois, je ne fuirai pas ! »");
    }
  }

  // déplacement (chaque joueur)
  for (const pl of S.players) {
  P = S.P = pl;
  if (P.down) { // K.O. en multijoueur : un coéquipier qui reste 3 s à côté le relève
    if (P.left) continue; // joueur en ligne déconnecté
    const help = S.players.some(q => !q.down && Math.hypot(q.x - P.x, q.y - P.y) < 60);
    P.revT = help ? P.revT + dt : Math.max(0, P.revT - dt * .5);
    if (P.revT >= 3) {
      P.revived = (P.revived || 0) + 1;
      for (const q of S.players) if (q !== P && !q.down && Math.hypot(q.x - P.x, q.y - P.y) < 60) q.saves = (q.saves || 0) + 1;
      P.down = false; P.hp = Math.round(P.maxHp * .4); P.inv = 2; P.evoFlash = 1; sfx("evo");
      banner(`${pTag(P)}${pName()} est relevé !`); S.fxs.push({ x:P.x, y:P.y, r:0, max:120, life:.45, col:"rgba(255,240,170," });
    }
    continue;
  }
  if (P.choosing) { P.inv = Math.max(P.inv, 1); P.dashT = 0; continue; } // en ligne : immobile et intangible pendant son choix
  const C = ctrlFor(P); P.gp = C.gp;
  let mx = 0, my = 0;
  if (C.kb && keys.has("left")) mx -= 1; if (C.kb && keys.has("right")) mx += 1;
  if (C.kb && keys.has("up")) my -= 1; if (C.kb && keys.has("down")) my += 1;
  if (C.kb && touch.on) { const dx = touch.x - touch.ox, dy = touch.y - touch.oy, l = Math.hypot(dx, dy); if (l > 8) { mx = dx / Math.max(l, 50); my = dy / Math.max(l, 50); } }
  if (C.x || C.y) { mx += C.x; my += C.y; }
  if (P.parT > 0) mx = my = 0; // paralysé (Cage-Éclair, barrière électrique)
  const ml = Math.hypot(mx, my); P.moving = ml > 0;
  if (ml > 1) { mx /= ml; my /= ml; }
  const slow = (tallGrassAt(P.x, P.y) ? .85 : 1) * (P.inSludge ? .75 : 1) * (P.inMud ? .6 : 1);
  if (LEVEL.ice && !flyP(P)) { // Île Écume : on glisse sur la glace (sauf en volant)
    const k = Math.min(1, dt * 2.4); P.ivx = (P.ivx || 0) + (mx * speed() * slow - (P.ivx || 0)) * k; P.ivy = (P.ivy || 0) + (my * speed() * slow - (P.ivy || 0)) * k;
    P.x += P.ivx * dt; P.y += P.ivy * dt;
    if (Math.hypot(P.ivx, P.ivy) > 90 && Math.random() < dt * 14) emit(P.x, P.y + P.r * .7, 1, "glace", { sp:25, life:.45, r:2 });
  } else if (ml > 0) { P.x += mx * speed() * slow * dt; P.y += my * speed() * slow * dt; }
  if (ml > 0) {
    const n = Math.hypot(mx, my); P.fx = mx / n; P.fy = my / n; P.mvx = P.fx; P.mvy = P.fy;
    if (Math.abs(mx) > .1) P.flip = mx < 0;
  }
  // visée : stick droit de la manette, sinon la souris ; sans visée, tir automatique
  let ax = 0, ay = 0;
  if (C.ax || C.ay) { ax = C.ax; ay = C.ay; }
  else if (C.kb && mouse.on) { ax = mouse.x - W / 2 - (P.x - S.cam.x) * ZOOM; ay = mouse.y - H / 2 - (P.y - S.cam.y) * ZOOM; if (Math.hypot(ax, ay) < 6) ax = ay = 0; }
  P.aiming = !!(ax || ay);
  P.tc = !P.aiming && (C.kb ? TOUCH : !!C.tc); // joueur sur téléphone (sans stick de visée) : Pistolet à O vise tout seul
  if (P.aiming) { const l = Math.hypot(ax, ay); P.fx = ax / l; P.fy = ay / l; P.aimA = Math.atan2(ay, ax); P.flip = ax < 0; }
  const flying = flyP(P); // Dracaufeu, Dracolosse, Togetic et Togekiss volent
  if (P.dashT > 0) { P.dashT -= dt; P.x += P.dvx * dt; P.y += P.dvy * dt; S.ghosts.push({ x:P.x, y:P.y, life:.22, dir:dirOf(P.dvx, P.dvy), o:P }); }
  if (P.kbx || P.kby) { P.x += P.kbx * dt; P.y += P.kby * dt; const k = Math.pow(.03, dt); P.kbx *= k; P.kby *= k; if (Math.abs(P.kbx) + Math.abs(P.kby) < 10) P.kbx = P.kby = 0; }
  if (LEVEL.rocket) around(P.x, P.y, c => { for (const sp of c.spinners || []) if (Math.abs(P.x - sp.x) < 26 && Math.abs(P.y - sp.y) < 26) { P.x += sp.dx * 380 * dt; P.y += sp.dy * 380 * dt; } }, 0);
  P.inSludge = false;
  for (const sl of S.sludge) { if ((P.x - sl.x) ** 2 + ((P.y - sl.y) * 1.6) ** 2 < sl.r * sl.r) P.inSludge = !flying; }
  P.inMud = !flying && S.muds.some(m => (P.x - m.x) ** 2 + ((P.y - m.y) * 1.6) ** 2 < m.r * m.r); // boue de Maraiste (Ruines d'Alpha)
  if (P.inSludge) { P.slT = (P.slT || 0) - dt; if (P.slT <= 0) { P.slT = .6; if (P.inv <= 0 && hurtP(3 * (1 + S.t / 900))) return; } }
  if (!flying) collide(P, P.r, ptype() === "eau");
  arenaClamp(P, P.r);
  P.swim = ptype() === "eau" && inWater(P.x, P.y);
  P.inv -= dt; P.evoFlash -= dt; P.slowT = (P.slowT || 0) - dt; P.parT = (P.parT || 0) - dt;
  if (P.regen) P.hp = Math.min(P.maxHp, P.hp + P.regen * dt);
  if (IT("orbevie") && (P.orbT = (P.orbT || 0) + dt) >= 1) { // Orbe Vie : contrecoup quand on attaque, comme dans les jeux
    P.orbT -= 1;
    if (P.orbHit) P.hp = Math.max(Math.min(P.hp, P.maxHp * .1), P.hp - P.maxHp * .004 * IT("orbevie")); // ne descend pas sous 10 % des PV max
    P.orbHit = false;
  }
  }
  for (const sl of S.sludge) sl.life -= dt;
  S.sludge = S.sludge.filter(sl => sl.life > 0);
  { // caméra commune : centre des joueurs debout, et personne ne sort de l'écran (en ligne : chacun a sa caméra, voir camFor)
    const up = S.players.filter(p => !p.down), list = SPLIT() ? [S.players[0]] : up.length ? up : S.players;
    let cx0 = 0, cy0 = 0; for (const p of list) { cx0 += p.x; cy0 += p.y; } cx0 /= list.length; cy0 /= list.length;
    if (S.players.length > 1 && !SPLIT()) { const hx = W / ZOOM / 2 - 40, hy = H / ZOOM / 2 - 50; for (const p of S.players) { p.x = Math.max(cx0 - hx, Math.min(cx0 + hx, p.x)); p.y = Math.max(cy0 - hy, Math.min(cy0 + hy, p.y)); } }
    S.cam = camClamp(cx0, cy0); // Ligue : la caméra reste dans la salle
  }
  P = S.P = nearP(S.cam.x, S.cam.y);

  // apparitions
  const mw = ((S.mewtwo && S.mewtwo.hp > 0) || (S.bird && S.bird.hp > 0) ? .3 : 1) * (LEVEL.league ? (S.lgPh === "boss" ? .45 : S.lgPh === "wild" ? 1 : 0) : 1); // Mewtwo et les oiseaux légendaires font fuir les autres Pokémon
  const np = 1 + .5 * (S.players.length - 1); // plus de joueurs, plus de Pokémon sauvages
  const tS = LEVEL.league ? Math.min(S.t, 600) : S.t; // Ligue Indigo : la difficulté arrête de monter après 10 min
  const ar = LEVEL.league ? .5 : 1; // salle fermée : moins de place pour fuir, donc moins de monde
  const rate = (1.1 + tS / 22) * CURSE() * mw * np * ar, cap = Math.min((260 + tS / 3) * CURSE() * mw * np, LEVEL.league ? (S.lgPh === "boss" ? 60 : 100) * np * CURSE() : 1e9);
  S.spawnAcc += rate * dt;
  while (S.spawnAcc >= 1) { S.spawnAcc--; if (S.foes.length < cap) spawnFoe(foeTable(S.t)); }
  if (S.t >= S.nextRing && (!LEVEL.league || S.lgPh === "wild")) {
    S.nextRing += LEVEL.league ? 1e9 : 120; // Ligue : une nuée par salle
    const kind = LEVEL.rings[Math.max(0, Math.min(LEVEL.rings.length - 1, Math.floor(S.t / 120) - 1))];
    const rc = spawnNear(); for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI*2; spawnFoe(kind, rc.x + Math.cos(a)*420, rc.y + Math.sin(a)*420); }
    banner(`Une nuée de ${FOES[kind].name} vous encercle !`);
  }
  if ((S.propT = (S.propT ?? 3) - dt) <= 0) {
    S.propT = 2.5;
    const pc = spawnNear(); if (S.foes.filter(f => f.prop).length < 5 * (SPLIT() ? S.players.length : 1)) for (let tries = 0; tries < 6; tries++) {
      const a = Math.random() * Math.PI * 2, d = 650 + Math.random() * 400, x = pc.x + Math.cos(a) * d, y = pc.y + Math.sin(a) * d;
      if (solidsNear(x, y).some(o => (x - o.x) ** 2 + (y - o.y) ** 2 < (o.r + 34) ** 2)) continue;
      if (LEVEL.moon && (getChunk(Math.floor(x / CH), Math.floor(y / CH)).craters || []).some(c => Math.hypot(c.x - x, c.y - y) < 70)) continue; // pas de rocher dans un cratère
      const pr = spawnFoe(LEVEL.prop || (LEVEL.cave ? "crackrock" : "berrytree"), x, y); pr.prop = true; pr.hp = pr.maxHp = 1; break;
    }
  }
  if (S.t >= S.evAt) { S.evAt = Infinity; startEvent(LEVEL.event.kind); }
  while (S.seq?.length && S.t >= S.seq[0][0]) banner(S.seq.shift()[1]);
  if (S.celebi) { S.P = nearP(S.celebi.x, S.celebi.y); updateCelebi(dt); S.P = P; }
  if (S.mother) updateMother(dt);
  if (S.orme) updateOrme(dt);
  if (LEVEL.safari) updateSafari(dt);
  if (LEVEL.manor) { for (const pl of S.players) if (!pl.down) { S.P = pl; updateManor(dt); } S.P = P; }
  const nb = LEVEL.bosses[S.bossIdx];
  if (nb && S.t >= nb.at) { S.bossIdx++; S.bossClean = true; S.boss = spawnFoe(nb.kind); sfx("boss"); banner(`Un ${foeName(FOES[nb.kind])} ${LEVEL.from} !`); }

  for (const pl of S.players) if (!pl.down && !pl.choosing) { // chaque joueur lance ses capacités ; on retient qui a lancé quoi
    P = S.P = pl; updateMoves(dt);
    // relu après chaque joueur : updateMoves remplace certains tableaux (filter), une liste gardée d'avant raterait ses nouveaux effets
    const owned = [S.shots, S.waves, S.clouds, S.tornados, S.beams, S.tails, S.suns, S.sunbeams, S.slashes, S.patches, S.flames, S.claws, S.bites, S.chains, S.bolts];
    for (const a of owned) for (const e of a) e.o ||= pl;
  }
  for (const sb of S.sunbeams) sb.life -= dt; S.sunbeams = S.sunbeams.filter(sb => sb.life > 0);

  // ennemis + séparation
  const grid = new Map(), CELL = 48;
  for (const f of S.foes) {
    P = S.P = nearP(f.x, f.y); // chaque Pokémon sauvage vise le joueur le plus proche
    if (f.prop) { if (f.hp > 0 && Math.hypot(f.x - P.x, f.y - P.y) < f.r + P.r + 8) f.hp = 0; continue; } // arbre à baies / rocher : se casse aussi en le touchant
    if (f.d.rare) { if (f.hp > 0) updateRare(f, dt); continue; }
    if (f.d.evo && f.hp > 0 && S.t >= f.d.evoAt && (f.evoT = (f.evoT ?? f.d.evoT) - dt) <= 0) evolveFoe(f, f.d.evo); // Rhinocorne → Rhinoféros → Rhinastoc
    const dx = P.x - f.x, dy = P.y - f.y, l = Math.hypot(dx, dy) || 1;
    let ax = dx / l, ay = dy / l;
    if (f.orme && S.orme?.on) { const ox = S.orme.x - f.x, oy = S.orme.y - f.y, ol = Math.hypot(ox, oy) || 1; ax = ox / ol; ay = oy / ol; } // ils foncent sur l'assistant du Prof. Orme
    if (f.charmT > S.t) { ax = -ax; ay = -ay; } // charmé par Togepi : s'éloigne
    if (f.d.erratic) { const w = Math.sin(S.t * 4 + f.ph) * .9; const c = Math.cos(w), s = Math.sin(w); [ax, ay] = [ax*c - ay*s, ax*s + ay*c]; }
    let sp = f.d.speed * CURSE() * (1 + Math.min(S.t / 600, 1) * .25) * (f.hurt > 0 && !f.d.boss ? .4 : 1) * (f.slowT > 0 ? f.slowMul : 1) * (f.d.boss ? BOSS_SPD[f.kind] || 1.3 : 1); // boss plus rapides
    if ((f.d.dash || f.d.bird) && !(f.sleepT > 0)) {
      f.dashT = (f.dashT ?? 1.5 + Math.random() * 2) - dt;
      const giant = !!(f.d.bigDash || f.d.bird);
      if (f.dashMode === "aim") { sp = 0; f.dx = ax; f.dy = ay; if (f.dashT <= 0) { f.dashMode = "go"; f.dashT = giant ? (f.d.bird ? .9 : 1.3) : .4; } }
      else if (f.dashMode === "go") { sp *= giant ? (f.d.bird ? 4.5 : 6) : 4.2; ax = f.dx; ay = f.dy; if (f.dashT <= 0) { f.dashMode = null; f.dashT = (giant ? 2.6 : 2.2) + Math.random() * 1.5; } }
      else if (!f.d.bird && f.dashT <= 0 && l < (giant ? 750 : 360)) { f.dashMode = "aim"; f.dashT = giant ? .85 : .45; }
    }
    if (f.d.herd) { // Tauros géant : son troupeau charge avec lui
      if (f.dashMode === "go" && !f.herded) {
        f.herded = true; const nx = -f.dy, ny = f.dx;
        for (const o of [-150, -75, 75, 150]) { const g = spawnFoe("tauros", f.x + nx * o - f.dx * 60, f.y + ny * o - f.dy * 60); g.stamp = { dx:f.dx, dy:f.dy, t:1.6 }; g.hp = g.maxHp = 60; }
        if (!f.saidHerd) { f.saidHerd = true; banner("Tauros géant fonce avec tout son troupeau !"); }
        S.shake = Math.max(S.shake, .25);
      }
      if (f.dashMode !== "go") f.herded = false;
    }
    if (f.stamp) { ax = f.stamp.dx; ay = f.stamp.dy; sp = 480; f.stamp.t -= dt; if (f.stamp.t <= 0) { f.hp = 0; f.gone = true; } }
    if (f.run) { ax = f.run.dx; ay = f.run.dy; sp = 300; if ((f.run.t -= dt) <= 0) f.run = null; } // Zarbi en formation : foncent tout droit
    if (f.jump) sp = 0;
    if (f.d.slide && !(f.sleepT > 0)) {
      // Éboulement : des rochers tombent au hasard autour de Grolem (ombre d'avertissement d'abord)
      const giant = !!f.d.boss;
      f.slideT = (f.slideT ?? 2 + Math.random() * 2) - dt;
      if (f.slideT <= 0 && l < (giant ? 700 : 420)) {
        f.slideT = giant ? 3.2 : 5 + Math.random() * 2; f.castT = .5;
        const n = giant ? 9 : 3, spread = giant ? 300 : 150, rr = giant ? 34 : 24;
        for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * spread; S.rocks.push({ x:f.x + Math.cos(a) * d, y:f.y + Math.sin(a) * d, r:rr, t:1, max:1, dmg:f.d.dmg * .75, ph:Math.random() * 6 }); }
        if (giant) for (let i = 0; i < 2; i++) S.rocks.push({ x:P.x + (Math.random() - .5) * 70, y:P.y + (Math.random() - .5) * 70, r:rr, t:1.1, max:1.1, dmg:f.d.dmg * .75, ph:Math.random() * 6 });
        if (giant && !f.said) { f.said = true; banner(`${f.d.name} utilise Éboulement !`); }
      }
      if (f.castT > 0) { f.castT -= dt; sp = 0; }
    }
    if (f.d.burrow && !(f.sleepT > 0)) {
      // Tunnel : Sablaireau (ou Onix) s'enfouit, file sous terre vers le joueur puis jaillit du sol ; Onix géant : Tunnel imposant
      const giant = !!f.d.boss;
      f.bT = (f.bT ?? 2 + Math.random() * 2) - dt;
      if (!f.under) { if (f.bT <= 0 && l < (giant ? 900 : 500)) { f.under = 1; f.bT = giant ? 2.6 : 1.6; if (giant) { S.shake = .3; if (!f.said) { f.said = true; banner(`${f.d.name} creuse un Tunnel… le sol tremble sous tes pieds !`); } } } }
      else if (f.under === 1) { sp *= giant ? 2.4 : 2.2; if (giant) { S.shake = Math.max(S.shake, .06); if (Math.random() < dt * 20) emit(f.x, f.y, 1, "sol", { sp:80, life:.5, r:3 }); } if (f.bT <= 0 || l < 22) { f.under = 2; f.bT = giant ? 1.1 : .45; } }
      else { sp = 0; if (f.bT <= 0) {
        f.under = 0; f.bT = giant ? 6 : 3 + Math.random() * 2;
        const rad = giant ? f.r + 95 : f.r + P.r + 26;
        S.fxs.push({ x:f.x, y:f.y, r:0, max:giant ? rad * 1.4 : f.r * 2.6, life:giant ? .5 : .3, col:"rgba(210,180,120," });
        if (giant) { S.shake = .5; sfx("break"); emit(f.x, f.y, 30, "sol", { sp:320, life:.6, r:4 }); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, tt = .7 + i % 2 * .3; S.rocks.push({ x:f.x + Math.cos(a) * rad * 1.35, y:f.y + Math.sin(a) * rad * 1.35, r:28, t:tt, max:tt, dmg:f.d.dmg * .6, ph:Math.random() * 6 }); } }
        if (l < rad && P.inv <= 0) { S.shake = Math.max(S.shake, .18); if (hurtP(f.d.dmg * (giant ? 1.2 : 1.4) * (1 + S.t / 900))) return; }
      } }
    }
    if (f.d.solid) { f.kbx = f.kby = 0; const md = f.r * .85 + P.r * .7; if (l < md) { P.x = f.x - dx / l * md; P.y = f.y - dy / l * md; } }
    if (f.d.blink && !(f.sleepT > 0)) {
      // Téléport : le Spectre s'efface puis réapparaît tout près du joueur
      f.bk = (f.bk ?? 3 + Math.random() * 3) - dt;
      if (!(f.vanish > 0) && f.bk <= 0 && l > 140 && l < 650) {
        f.vanish = f.vanMax = f.d.boss ? .6 : .75; f.bk = f.d.boss ? 4.5 : 5 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2, dd = f.d.boss ? 230 : 150; // Spectrum réapparaît à 150 px du joueur
        f.bx = P.x + Math.cos(a) * dd; f.by = P.y + Math.sin(a) * dd; // point d'arrivée choisi d'avance et marqué au sol
      }
      if (f.vanish > 0) { sp = 0; f.vanish -= dt; if (f.vanish <= 0) {
        let bx = f.bx, by = f.by; const bl = Math.hypot(bx - P.x, by - P.y) || 1, mn = f.d.boss ? 130 : 90;
        if (bl < mn) { bx = P.x + (bx - P.x) / bl * mn; by = P.y + (by - P.y) / bl * mn; } // jamais pile sur le joueur
        f.x = bx; f.y = by; f.appear = .4;
        S.fxs.push({ x:f.x, y:f.y, r:0, max:f.r * 2.4, life:.35, col:"rgba(170,120,240," }); emit(f.x, f.y, f.d.boss ? 18 : 8, "spectre", { sp:120, life:.5 });
      } }
    }
    if (f.appear > 0) { f.appear -= dt; if (f.d.blink) sp = 0; } // à peine réapparu : immobile et inoffensif
    if (f.d.boomR && !(f.sleepT > 0)) { // Explosion d'Électrode : courte mèche, puis souffle sur une grande zone
      if (!(f.fuse > 0) && l < 95) f.fuse = .75;
      if (f.fuse > 0) { sp = 0; f.fuse -= dt; if (f.fuse <= 0) {
        f.hp = 0; f.boomed = true; const R = f.d.boomR;
        S.fxs.push({ x:f.x, y:f.y, r:0, max:R, life:.4, col:"rgba(250,225,90," }); emit(f.x, f.y, 28, "electrik", { sp:R * 3, life:.5, r:3.6 }); emit(f.x, f.y, 12, "feu", { sp:220, life:.35 });
        S.shake = Math.max(S.shake, .3); sfx("break");
        if (boomHit(f.x, f.y, R, f.d.dmg * 1.5)) return;
        continue;
      } }
    } else
    if (f.d.boom && !(f.sleepT > 0) && l < f.r + P.r + 10) { // Destruction : Smogo (et Voltorbe) explose au contact
      f.hp = 0; f.boomed = true; const big = f.kind === "smogogo", el = f.d.types[0] === "electrik";
      S.fxs.push({ x:f.x, y:f.y, r:0, max:big ? 90 : 60, life:.35, col:el ? "rgba(250,225,90," : "rgba(190,120,220," }); emit(f.x, f.y, big ? 26 : 16, el ? "electrik" : "poison", { sp:260, life:.5, r:3.4 }); emit(f.x, f.y, 10, "feu", { sp:200, life:.35 });
      S.shake = Math.max(S.shake, .2); sfx("break");
      if (P.inv <= 0 && hurtP(f.d.dmg * 1.6 * (1 + S.t / 900))) return;
      continue;
    }
    if (f.d.toxTrail && f.dashMode === "go") { // Spectrum géant : traînée de poison pendant la charge
      if (!f.saidTox) { f.saidTox = true; banner("Spectrum géant charge en laissant une traînée de poison !"); }
      f.trT = (f.trT ?? 0) - dt; if (f.trT <= 0) { f.trT = .06; if (S.sludge.length < 160) S.sludge.push({ x:f.x, y:f.y + f.r * .3, r:f.r * .75, life:4.5, max:4.5, ph:Math.random() * 6 }); }
    }
    if (f.d.sludge && !(f.sleepT > 0)) { f.slT = (f.slT ?? Math.random()) - dt; if (f.slT <= 0) { f.slT = 1.3; if (S.sludge.length < 90) S.sludge.push({ x:f.x, y:f.y + f.r * .4, r:f.r * 1.3, life:5, max:5, ph:Math.random() * 6 }); } }
    if (f.d.ranged && !(f.sleepT > 0)) {
      if (l < 190) sp *= -.3;
      f.shotT = (f.shotT ?? 1 + Math.random() * 2) - dt;
      if (f.shotT <= 0 && l < 420) {
        f.shotT = (f.d.shotCd || 2.4) + Math.random();
        const n = f.d.volley || 1; // Magnéton : trois éclairs en éventail
        for (let i = 0; i < n; i++) { const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * .22; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 230, vy:Math.sin(a) * 230, dmg:f.d.dmg, life:2.4, type:f.copyT || f.skT || f.d.shot || "electrik", r:6 }); }
      }
    }
    if (f.sleepT > 0 || f.stunT > 0 || f.hold > 0) sp = 0; // hold : attaque en cours (Repos, Laser Glace, Explosion)
    const flies = f.d.types.includes("vol");
    if (!flies && !f.d.boss && tallGrassAt(f.x, f.y)) sp *= .85; // les boss ignorent le décor
    f.x += ax * sp * dt; f.y += ay * sp * dt;
    if (f.kbx || f.kby) { f.x += f.kbx * dt; f.y += f.kby * dt; const k = Math.pow(.02, dt); f.kbx *= k; f.kby *= k; if (Math.abs(f.kbx) + Math.abs(f.kby) < 8) f.kbx = f.kby = 0; }
    if (!flies && !f.d.boss && !f.under && !f.d.ghost && !f.d.phase) collide(f, f.r, !!f.d.swim);
    arenaClamp(f, Math.min(f.r, 30)); f.dir = dirOf(ax, ay); f.flip = (f.d.ranged && l < 190) ? ax > 0 : ax < 0;
    f.hurt -= dt; f.hold = (f.hold || 0) - dt; f.slowT = (f.slowT || 0) - dt; f.sleepT = (f.sleepT || 0) - dt; f.stunT = (f.stunT || 0) - dt; f.leerT = (f.leerT || 0) - dt;
    if (f.burnT > 0 || f.seedT > 0 || f.poisonT > 0) {
      f.dotT = (f.dotT || 0) - dt;
      if (f.dotT <= 0) {
        f.dotT = .5;
        HIT_SRC = "brulure"; if (f.burnT > 0) hitFoe(f, f.burnDps * .5, "feu");
        HIT_SRC = "poudretoxik"; if (f.poisonT > 0) hitFoe(f, f.poisonDps * .5, "poison");
        HIT_SRC = "vampigraine"; if (f.seedT > 0) { hitFoe(f, f.seedDps * .5, "plante"); P.hp = Math.min(P.maxHp, P.hp + f.seedHeal); }
      }
      f.burnT -= dt; f.seedT -= dt; f.poisonT -= dt;
    }
    if (f.d.snake) { // Onix : corps de rochers qui suit la tête (caché sous terre)
      if (f.under) f.trail.length = 0;
      else { const lt = f.trail[0]; if (!lt || Math.hypot(lt[0]-f.x, lt[1]-f.y) > f.r * 1.1) { f.trail.unshift([f.x, f.y]); f.trail.length = Math.min(f.trail.length, f.d.boss ? 10 : 8); } }
    }
    const k = ((f.x / CELL) | 0) + "," + ((f.y / CELL) | 0);
    if (!f.d.boss && !f.d.solid) (grid.get(k) || grid.set(k, []).get(k)).push(f);
    // contact
    if (l < f.r + P.r - 3 && P.inv <= 0 && !(f.sleepT > 0) && !f.under && !f.jump && !(f.appear > 0) && !(f.vanish > 0) && !(f.missT > S.t) && !(f.charmT > S.t)) {
      if (f.blindT > S.t && Math.random() < (f.d.boss ? .5 : 1) * (f.blindMiss || .4)) { f.missT = S.t + .6; maybeMsg(f, "Raté !", "#c9c9c9"); } // Brouillard
      else {
        if (P.line === "pika" && !f.d.boss) f.stunT = Math.max(f.stunT || 0, 1); // Statik : paralyse l'ennemi qui le touche
        S.shake = .18; if (hurtP(f.d.dmg * (1 + S.t / 900))) return;
      }
    }
  }
  for (const cell of grid.values()) {
    for (let i = 0; i < cell.length; i++) for (let j = i + 1; j < cell.length; j++) {
      const a = cell[i], b = cell[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || .01, min = a.r + b.r;
      if (d < min) { const push = (min - d) / 2 / d; const wa = a.d.boss ? 0 : 1, wb = b.d.boss ? 0 : 1;
        a.x -= dx * push * wa; a.y -= dy * push * wa; b.x += dx * push * wb; b.y += dy * push * wb; }
    }
  }

  // Poudre Toxik
  for (const c of S.clouds) {
    c.life -= dt; c.r += (c.max - c.r) * Math.min(1, dt * 5);
    if (c.follow) { const o = c.o || P; c.x = o.x; c.y = o.y; }
    for (const f of S.foes) if ((f.x-c.x)**2 + (f.y-c.y)**2 < (c.r + f.r)**2) { f.poisonT = c.poisonT; f.poisonDps = Math.max(f.poisonDps || 0, c.dps); }
  }
  S.clouds = S.clouds.filter(c => c.life > 0);
  for (const tl of S.tails) tl.life -= dt; S.tails = S.tails.filter(tl => tl.life > 0);
  for (const bm of S.beams) bm.life -= dt;
  S.beams = S.beams.filter(bm => bm.life > 0);
  // Danse Pétale
  for (const tn of S.tornados) {
    P = S.P = tn.o || P; tn.life -= dt; tn.tick -= dt; HIT_SRC = tn.src;
    if (!tn.tx || tn.tx.hp <= 0 || Math.random() < dt * .8) {
      let best = null, bc = -1;
      for (const f of nearestFoes(20)) { let c = 0; for (const g of S.foes) if ((g.x-f.x)**2 + (g.y-f.y)**2 < 100*100) c++; if (c > bc) { bc = c; best = f; } }
      tn.tx = best;
    }
    const gx = tn.tx ? tn.tx.x : P.x, gy = tn.tx ? tn.tx.y : P.y, d = Math.hypot(gx - tn.x, gy - tn.y) || 1;
    tn.x += (gx - tn.x) / d * Math.min(d, 110 * dt); tn.y += (gy - tn.y) / d * Math.min(d, 110 * dt);
    const hit = tn.tick <= 0; if (hit) tn.tick = .3;
    for (const f of S.foes) {
      const dx = tn.x - f.x, dy = tn.y - f.y, d2 = dx*dx + dy*dy;
      if (d2 > (tn.r + f.r) ** 2) continue;
      if (hit) hitFoe(f, tn.dmg, tn.type || "plante");
      if (!f.d.boss) { const dd = Math.sqrt(d2) || 1; f.x += dx / dd * 70 * dt + dy / dd * 90 * dt; f.y += dy / dd * 70 * dt - dx / dd * 90 * dt; }
    }
  }
  S.tornados = S.tornados.filter(tn => tn.life > 0);
  for (const sl of S.slashes) { const o = sl.o || P; sl.life -= dt; sl.x = o.x; sl.y = o.y; }
  for (const e of S.claws) e.life -= dt; S.claws = S.claws.filter(e => e.life > 0);
  for (const e of S.eclaws) e.life -= dt; S.eclaws = S.eclaws.filter(e => e.life > 0);
  for (const e of S.bites) e.life -= dt; S.bites = S.bites.filter(e => e.life > 0);
  if (S.frostFangs) { for (const e of S.frostFangs) e.life -= dt; S.frostFangs = S.frostFangs.filter(e => e.life > 0); }
  for (const e of S.ghosts) e.life -= dt; S.ghosts = S.ghosts.filter(e => e.life > 0);
  S.slashes = S.slashes.filter(sl => sl.life > 0);
  // Danse Flamme
  for (const pt of S.patches) {
    P = S.P = pt.o || P; pt.life -= dt; HIT_SRC = pt.src;
    if (Math.random() < dt * 5) emit(pt.x + (Math.random() - .5) * pt.r, pt.y - pt.r * .4, 1, "feu", { sp:15, life:.7, up:55, r:2 });
    for (const f of S.foes) {
      if ((f.patchT || 0) > S.t || (f.x-pt.x)**2 + (f.y-pt.y)**2 > (pt.r + f.r)**2) continue;
      f.patchT = S.t + .4; hitFoe(f, pt.dmg, "feu"); if (pt.burn) { f.burnT = 2.5 * DUR(); f.burnDps = Math.max(f.burnDps || 0, 4); }
    }
  }
  S.patches = S.patches.filter(pt => pt.life > 0);
  if (S.patches.length > 220) S.patches.splice(0, S.patches.length - 220);
  for (const fl of S.flames) { fl.life -= dt; fl.x += fl.vx * dt * .4; fl.y += fl.vy * dt * .4; }
  S.flames = S.flames.filter(fl => fl.life > 0);

  // vagues de Surf
  for (const w of S.waves) {
    P = S.P = w.o || P; w.life -= dt; HIT_SRC = w.src; w.r += (w.max - w.r) * Math.min(1, dt * 6);
    for (const f of S.foes) {
      if (w.hit.has(f)) continue;
      const dx = f.x - w.x, dy = f.y - w.y, d = Math.hypot(dx, dy) || 1;
      if (d < w.r + f.r && d > w.r - 46) { w.hit.add(f); hitFoe(f, w.dmg, "eau"); const k = f.d.boss ? .12 : 1; f.kbx = dx / d * w.push * k; f.kby = dy / d * w.push * k; }
    }
  }
  S.waves = S.waves.filter(w => w.life > 0);

  // Tornade de Roucarnage géant
  for (const f of S.foes) if (f.kind === "bossRouc") {
    P = S.P = nearP(f.x, f.y);
    f.gustT = (f.gustT ?? 2.5) - dt;
    if (f.gustT <= 0) {
      f.gustT = 4.5;
      const base = Math.atan2(P.y - f.y, P.x - f.x);
      for (const o of [-.35, 0, .35]) S.gusts.push({ x:f.x, y:f.y, vx:Math.cos(base + o) * 150, vy:Math.sin(base + o) * 150, r:34, life:4.5, ph:Math.random() * 6, hitT:0 });
      banner("Roucarnage géant utilise Tornade !");
    }
  }
  for (const g of S.gusts) {
    P = S.P = nearP(g.x, g.y); g.life -= dt; g.hitT -= dt;
    const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy) || 1;
    g.vx += dx / d * 60 * dt; g.vy += dy / d * 60 * dt;
    const sp = Math.hypot(g.vx, g.vy); if (sp > 170) { g.vx *= 170 / sp; g.vy *= 170 / sp; }
    g.x += g.vx * dt; g.y += g.vy * dt;
    if (d < g.r + P.r && g.hitT <= 0) {
      g.hitT = .8; P.kbx = dx / d * 520; P.kby = dy / d * 520;
      if (P.inv <= 0) { S.shake = .2; if (hurtP((g.dmg || 10) * (1 + S.t / 900))) return; }
    }
  }
  S.gusts = S.gusts.filter(g => g.life > 0);

  // rochers d'Éboulement
  for (const rk of S.rocks) {
    P = S.P = nearP(rk.x, rk.y); rk.t -= dt;
    if (rk.t <= 0 && !rk.done) {
      rk.done = true; S.shake = Math.max(S.shake, .1);
      S.fxs.push({ x:rk.x, y:rk.y, r:0, max:rk.r * 1.5, life:.25, col:"rgba(190,175,150," });
      if (P.inv <= 0 && (P.x - rk.x) ** 2 + (P.y - rk.y) ** 2 < (rk.r + P.r * .6) ** 2) { if (hurtP(rk.dmg * (1 + S.t / 900))) return; }
    }
  }
  S.rocks = S.rocks.filter(rk => rk.t > -.7);
  // Météores de Mélodelfe géant
  for (const f of S.foes) if (f.kind === "bossMelo") {
    P = S.P = nearP(f.x, f.y);
    f.starT = (f.starT ?? 3) - dt;
    if (f.starT <= 0) {
      f.starT = 4; const n = 14, off = Math.random();
      for (let i = 0; i < n; i++) { const a = (i + off) / n * Math.PI * 2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 170, vy:Math.sin(a) * 170, dmg:12, life:4, type:"fee", r:9, star:true }); }
      if (!f.said) { f.said = true; banner("Mélodelfe géant utilise Météores !"); }
    }
  }
  // tirs ennemis (éclairs, jets d'eau, étoiles)
  // Osmerang de l'Esprit d'Ossatueur, Ball'Ombre d'Ectoplasma géant
  for (const f of S.foes) if (f.kind === "bossOssa" && !(f.sleepT > 0)) {
    P = S.P = nearP(f.x, f.y);
    f.boneT = (f.boneT ?? 2) - dt;
    if (f.boneT <= 0) {
      f.boneT = 2.6; const a0 = Math.atan2(P.y - f.y, P.x - f.x);
      for (const da of [-.35, 0, .35]) S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a0 + da) * 330, vy:Math.sin(a0 + da) * 330, dmg:14, life:4, type:"sol", r:10, big:true, boomer:f, bt:0 });
      if (!f.said) { f.said = true; banner("L'Esprit d'Ossatueur lance Osmerang !"); }
    }
  }
  for (const f of S.foes) if (f.d.spit && !(f.sleepT > 0) && f.dashMode !== "go") {
    P = S.P = nearP(f.x, f.y);
    f.spT = (f.spT ?? 2.5) - dt;
    if (f.spT <= 0) {
      f.spT = 3; const a0 = Math.atan2(P.y - f.y, P.x - f.x);
      for (let i = -3; i <= 3; i++) S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a0 + i * .2) * 240, vy:Math.sin(a0 + i * .2) * 240, dmg:12, life:3, type:"poison", r:9 });
      if (!f.said) { f.said = true; banner(`${f.d.name} utilise Acide !`); }
    }
  }
  // Kangourex géant : bondit sur le joueur et retombe en onde de choc
  for (const f of S.foes) if (f.d.stomp && !(f.sleepT > 0)) {
    P = S.P = nearP(f.x, f.y);
    if (f.jump) {
      const j = f.jump; j.t += dt; const k = Math.min(1, j.t / j.dur);
      f.x = j.sx + (j.tx - j.sx) * k; f.y = j.sy + (j.ty - j.sy) * k; f.jz = Math.sin(k * Math.PI) * 140;
      if (k >= 1) {
        f.jump = null; f.jz = 0; S.shake = .35; sfx("break");
        S.fxs.push({ x:f.x, y:f.y, r:0, max:150, life:.4, col:"rgba(230,200,140," }); emit(f.x, f.y, 24, "sol", { sp:260, life:.5, r:3.5 });
        for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 200, vy:Math.sin(a) * 200, dmg:12, life:2.2, type:"normal", r:9 }); }
        if (Math.hypot(P.x - f.x, P.y - f.y) < 110 && P.inv <= 0 && hurtP(f.d.dmg * 1.2)) return;
      }
    } else {
      f.jT = (f.jT ?? 2.5) - dt;
      if (f.jT <= 0) { f.jT = 4.2; f.jump = { sx:f.x, sy:f.y, tx:P.x, ty:P.y, t:0, dur:1 }; if (!f.said) { f.said = true; banner("Kangourex géant bondit… gare à l'atterrissage !"); } }
    }
  }
  if (updateJohtoFoes(dt)) return;
  if (updateAlph(dt)) return;
  // Magmar géant : Lance-Flammes (gerbe de feu continue vers le joueur)
  for (const f of S.foes) if (f.d.flamer && !(f.sleepT > 0)) {
    P = S.P = nearP(f.x, f.y);
    f.flT = (f.flT ?? 3) - dt;
    if (f.flT <= 0 && !(f.flame > 0)) { f.flame = 1.4; f.flA = Math.atan2(P.y - f.y, P.x - f.x); if (!f.said) { f.said = true; banner("Magmar géant utilise Lance-Flammes !"); } }
    if (f.flame > 0) {
      f.flame -= dt; f.flA += Math.sign(((Math.atan2(P.y - f.y, P.x - f.x) - f.flA + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * .9 * dt; // suit lentement le joueur
      f.fsT = (f.fsT || 0) - dt;
      if (f.fsT <= 0) { f.fsT = .05; const a = f.flA + (Math.random() - .5) * .35, v = 300 + Math.random() * 80; S.eshots.push({ x:f.x + Math.cos(a) * 30, y:f.y + Math.sin(a) * 30, vx:Math.cos(a) * v, vy:Math.sin(a) * v, dmg:9, life:1.1, type:"feu", r:9 }); }
      if (f.flame <= 0) f.flT = 4;
    }
  }
  // Arcanin géant : Vitesse Extrême qui sème des braises
  for (const f of S.foes) if (f.d.embers && f.dashMode === "go") {
    P = S.P = nearP(f.x, f.y);
    if (!f.saidEm) { f.saidEm = true; banner("Arcanin géant utilise Vitesse Extrême et sème des braises !"); }
    f.emT = (f.emT || 0) - dt;
    if (f.emT <= 0) { f.emT = .08; for (const sgn of [-1, 1]) S.eshots.push({ x:f.x, y:f.y, vx:-f.dy * sgn * 90 + (Math.random() - .5) * 40, vy:f.dx * sgn * 90 + (Math.random() - .5) * 40, dmg:10, life:2.2, type:"feu", r:8 }); }
  }
  // Mewtwo : Choc Mental à tête chercheuse, Psyko, Téléport, Barrière ; enragé sous 50 % de PV
  for (const f of S.foes) if (f.d.mewtwo && f.hp > 0) {
    P = S.P = nearP(f.x, f.y);
    const rage = f.hp < f.maxHp * .5;
    if (rage && !f.raged) { f.raged = true; banner("Mewtwo entre dans une rage psychique ! Ses attaques redoublent !"); S.shake = .4; }
    f.shieldT = (f.shieldT || 0) - dt;
    const cv = f.d.cave, more = cv ? 1.3 : 1;
    if (f.ring2 > 0) { f.ring2 -= dt; if (f.ring2 <= 0) mewRing(f, Math.round((rage ? 22 : 16) * more), .5); }
    if (cv) { // Ultralaser : vise, puis balaie
      const a0 = Math.atan2(P.y - f.y, P.x - f.x);
      f.lzT = (f.lzT ?? 7) - dt;
      if (!f.lz && f.lzT <= 0 && f.atkT > .5) { f.lz = { ph:"aim", t:rage ? .7 : .9, a:a0, dmg:20, w:30, turn:rage ? .55 : .4, slow:0, type:"normal", dur:rage ? 1.8 : 1.4 }; if (!f.saidH) { f.saidH = true; banner("Mewtwo charge Ultralaser ! Sors de sa ligne de mire !"); } }
      if (f.lz) { if (laserTick(f, a0, dt)) return; if (!f.lz) f.lzT = rage ? 4.5 : 6.5; continue; }
    }
    f.atkT -= dt;
    if (f.atkT <= 0) {
      const seq = ["choc", "psyko", "tele", "choc", "barriere", "psyko", "tele"], atk = seq[f.atkI++ % seq.length];
      f.atkT = (rage ? 1.5 : 2.3) * (cv ? .75 : 1);
      if (atk === "choc") { mewChoc(f, (rage ? 5 : 3) + (cv ? 1 : 0)); if (!f.saidC) { f.saidC = true; banner("Mewtwo utilise Choc Mental !"); } }
      else if (atk === "psyko") { mewRing(f, Math.round((rage ? 22 : 16) * more), 0); f.ring2 = .4; if (!f.saidP) { f.saidP = true; banner("Mewtwo utilise Psyko !"); } }
      else if (atk === "tele") {
        S.fxs.push({ x:f.x, y:f.y, r:0, max:90, life:.3, col:"rgba(220,140,255," });
        const a = Math.random() * Math.PI * 2; f.x = P.x + Math.cos(a) * 230; f.y = P.y + Math.sin(a) * 230;
        S.fxs.push({ x:f.x, y:f.y, r:0, max:110, life:.35, col:"rgba(220,140,255," }); emit(f.x, f.y, 20, "psy", { sp:200, life:.5 });
        mewChoc(f, (rage ? 4 : 2) + (cv ? 1 : 0));
      } else { f.shieldT = rage ? 2.2 : 3; if (!f.saidB) { f.saidB = true; banner("Mewtwo utilise Barrière : il encaisse à peine les coups !"); } }
    }
  }
  // Persian de Giovanni : Vive-Attaque (charge éclair) et Combo-Griffe au corps à corps
  for (const f of S.foes) if (f.d.claws && !(f.sleepT > 0)) {
    P = S.P = nearP(f.x, f.y);
    const dx = P.x - f.x, dy = P.y - f.y, l = Math.hypot(dx, dy);
    if (f.dashMode === "go") { if (!f.saidVA) { f.saidVA = true; banner("Persian de Giovanni utilise Vive-Attaque !"); } if (Math.random() < dt * 40) emit(f.x, f.y, 1, "normal", { sp:40, life:.35, r:3 }); }
    f.cgT = (f.cgT ?? 1) - dt;
    if (f.combo > 0) {
      f.comboT -= dt;
      if (f.comboT <= 0) {
        f.combo--; f.comboT = .2; const last = f.combo === 0;
        S.eclaws.push({ x:f.x, y:f.y, a:Math.atan2(dy, dx), side:f.combo % 2 ? 1 : -1, range:f.r + 80, life:.2, big:last });
        if (l < f.r + 85 && P.inv <= 0 && hurtP(f.d.dmg * (last ? .9 : .45) * (1 + S.t / 900))) return;
      }
    } else if (f.cgT <= 0 && l < f.r + 95 && f.dashMode !== "go") {
      f.combo = 3; f.comboT = .25; f.cgT = 2.4;
      if (!f.saidCG) { f.saidCG = true; banner("Persian de Giovanni utilise Combo-Griffe !"); }
    }
  }
  for (const f of S.foes) if ((f.kind === "bossEcto" || f.d.shadowBall) && !(f.sleepT > 0)) {
    P = S.P = nearP(f.x, f.y);
    f.ballT = (f.ballT ?? 3) - dt;
    if (f.ballT <= 0) {
      f.ballT = 3.6; const n = 12, off = Math.random();
      for (let i = 0; i < n; i++) { const a = (i + off) / n * Math.PI * 2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 160, vy:Math.sin(a) * 160, dmg:13, life:4, type:"spectre", r:10 }); }
      if (!f.said) { f.said = true; banner(`${f.d.name} utilise Ball'Ombre !`); }
    }
  }
  if (updateMap7(dt)) return;
  if (LEVEL.league && updateLeague(dt)) return;
  for (const s of S.eshots) {
    P = S.P = nearP(s.x, s.y);
    if (s.boomer) { // l'os revient vers son lanceur
      s.bt += dt; const o = s.boomer;
      if (s.bt > .75) { const dx = o.x - s.x, dy = o.y - s.y, l = Math.hypot(dx, dy) || 1; s.vx += dx / l * 1100 * dt; s.vy += dy / l * 1100 * dt; const v = Math.hypot(s.vx, s.vy); if (v > 360) { s.vx *= 360 / v; s.vy *= 360 / v; } if (l < 40 || o.hp <= 0) s.life = 0; }
    }
    if (s.home) { // tourne vers le joueur
      const want = Math.atan2(P.y - s.y, P.x - s.x), cur = Math.atan2(s.vy, s.vx), v = Math.hypot(s.vx, s.vy);
      const d = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI, na = cur + Math.max(-s.home * dt, Math.min(s.home * dt, d));
      s.vx = Math.cos(na) * v; s.vy = Math.sin(na) * v;
    }
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    if (s.mew) for (const g of S.foes) { // les attaques de Mewtwo blessent aussi les autres Pokémon
      if (g.d.boss || g.prop || g.d.rare || g.hp <= 0 || (g.x - s.x) ** 2 + (g.y - s.y) ** 2 > (g.r + s.r) ** 2) continue;
      g.hp -= 45 * (1 + S.t / 300); g.hurt = .12; s.life = 0; emit(s.x, s.y, 5, "psy", { sp:100, life:.35 }); break;
    }
    if (s.life <= 0) { if (s.puddle && S.sludge.length < 240) S.sludge.push({ x:s.x, y:s.y, r:42, life:7, max:7, ph:Math.random() * 6 }); continue; } // Bomb-Beurk : flaque à l'atterrissage
    if (P.inv <= 0 && !s.fogMiss && (s.x-P.x)**2 + (s.y-P.y)**2 < (P.r + s.r)**2) {
      const sm = S.smokes && S.smokes.find(c => (P.x-c.x)**2 + (P.y-c.y)**2 < c.r*c.r); // Brouillard : le tireur rate sa cible
      if (sm && Math.random() < sm.miss) { s.fogMiss = true; S.texts.push({ x:P.x, y:P.y - P.r - 18, txt:"Raté !", col:"#c9c9c9", life:.8, label:true }); continue; }
      const m = eff(s.type, [ptype()]); s.life = 0;
      if (m === 0) { S.texts.push({ x:P.x, y:P.y - P.r - 18, txt:"Aucun effet !", col:"#c8c8c8", life:1, label:true }); continue; }
      S.shake = .18;
      if (m > 1) S.texts.push({ x:P.x, y:P.y - P.r - 18, txt:"Super efficace !", col:"#ffd84a", life:1, label:true });
      statusHit(P, s);
      if (hurtP(s.dmg * m * (1 + S.t / 900))) return;
    }
  }
  S.eshots = S.eshots.filter(s => s.life > 0);

  // projectiles
  function explode(s, f) {
    const R = s.boomR || 56 * AREA(); s.exploded = true; emit(s.x, s.y, 16, s.type, { sp:R * 4, life:.4, r:3.2 }); HIT_SRC = s.src;
    S.fxs.push({ x:s.x, y:s.y, r:0, max:R, life:s.star ? .45 : .25, col:s.type === "electrik" ? "rgba(246,209,58," : s.type === "dragon" ? "rgba(150,110,250," : "rgba(246,162,58,", star:s.star });
    if (s.star) S.shake = .2;
    for (const g of S.foes) if (g !== f && (g.x-s.x)**2 + (g.y-s.y)**2 < R*R) { hitFoe(g, s.dmg * (s.boomMul || .6), s.type); if (s.burn) { g.burnT = s.burn.t * DUR(); g.burnDps = Math.max(g.burnDps || 0, s.burn.dps); } }
    if (f && s.burn) { f.burnT = s.burn.t * DUR(); f.burnDps = Math.max(f.burnDps || 0, s.burn.dps); }
  }
  for (const s of S.shots) { P = S.P = s.o || P; if (s.explodeOnEnd && !s.exploded && s.life - dt * PSPD() <= 0) explode(s, null); }
  for (const s of S.shots) {
    P = S.P = s.o || P; const ps = PSPD(); // dégâts et vitesse : ceux du joueur qui a tiré
    (s.tr ||= []).unshift([s.x, s.y]); if (s.tr.length > 7) s.tr.pop();
    if (s.home) { // Météores : l'étoile se dirige toujours vers sa cible
      if (s.home.hp <= 0 || s.hit?.has(s.home)) s.home = nearestFoes(1)[0] || null;
      if (s.home) { const dx = s.home.x - s.x, dy = s.home.y - s.y, l = Math.hypot(dx, dy) || 1, k = Math.min(1, dt * 6); s.vx += (dx / l * 420 - s.vx) * k; s.vy += (dy / l * 420 - s.vy) * k; }
    }
    if (s.kind === "fire" && Math.random() < dt * 30) emit(s.x, s.y, 1, "feu", { sp:40, life:.45, up:30, r:2.2 });
    if (s.kind === "dfire" && Math.random() < dt * 30) emit(s.x, s.y, 1, "dragon", { sp:40, life:.45, up:30, r:2.2 });
    s.x += s.vx * dt * ps; s.y += s.vy * dt * ps; s.life -= s.explodeOnEnd ? dt * ps : dt;
    if (s.grow) s.r = Math.min(6 + s.grow, s.r + s.grow * dt);
    for (const f of S.foes) {
      if (s.pierce <= 0) break;
      if (f.hp <= 0 || s.hit?.has(f)) continue;
      if ((f.x-s.x)**2 + (f.y-s.y)**2 < (f.r + s.r)**2) {
        const n = Math.hypot(s.vx, s.vy); HIT_SRC = s.src;
        hitFoe(f, s.dmg, s.type, s.vx/n, s.vy/n, s.crit); s.pierce--; s.hit?.add(f); if (s.onHit) s.onHit(f);
        if (s.slow) { f.slowT = 2 * DUR(); f.slowMul = s.slow; }
        if (s.seed) { f.seedT = 5 * DUR(); f.seedDps = s.seed.dps; f.seedHeal = s.seed.heal; }
        if (s.boom) explode(s, f);
        if (s.coinV && f.hp <= 0 && !f.d.boss) S.gems.push({ x:f.x + 8, y:f.y - 4, v:s.coinV, coin:true });
        if (s.bounce > 0) {
          const nx = S.foes.filter(g => g.hp > 0 && !g.under && !s.hit.has(g) && (g.x - f.x) ** 2 + (g.y - f.y) ** 2 < 220 * 220)
            .sort((a, b) => ((a.x - f.x) ** 2 + (a.y - f.y) ** 2) - ((b.x - f.x) ** 2 + (b.y - f.y) ** 2))[0];
          if (nx) { s.bounce--; s.pierce++; const sp = Math.hypot(s.vx, s.vy), aa = Math.atan2(nx.y - s.y, nx.x - s.x); s.vx = Math.cos(aa) * sp; s.vy = Math.sin(aa) * sp; s.life = 1; }
        }
      }
    }
    if (s.pierce <= 0) s.life = 0;
  }
  S.shots = S.shots.filter(s => s.life > 0);

  // K.O.
  const alive = [];
  for (const f of S.foes) {
    P = S.P = nearP(f.x, f.y);
    if (f.prop) {
      if (f.hp > 0) { if (Math.hypot(f.x - P.x, f.y - P.y) < 1500) alive.push(f); continue; }
      sfx("break");
      const r = Math.random(), pick = r < 1/30 ? "flute" : r < 2/30 ? "aimant" : LEVEL.cave ? "potion" : "sitrus";
      if (S.nuz && (pick === "sitrus" || pick === "potion")) S.gems.push({ x:f.x, y:f.y + 6, v:3 }); // Nuzlocke : un Bonbon Exp. à la place du soin
      else S.gems.push({ x:f.x, y:f.y + 6, pick });
      for (let k = 0; k < 8; k++) S.fxs.push({ x:f.x + (Math.random() - .5) * 30, y:f.y + (Math.random() - .5) * 24, r:0, max:6 + Math.random() * 6, life:.3, col: LEVEL.cave ? "rgba(150,130,110," : "rgba(90,170,70," });
      continue;
    }
    if (f.hp > 0) {
      if (!f.d.boss && !f.d.event && !f.d.mother && !f.d.rare && !f.stamp && Math.hypot(f.x - P.x, f.y - P.y) > 1400) { const a = Math.random()*Math.PI*2; f.x = P.x + Math.cos(a)*700; f.y = P.y + Math.sin(a)*700; }
      alive.push(f); continue;
    }
    if (f.gone) continue; // troupeau qui s'éloigne, Pokémon rare enfui
    if (f.d.rare) { if (f.caught) rareCaught(f); continue; }
    if (f.d.mother) { motherCalm(f); continue; }
    S.kills++; dexCount(f); sfx("ko"); if (f.d.zarbi) zarbiCarnet(f);
    { const kp = S.players[f.lastBy]; if (kp) kp.kos = (kp.kos || 0) + 1; }
    if (f.d.healer && !S.nuz) { P.hp = Math.min(P.maxHp, P.hp + 20); S.texts.push({ x:P.x, y:P.y - 30, txt:"Leveinard +20 PV", col:"#7fe08a", life:1, label:true }); emit(P.x, P.y, 10, "fee", { sp:120, life:.5, r:2.6 }); }
    if (f.d.event) { // Ronflex se réveille
      banner("Ronflex se réveille, bâille… et s'en va en te laissant des cadeaux !"); S.shake = .3;
      S.fxs.push({ x:f.x, y:f.y, r:0, max:260, life:.5, col:"rgba(255,240,200," });
      for (const g of S.foes) { if (g === f || g.d.boss) continue; const gx = g.x - f.x, gy = g.y - f.y, gd = Math.hypot(gx, gy) || 1; if (gd < 300) { g.kbx = gx / gd * 800; g.kby = gy / gd * 800; } }
      S.gems.push({ x:f.x, y:f.y, pick:"chest" });
      for (let i = 0; i < 16; i++) S.gems.push({ x:f.x + (Math.random() - .5) * 120, y:f.y + (Math.random() - .5) * 90, v:4 });
      S.fxs.push({ x:f.x, y:f.y, r:0, max:f.r * 1.6, life:.2, col:"rgba(255,255,255," }); continue;
    }
    if (f.d.mini) {
      for (let i = 0; i < 6; i++) S.gems.push({ x:f.x + (Math.random() - .5) * 60, y:f.y + (Math.random() - .5) * 60, v:4 });
      if (!S.foes.some(g => g !== f && g.d.mini && g.hp > 0)) { // les trois sont battus
        banner("« La Team Rocket s'envole vers d'autres cieux ! » ✦"); sfx("win");
        S.gems.push({ x:f.x, y:f.y, pick:"chest" }); S.rocketStar = { t:0 };
      }
    }
    if (f.d.mewtwo && f.d.cave) {
      S.mewtwo = null; S.winAt = S.t + 4; S.white = 1.2; S.shake = .6; sfx("boss");
      banner("Mewtwo s'effondre pour de bon !");
      S.seq = [[S.t + 1.6, "« Mew ! » Un petit Pokémon rose sort de l'ombre… Mew veut te suivre !"]];
    } else if (f.d.mewtwo) {
      S.mewtwo = null; teamAch("mewtwo"); S.gems.push({ x:f.x + 40, y:f.y, pick:"chest" }); S.shake = .5; S.white = 1.6; sfx("boss"); // pas vaincu : il s'enfuit
      banner("Mewtwo : « Nous nous reverrons… »");
      S.seq = [[S.t + 2.2, "Mewtwo s'est enfui vers la Caverne Azurée… Il laisse deux Poké Balls derrière lui !"]];
    }
    if (f.d.bird) {
      S.bird = null; teamAch("legend"); S.gems.push({ x:f.x + 40, y:f.y, pick:"chest" }); S.shake = .5;
      S.seq = [[S.t + 1.5, `${f.d.name} pousse un dernier cri et s'envole au loin… Il laisse deux Poké Balls derrière lui !`]];
    }
    if (f.d.boss) {
      if (!(f.d.mewtwo || f.d.bird) || S.boss === f) S.boss = null; if (!f.d.mewtwo) banner(`${f.d.name} est K.O. ! Il laisse une Poké Ball…`); teamAch("boss"); if (S.bossClean) teamAch("nohit");
      S.gems.push({ x:f.x, y:f.y, pick:"chest" });
      for (let i = 0; i < 12; i++) S.gems.push({ x:f.x + (Math.random()-.5)*80, y:f.y + (Math.random()-.5)*80, v:f.d.xp/12 | 0 || 1, berry:i < 2 && !S.nuz });
    } else if (S.gems.length < 450) {
      S.gems.push({ x:f.x, y:f.y, v:f.d.xp, berry: !S.nuz && Math.random() < .012 });
    } else gainXp(f.d.xp, nearP(f.x, f.y));
    S.fxs.push({ x:f.x, y:f.y, r:0, max:f.r * 1.6, life:.2, col:"rgba(255,255,255," });
  }
  S.foes = alive;

  // ramassage (chaque bonbon file vers le joueur debout le plus proche)
  for (const g of S.gems) {
    if (g.got) continue;
    P = S.P = g.pull && g.pull !== true && !g.pull.down ? g.pull : nearP(g.x, g.y);
    const mag = P.magnet * (1 + .35 * (P.items.aimant || 0));
    const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy);
    if (d < mag && !g.pull) g.pull = P;
    if (g.pull) { const sp = 420 * dt; g.x += dx / d * Math.min(sp, d); g.y += dy / d * Math.min(sp, d); }
    if (d < P.r + 6 && g.pick) { g.got = true; usePick(g.pick); continue; }
    if (d < P.r + 6) { g.got = true; if (g.berry) { P.hp = Math.min(P.maxHp, P.hp + 25); S.texts.push({ x:P.x, y:P.y - 30, txt:"Baie Oran +25 PV", col:"#7fe08a", life:1, label:true }); } else { gainXp(g.v, P); sfx("xp"); } }
  }
  S.gems = S.gems.filter(g => !g.got);

  for (const t of S.texts) { t.life -= dt; t.y -= 32 * dt; }
  S.texts = S.texts.filter(t => t.life > 0);
  for (const e of S.fxs) { e.life -= dt; e.r += (e.max - e.r) * .4; }
  const pd = Math.exp(-3 * dt);
  for (const q of S.parts) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= pd; q.vy *= pd; }
  S.parts = S.parts.filter(q => q.life > 0);
  S.fxs = S.fxs.filter(e => e.life > 0);
  for (const b of S.bolts) b.life -= dt;
  for (const c of S.chains) c.life -= dt; S.chains = S.chains.filter(c => c.life > 0);
  S.bolts = S.bolts.filter(b => b.life > 0);
  for (const m of S.msgs) m.life -= dt;
  S.msgs = S.msgs.filter(m => m.life > 0);
  S.shake = Math.max(0, S.shake - dt); if (S.white) S.white = Math.max(0, S.white - dt);

  P = S.P = S.players[0];
  if (NET.role === "host" && NET.started) netChoices(dt); // en ligne : la partie continue pendant les choix
  else {
    const pe = S.players.find(p => p.pendingEvo && !p.down), pv = S.players.find(p => p.pendingLv > 0 && !p.down);
    if (pe) { S.P = S.chooser = pe; openEvo(); }       // sur le même écran : chaque joueur choisit à son tour
    else if (pv) { S.P = S.chooser = pv; openLevelUp(); }
    else if (S.chestQ.length) openChest();
  }
  if ((S.dexSaveT = (S.dexSaveT ?? 15) - dt) <= 0) { S.dexSaveT = 15; dexSave(); }
  if ((S.achT = (S.achT ?? 1) - dt) <= 0) { S.achT = 1; achCheck(); }
  playTrack(S.foes.some(f => f.d.boss) ? "boss" : LEVEL.track || (LEVEL.cave ? "cave" : "forest"));
}

function gainXp(v, who) { // XP individuelle : seul le joueur qui ramasse le bonbon la reçoit
  const me = S.P;
  for (const P of who ? [who] : S.players) {
    if (P.down) continue; S.P = P;
    P.xp += v * (1 + .08 * IT("multiexp")) * (P.line === "evoli" ? 1.1 : 1); // Adaptabilité d'Évoli
    while (P.xp >= P.need) { P.xp -= P.need; P.lvl++; P.need = Math.round(6 + P.lvl * 4.5 + P.lvl * P.lvl * .12); P.pendingLv++; checkEvo(); }
  }
  S.P = me;
}
function checkEvo() {
  const P = S.P;
  if (P.line === "evoli" && P.stage === 0 && P.lvl >= EVO_LEVELS[0]) { P.pendingEvo = true; return; } // Évoli choisit sa forme
  if (P.stage < 2 && P.lvl >= EVO_LEVELS[P.stage]) {
    const from = pName(); P.stage++;
    P.maxHp += 30; P.hp = P.maxHp; P.dmgMul *= 1.15; P.r += 2; if (P.stage === 2 && !P.spiky) P.r *= 1.1; P.evoFlash = 1.2;
    sfx("evo"); banner(from === pName() ? `${from} devient encore plus fort !` : `Quoi ? ${from} évolue en ${pName()} !`);
  }
}
function banner(txt) { S.msgs = [{ txt, life:3 }]; }

