/* ---------- Écran titre ---------- */
const starterOrder = ["plante", "feu", "eau", "magicarpe", "miaouss", "pika", "evoli", "draco", "mew", "germignon", "heri", "kaiminus", "togepi", "celebi"];
const levelBtns = [];
$("lgBtn").addEventListener("click", nextRoom);
const levelOpen = i => i === 0 || !!achs[LEVELS[i].jFirst ? "win9" : "win" + i]; // un niveau se débloque en terminant le précédent (Johto : après la Caverne Azurée)
const lvLabel = lv => lv.label || lv.num;
let REGION = "kanto";
function setLevel(i) {
  if (!levelOpen(i)) { $("levelTag").textContent = `🔒 Termine ${LEVELS[i].jFirst ? "la Caverne Azurée" : LEVELS[i - 1].name} pour débloquer ${LEVELS[i].name}`; sfx("hurt"); return; }
  setTimeout(refreshSides); // décor et panneaux des côtés (35-decor-menu.js)
  REGION = LEVELS[i].region || "kanto";
  if (LEVEL !== LEVELS[i]) { LEVEL = LEVELS[i]; chunkData.clear(); nearCache.clear(); liveChunks.clear(); motes.length = 0; }
  $("levelTag").textContent = `${REGION === "johto" ? "Johto · " : ""}Niveau ${lvLabel(LEVEL)} · ${LEVEL.name}`;
  $("levelIntro").textContent = LEVEL.intro;
  if (LEVEL.league) { let hof = []; try { hof = JSON.parse(localStorage.getItem("pokesurv-hof") || "[]"); } catch (e) {} if (Array.isArray(hof) && hof[0]) $("levelIntro").textContent += ` Record du Panthéon : ${hof[0].n}, ${fmt(hof[0].t)}.`; }
  if (typeof renderCar === "function") renderCar();
  if (typeof NET !== "undefined" && NET.role === "host" && !NET.started) setTimeout(netLobby, 0);
  levelBtns.forEach((b, k) => { b.setAttribute("aria-pressed", String(k === i)); const lv = LEVELS[k]; b.hidden = (!!lv.secret && !levelOpen(k)) || (lv.region || "kanto") !== REGION; b.classList.toggle("lvlocked", !levelOpen(k)); b.textContent = `${levelOpen(k) ? "" : "🔒 "}${lvLabel(lv)} · ${lv.name}`; });
  regionBtns.forEach(b => { b.hidden = !achs.win9; b.setAttribute("aria-pressed", String(b.dataset.r === REGION)); });
  regLbl.hidden = !achs.win9;
}
const regLbl = document.createElement("span"); regLbl.className = "regLbl"; regLbl.textContent = "Aventure"; regLbl.hidden = true; $("levelPick").appendChild(regLbl); // la région choisit les niveaux, pas les starters
const regionBtns = [["kanto", "🗾 Kanto"], ["johto", "🍃 Johto"]].map(([r, txt]) => { // choix de la région, une fois la Caverne Azurée gagnée
  const b = document.createElement("button"); b.type = "button"; b.className = "lvbtn regbtn"; b.dataset.r = r; b.textContent = txt; b.hidden = true;
  b.addEventListener("click", () => { if (r === REGION) return; const ks = LEVELS.map((lv, k) => k).filter(k => (LEVELS[k].region || "kanto") === r && levelOpen(k) && !(LEVELS[k].secret && !levelOpen(k))); setLevel(ks[ks.length - 1] ?? 0); });
  $("levelPick").appendChild(b); return b;
});
LEVELS.forEach((lv, i) => {
  const b = document.createElement("button"); b.type = "button"; b.className = "lvbtn";
  b.textContent = `${lvLabel(lv)} · ${lv.name}`; b.addEventListener("click", () => setLevel(i));
  $("levelPick").appendChild(b); levelBtns.push(b);
});
// Choix du starter : carrousel, fiche Stats et Attaques façon jeu Pokémon
const TALENTS = { plante:["Engrais", "récupère 0,4 PV par seconde."], feu:["Brasier", "+10 % de dégâts."], eau:["Torrent", "capacités rechargées 8 % plus vite."],
  pika:["Statik", "un ennemi qui le touche est paralysé 1 s."], evoli:["Adaptabilité", "+10 % d'expérience."], draco:["Multiécaille", "−10 % de dégâts reçus."],
  mew:["Fabuleux", "+10 % de dégâts et de bons PV."], miaouss:["Technicien", "+10 % de coups critiques."], germignon:["Feuille Garde", "une aura soigne les alliés proches et ralentit les ennemis."],
  heri:["Torche", "courir rend ses attaques Feu jusqu'à 40 % plus fortes."], kaiminus:["Sans Limite", "+15 % de dégâts au contact, chaque coup le soigne un peu."],
  togepi:["Sérénité", "les effets secondaires (apeurer, charmer) se produisent deux fois plus souvent."],
  celebi:["Voyage Temporel", "une fois par partie, au lieu d'être K.O., remonte le temps et revient 5 s en arrière."] };
