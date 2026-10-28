/* ---------- Johto : Tour Cendrée (Pokémon Obscurs, Krabby des rochers, météo des trois chiens légendaires, rival) ---------- */
// Entei appelle le soleil (Zénith), Suicune la pluie (Danse Pluie), Raikou l'orage : la météo dure jusqu'au chien suivant, et s'arrête quand les trois sont vaincus
const WX = { sun:{ name:"Zénith", icon:"☀", up:"feu", down:"eau" }, rain:{ name:"Pluie", icon:"🌧", up:"eau", down:"feu" }, storm:{ name:"Orage", icon:"⛈", up:"eau", down:"feu" } };
const BEASTS = { entei:{ boss:"bossEntei", name:"Entei", col:"255,140,60", type:"feu" }, suicune:{ boss:"bossSuicune", name:"Suicune", col:"120,210,255", type:"eau" }, raikou:{ boss:"bossRaikou", name:"Raikou", col:"255,230,90", type:"electrik" } };
function wxMul(type) { // bonus ou malus de la météo sur une attaque de ce type (pour tout le monde : joueurs et Pokémon sauvages)
  const w = S && (LEVEL.burned || LEVEL.rage) && WX[S.wx]; return !w ? 1 : type === w.up ? 1.5 : type === w.down ? .5 : 1; // Tour Cendrée, et la pluie du Lac Colère
}
function setWx(k, f) {
  S.wx = k; S.wxT = 0;
  if (k === "sun") banner(`${f.d.name} utilise Zénith ! Le soleil tape fort : attaques Feu +50 %, attaques Eau −50 %. Les braises se propagent !`);
  if (k === "rain") { banner(`${f.d.name} utilise Danse Pluie ! Il pleut : attaques Eau +50 %, attaques Feu −50 %. Les braises s'éteignent.`); douse(); }
  if (k === "storm") banner(`${f.d.name} fait gronder l'orage ! La pluie redouble, et la foudre tombe sur la tour…`);
  sfx("boss"); S.flash = k === "storm" ? .5 : .25;
}
function douse() { // la pluie éteint toutes les braises (pour le reste de la partie)
  if (S.doused) return; S.doused = true;
  for (const e of S.tcEmb || []) for (let i = 0; i < 3; i++) (S.tcSteam ||= []).push({ x:e.x + (Math.random() - .5) * e.r, y:e.y + (Math.random() - .5) * e.r * .6, life:1.4 + Math.random(), ph:Math.random() * 6 });
  S.tcEmb = [];
}
// ---- braises : celles du plancher (décor), et celles que le soleil d'Entei propage ----
const emberK = () => S.doused ? 0 : S.wx === "sun" ? 1.5 : 1;
function embersNear(x, y, fn) {
  around(x, y, c => { for (const e of c.embers || []) fn(e, e.r * emberK()); });
  for (const e of S.tcEmb || []) fn(e, e.r * Math.min(1, e.life / 2));
}
function updateEmbers(dt) {
  if (S.wx === "sun" && !S.doused && (S.tcEmbT = (S.tcEmbT ?? 1) - dt) <= 0) { // Zénith : les braises gagnent du terrain
    S.tcEmbT = .9; const up = S.players.filter(q => !q.down), q = up[Math.random() * up.length | 0];
    if (q && (S.tcEmb ||= []).length < 40) { const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 380, x = q.x + Math.cos(a) * d, y = q.y + Math.sin(a) * d;
      if (!blockedAt(x, y, 20, false)) S.tcEmb.push({ x, y, r:26 + Math.random() * 18, life:18 + Math.random() * 8, ph:Math.random() * 6 }); }
  }
  for (const e of S.tcEmb || []) e.life -= dt; if (S.tcEmb) S.tcEmb = S.tcEmb.filter(e => e.life > 0);
  for (const s of S.tcSteam || []) s.life -= dt; if (S.tcSteam) S.tcSteam = S.tcSteam.filter(s => s.life > 0);
  if (S.doused) return;
  for (const q of S.players) { // marcher dans les braises brûle (sauf les Pokémon qui volent, et les Pokémon Feu)
    if (q.down || q.choosing || flyP(q)) continue;
    let hot = false; embersNear(q.x, q.y, (e, r) => { if (!hot && r > 0 && ((q.x - e.x) / r) ** 2 + ((q.y - e.y) / (r * .62)) ** 2 < 1) hot = true; });
    if (hot) { const S0 = S.P; S.P = q; burnP(q, 1.2); S.P = S0; }
  }
}
// ---- rochers (Éclate-Roc) : Krabby 90 %, Caratroc 10 % ----
function burnedRock(f) {
  if (Math.random() > .55) return;
  const kind = Math.random() < .1 ? "caratroc" : "krabby", g = spawnFoe(kind, f.x, f.y); g.appear = .3;
  emit(f.x, f.y, 8, "roche", { sp:120, life:.35 });
  if (!S.saidRock?.[kind]) { (S.saidRock ||= {})[kind] = true; banner(kind === "krabby" ? "Un Krabby se cachait sous le rocher !" : "Un Caratroc était caché sous le rocher ! Il est dur comme la pierre…"); }
}
function burnedKo(f) {
  if (!f.d.juice) return; // Caratroc laisse son jus de Baie
  if (S.nuz) S.gems.push({ x:f.x, y:f.y + 6, v:3 }); else S.gems.push({ x:f.x, y:f.y + 6, pick:"sitrus" });
  S.texts.push({ x:f.x, y:f.y - 30, txt:"Jus de Baie !", col:"#ffe08a", life:1.2, label:true });
}
function burnedSpawn(f, placed) { // jamais au fond d'un trou du plancher (sauf ceux qui volent)
  if (placed || f.d.types.includes("vol") || f.d.ghost) return;
  for (let k = 0; k < 10 && blockedAt(f.x, f.y, f.r, false); k++) { const a = Math.random() * Math.PI * 2; f.x += Math.cos(a) * 90; f.y += Math.sin(a) * 90; }
}
// ---- coups annoncés au sol : Éruption (Entei), foudre de l'orage et Fatal-Foudre (Raikou) ----
function strike(x, y, o) { (S.tcStr ||= []).push({ x, y, r:46, t:1, max:1, dmg:14, type:"feu", ...o }); }
function updateStrikes(dt) {
  for (const s of S.tcStr || []) {
    if (s.follow) { const q = s.follow; if (q.down || !S.players.includes(q)) s.follow = null; else { s.x = q.x; s.y = q.y; } } // Fatal-Foudre suit sa cible jusqu'au bout : sous la pluie, elle ne rate jamais
    if ((s.t -= dt) > 0) continue;
    s.done = true;
    if (s.type === "electrik") { (S.tcZap ||= []).push({ x:s.x, y:s.y, life:.35, seed:Math.random() * 99 }); S.flash = Math.max(S.flash || 0, s.fatal ? .45 : .2); S.shake = Math.max(S.shake, s.fatal ? .3 : .15); sfx("hit"); emit(s.x, s.y, 14, "electrik", { sp:200, life:.4, r:3 }); }
    else { emit(s.x, s.y, 22, "feu", { sp:220, life:.55, up:120, r:3.5 }); S.shake = Math.max(S.shake, .18); if (!S.doused && (S.tcEmb ||= []).length < 50) S.tcEmb.push({ x:s.x, y:s.y, r:30, life:14, ph:Math.random() * 6 }); }
    if (s.follow && !s.follow.down && s.follow.inv <= 0) { // la cible de Fatal-Foudre est touchée à coup sûr
      const q = s.follow, S0 = S.P; S.P = q; const m = eff(s.type, [ptype()]);
      if (m === 0) S.texts.push({ x:q.x, y:q.y - q.r - 18, txt:"Aucun effet !", col:"#c8c8c8", life:1, label:true });
      else { if (Math.random() < .35) paralyze(q, .9); if (hurtP(s.dmg * m * wxMul(s.type) * (1 + S.t / 900))) return true; }
      S.P = S0; q.inv = Math.max(q.inv, .05);
    }
    if (boomHit(s.x, s.y, s.r, s.dmg, s.type)) return true;
  }
  if (S.tcStr) S.tcStr = S.tcStr.filter(s => !s.done);
  for (const z of S.tcZap || []) z.life -= dt; if (S.tcZap) S.tcZap = S.tcZap.filter(z => z.life > 0);
  if (S.wx === "storm" && (S.stormT = (S.stormT ?? 2) - dt) <= 0) { // l'orage : la foudre tombe au hasard près des joueurs
    S.stormT = 2.2 + Math.random() * 1.6; const up = S.players.filter(q => !q.down), q = up[Math.random() * up.length | 0];
    if (q) { const a = Math.random() * Math.PI * 2, d = Math.random() < .4 ? Math.random() * 40 : 80 + Math.random() * 260; strike(q.x + Math.cos(a) * d, q.y + Math.sin(a) * d, { type:"electrik", t:.9, max:.9, dmg:12, r:44 }); }
  }
  return false;
}
// ---- Tornade de Suicune : un tourbillon qui repousse ----
function updateTwisters(dt) {
  for (const w of S.tcTw || []) {
    w.life -= dt; w.x += w.vx * dt; w.y += w.vy * dt; w.a = (w.a || 0) + dt * 9;
    for (const q of S.players) {
      if (q.down || q.choosing || q.inv > 0 || Math.hypot(q.x - w.x, q.y - w.y) > 34 + q.r) continue;
      const S0 = S.P; S.P = q; const l = Math.hypot(w.vx, w.vy) || 1; q.x += w.vx / l * 110; q.y += w.vy / l * 110; collide(q, q.r, false);
      w.life = Math.min(w.life, .2); if (hurtP(9 * eff("vol", [ptype()]) * (1 + S.t / 900))) return true; S.P = S0;
    }
  }
  if (S.tcTw) S.tcTw = S.tcTw.filter(w => w.life > 0);
  return false;
}
// ---- les trois chiens légendaires ----
const BEAST_SEQ = { sun:["lance", "eruption", "lance", "danse"], rain:["aurore", "hydro", "tornade", "brume", "aurore", "hydro", "tornade"], storm:["fatal", "tonnerre", "fatal", "tonnerre", "fatal"] };
function beastAttack(f, P) {
  const k = f.d.beast, atk = BEAST_SEQ[k][f.atkI++ % BEAST_SEQ[k].length], a0 = Math.atan2(P.y - f.y, P.x - f.x), say = (id, txt) => { if (!(f.said ||= {})[id]) { f.said[id] = true; banner(txt); } };
  if (atk === "lance") { f.flame = 1.4; f.flA = a0; say("l", "Entei utilise Lance-Flammes !"); }
  else if (atk === "eruption") { for (const q of S.players) if (!q.down) for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2, d = i ? 70 + Math.random() * 110 : 0; strike(q.x + Math.cos(a) * d + (q.mvx || 0) * 30, q.y + Math.sin(a) * d + (q.mvy || 0) * 30, { type:"feu", t:1.1, max:1.1, dmg:15, r:50 }); }
    say("e", "Entei utilise Éruption ! Sors des cercles de feu !"); }
  else if (atk === "danse") { const n = 16; for (const q of S.players) if (!q.down) for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, R = 250; S.eshots.push({ x:q.x + Math.cos(a) * R, y:q.y + Math.sin(a) * R, vx:-Math.cos(a) * 105, vy:-Math.sin(a) * 105, dmg:9, life:2.3, type:"feu", r:10 }); }
    say("d", "Entei utilise Danse Flamme ! Un cercle de feu se referme sur toi…"); }
  else if (atk === "aurore") { for (let i = -3; i <= 3; i++) { const a = a0 + i * .16; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 270, vy:Math.sin(a) * 270, dmg:10, life:2.4, type:"glace", r:9, slow:1.4 }); }
    say("a", "Suicune utilise Onde Boréale ! Ses rayons glacés ralentissent."); }
  else if (atk === "hydro") { S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a0) * 240, vy:Math.sin(a0) * 240, dmg:22, life:2.6, type:"eau", r:22 });
    for (const s of [-1, 1]) S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a0 + s * .3) * 220, vy:Math.sin(a0 + s * .3) * 220, dmg:11, life:2.4, type:"eau", r:11 });
    say("h", "Suicune utilise Hydrocanon !"); }
  else if (atk === "tornade") { for (const s of [-.35, .35]) (S.tcTw ||= []).push({ x:f.x, y:f.y, vx:Math.cos(a0 + s) * 165, vy:Math.sin(a0 + s) * 165, life:4 });
    say("t", "Suicune utilise Tornade ! Les tourbillons te repoussent."); }
  else if (atk === "brume") { f.leerT = 4.5; f.leerMul = .5; f.mistT = 4.5; say("b", "Suicune s'entoure de Brume : il encaisse deux fois moins de dégâts pendant quelques secondes !"); }
  else if (atk === "fatal") { for (const q of S.players) if (!q.down) strike(q.x, q.y, { type:"electrik", t:1.15, max:1.15, dmg:18, r:40, follow:q, fatal:true });
    say("f", "Raikou utilise Fatal-Foudre ! Sous la pluie, elle ne rate jamais… Tiens bon !"); }
  else if (atk === "tonnerre") { const n = 14, sh = Math.random(); for (let i = 0; i < n; i++) { const a = (i + sh) / n * Math.PI * 2; S.eshots.push({ x:f.x, y:f.y, vx:Math.cos(a) * 230, vy:Math.sin(a) * 230, dmg:10, life:2.4, type:"electrik", r:9, para:.7 }); }
    say("o", "Raikou utilise Tonnerre !"); }
  f.atkT = (f.hp < f.maxHp * .4 ? 1.6 : 2.2) + Math.random() * .5;
}
function updateBeasts(dt) {
  for (const f of S.foes) {
    if (!f.d.beast || f.hp <= 0) continue;
    if (!f.wxOn) { f.wxOn = true; f.atkT = 2.4; f.atkI = 0; setWx(f.d.beast, f); }
    if (f.mistT > 0) f.mistT -= dt;
    if (f.sleepT > 0) continue;
    const P = S.P = nearP(f.x, f.y);
    if ((f.atkT -= dt) <= 0 && !(f.flame > 0)) beastAttack(f, P);
    if (f.flame > 0) { // Lance-Flammes : une gerbe de feu qui suit lentement le joueur
      f.flame -= dt; f.flA += Math.sign(((Math.atan2(P.y - f.y, P.x - f.x) - f.flA + Math.PI * 3) % (Math.PI * 2)) - Math.PI) * .9 * dt;
      if ((f.fsT = (f.fsT || 0) - dt) <= 0) { f.fsT = .05; const a = f.flA + (Math.random() - .5) * .35, v = 300 + Math.random() * 80; S.eshots.push({ x:f.x + Math.cos(a) * 30, y:f.y + Math.sin(a) * 30, vx:Math.cos(a) * v, vy:Math.sin(a) * v, dmg:9, life:1.1, type:"feu", r:9 }); }
    }
  }
}
function beastFlee(f) { // vaincu, le chien légendaire bondit hors de la tour : on ne le capture pas
  const B = S.bst ||= { ko:{} }, k = f.d.sprite; B.ko[k] = true;
  const P = nearP(f.x, f.y), a = Math.atan2(f.y - P.y, f.x - P.x);
  (S.tcRun ||= []).push({ kind:k, x:f.x, y:f.y, vx:Math.cos(a) * 520, vy:Math.sin(a) * 520 - 60, t:1.6 });
  banner(`${f.d.name} est vaincu ! Il bondit à travers les décombres et s'enfuit… Il laisse une Poké Ball.`);
  if (Object.keys(BEASTS).every(b => B.ko[b])) B.finalAt = S.t + 2.5;
}
// ---- à la fin : les trois reviennent, et on choisit celui qui nous aidera plus tard ----
function startTrio() {
  const P = nearP(S.cam.x, S.cam.y), ks = Object.keys(BEASTS);
  S.trio = { t:0, asked:false, picked:null, list:ks.map((k, i) => { const tx = P.x + (i - 1) * 130, ty = P.y - 150 + (i === 1 ? -20 : 0), a = Math.atan2(ty - P.y, tx - P.x) + (i - 1) * .4;
    return { k, tx, ty, x:tx + Math.cos(a) * 700, y:ty + Math.sin(a) * 700 }; }) };
  banner("Entei, Suicune et Raikou reviennent… Ils te regardent, immobiles.");
}
function updateTrio(dt) {
  const T = S.trio; T.t += dt;
  for (const b of T.list) {
    if (b.go) { b.x += b.vx * dt; b.y += b.vy * dt; if (Math.random() < .7) (b.trail ||= []).push({ x:b.x, y:b.y, life:.6 }); continue; }
    b.x += (b.tx - b.x) * Math.min(1, dt * 3); b.y += (b.ty - b.y) * Math.min(1, dt * 3);
  }
  if (!T.asked && T.t > 1.6) { T.asked = true; openBeastPick(); }
  if (T.leave && (T.leave -= dt) <= 0) { S.trio = null; S.wx = null; banner("Le ciel s'éclaircit au-dessus de la Tour Cendrée."); }
}
const BLESS = {
  entei:"Entei pousse un rugissement qui fait trembler la tour. Les flammes de son cœur brûlent désormais pour toi : il t'offre sa bénédiction et veillera sur toi.",
  suicune:"Suicune pose sur toi un regard aussi pur que l'eau d'une source. Porté par le vent du nord, il t'offre sa bénédiction et veillera sur toi.",
  raikou:"Un éclair déchire le ciel et Raikou se tient devant toi. Son tonnerre grondera à tes côtés : il t'offre sa bénédiction et veillera sur toi." };
