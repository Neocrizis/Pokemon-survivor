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
const ORME_IMG = [new Image(), new Image()]; // pixel art 16×21 façon assistants du labo d'Orme : avec l'Œuf, puis sans (Œuf brisé)
ORME_IMG[0].src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAVCAYAAABPPm7SAAABS0lEQVR42qWUMUvDUBDH/y8EBD+DhCJnEckQJENxdHTwA+ji4NBN6ezYRXCWIq52yAdwyNDBKUOQDB2CDVKKQ3XqEKST5/TCey8vWu0PQu7d5e7du7sXAQvkEdv0xawQps61OV6dbAEAwv0WACB9ngIA+kOwGUiozk2OJv3hWxVEmM6rIoM4WJO1A7hmWiryWE16rfqL+IbJI56XzPOS+TZKmDyy6uS3tQzS+y7CvR1tDcCqs7bRNDYRng/0NpqDJAO95gUAYHuXKsemiQR5xMtlqT1RsuCDi4yjZFGzyc2cv6bvtwNsfH1gkscgj9gxjSrHgau9/XaASR7j/ewSp4NNfZDk+UxG11TT9Tp3eOh+wlrE8UtWrbPxFIHfQlOWxawQ7n/GV+2C+1OxJGpWJsLWzs7hEQAgGT1ClX/9I1U7pk9WeWXkJTJlG98bbcaNh9HgTwAAAABJRU5ErkJggg==";
ORME_IMG[1].src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAVCAYAAABPPm7SAAABLUlEQVR42qVUsU7DMBB9rvwZyKrQgRDqEKEMiJGRgQ9gZmDjBxg7dkYMnTvkAxg6MDBliFCGDghZqKoYOmbI0O2YHNnOGQJ9UpTLnd/5+e4cBQFkiCW/3VgV+7REfLg5AADkZ2MAQPW2BgBMF+A4kfLJKWKM6eKrS6Ji8lC4JCPsib0T6FiWD3eslD+ofrOcMRnibcu8bZkfi5LJkOhza3sKqvkd8tOj4BuA6BPbGAdTyG+fwjbGg+QSfb5bAMDhCXXE1ESCDPFu1wZPUTZ8cV9zUTa9WFCDv8ifHGedAjLEozjo4zrTwduRm+WMgyL6t2/1UQ/a3fF6RfQT1Ks1sskYKZV2Y5X+z/j6KvRPcoccS0ntPL+8AgCUL8/w7V//SN2O1atoD4a7RLEt4RsFasf9DQb88gAAAABJRU5ErkJggg==";
function drawOrme(t) { // l'assistant du Prof. Orme : blouse blanche, l'Œuf dans la main
  const o = S.orme; if (!o || (!o.on && !(o.leave > 0))) return;
  const a = o.on ? 1 : Math.min(1, o.leave), run = !o.on || o.hit > 0, x = o.x + (o.hit > 0 ? Math.sin(t * 60) * 2 : 0), y = o.y, hop = run ? Math.abs(Math.sin(t * 14)) * 3 : 0;
  const img = ORME_IMG[o.fail ? 1 : 0], k = 2.6, w = 16 * k, h = 21 * k, flip = !o.on && o.lx < 0;
  cx.save(); cx.globalAlpha = a;
  if (o.on) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(x, y - 6, 44, o.hit > 0 ? "255,90,80" : "255,236,160", .35); cx.restore(); }
  ell(cx, x, y + 22, 14, 4.5, "rgba(0,0,0,.32)");
  if (img.complete) { cx.imageSmoothingEnabled = false; cx.save(); cx.translate(x, y + 24 - h - hop); if (flip) cx.scale(-1, 1); cx.drawImage(img, -w / 2, 0, w, h); cx.restore(); }
  if (o.on) { // jauge de l'Œuf et temps restant
    const bw = 54, kk = Math.max(0, o.hp / ORME_HP), by = y - 52;
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

