/* ---------- Événements : Célébi, Ronflex, Jessie et James ---------- */
function startEvent(kind) {
  const P = S.P, mx = P.mvx || 1, my = P.mvy || 0;
  if (kind === "celebi") {
    const a = Math.random() * Math.PI * 2;
    S.celebi = { x:P.x + Math.cos(a) * 280, y:P.y + Math.sin(a) * 280, life:25, ph:Math.random() * 6 };
    banner("Un chant mystérieux résonne… Célébi est apparu ! Attrape-le avant qu'il disparaisse !"); sfx("ach");
  } else if (kind === "ronflex") {
    const f = spawnFoe("ronflex", P.x + mx * 360, P.y + my * 360); f.sleepT = 1e9;
    banner("Un Ronflex endormi bloque le passage ! Frappe-le pour le réveiller."); sfx("boss");
  } else if (kind === "rocket") {
    const base = Math.random() * Math.PI * 2;
    ["jarbok", "jsmogogo", "jmiaouss"].forEach((k, i) => { const a = base + i * 2.1; spawnFoe(k, P.x + Math.cos(a) * 380, P.y + Math.sin(a) * 380); });
    S.seq = [[S.t, "« Nous sommes de retour ! »"], [S.t + 1.6, "« Pour vous jouer un mauvais tour ! »"], [S.t + 3.2, "« Jessie ! » « James ! »"],
             [S.t + 4.8, "« La Team Rocket, plus rapide que la lumière ! »"], [S.t + 6.4, "« Rendez-vous tous, ou ce sera la guerre ! »"], [S.t + 8, "« Miaouss, oui la guerre ! »"]];
    sfx("boss");
  } else if (kind === "draco") {
    // il jaillit d'un étang proche et retombe sur la rive, côté joueur
    const ci = Math.floor(P.x / CH), cj = Math.floor(P.y / CH), ponds = [];
    for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (const pd of getChunk(ci + a, cj + b).ponds) { const d = Math.hypot(pd.x - P.x, pd.y - P.y); if (d > 260 && d < 900) ponds.push(pd); }
    const pd = ponds[Math.floor(Math.random() * ponds.length)], a0 = Math.random() * Math.PI * 2;
    const sx = pd ? pd.x : P.x + Math.cos(a0) * 420, sy = pd ? pd.y : P.y + Math.sin(a0) * 420, dd = Math.hypot(P.x - sx, P.y - sy) || 1, out = pd ? Math.max(pd.rx, pd.ry) + 45 : 0;
    S.dracoJump = { sx, sy, tx:sx + (P.x - sx) / dd * out, ty:sy + (P.y - sy) / dd * out, t:0 };
    banner("Plouf ! Un Minidraco jaillit d'un étang ! Rattrape-le avant qu'il s'échappe dans les herbes."); sfx("ach");
  } else if (kind === "journal") {
    S.journal = { n:0 }; journalNext();
    banner("Une page de journal traîne sur le sol… Il y en a d'autres dans le manoir : retrouve-les toutes !"); sfx("ach");
  } else if (kind === "orme") { // Tour Chétiflor : l'assistant du Prof. Orme et son Œuf, encerclés
    let x = P.x + 360, y = P.y;
    for (let k = 0; k < 40; k++) { const a = Math.random() * Math.PI * 2, dd = 320 + Math.random() * 120; x = P.x + Math.cos(a) * dd; y = P.y + Math.sin(a) * dd;
      if (!solidsNear(x, y).some(o => Math.hypot(o.x - x, o.y - y) < o.r + 40)) break; }
    S.orme = { x, y, hp:ORME_HP, t:90, on:1, hit:0, ph:Math.random() * 6 };
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, d = 380 + (i % 3) * 110; ormeFoe(i % 2 ? "hoothoot" : "rattata", x + Math.cos(a) * d, y + Math.sin(a) * d); }
    banner("« À l'aide ! » L'assistant du Prof. Orme transporte un Œuf, mais des Rattata et des Hoothoot l'encerclent. Protège-le pendant 1 min 30 !"); sfx("boss");
  } else if (kind === "mere") {
    const f = spawnFoe("mereossa", P.x + mx * 420, P.y + my * 420); S.mother = { t:300, f };
    banner(scopeOn() ? "« Partez… partez… » Le Scope Sylphe révèle le Spectre : c'est la Mère Ossatueur ! Apaise son esprit en le combattant."
                      : "« Partez… partez… » Un Spectre surgit ! Sans Scope Sylphe, impossible de le toucher : survis 5 minutes."); sfx("boss");
  }
}
// Tour Chétiflor : protéger l'assistant du Prof. Orme 1 min 30 ; trop de coups et l'Œuf se brise
const ormeFoe = (kind, x, y) => { const f = spawnFoe(kind, x, y); f.orme = true; f.hp = f.maxHp = Math.min(f.maxHp, f.d.hp * 1.6); return f; }; // renforts moins coriaces que le reste de la tour
const ORME_HP = 100, ORME_CRY = ["« À l'aide ! »", "« Pas l'Œuf ! »", "« Ouille ! »", "« Vite, par ici ! »"];
function updateOrme(dt) {
  const o = S.orme; o.hit = Math.max(0, o.hit - dt);
  if (!o.on) { if (o.leave > 0) { o.leave -= dt; o.x += o.lx * 150 * dt; o.y += o.ly * 150 * dt; } return; }
  o.t -= dt;
  if ((o.spT = (o.spT ?? 1.2) - dt) <= 0) { // renforts : des Rattata et des Hoothoot de plus en plus nombreux
    o.spT = Math.max(1, 1.8 - (90 - o.t) / 110) / (1 + .5 * (S.players.length - 1));
    const a = Math.random() * Math.PI * 2, kind = o.t < 45 && Math.random() < .3 ? (Math.random() < .5 ? "rattatac" : "noarfang") : Math.random() < .5 ? "rattata" : "hoothoot";
    ormeFoe(kind, o.x + Math.cos(a) * 520, o.y + Math.sin(a) * 520);
  }
  for (const f of S.foes) {
    if (!f.orme || f.hp <= 0 || f.under || f.sleepT > 0 || f.charmT > S.t || f.ormeT > S.t || (f.x - o.x) ** 2 + (f.y - o.y) ** 2 > (f.r + 16) ** 2) continue;
    const v = 3; f.ormeT = S.t + 1.5; o.hp -= v; o.hit = .3;
    S.texts.push({ x:o.x + (Math.random() - .5) * 20, y:o.y - 46, txt:"-" + v, col:"#ff8a7a", life:.7 });
    if (Math.random() < .3) S.texts.push({ x:o.x, y:o.y - 62, txt:ORME_CRY[Math.random() * ORME_CRY.length | 0], col:"#ffe0a0", life:1, label:true });
  }
  if (o.hp > 0 && o.t > 0) return;
  const away = Math.random() * Math.PI * 2; o.on = 0; o.leave = 3; o.lx = Math.cos(away); o.ly = Math.sin(away);
  for (const f of S.foes) f.orme = false;
  if (o.hp <= 0) { o.hp = 0; o.fail = 1; banner("Oh non ! L'assistant a pris trop de coups : l'Œuf s'est brisé… Il repart en courant prévenir le Prof. Orme."); sfx("lose"); }
  else {
    o.ok = 1; sfx("evo"); S.fxs.push({ x:o.x, y:o.y, r:0, max:120, life:.5, col:"rgba(255,240,180," }); emit(o.x, o.y, 24, "fee", { sp:200, life:.6, r:3 });
    banner("« Merci ! » L'assistant te confie l'Œuf du Prof. Orme. Termine la Tour Chétiflor : il pourrait bien éclore !");
  }
}
const ORME_IMG = new Image(); // assistant du labo (sprite fourni par Raphaël) : face immobile, face qui marche ×2, profil gauche ×3, cases de 36×52
ORME_IMG.src = "data:image/png;base64,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";
function drawOrme(t) { // l'assistant du Prof. Orme, l'Œuf dans les mains
  const o = S.orme; if (!o || (!o.on && !(o.leave > 0))) return;
  const a = o.on ? 1 : Math.min(1, o.leave), x = o.x + (o.hit > 0 ? Math.sin(t * 60) * 2 : 0), y = o.y, k = 1.15, w = 36 * k, h = 52 * k;
  const step = Math.floor(t * 8) % 2, fr = o.on ? (o.hit > 0 ? 1 + step : 0) : 4 + step, flip = !o.on && o.lx > 0;
  cx.save(); cx.globalAlpha = a;
  if (o.on) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(x, y - 6, 44, o.hit > 0 ? "255,90,80" : "255,236,160", .35); cx.restore(); }
  ell(cx, x, y + 22, 14, 4.5, "rgba(0,0,0,.32)");
  if (ORME_IMG.complete) { cx.imageSmoothingEnabled = false; cx.save(); cx.translate(x, y + 26 - h); if (flip) cx.scale(-1, 1); cx.drawImage(ORME_IMG, fr * 36, 0, 36, 52, -w / 2, 0, w, h); cx.restore(); }
  if (o.on || o.ok) { // l'Œuf, tenu devant lui
    const ex = x + (o.on ? 0 : (o.lx > 0 ? 8 : -8)), ey = y + 11;
    ell(cx, ex, ey, 4, 5, "#fff6de"); cx.strokeStyle = "#5a4a3a"; cx.lineWidth = 1; cx.beginPath(); cx.ellipse(ex, ey, 4, 5, 0, 0, Math.PI * 2); cx.stroke();
    poly(cx, [ex - 3, ey - 2, ex, ey - 4, ex - 1, ey], "#e8564e"); poly(cx, [ex + 1, ey + 1, ex + 3, ey, ex + 2, ey + 3], "#5a8ee8");
  }
  if (o.on) { // jauge de l'Œuf et temps restant
    const bw = 54, kk = Math.max(0, o.hp / ORME_HP), by = y - 46;
    cx.fillStyle = "rgba(0,0,0,.6)"; cx.fillRect(x - bw / 2 - 2, by - 2, bw + 4, 9);
    cx.fillStyle = kk > .5 ? "#7fe08a" : kk > .25 ? "#f6c845" : "#e2513f"; cx.fillRect(x - bw / 2, by, bw * kk, 5);
    cx.font = "700 13px 'Pixelify Sans', monospace"; cx.textAlign = "center"; cx.lineWidth = 3; cx.strokeStyle = "rgba(0,0,0,.75)";
    const txt = "Œuf · " + fmt(Math.max(0, o.t)); cx.strokeText(txt, x, by - 6); cx.fillStyle = "#fff3c8"; cx.fillText(txt, x, by - 6);
  }
  cx.restore();
}
function eggHatch(fresh) { // écran de victoire : l'Œuf éclot, Togepi rejoint l'équipe
  $("endStats").insertAdjacentHTML("afterbegin", `<div class="hof hatch"><canvas id="hatchCv" width="160" height="160"></canvas><div><b class="hofT" id="hatchT">Oh ? L'Œuf bouge !</b><small id="hatchSub">…</small></div></div>`);
  const cv = $("hatchCv"), g = cv.getContext("2d"), t0 = performance.now(), egg = SPR.egg;
  const step = now => {
    if (!cv.isConnected) return;
    const t = (now - t0) / 1000; g.clearRect(0, 0, 160, 160);
    g.fillStyle = "rgba(246,200,69,.14)"; g.beginPath(); g.arc(80, 80, 74, 0, Math.PI * 2); g.fill();
    if (t < 2.4) { // il remue de plus en plus fort
      const w = Math.sin(t * (8 + t * 8)) * .32 * Math.min(1, t * .8);
      g.save(); g.translate(80, 112); g.rotate(w); if (egg && egg.img.complete) drawSprite(g, egg, 0, -36, 34, 0, 0, false); g.restore();
    } else {
      if (!step.done) { step.done = true; $("hatchT").textContent = "Togepi a rejoint ton équipe !";
        $("hatchSub").textContent = fresh ? "Choisis-le parmi les starters de Johto. Sérénité : ses effets secondaires se produisent deux fois plus souvent." : "Un autre Togepi est né ! Il est déjà dans ton équipe."; }
      drawMon(g, "togepi", 80, 80, 26, false, t, 0, 0, true);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + t, rr = 46 + Math.sin(t * 3 + k) * 6; g.fillStyle = k % 2 ? "#ff9ac8" : "#fff3a0"; g.beginPath(); g.arc(80 + Math.cos(a) * rr, 80 + Math.sin(a) * rr, 2.5, 0, Math.PI * 2); g.fill(); }
      const fl = 1 - (t - 2.4) / .5; if (fl > 0) { g.fillStyle = `rgba(255,255,255,${fl})`; g.beginPath(); g.arc(80, 80, 80, 0, Math.PI * 2); g.fill(); }
    }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
// Spectre de la Mère Ossatueur : poursuit le joueur 5 min, lance des Ball'Ombre, puis s'apaise
function mewChoc(f, n) {
  const P = S.P, a0 = Math.atan2(P.y - f.y, P.x - f.x), m = f.d.cave ? 1.6 : 1;
  for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .5; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 170, vy:Math.sin(a) * 170, dmg:16 * m, life:4.5, type:"psy", r:11, home:2.4, mew:true }); }
}
function mewRing(f, n, off) {
  const m = f.d.cave ? 1.6 : 1;
  for (let i = 0; i < n; i++) { const a = (i + off) / n * Math.PI * 2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 175, vy:Math.sin(a) * 175, dmg:14 * m, life:4, type:"psy", r:10, mew:true }); }
}
function updateMother(dt) {
  const m = S.mother, f = m.f;
  if (!S.foes.includes(f)) { S.mother = null; return; }
  m.t -= dt;
  if (m.t <= 0) { f.calm = true; f.hp = 0; return; }
  f.wailT = (f.wailT ?? 3) - dt;
  if (f.wailT <= 0) {
    f.wailT = 3.2; const n = 10, off = Math.random();
    for (let i = 0; i < n; i++) { const a = (i + off) / n * Math.PI * 2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 160, vy:Math.sin(a) * 160, dmg:10, life:4, type:"spectre", r:10 }); }
    S.texts.push({ x:f.x, y:f.y - f.r - 26, txt:"« Partez… »", col:"#cfc4ff", life:1.2, label:true });
  }
}
// Parc Safari : Noeunoeuf et Scarabrute traversent le parc en fuyant, la Dent d'Or du gardien
function updateSafari(dt) {
  const P = S.P;
  S.rareT = (S.rareT ?? 35 + Math.random() * 20) - dt;
  if (S.rareT <= 0 && !S.foes.some(f => f.d.rare)) {
    S.rareT = 50 + Math.random() * 30;
    const kind = Math.random() < .5 ? "noeunoeuf" : "scarabrute", a = Math.random() * Math.PI * 2;
    const f = spawnFoe(kind, P.x + Math.cos(a) * 330, P.y + Math.sin(a) * 330); f.life = 15;
    banner(`Un ${FOES[kind].name} sauvage traverse le parc ! Touche-le avant qu'il s'enfuie !`); sfx("ach");
  }
  const dj = S.dracoJump;
  if (dj) {
    dj.t += dt;
    if (dj.t >= .9) { // il touche terre : il ne retournera plus dans l'eau
      S.dracoJump = null; const f = spawnFoe("minidraco", dj.tx, dj.ty); f.life = 25;
      banner("Minidraco est très rapide : il te faudra de la vitesse ou une ruée (Cascade, Vive-Attaque) pour le toucher !");
      emit(dj.tx, dj.ty, 14, "eau", { sp:150, life:.5, r:3 });
    }
  }
}