const lineMoves = line => { // capacités que ce starter peut apprendre (même règle que buildChoices, tous stades confondus)
  const L = LINES[line], out = [];
  for (const [id, m] of Object.entries(MOVES)) {
    if (m.line && ![].concat(m.line).includes(line)) continue;
    const alt = m.alt && m.alt.line === line, also = (m.also || []).includes(line);
    if (m.only && ![].concat(m.only).includes(L.type) && !alt && !also) continue;
    if (m.only && (L.own || L.restricted) && !also && !alt) continue;
    if (!m.only && !m.line) continue;
    out.push([id, m, alt]);
  }
  return out.sort((a, b) => (b[0] === L.move) - (a[0] === L.move) || (a[1].tier || 0) - (b[1].tier || 0) || !!a[1].rare - !!b[1].rare);
};
const carVisible = () => starterOrder.filter(l => !(LINES[l].secret && !isUnlocked(l))); // Mew et Johto : invisibles tant qu'ils ne sont pas débloqués
let carLine = starterOrder[0], ballAnim = null;
function carMove(d) {
  if (ballAnim) return; const v = carVisible(); let i = v.indexOf(carLine); if (i < 0) i = 0;
  carLine = v[(i + d + v.length) % v.length]; renderCar(); sfx("click");
  $("sGo").scrollIntoView({ block:"nearest", behavior:"smooth" }); // la fiche et le bouton restent à l'écran
}
function carGo(line) { if (!ballAnim && v_ok(line)) { carLine = line; renderCar(); } }
const v_ok = l => carVisible().includes(l);
function renderCar() {
  const v = carVisible(); if (!v.includes(carLine)) carLine = v[0];
  const line = carLine, L = LINES[line], i = v.indexOf(line), col = TYPE_COLORS[L.type], lock = ACHS.find(x => unlocks(x, line) && !achs[x.id]);
  const hex = col.replace("#", ""), rgb = [0, 2, 4].map(k => parseInt(hex.slice(k, k + 2), 16)).join(",");
  const car = $("sCar"); car.style.setProperty("--c", col); car.style.setProperty("--ca", rgb);
  const lum = rgb.split(",").reduce((a, v, k) => a + v * [.3, .59, .11][k], 0); car.querySelectorAll(".pkh").forEach(h => { h.style.color = lum > 170 ? "#2a2310" : "#fff"; h.style.textShadow = lum > 170 ? "none" : ""; }); // en-tête lisible sur le jaune
  const groups = [["Kanto", v.filter(l => !LINES[l].own)], ["Johto", v.filter(l => LINES[l].own)]].filter(g => g[1].length);
  $("sTabs").innerHTML = `<span class="lbl">Starters</span>` + (groups.length > 1 ? groups.map(([n, ls]) => `<button type="button" role="tab" data-g="${ls[0]}" aria-selected="${ls.includes(line)}">${n}<i>${ls.length}</i></button>`).join("") : "") + `<span class="cnt">${i + 1} / ${v.length}</span>`;
  $("sTabs").querySelectorAll("[data-g]").forEach(b => b.addEventListener("click", () => carGo(b.dataset.g)));
  $("sName").textContent = lock ? "???" : L.names[0]; $("sChip").textContent = TYPE_NAMES[L.type]; $("sChip").style.background = col;
  const mu = LEVEL.matchup[line] || (L.own && LEVEL.matchup[L.type]) || (line === "mew" ? ["Variable", "Métronome peut tirer n'importe quel type : chaque partie est une surprise."] : ["Neutre", "Pas d'avantage ni de faiblesse marqués dans ce niveau."]);
  $("sMu").innerHTML = `<b>${mu[0]}</b> ${LEVEL.where}. ${mu[1]}`;
  $("sLock").hidden = !lock; $("sLock").textContent = lock ? `🔒 Succès « ${lock.name} » : ${lock.desc}` : "";
  const mystery = line === "magicarpe";
  const statsBox = $("sStats").parentElement, statsHeader = statsBox.querySelector(".pkh");
  statsBox.hidden = false; statsBox.classList.toggle("surprise", mystery); statsHeader.hidden = false; $("sTal").hidden = mystery;
  statsHeader.querySelector("span").textContent = mystery ? "Surprise Mother Fucker" : "Stats";
  $("sEvo").hidden = mystery; $("sEvo").textContent = mystery ? "" : "N.1";
  const evo = line === "mew" ? "n'évolue pas, se renforce N.10 et N.22" : line === "evoli" ? "Pyroli, Aquali, Phyllali ou Voltali au N.10" : line === "magicarpe" ? L.evo : line === "miaouss" ? `${L.names[1]} au N.${EVO_LEVELS[0]}` : `${L.names[1]} au N.${EVO_LEVELS[0]}, ${L.names[2]} au N.${EVO_LEVELS[1]}`;
  const st = [["PV", L.hp, L.hp / 56, false], ["Attaque", Math.round(100 * (L.dmg || 1)), (L.dmg || 1) / 1.2, (L.dmg || 1) > 1],
    ["Vitesse", L.speed, (L.speed - 135) / 45, false], ["Recharge", Math.round(100 / (L.cd || 1)), (100 / (L.cd || 1) - 70) / 45, (L.cd || 1) < 1],
    ["Critique", `${Math.round(100 * (L.crit || 0))} %`, (L.crit || 0) / .2, !!L.crit], ["Régén.", String(L.regen || 0).replace(".", ","), (L.regen || 0) / .8, !!L.regen]];
  $("sStats").innerHTML = mystery ? Array.from({ length:6 }, () => `<div class="pst"><span>???</span><span class="v">???</span><span></span></div>`).join("") : st.map(([n, val, f, up]) => `<div class="pst${up ? " up" : ""}"><span>${n}${up ? " ▲" : ""}</span><span class="v">${val}</span><div class="bb"><i style="width:${Math.round(Math.max(.06, Math.min(1, f)) * 100)}%"></i></div></div>`).join("");
  const t = TALENTS[line]; $("sTal").innerHTML = mystery ? "" : (t ? `<b>Talent · ${t[0]}</b> : ${t[1]}<br>` : "") + `<b>Évolution</b> : ${evo}`;
  const mv = mystery ? lineMoves(line).filter(([id]) => id === L.move) : lineMoves(line); $("sMvN").textContent = mv.length; $("sMoves").classList.toggle("many", mv.length > 7);
  $("sMoves").innerHTML = mv.map(([id, m, alt]) => { const d = m.desc(1).split(/(?<=\.) /)[0].replace(/\.$/, "");
    const tg = id === L.move ? `<span class="tg">Départ</span>` : m.rare ? `<span class="tg r">Rare N.${m.rare.minLvl}</span>` : alt ? `<span class="tg a">${L.names[m.alt.stage]}</span>` : m.tier ? `<span class="tg r" title="Proposé après Métronome ${m.tier - 1}">après M.${m.tier - 1}</span>` : "<span></span>";
    return `<div class="mv"><span class="ty" style="background:${TYPE_COLORS[m.type] || "#888"}">${TYPE_NAMES[m.type] || m.type}</span><div><b>${m.name}</b><small>${d}</small></div>${m.tier === 1 ? "<span></span>" : tg}</div>`; }).join("");
  $("sGo").disabled = !!lock; $("sGo").classList.toggle("playIco", !lock); $("sGo").textContent = lock ? "🔒 Verrouillé" : `Choisir ${L.names[0]}`;
  $("sBig").parentElement.classList.toggle("lk", !!lock);
  const side = (el, l) => { el.querySelector("b").textContent = isUnlocked(l) ? LINES[l].names[0] : "???"; el.classList.toggle("lk", !isUnlocked(l)); el.dataset.l = l; };
  side($("sPrev"), v[(i - 1 + v.length) % v.length]); side($("sNext"), v[(i + 1) % v.length]);
  $("sDots").innerHTML = v.map(l => `<i data-l="${l}" class="${l === line ? "on" : ""}" title="${isUnlocked(l) ? LINES[l].names[0] : "???"}"></i>`).join("");
  $("sDots").querySelectorAll("i").forEach(d => d.addEventListener("click", () => carGo(d.dataset.l)));
}
function refreshLocks() {
  const cb = $("carBtn"); if (cb) cb.hidden = !achs.win8; // le Panthéon n'apparaît qu'après la victoire à la Ligue
  renderCar();
}
// Validation : la Poké Ball (Master Ball pour Mew) tombe, tremble et s'ouvre, puis la partie démarre
function chooseStarter(line = carLine) {
  if (ballAnim || !isUnlocked(line) || state !== "menu") return;
  if (line !== carLine) { carLine = line; renderCar(); }
  ballAnim = { line, t0:performance.now(), master: line === "mew", opened:false }; sfx("chest");
}
$("sGo").addEventListener("click", () => chooseStarter());
$("sLeft").addEventListener("click", () => carMove(-1)); $("sRight").addEventListener("click", () => carMove(1));
$("sPrev").addEventListener("click", () => carMove(-1)); $("sNext").addEventListener("click", () => carMove(1));
$("sBig").addEventListener("click", () => chooseStarter());
{ let sx = null; const st = $("sCar"); // mobile : glisser pour changer de starter
  st.addEventListener("pointerdown", e => { sx = e.clientX; });
  st.addEventListener("pointerup", e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) carMove(e.clientX < sx ? 1 : -1); sx = null; }); }
