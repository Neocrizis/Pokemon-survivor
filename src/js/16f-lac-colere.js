/* ---------- Johto : Lac Colère (pluie, onde radio de la Team Rocket, Léviator rouge et ses deux escortes, Peter) ---------- */
const LK_WED = new Date().getDay() === 3; // le mercredi, comme dans HeartGold / SoulSilver : pas de pluie, et le lac baisse
function updateRage(dt) {
  if (!LEVEL.rage) return false;
  if (!S.lk) {
    S.lk = { waveAt:40, waves:[] }; if (!LK_WED) S.wx = "rain";
    banner(LK_WED ? "C'est mercredi : il ne pleut pas, et le niveau du Lac Colère a baissé." : "La pluie tombe sur le Lac Colère… Une étrange onde radio grésille au loin.");
  }
  const L = S.lk;
  if (S.t >= L.waveAt) { L.waveAt += 60; rocketWave(); }
  for (const f of S.foes) if (f.d.aqua && f.hp > 0 && !lakeAt(f.x, f.y) && !lakeMove(f, true)) { f.gone = true; f.hp = 0; } // replacé loin du lac : il y retourne, ou disparaît
  for (const w of L.waves) { w.r += 700 * dt; w.life -= dt; } L.waves = L.waves.filter(w => w.life > 0);
  if (updateTwisters(dt) || updateGyara(dt)) return true;
  const red = S.foes.find(f => f.d.red && f.hp > 0);
  if (red && !L.red) { L.red = S.t; redArrives(red); }
  if (L.red && !red && !L.redDone) { L.redDone = true; // le Léviator rouge est vaincu
    S.seq = [...(S.seq || []), [S.t + 1.8, "Il laisse aussi tomber une Écaillerouge… L'onde de la Team Rocket vient du sud, d'Acajou."]];
    if (S.peter) { S.peter.leave = 3; banner("Peter : « Bien joué ! Je file à Acajou : la Team Rocket se cache là-bas. »"); } }
  if (L.peterWant && L.red && !L.redDone && !S.peter && S.t > L.red + 5) startPeter();
  if (S.peter && updatePeter(dt)) S.peter = null;
  return false;
}
// ---- l'onde radio : toutes les minutes, les Magicarpe Obscurs proches évoluent de force ----
function rocketWave(x, y) {
  const P = nearP(S.cam.x, S.cam.y); x ??= P.x; y ??= P.y;
  S.lk.waves.push({ x, y, r:0, life:1.4 });
  let n = 0;
  for (const f of S.foes) if (f.kind === "magicarpeO" && f.hp > 0 && n < 3 && Math.hypot(f.x - x, f.y - y) < 650) { n++; evolveFoe(f, "leviatorO"); }
  if (!S.lk.said) { S.lk.said = true; banner("Une onde radio de la Team Rocket balaie le lac ! Les Magicarpe Obscurs évoluent de force en Léviator…"); }
  sfx("evo");
}
// ---- boss ----
function redArrives(f) { // Léviator rouge géant : deux Léviator Obscurs l'escortent, et Intimidation baisse l'attaque de tout le monde
  for (const s of [-1, 1]) { const g = spawnFoe("bossLevEsc", f.x + s * 170, f.y + 40); g.appear = .4; }
  for (const q of S.players) { q.intimT = S.t + 15; S.texts.push({ x:q.x, y:q.y - q.r - 30, txt:"Attaque ↓", col:"#ff9a8a", life:1.4, label:true }); }
  S.seq = [...(S.seq || []), [S.t + 1.6, "Deux Léviator Obscurs l'escortent ! Son Intimidation fait baisser ton attaque pendant 15 secondes."]];
  S.shake = .5;
}
const GYARA_SEQ = { red:["ouragan", "draco", "grozyeux", "draco", "ouragan", "draco"], obs:["ouragan", "draco", "draco"], esc:["draco"] };
function gyaraAttack(f, P) {
  const seq = GYARA_SEQ[f.d.red ? "red" : f.d.escort ? "esc" : "obs"], atk = seq[f.atkI++ % seq.length], a0 = Math.atan2(P.y - f.y, P.x - f.x);
  const say = (id, txt) => { if (!(f.said ||= {})[id]) { f.said[id] = true; banner(txt); } };
  if (atk === "ouragan") { for (const s of [-.4, 0, .4]) (S.tcTw ||= []).push({ x:f.x, y:f.y, vx:Math.cos(a0 + s) * 170, vy:Math.sin(a0 + s) * 170, life:4 });
    say("o", `${f.d.name} utilise Ouragan ! Les tourbillons te repoussent.`); }
  else if (atk === "draco") { const n = f.d.escort ? 3 : 5; for (let i = 0; i < n; i++) { const a = a0 + (i - (n - 1) / 2) * .2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 250, vy:Math.sin(a) * 250, dmg:f.d.escort ? 9 : 12, life:2.4, type:"dragon", r:12 }); }
    say("d", `${f.d.name} utilise Draco-Rage !`); }
  else if (atk === "grozyeux") { for (const q of S.players) if (!q.down && Math.hypot(q.x - f.x, q.y - f.y) < 700) { q.leerT = S.t + 6; S.texts.push({ x:q.x, y:q.y - q.r - 30, txt:"Défense ↓", col:"#ff9a8a", life:1.4, label:true }); }
    f.hold = .6; say("g", `${f.d.name} utilise Groz'Yeux ! Tu encaisses plus de dégâts pendant quelques secondes.`); }
  f.atkT = (f.d.escort ? 4 : f.hp < f.maxHp * .4 ? 2.2 : 2.8) + Math.random() * .6;
}
function updateGyara(dt) {
  for (const f of S.foes) {
    if (!f.d.boss || f.hp <= 0 || f.sleepT > 0) continue;
    const P = S.P = nearP(f.x, f.y), dx = P.x - f.x, dy = P.y - f.y, l = Math.hypot(dx, dy) || 1;
    if (f.d.venom) { // Aéromite géant : Poudre Toxik, Rafale Psy, et des Mimitoss Obscurs
      if ((f.vnT = (f.vnT ?? 2.5) - dt) <= 0) { f.vnT = 4.5;
        for (let i = 0; i < 4; i++) { const a = Math.random() * Math.PI * 2, d = i ? 80 + Math.random() * 160 : 10; if (S.sludge.length < 120) S.sludge.push({ x:P.x + Math.cos(a) * d, y:P.y + Math.sin(a) * d, r:44, life:6, max:6, ph:Math.random() * 6 }); }
        if (!f.saidV) { f.saidV = true; banner(`${f.d.name} répand de la Poudre Toxik ! Évite les flaques violettes.`); } }
      if ((f.psT = (f.psT ?? 1.5) - dt) <= 0) { f.psT = 2.6; const a0 = Math.atan2(dy, dx); for (let i = -2; i <= 2; i++) S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a0 + i * .22) * 210, vy:Math.sin(a0 + i * .22) * 210, dmg:9, life:2.6, type:"psy", r:10 }); }
      if ((f.smT = (f.smT ?? 10) - dt) <= 0) { f.smT = 12; for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2, g = spawnFoe("mimitossO", f.x + Math.cos(a) * 90, f.y + Math.sin(a) * 90); g.appear = .3; } }
    }
    if (f.d.splash) { // Magicarpe géant : Trempette… qui écrase tout à l'atterrissage
      if (f.hop) { const h = f.hop; h.t += dt; const k = Math.min(1, h.t / h.max); f.x = h.sx + (h.tx - h.sx) * k; f.y = h.sy + (h.ty - h.sy) * k; f.jz = Math.sin(k * Math.PI) * 120; f.hold = .1;
        if (k >= 1) { f.hop = null; f.jz = 0; f.hopT = 1.4; S.shake = Math.max(S.shake, .3); sfx("break");
          S.fxs.push({ x:f.x, y:f.y, r:0, max:110, life:.4, col:"rgba(140,200,255," }); emit(f.x, f.y, 24, "eau", { sp:260, life:.5, r:3.4 });
          if (!f.saidS) { f.saidS = true; banner(`${f.d.name} utilise Trempette… et ça fait mal en retombant !`); }
          if (boomHit(f.x, f.y, 95, f.d.dmg * .9, "eau")) return true; } }
      else if ((f.hopT = (f.hopT ?? 1.5) - dt) <= 0) { const d = Math.min(l, 320); f.hop = { t:0, max:.9, sx:f.x, sy:f.y, tx:f.x + dx / l * d, ty:f.y + dy / l * d }; }
      if (f.hp < f.maxHp * .5) { // l'onde de la Team Rocket le fait évoluer en plein combat
        f.hop = null; f.jz = 0; rocketWave(f.x, f.y); evolveFoe(f, "bossLevO"); f.hp = f.maxHp; f.atkT = 2.5; f.atkI = 0; S.shake = .6;
        banner("L'onde de la Team Rocket frappe Magicarpe Obscur géant… Il évolue de force en Léviator Obscur géant !"); continue; }
    }
    if (f.d.gyara) { f.atkI ??= 0; if ((f.atkT = (f.atkT ?? 2.5) - dt) <= 0 && f.dashMode !== "go") gyaraAttack(f, P); }
  }
  return false;
}
// ---- Peter et son Dracolosse (une partie sur trois) ----
const PETER_IMG = new Image(); // Peter (sprite HGSS 32×32 envoyé par Raphaël)
PETER_IMG.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAACd0lEQVR42tVWLZfrIBC92bNiZeVIJBKJXInsT0AiIyMrIysjI1cikU9GRkZGIvsPWJHAJtu+lmyz552HKWWGuXc+mAzwPy5DFAxR2MPWy08vllrjDomwG4Ho7S0wLWUisZCH7njMJvGa6+1lGICuS0Yvw4AD50DXwRCFUmugbYMi2j8Fg3M4cI5Sa0QAP464DAO0lIkQABBj+xJovC+c9wmAKwUtJZz3q1QAWJHLLdbXXKbRKAAcOIe+oRO9d97DEEFLCWntUxFIHiw9jtG4t7SUK9I/ToGWMoU4x+AyJTPp4p5ukWEvPqsVge/FFmXEWNof+/4hxsujHtA3Jfw4JqPMvEO1Nd4US+dvikG1NZh5X5HsmxJPFWHjPcwcyljhXKr0G/dxcakwNn++CnG2sUsrjkXodPV3nVnmHoBuIVAIc05/mHmfQntqrhTjWdQBgPlu8WwEilUYGwtpLYbOfXXKzk3vvbGr9OUUeW4KEgklCFaIVf65VLBCQAnaBJ6tFFelRDjV9V2dU1Whdn223U0E4ie2b0pwqVIa4n5RL1vtZoMH4jLEfaVEqJQIt2S/QoC4TCBM6AQW90v53iNZIC7hhw4AYLsRIA5DBEMEEJ/OAPihA3GZPREVW3LPVI3RVWCqRqnlSuHcdkk2uirbfrEFfHYRY9+CqRqqn4rOiXICFxogDgDZJLJbsT36BG6FuJYLgbFvAT9MujvVQDCLIdOawzSkQuDsP6CIoIhw9h8oIVY689f0YS0UuQRiJ2RC370w9u0S/GFXzK6BpcFIIoIt/38nvMdEtCIyP7H0JNOEdH1e/EYrvpmW3HDvRuDG/fCkzX+3PgFLjllaMrXChAAAAABJRU5ErkJggg==";
function startPeter() { // Peter arrive à pied à côté du joueur, lance la Poké Ball de Dracolosse, puis repart
  const P = nearP(S.cam.x, S.cam.y); S.lk.peterWant = false;
  S.peter = { x:0, y:0, atkT:1.5, ph:0, out:0, p:{ x:P.x - 520, y:P.y + 10, st:"walk", T:0 } };
}
function updatePeter(dt) {
  const D = S.peter, P = nearP(D.x || D.p.x, D.y || D.p.y), Q = D.p; D.ph += dt;
  if (Q && !Q.gone) { Q.T += dt;
    if (Q.st === "walk") { const tx = P.x - 90, ty = P.y + 10, d = Math.hypot(tx - Q.x, ty - Q.y), v = 260 * dt;
      if (d > v) { Q.x += (tx - Q.x) / d * v; Q.y += (ty - Q.y) / d * v; }
      else { Q.st = "throw"; Q.T = 0; Q.bx = Q.x + 10; Q.by = Q.y - 40; Q.ex = Q.x + 70; Q.ey = Q.y - 70; banner("Peter arrive avec son Dracolosse : « Ce Léviator rouge… c'est un coup de la Team Rocket ! Dracolosse, Ultralaser ! »"); } }
    else if (Q.st === "throw" && Q.T >= .7) { Q.st = "leave"; Q.T = 0; D.x = Q.ex; D.y = Q.ey; D.out = .01; sfx("boss");
      S.fxs.push({ x:D.x, y:D.y, r:0, max:110, life:.4, col:"rgba(255,255,255," }); emit(D.x, D.y, 18, "dragon", { sp:220, life:.5, r:3 }); }
    else if (Q.st === "leave") { Q.x -= 260 * dt; Q.y += 40 * dt; if (Q.T > 2.6) Q.gone = true; }
  }
  if (!D.out) return false;
  D.out = Math.min(1, D.out + dt * 2.5);
  if (D.leave !== undefined) { D.leave -= dt; D.y -= 380 * dt; D.x += 120 * dt; return D.leave <= 0; }
  const tx = P.x - 110, ty = P.y - 120; D.x += (tx - D.x) * Math.min(1, dt * 1.6); D.y += (ty - D.y) * Math.min(1, dt * 1.6);
  if (D.beam && (D.beam.life -= dt) <= 0) D.beam = null;
  if ((D.atkT -= dt) > 0) return false;
  const near = (list, R) => list.reduce((b, f) => { const d = Math.hypot(f.x - D.x, f.y - D.y); return d < R && (!b || d < b[1]) ? [f, d] : b; }, null);
  const t = near(S.foes.filter(f => f.d.gyara && f.hp > 0), 900) || near(S.foes.filter(f => !f.prop && !f.d.rare && f.hp > 0), 500);
  if (!t) { D.atkT = .4; return false; }
  const f = t[0]; D.atkT = 3; D.beam = { tg:f, x:f.x, y:f.y, life:.45 }; D.flip = f.x < D.x;
  const S0 = S.P; S.P = P; hitFoe(f, f.d.boss ? 80 : 40, "dragon"); S.P = S0;
  emit(f.x, f.y, 14, "feu", { sp:200, life:.4, r:3 }); S.shake = Math.max(S.shake, .12);
  return false;
}
// ---- dessin ----
function drawRageUnder(t) {
  if (!LEVEL.rage || !S.lk) return;
  for (const w of S.lk.waves) { // l'onde radio : des cercles rouge et violet qui grésillent
    const a = Math.min(1, w.life);
    for (let i = 0; i < 3; i++) { const r = w.r - i * 60; if (r <= 0) continue;
      cx.strokeStyle = `rgba(${i & 1 ? "180,60,220" : "235,60,80"},${.55 * a})`; cx.lineWidth = 4 - i; cx.setLineDash([18, 10]); cx.lineDashOffset = -t * 60;
      cx.beginPath(); cx.ellipse(w.x, w.y, r, r * .62, 0, 0, Math.PI * 2); cx.stroke(); }
    cx.setLineDash([]);
  }
}
function drawRageOver(t) {
  if (!LEVEL.rage || !S.lk) return;
  drawTwisters();
  const D = S.peter; if (!D) return;
  if (D.beam) { const b = D.beam, k = b.life / .45, x2 = b.tg.hp > 0 ? b.tg.x : b.x, y2 = b.tg.hp > 0 ? b.tg.y : b.y; // Ultralaser
    cx.save(); cx.globalCompositeOperation = "lighter"; cx.lineCap = "round";
    for (const [w, c] of [[22, `rgba(255,170,60,${.35 * k})`], [10, `rgba(255,230,140,${.8 * k})`], [4, `rgba(255,255,240,${k})`]]) { cx.strokeStyle = c; cx.lineWidth = w; cx.beginPath(); cx.moveTo(D.x, D.y - 10); cx.lineTo(x2, y2); cx.stroke(); }
    glow(x2, y2, 70, "255,200,90", k); cx.restore(); }
  const Q = D.p;
  if (Q && !Q.gone) { // Peter à pied (il sautille en marchant) et sa Poké Ball
    const k = 2, hop = Q.st === "throw" ? 0 : Math.abs(Math.sin(D.ph * 9)) * 3, a = Q.st === "leave" ? Math.max(0, 1 - (Q.T - 2) / .6) : 1;
    cx.save(); cx.globalAlpha = a; ell(cx, Q.x, Q.y + 30, 14, 5, "rgba(0,0,0,.25)");
    if (PETER_IMG.complete && PETER_IMG.naturalWidth) { cx.imageSmoothingEnabled = false; cx.drawImage(PETER_IMG, Q.x - 16 * k, Q.y - 32 * k + 32 - hop, 32 * k, 32 * k); }
    cx.restore();
    if (Q.st === "throw") { const u = Math.min(1, Q.T / .7), bx = Q.bx + (Q.ex - Q.bx) * u, by = Q.by + (Q.ey - Q.by) * u - Math.sin(u * Math.PI) * 60;
      cx.save(); cx.imageSmoothingEnabled = false; cx.translate(bx, by); cx.rotate(u * 9); cx.drawImage(ballSprite(false), -24, -24, 48, 48); cx.restore(); }
  }
  if (!D.out) return;
  const y = D.y + Math.sin(D.ph * 3) * 6;
  ell(cx, D.x, D.y + 70, 26 * D.out, 8 * D.out, "rgba(0,0,0,.22)"); // il vole : son ombre plus bas
  if (D.out < 1) glow(D.x, y, 90 * (1 - D.out) + 20, "255,255,255", 1 - D.out); // il sort de sa Poké Ball
  drawMon(cx, "dracolosse", D.x, y, 32 * D.out, !!D.flip, t, 0, null, true);
}