function updateRare(f, dt) {
  const P = S.P, dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1;
  f.life -= dt; f.hurt -= dt;
  if (d < f.r + P.r + (P.dashT > 0 ? 18 : 0)) { f.caught = true; f.hp = 0; return; } // une ruée (Cascade, Vive-Attaque) attrape plus large
  if (f.kind === "minidraco") { // très rapide : il faut un build vitesse (Mouchoir Choix) ou une ruée pour le rattraper
    f.sprint = (f.sprint ?? 3) - dt; if (f.sprint < -1) f.sprint = 3; // 3 s de sprint, 1 s de souffle
    if (f.sprint < 0 && Math.random() < dt * 6) S.texts.push({ x:f.x, y:f.y - 26, txt:"…", col:"#b9a4ff", life:.4, label:true });
  }
  if (f.life <= 0) { f.gone = true; f.hp = 0; banner(`${f.d.name} s'est enfui dans les hautes herbes…`); return; }
  // il fuit quand on s'approche, sinon il traverse le parc en zigzag
  const near = d < (f.kind === "minidraco" ? 210 : 240), w = Math.sin(S.t * 2 + f.ph) * .7;
  let ax = near ? dx / d : Math.cos(f.ph + S.t * .3 + w), ay = near ? dy / d : Math.sin(f.ph + S.t * .3 + w);
  if (!near && d > 420) { ax = -dx / d; ay = -dy / d; } // reste à portée
  const sp = f.kind === "minidraco" ? (near ? (f.sprint > 0 ? 215 : 115) : 100) : near ? 125 : 90;
  f.x += ax * sp * dt; f.y += ay * sp * dt; f.flip = ax < 0; f.dir = dirOf(ax, ay);
  collide(f, f.r, false);
  if (Math.random() < dt * 8) emit(f.x, f.y - f.r, 1, "electrik", { sp:30, life:.7, up:20, r:2 });
}
function rareCaught(f) {
  const P = S.P; sfx("evo");
  if (f.kind === "minidraco") {
    P.dmgMul *= 1.1; banner("Tu as attrapé Minidraco ! Il te confie une Écaille Draco : dégâts +10 % !"); teamAch("draco", P);
    S.gems.push({ x:f.x, y:f.y, pick:"chest" });
    for (let i = 0; i < 10; i++) S.gems.push({ x:f.x + (Math.random() - .5) * 110, y:f.y + (Math.random() - .5) * 80, v:4 });
  } else if (f.kind === "noeunoeuf") {
    banner("Tu as attrapé Noeunoeuf ! Ses six œufs éclatent en Bonbons Exp. !");
    for (let i = 0; i < 14; i++) S.gems.push({ x:f.x + (Math.random() - .5) * 110, y:f.y + (Math.random() - .5) * 80, v:5 });
    if (!S.nuz) { P.hp = Math.min(P.maxHp, P.hp + P.maxHp * .5); S.texts.push({ x:P.x, y:P.y - 30, txt:"+50 % PV", col:"#7fe08a", life:1.2, label:true }); }
  } else {
    banner("Tu as attrapé Scarabrute ! Il te laisse une Poké Ball…");
    S.gems.push({ x:f.x, y:f.y, pick:"chest" });
  }
  emit(f.x, f.y, 26, "electrik", { sp:220, life:.7, r:3 });
  S.fxs.push({ x:f.x, y:f.y, r:0, max:160, life:.45, col:"rgba(255,240,150," });
}
// Manoir : grilles de feu (on/off par les statues), pages du journal, réveil de Mewtwo
const JOURNAL = ["Page 1 : « 5 juillet. Guyane, Amérique du Sud. Nous avons découvert un nouveau Pokémon au cœur de la jungle. »",
  "Page 2 : « 10 juillet. Nous l'avons baptisé Mew. Sa puissance dépasse tout ce que nous connaissons. »",
  "Page 3 : « 6 février. Mew a donné naissance. Nous avons appelé le petit Mewtwo. »",
  "Page 4 : « 1er septembre. Mewtwo est bien trop puissant. Nous ne parvenons plus à le contrôler… »"];