// Poké Ball du choix du starter : la même que celle des boss (pixel art), pas un dessin vectoriel
const MASTER_BALL = new Image(); MASTER_BALL.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAA/0lEQVRYw+2WvQ3CMBCFPYpXSElJS5kxaClTsgIjZARWcOkVUjJCWpNncdbZnJUilyAkP+kpCrm872Hlz5impqZ/lLU2SD4M+jzNoncrg8CXdckSPDtuHnolEBRcyAD+HKI5HDN8Tq0Egsp/f1iBr6VfQteWP5tdrFaA4JOfs22tBBXYtArxiv8ESfBaiXSORoFb5xNgrUCcZfBr57YXQEjtvi+NAtwqBS59n5XAPrkGJjhmVApwjyPutxC32Jeg3Cq34jDcUyBXCePGOSoPIoTgYoMQWq6ABMY8jqs+jnkJMn6TrArnJRBcgxJ4F3j5SiZQ6UO+C372QdLU1LSX3jXfmasWIVy0AAAAAElFTkSuQmCC"; // Master Ball de PokéSprite (même cadrage que la Poké Ball des boss)
function ballSprite(master) { return master && MASTER_BALL.complete && MASTER_BALL.naturalWidth ? MASTER_BALL : PICKS.chest.img; }
function drawBall(g, x, y, R, master, open, now) {
  const img = ballSprite(master), s = 3 / .7, cut = 17; // 3 px d'écran par pixel du sprite (la scène est dessinée à 0,7)
  g.save(); g.imageSmoothingEnabled = false; g.globalAlpha *= 1 - Math.max(0, open - .6) / .4; // la balle s'efface pendant que le Pokémon sort
  g.drawImage(img, 0, cut, 32, 32 - cut, x - 16 * s, y + (cut - 16) * s, 32 * s, (32 - cut) * s); // moitié basse
  g.translate(x + 8 * s, y + (cut - 16) * s); g.rotate(open * .5); g.translate(0, -open * R * .6); // le couvercle se soulève en basculant vers l'arrière
  g.drawImage(img, 0, 0, 32, cut, -24 * s, -cut * s, 32 * s, cut * s);
  g.restore();
}
// Choix du starter, façon capture des jeux Game Boy Advance : la balle est lancée sur le Pokémon,
// il devient blanc et est aspiré dedans (la balle ne s'ouvre jamais), elle tombe, tremble trois fois, puis « clic » et étoiles
const BALL_TMP = document.createElement("canvas");
function pixStar(g, x, y, s, a, col) { g.globalAlpha = a; g.fillStyle = col; g.fillRect(x - s / 2, y - s * 1.5, s, s * 3); g.fillRect(x - s * 1.5, y - s / 2, s * 3, s); g.fillStyle = "#fff"; g.fillRect(x - s / 2, y - s / 2, s, s); g.globalAlpha = 1; }
function drawBallAnim(g, t, line, MX, MY, MR, now) {
  const m = ballAnim.master, bx = 140, by = 149, R = 24, /* posée au milieu du cercle de sol (.sPed : y 148 à 186) */ hy = MY - 40, fc = m ? "200,140,255" : "255,255,255";
  const ball = (x, y, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(.7, .7); drawBall(g, 0, 0, R / .7, m, 0, now); g.restore(); };
  if (t < 1.05) { // le Pokémon : normal, puis blanc et aspiré vers la balle
    const w = Math.min(1, Math.max(0, (t - .5) / .2)), e = Math.min(1, Math.max(0, (t - .62) / .38)), sc = 1 - e * e;
    if (sc > .01) {
      const c = BALL_TMP, dpr = g.getTransform().a;
      if (c.width !== g.canvas.width) { c.width = g.canvas.width; c.height = g.canvas.height; }
      const tg = c.getContext("2d"); tg.setTransform(dpr, 0, 0, dpr, 0, 0); tg.globalCompositeOperation = "source-over"; tg.clearRect(0, 0, 280, 210);
      tg.save(); tg.translate(MX, MY + (hy - MY) * e); tg.scale(sc, sc); tg.translate(-MX, -MY); drawMon(tg, line === "magicarpe" ? "magicarpe_s" : line, MX, MY, MR, false, now / 1000, 0, 1, e === 0); tg.restore();
      if (w > 0) { tg.setTransform(1, 0, 0, 1, 0, 0); tg.globalCompositeOperation = "source-atop"; tg.fillStyle = `rgba(${m ? "235,215,255" : "255,255,255"},${w})`; tg.fillRect(0, 0, c.width, c.height); }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(c, 0, 0); g.restore();
    }
  }
  if (t < .5) { // lancer : arc depuis la gauche jusqu'au Pokémon, la balle tourne sur elle-même
    const k = t / .5, x = -20 + (MX + 20) * k, y = hy - Math.sin(k * Math.PI) * 70 + (1 - k) * 30;
    ball(x, y, k * Math.PI * 4);
  } else if (t < 1.05) { // elle reste en l'air devant le Pokémon, dans la lumière qui l'aspire
    const k = (t - .5) / .55; ball(MX, hy + Math.sin(k * Math.PI * 6) * 1.5);
    if (!ballAnim.hit) { ballAnim.hit = true; sfx("evo"); }
    g.save(); g.globalCompositeOperation = "lighter"; g.translate(MX, hy);
    const a = Math.sin(Math.min(1, k * 1.2) * Math.PI);
    for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4 + k * .3); g.fillStyle = `rgba(${fc},${.45 * a})`; g.fillRect(-1.5, 0, 3, 20 + 70 * a); }
    const fl = g.createRadialGradient(0, 0, 0, 0, 0, 20 + 70 * a); fl.addColorStop(0, `rgba(${fc},${.9 * a})`); fl.addColorStop(1, `rgba(${fc},0)`); g.fillStyle = fl; g.fillRect(-150, -150, 300, 300); g.restore();
  } else if (t < 1.35) { // la balle tombe au sol et rebondit
    const k = (t - 1.05) / .3, y = k < .7 ? hy + (by - hy) * (k / .7) ** 2 : by - Math.sin((k - .7) / .3 * Math.PI) * 10; ball(MX, y);
  } else if (t < 2.45) { // trois secousses, avec une pause entre chacune
    const u = (t - 1.35) / .37, n = Math.floor(u), f = u - n, rot = f < .55 ? Math.sin(f / .55 * Math.PI * 2) * .32 : 0;
    if (n !== ballAnim.wob && n < 3) { ballAnim.wob = n; sfx("chest"); }
    g.save(); g.translate(bx, by + 27); g.rotate(rot); g.translate(-bx, -by - 27); ball(bx, by); g.restore();
  } else { // clic : étoiles qui jaillissent
    if (!ballAnim.click) { ballAnim.click = true; sfx("ach"); }
    const k = Math.min(1, (t - 2.45) / .4); ball(bx, by);
    for (const [dx, dy, c] of [[-1, -1, "#ffe066"], [0, -1.3, "#ffffff"], [1, -1, "#9ad8ff"]]) pixStar(g, bx + dx * 34 * k, by - 10 + dy * 30 * k, 3, 1 - k * k, m ? "#e0a8ff" : c);
    if (t > 3.05) { const l = ballAnim.line; ballAnim = null; pickStarter(l); }
  }
}
function drawPreviews(now) {
  if (state === "menu") {
    // Canvas à la taille affichée et sprite agrandi d'un nombre entier de fois (×4) : pixels nets et réguliers
    const c = $("sBig"), dpr = Math.min(2, Math.round(devicePixelRatio || 1)) || 1;
    if (c.width !== 280 * dpr) { c.width = 280 * dpr; c.height = 210 * dpr; }
    const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, 280, 210);
    const line = ballAnim ? ballAnim.line : carLine, sp = sheetFor(line, 0), MX = 140, MY = sp ? 142 : 140, MR = sp ? 28 : 46; // ×4
    if (!ballAnim) drawMon(g, line === "magicarpe" ? "magicarpe_s" : line, MX, sp ? MY : MY + Math.sin(now / 300) * 3, MR, false, now / 1000, 0, 1, true);
    else drawBallAnim(g, (now - ballAnim.t0) / 1000, line, MX, MY, MR, now);
    for (const id of ["sPrev", "sNext"]) {
      const el = $(id), l = el.dataset.l; if (!l) continue; const cc = el.querySelector("canvas"), gg = cc.getContext("2d"), sp2 = sheetFor(l, 0);
      if (cc.width !== 150 * dpr) { cc.width = 150 * dpr; cc.height = 112 * dpr; }
      gg.setTransform(dpr, 0, 0, dpr, 0, 0); gg.clearRect(0, 0, 150, 112); drawMon(gg, l === "magicarpe" ? "magicarpe_s" : l, 75, sp2 ? 64 : 66, sp2 ? 14 : 30, false, now / 1000, 0, 1, true); // ×2
    }
  }
  requestAnimationFrame(drawPreviews);
}
setLevel(0);
achCheck(); refreshLocks();
// multijoueur local (2 à 4) : chaque joueur choisit son starter à tour de rôle
let NPL = 1, picks = [];
function mpHint() {
  const el = $("mpTag"); el.hidden = NPL === 1; if (NPL === 1) return;
  const g = padList().length, need = NPL - 1;
  el.textContent = `👥 Joueur ${picks.length + 1} sur ${NPL} : choisis ton starter` + (picks.length ? ` (déjà pris : ${picks.map(l => LINES[l].names[0]).join(", ")})` : "")
    + ` · J1 au clavier, ${NPL === 2 ? "J2" : `J2 à J${NPL}`} à la manette (${Math.min(g, NPL)}/${g >= NPL ? NPL : need} détectée${g > 1 ? "s" : ""}${g < need ? " : appuie sur un bouton de chaque manette" : ""})`;
}
function setPlayers(n) { NPL = n; picks = []; $("mpBtn").textContent = `👥 ${n} joueur${n > 1 ? "s" : ""}`; $("mpBtn").setAttribute("aria-pressed", String(n > 1)); mpHint(); }
// Mobile : plein écran (et paysage verrouillé si le navigateur le permet) au lancement d'une partie
const TOUCH = matchMedia("(pointer: coarse)").matches;
function goFull() {
  const d = document, el = d.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
  if (!req || d.fullscreenElement || d.webkitFullscreenElement) return;
  try { const pr = req.call(el, { navigationUI:"hide" }); if (pr && pr.then) pr.then(() => screen.orientation?.lock?.("landscape").catch(() => {})).catch(() => {}); } catch (e) {}
}
if (TOUCH && (document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen)) {
  $("fsBtn").hidden = false; $("fsBtn").addEventListener("click", goFull);
}
function pickStarter(line) {
  if (!isUnlocked(line)) return;
  if (TOUCH) goFull();
  if (NET.role) return netPick(line);
  if (NPL === 1) return newGame(line);
  picks.push(line);
  if (picks.length < NPL) { mpHint(); return; }
  const p = picks; picks = []; mpHint(); newGame(p);
}
$("mpBtn").addEventListener("click", () => setPlayers(NPL % 4 + 1));
window.addEventListener("gamepadconnected", () => mpHint()); window.addEventListener("gamepaddisconnected", () => mpHint());
requestAnimationFrame(drawPreviews);