function pickBeast(k) {
  const T = S.trio; if (!T || T.picked) return;
  T.picked = k; $("beastPick").hidden = true; if (state === "beast") { state = "play"; last = performance.now(); }
  shop.beast = k; shop.beastAt = Date.now(); shopSave(); teamAch("trio"); sfx("evo");
  const b = T.list.find(x => x.k === k); S.fxs.push({ x:b.x, y:b.y, r:0, max:140, life:.6, col:`rgba(${BEASTS[k].col},` });
  S.msgs = [{ txt:BLESS[k], life:6 }]; // la bénédiction (idée de Raphaël)
  setTimeout(() => { if (S.trio !== T) return; T.list.forEach((x, i) => { if (x.k === k) return; const a = -Math.PI / 2 + (i - 1) * 1.1; x.vx = Math.cos(a) * 560; x.vy = Math.sin(a) * 560; x.go = true; }); }, 2200); // les deux autres s'enfuient en laissant une traînée de lumière
  setTimeout(() => { if (S.trio !== T) return; T.leave = 2.2; const x = T.list.find(b => b.k === k); x.vx = 0; x.vy = -600; x.go = true; }, 5600); // puis l'élu part à son tour
}
function openBeastPick() {
  const ov = $("beastPick"), box = $("bpCards"); box.innerHTML = "";
  const cur = shop.beast;
  $("bpSub").textContent = cur ? `Aujourd'hui, c'est ${BEASTS[cur].name} qui doit t'aider. Tu peux garder ton choix ou en changer : il t'accompagnera dans un prochain niveau.` : "L'un d'eux t'accompagnera dans un prochain niveau. Choisis bien !";
  Object.entries(BEASTS).forEach(([k, B], i) => {
    const b = document.createElement("button"); b.className = "card"; b.type = "button"; b.style.setProperty("--c", TYPE_COLORS[B.type]);
    const txt = { entei:"Le volcan dans l'âme. Son Zénith fait rugir les flammes.", suicune:"Le vent du nord. Sa pluie purifie l'eau et éteint les braises.", raikou:"La foudre incarnée. Son orage fait tomber Fatal-Foudre." }[k];
    b.innerHTML = `<span class="key">${i + 1}</span><canvas width="240" height="120"></canvas><div class="card-body"><span class="tag">${cur === k ? "Ton choix actuel" : "Légendaire"}</span><h3>${B.name} <span class="chip" style="--c:${TYPE_COLORS[B.type]}">${TYPE_NAMES[B.type]}</span></h3><p>${txt}</p></div>`;
    b.addEventListener("click", () => pickBeast(k)); box.appendChild(b);
    const c = b.querySelector("canvas"), g = c.getContext("2d");
    const draw = now => { if (ov.hidden || !c.isConnected) return; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 240, 120); drawMon(g, k, 120, 62, 30, false, now / 1000, 0, 2, true); requestAnimationFrame(draw); };
    requestAnimationFrame(draw);
  });
  ov.hidden = false; if (!NET.role && state === "play") state = "beast"; // en ligne, la partie continue pendant que l'hôte choisit
  box.querySelector("button")?.focus({ preventScroll:true }); sfx("levelup");
}
window.addEventListener("keydown", e => { if ($("beastPick").hidden) return; const n = { Digit1:0, Digit2:1, Digit3:2, Numpad1:0, Numpad2:1, Numpad3:2 }[e.code]; if (n !== undefined) { e.preventDefault(); pickBeast(Object.keys(BEASTS)[n]); } });
// ---- Silver, le rival : Spectrum, Magnéti, Nosferapti, puis le starter qui bat le tien ----
function startRival() {
  const P = nearP(S.cam.x, S.cam.y), t = P.etype || LINES[P.line].type;
  const ace = { plante:"rvFeurisson", feu:"rvCrocrodil", eau:"rvMacronium" }[t] || ["rvFeurisson", "rvCrocrodil", "rvMacronium"][Math.random() * 3 | 0];
  S.rival = { ace, phase:1, t:100 };
  ["rvSpectrum", "rvMagneti", "rvNosferapti"].forEach((k, i) => { const a = -Math.PI / 2 + (i - 1) * .9, g = spawnFoe(k, P.x + Math.cos(a) * 330, P.y + Math.sin(a) * 330); g.appear = .4; });
  banner("« Hé, toi ! Dégage de ma route ! » Silver, ton rival, débarque dans la tour avec son équipe !"); sfx("boss");
}
function updateRival(dt) {
  const R = S.rival; R.t -= dt;
  const left = S.foes.filter(f => f.d.rival && f.hp > 0);
  if (R.t <= 0) { for (const f of left) { f.gone = true; f.hp = 0; emit(f.x, f.y, 10, "normal", { sp:120, life:.4 }); } S.rival = null; banner("Silver rappelle ses Pokémon : « Tss… Je n'ai pas de temps à perdre avec toi. »"); return; }
  if (left.length) return;
  if (R.phase === 1) { R.phase = 2; const P = nearP(S.cam.x, S.cam.y), a = Math.random() * Math.PI * 2, g = spawnFoe(R.ace, P.x + Math.cos(a) * 300, P.y + Math.sin(a) * 300); g.appear = .4;
    banner(`« Pas mal… Mais celui-là, tu ne le battras pas ! » Silver envoie ${FOES[R.ace].name.replace(" de Silver", "")} !`); return; }
  S.rival = null; S.gems.push({ x:S.P.x + 50, y:S.P.y, pick:"chest" }); sfx("win");
  banner("« … Hmph. Tu as eu de la chance. » Silver s'en va en te laissant une Poké Ball.");
}
// ---- boucle ----
function updateBurned(dt) {
  if (!LEVEL.burned) return false;
  if (S.flash > 0) S.flash -= dt;
  updateBeasts(dt);
  updateEmbers(dt);
  if (updateStrikes(dt) || updateTwisters(dt)) return true;
  for (const r of S.tcRun || []) { r.t -= dt; r.x += r.vx * dt; r.y += r.vy * dt; } if (S.tcRun) S.tcRun = S.tcRun.filter(r => r.t > 0);
  if (S.bst && S.bst.finalAt && S.t >= S.bst.finalAt) { S.bst.finalAt = 0; startTrio(); }
  if (S.trio) updateTrio(dt);
  if (S.rival) updateRival(dt);
  return false;
}
// ---- dessin ----
function drawBurnedUnder(t) {
  if (!LEVEL.burned) return;
  const k = emberK(), camX = S.cam.x - W / ZOOM / 2, camY = S.cam.y - H / ZOOM / 2;
  { // braises : tas de cendres qui brûlent (éteints pour de bon après la pluie)
    const one = (e, r0) => {
      const r = k > 0 ? r0 / k : e.r; // éteintes, les cendres restent visibles
      if (r <= 0 || e.x < camX - 80 || e.y < camY - 80 || e.x > camX + W / ZOOM + 80 || e.y > camY + H / ZOOM + 80) return;
      if (k > 0) { const fl = .75 + .25 * Math.sin(t * 5 + e.ph) * Math.sin(t * 2.3 + e.ph * 2); cx.save(); cx.globalCompositeOperation = "lighter"; glow(e.x, e.y, r * 1.4, "255,110,30", .25 * fl); cx.restore(); }
      drawEmber(e, r * (k > 1 ? 1.15 : 1), t, k > 0);
      if (k > 0 && Math.random() < .04) emit(e.x + (Math.random() - .5) * r, e.y - r * .4, 1, "feu", { sp:15, life:.8, up:70, r:1.8 });
    };
    embersNear(S.cam.x, S.cam.y, one);
  }
  for (const s of S.tcSteam || []) { const a = Math.min(1, s.life); circ(cx, s.x + Math.sin(t * 2 + s.ph) * 6, s.y - (2.4 - s.life) * 30, 10 + (2.4 - s.life) * 8, `rgba(220,225,230,${.25 * a})`); }
  for (const s of S.tcStr || []) { // cercles d'avertissement
    const kk = 1 - s.t / s.max, col = s.type === "electrik" ? "255,226,80" : "255,110,50";
    cx.save(); cx.fillStyle = `rgba(${col},${.12 + .16 * kk})`; cx.strokeStyle = `rgba(${col},${.55 + .4 * kk})`; cx.lineWidth = s.fatal ? 3.5 : 2.5;
    cx.beginPath(); cx.ellipse(s.x, s.y, s.r, s.r * .62, 0, 0, Math.PI * 2); cx.fill(); cx.stroke();
    cx.beginPath(); cx.ellipse(s.x, s.y, s.r * kk, s.r * .62 * kk, 0, 0, Math.PI * 2); cx.stroke(); cx.restore();
  }
  for (const f of S.foes) if (f.d.beast && f.hp > 0 && f.mistT > 0) { // Brume de Suicune
    const a = Math.min(1, f.mistT); for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2 + t * .8; circ(cx, f.x + Math.cos(an) * f.r * 1.1, f.y + Math.sin(an) * f.r * .6, f.r * .55, `rgba(220,240,255,${.16 * a})`); }
  }
}
function drawTwisters() { // tourbillons de Tornade (Suicune) et d'Ouragan (Léviator)
  for (const w of S.tcTw || []) { // tourbillons de Tornade
    const a = Math.min(1, w.life * 2);
    for (let i = 0; i < 4; i++) { cx.save(); cx.translate(w.x, w.y - i * 12); cx.rotate(w.a + i); cx.strokeStyle = `rgba(225,245,255,${(.7 - i * .12) * a})`; cx.lineWidth = 3;
      cx.beginPath(); cx.ellipse(0, 0, 16 + i * 7, (16 + i * 7) * .4, 0, 0, Math.PI * 1.4); cx.stroke(); cx.restore(); }
  }
}
function drawBurnedOver(t) {
  if (!LEVEL.burned) return;
  drawTwisters();
  for (const z of S.tcZap || []) { // éclairs qui tombent du ciel
    const R = rng(z.seed * 1e6 | 0), a = z.life / .35; let x = z.x + (R() - .5) * 60, y = z.y - 520;
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(z.x, z.y, 80, "255,240,140", a); cx.lineCap = "round";
    for (const [w, c] of [[9, `rgba(255,220,90,${.45 * a})`], [3.5, `rgba(255,255,230,${a})`]]) {
      cx.strokeStyle = c; cx.lineWidth = w; cx.beginPath(); const R2 = rng(z.seed * 1e6 | 0); let px = x, py = y; cx.moveTo(px, py);
      for (let i = 1; i <= 8; i++) { px = x + (z.x - x) * i / 8 + (i < 8 ? (R2() - .5) * 46 : 0); py = y + (z.y - y) * i / 8; cx.lineTo(px, py); } cx.stroke();
    }
    cx.restore();
  }
  for (const r of S.tcRun || []) { cx.save(); cx.globalAlpha = Math.min(1, r.t / .8); drawMon(cx, r.kind, r.x, r.y, 34, r.vx < 0, t * 2, 0, null, true); cx.restore(); } // ils s'enfuient en courant
  const T = S.trio;
  if (T) for (const b of T.list) {
    const pk = T.picked === b.k;
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(b.x, b.y, pk ? 90 : 60, BEASTS[b.k].col, pk ? .55 + .2 * Math.sin(t * 5) : .3); cx.restore();
    for (const p of b.trail || []) { p.life -= 1 / 60; if (p.life > 0) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(p.x, p.y, 26 * p.life / .6 + 6, BEASTS[b.k].col, p.life); cx.restore(); } }
    if (b.trail) b.trail = b.trail.filter(p => p.life > 0);
    drawMon(cx, b.k, b.x, b.y, 26, false, t, 0, b.go ? null : 0, !!b.go);
  }
  for (const f of S.foes) if (f.d.rival && f.hp > 0) { cx.strokeStyle = "rgba(230,60,60,.8)"; cx.lineWidth = 2.5; cx.beginPath(); cx.ellipse(f.x, f.y + f.r * .8, f.r * 1.1, f.r * .4, 0, 0, Math.PI * 2); cx.stroke(); } // l'équipe de Silver
}
function drawBurnedTop(camX, camY, vw, vh, t) { // teinte de la météo sur le monde
  if (!LEVEL.burned && !LEVEL.rage) return;
  const w = S.wx; S.wxK = Math.max(0, Math.min(1, (S.wxK || 0) + (w ? 1 : -1) * .02)); if (w) S.wxLast = w;
  const k = S.wxK, l = S.wxLast; if (!k || !l) return;
  if (l === "sun") { cx.fillStyle = `rgba(255,150,40,${.13 * k})`; cx.fillRect(camX - 60, camY - 60, vw + 120, vh + 120); }
  else { cx.fillStyle = l === "storm" ? `rgba(14,18,40,${.36 * k})` : `rgba(30,50,80,${.24 * k})`; cx.fillRect(camX - 60, camY - 60, vw + 120, vh + 120);
    for (let i = 0; i < 18; i++) { // ronds dans les flaques
      const ph = (t * .9 + i * .37) % 1, x = camX + ((i * 263.7) % vw), y = camY + ((i * 151.3 + Math.floor(t * .9 + i * .37) * 97) % vh);
      cx.strokeStyle = `rgba(200,225,255,${.35 * (1 - ph) * k})`; cx.lineWidth = 1.2; cx.beginPath(); cx.ellipse(x, y, 3 + ph * 12, (3 + ph * 12) * .45, 0, 0, Math.PI * 2); cx.stroke();
    }
  }
}
function drawWeather(t) { // à l'écran : rayons du soleil, pluie, éclairs, et l'étiquette de la météo
  if ((!LEVEL.burned && !LEVEL.rage) || !S) return;
  const k = S.wxK || 0, l = S.wxLast;
  if (k && l === "sun") {
    cx.save(); cx.globalCompositeOperation = "lighter";
    const g = cx.createRadialGradient(W * .1, -H * .1, 0, W * .1, -H * .1, Math.max(W, H) * .9); g.addColorStop(0, `rgba(255,220,140,${.32 * k})`); g.addColorStop(1, "rgba(255,160,60,0)");
    cx.fillStyle = g; cx.fillRect(0, 0, W, H);
    for (let i = 0; i < 5; i++) { const a = .5 + i * .16 + Math.sin(t * .3 + i) * .02; cx.fillStyle = `rgba(255,230,160,${.05 * k})`; cx.beginPath(); cx.moveTo(W * .1, -H * .1); cx.lineTo(W * .1 + Math.cos(a - .03) * W * 2, -H * .1 + Math.sin(a - .03) * W * 2); cx.lineTo(W * .1 + Math.cos(a + .03) * W * 2, -H * .1 + Math.sin(a + .03) * W * 2); cx.fill(); }
    cx.restore();
  }
  if (k && l !== "sun") { // pluie (plus forte et plus penchée sous l'orage)
    const n = l === "storm" ? 220 : 140, vx = l === "storm" ? -260 : -90, vy = 1100, len = l === "storm" ? .034 : .028;
    cx.save(); cx.strokeStyle = `rgba(190,215,255,${.5 * k})`; cx.lineWidth = 1.3; cx.beginPath();
    for (let i = 0; i < n; i++) { const sp = .8 + (i % 5) * .1, x = (((i * 97.31 + t * vx * sp) % (W + 200)) + W + 200) % (W + 200) - 100, y = (((i * 61.7 + t * vy * sp) % (H + 60)) + H + 60) % (H + 60) - 30;
      cx.moveTo(x, y); cx.lineTo(x - vx * len * sp, y - vy * len * sp); }
    cx.stroke(); cx.restore();
  }
  if (S.flash > 0) { cx.fillStyle = `rgba(240,245,255,${Math.min(.7, S.flash)})`; cx.fillRect(0, 0, W, H); }
  if (S.wx) { // étiquette : météo en cours et son effet
    const w = WX[S.wx], txt = `${w.icon} ${w.name} · ${TYPE_NAMES[w.up]} +50 % · ${TYPE_NAMES[w.down]} −50 %`;
    cx.font = "700 14px 'Pixelify Sans', monospace"; const tw = cx.measureText(txt).width + 24, x = W / 2 - tw / 2, y = 64;
    cx.fillStyle = "rgba(10,10,20,.62)"; cx.beginPath(); cx.roundRect(x, y, tw, 26, 13); cx.fill();
    cx.fillStyle = S.wx === "sun" ? "#ffd27a" : "#bfe0ff"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText(txt, W / 2, y + 13); cx.textBaseline = "alphabetic";
  }
}
function burnedMote(m, t, dt) { // cendres qui tombent, et braises qui montent tant qu'il ne pleut pas
  const ember = !S?.doused && (m.ph * 10 | 0) % 3 === 0;
  if (ember) { const a = .4 + .4 * Math.sin(t * 3 + m.ph); m.y -= 26 * dt; circ(cx, m.x, m.y, 3 * m.s, `rgba(255,110,30,${a * .25})`); circ(cx, m.x, m.y, 1.2 * m.s, `rgba(255,200,110,${a})`); }
  else { m.y += 10 * m.s * dt; m.x += Math.sin(t + m.ph) * 6 * dt; circ(cx, m.x, m.y, 1.8 * m.s, `rgba(70,64,60,${.5})`); circ(cx, m.x - .5, m.y - .5, .9 * m.s, "rgba(150,144,140,.5)"); }
}