function journalNext() {
  const P = S.P, j = S.journal; let x = P.x + 500, y = P.y;
  for (let k = 0; k < 40; k++) { const a = Math.random() * Math.PI * 2, dd = 480 + Math.random() * 380; x = P.x + Math.cos(a) * dd; y = P.y + Math.sin(a) * dd;
    if (!solidsNear(x, y).some(o => Math.hypot(o.x - x, o.y - y) < o.r + 30)) break; }
  j.x = x; j.y = y; j.ph = Math.random() * 6;
}
function segDist(px, py, f) { const ux = Math.cos(f.a), uy = Math.sin(f.a), k = Math.max(-f.len / 2, Math.min(f.len / 2, (px - f.x) * ux + (py - f.y) * uy)); return Math.hypot(px - f.x - ux * k, py - f.y - uy * k); }
function updateManor(dt) {
  const P = S.P;
  S.statueCd = (S.statueCd || 0) - dt;
  let inFire = false, onStatue = false;
  around(P.x, P.y, c => {
    if (!S.fireOff) for (const f of c.fires || []) if (segDist(P.x, P.y, f) < 14 + P.r * .5) inFire = true;
    for (const q of c.statues || []) if (Math.hypot(P.x - q.x, P.y - q.y) < 15 + P.r + 8) onStatue = true;
  }, 1);
  if (onStatue && S.statueCd <= 0) {
    S.statueCd = 2; S.fireOff = !S.fireOff; sfx("chest"); S.shake = .12;
    banner(S.fireOff ? "Clic ! La statue s'enfonce… les portes de feu s'éteignent." : "Clic ! La statue s'enfonce… les portes de feu se rallument !");
  }
  S.fireT = (S.fireT || 0) - dt;
  if (inFire && S.fireT <= 0 && P.inv <= 0) { S.fireT = .45; emit(P.x, P.y, 6, "feu", { sp:90, life:.4, up:40 }); if (hurtP(9 * eff("feu", [ptype()]) * (1 + S.t / 900))) return; }
  const j = S.journal;
  if (j && Math.hypot(j.x - P.x, j.y - P.y) < P.r + 20) {
    banner(JOURNAL[j.n]); sfx("xp"); j.n++;
    emit(j.x, j.y, 12, "normal", { sp:120, life:.5, r:2.5 });
    if (j.n < 4) journalNext();
    else { S.journal = null; S.mewAt = S.t + 5; S.seq = [[S.t + 2.5, "Le manoir tremble… Une pression psychique terrible envahit les couloirs !"]]; S.shake = .4; }
  }
  if (S.mewAt && S.t >= S.mewAt) {
    S.mewAt = 0; const a = Math.random() * Math.PI * 2, f = spawnFoe("mewtwo", P.x + Math.cos(a) * 320, P.y + Math.sin(a) * 320);
    f.hp = f.maxHp = Math.round((6000 + S.t * 8) * (1 + .6 * (S.players.length - 1))); f.atkT = 2; f.atkI = 0; sfx("boss"); S.shake = .5; S.mewtwo = f;
    for (const g of S.foes) if (g !== f && !g.d.boss && !g.prop && Math.hypot(g.x - f.x, g.y - f.y) < 650) { g.hp = 0; emit(g.x, g.y, 4, "psy", { sp:120, life:.4 }); } // onde psychique : il balaie les Pokémon autour
    banner("MEWTWO s'est libéré ! Le Pokémon génétique veut se venger des humains !");
    S.fxs.push({ x:f.x, y:f.y, r:0, max:400, life:.8, col:"rgba(220,140,255," }); emit(f.x, f.y, 40, "psy", { sp:300, life:.8, r:3.5 });
  }
}
function motherCalm(f) {
  const P = S.P; S.mother = null; sfx("evo");
  dexCount(f); // l'apaiser compte au Pokédex (catégorie Boss)
  banner(f.calm ? `Le Spectre s'apaise et s'évanouit… C'était la Mère Ossatueur. Elle te bénit avant de rejoindre son petit.`
                : "L'esprit de la Mère Ossatueur est apaisé. Elle te bénit avant de rejoindre son petit…");
  if (S.nuz) { for (let i = 0; i < 10; i++) S.gems.push({ x:f.x + (Math.random() - .5) * 90, y:f.y + (Math.random() - .5) * 70, v:4 }); } // Nuzlocke : pas de soin
  else { P.hp = P.maxHp; S.texts.push({ x:P.x, y:P.y - 30, txt:"PV restaurés !", col:"#7fe08a", life:1.4, label:true }); }
  if (!f.calm) for (let i = 0; i < 8; i++) S.gems.push({ x:f.x + (Math.random() - .5) * 80, y:f.y + (Math.random() - .5) * 60, v:4 });
  S.gems.push({ x:f.x, y:f.y, pick:"chest" });
  emit(f.x, f.y, 30, "spectre", { sp:200, life:1, up:40, r:3 });
  S.fxs.push({ x:f.x, y:f.y, r:0, max:320, life:.7, col:"rgba(200,190,255," });
}
function updateCelebi(dt) {
  const c = S.celebi, P = S.P, dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) || 1;
  c.life -= dt;
  if (d < P.r + 18) { // attrapé : Voyage Temporel
    S.celebi = null; sfx("evo"); banner("Célébi utilise Voyage Temporel ! Le temps s'arrête… et il te laisse un cadeau !");
    for (const f of S.foes) if (!f.d.boss && !f.prop) f.stunT = 5;
    S.gems.push({ x:P.x + 30, y:P.y, pick:"chest" }); emit(P.x, P.y, 30, "plante", { sp:260, life:.7, r:3.5 });
    S.fxs.push({ x:P.x, y:P.y, r:0, max:420, life:.6, col:"rgba(160,255,170," });
    return;
  }
  if (c.life <= 0) { S.celebi = null; banner("Célébi a disparu dans la forêt…"); return; }
  // il fuit quand on s'approche, sinon il tourne autour du joueur en restant visible
  const tx = d < 170 ? dx / d : -dy / d * .8 + dx / d * (d > 300 ? -.6 : .1), ty = d < 170 ? dy / d : dx / d * .8 + dy / d * (d > 300 ? -.6 : .1), sp = d < 170 ? 125 : 90;
  c.x += tx * sp * dt; c.y += ty * sp * dt;
  if (Math.random() < dt * 14) emit(c.x, c.y, 1, "plante", { sp:30, life:.8, up:20, r:2.2 });
}

