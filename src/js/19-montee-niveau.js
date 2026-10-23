/* ---------- Montée de niveau ---------- */
function buildChoices() {
  const P = S.P, pool = [];
  const owned = realMoves(P).map(e => e[0]);
  for (const [id, m] of Object.entries(MOVES)) {
    const cur = (!P.moves[id]?.tmp && P.moves[id]?.lv) || 0;
    if (P.line === "magicarpe" && (P.stage === 0 ? !cur : id === "cascade" || id === "magibulle")) continue; // Magicarpe : Trempette seule ; Léviator : pas de Cascade
    if (m.tier > 1 && !P.moves["metro" + (m.tier - 1)]) continue;
    if (cur >= m.max) continue;
    const alt = m.alt && P.line === m.alt.line && !P.spiky && (cur || P.stage === m.alt.stage);
    const also = (m.also || []).includes(P.line);
    if (m.only && ![].concat(m.only).includes(ptype()) && !alt && !also) continue;
    if (m.only && (LINES[P.line].own || LINES[P.line].restricted) && !also && !alt) continue; // starters à capacités limitées
    if (m.line && ![].concat(m.line).includes(P.line)) continue;
    if (!cur && owned.length >= MAX_MOVES()) continue;
    if (!cur && m.rare && P.lvl < m.rare.minLvl) continue;
    pool.push({ kind:"move", id, lv:cur + 1, w: cur ? 3 : alt ? m.alt.w : m.rare ? m.rare.w : 2 });
  }
  for (const [id, it] of Object.entries(ITEMS)) {
    const cur = P.items[id] || 0;
    if (!cur && Object.keys(P.items).length >= MAX_ITEMS) continue;
    if (S.nuz && id === "rappel") continue;
    if (cur < it.max) pool.push({ kind:"item", id, lv:cur + 1, w: cur ? 2 : 1.3 });
  }
  const out = [];
  while (out.length < 3 && pool.length) {
    const tot = pool.reduce((s, x) => s + x.w, 0); let r = Math.random() * tot, i = 0;
    for (; i < pool.length - 1; i++) if ((r -= pool[i].w) <= 0) break;
    out.push(pool.splice(i, 1)[0]);
  }
  if (!out.length) out.push({ kind:"heal" });
  return out;
}
function evolveEevee(id) {
  const P = S.P, E = EEVEE[id], from = pName();
  P.eform = id; P.etype = E.type; P.stage = 1; P.pendingEvo = false;
  P.maxHp += 30; P.hp = P.maxHp; P.dmgMul *= 1.15; P.r += 2; P.evoFlash = 1.2; E.apply(P);
  if (!P.moves[E.move] && Object.keys(P.moves).length < MAX_MOVES()) P.moves[E.move] = { lv:1, t:.3, since:S.t };
  sfx("evo"); banner(`Quoi ? ${from} évolue en ${E.name} !`);
  checkEvo(); // N.22 déjà atteint grâce à un coffre : se renforce aussitôt
}
function applyChoice(ch, p) {
  if (NET.role === "guest") { netSend({ t:"pick", i:choices.indexOf(ch) }); $("levelup").hidden = true; state = "netplay"; return; }
  p ||= S.chooser || S.P; S.P = p;
  if (ch.kind === "evo") evolveEevee(ch.id); else { grant(ch); p.pendingLv--; }
  doneChoosing(p);
}
function doneChoosing(p) { // fin d'un choix : en ligne, le joueur reste intangible 1 s
  if (p.choosing) { p.choosing = false; p.inv = Math.max(p.inv, 1); }
  if (p.remote) return; // choix fait sur l'écran d'un invité : rien à fermer ici
  S.chooser = null; $("levelup").hidden = true; $("chest").hidden = true; state = "play"; last = performance.now(); refreshHud();
}
const CHOOSE_T = 10; // en ligne : temps max pour choisir (sinon choix au hasard), contre la triche à l'intangibilité
function netChoices(dt) {
  for (const p of S.players) if (p.choosing && (p.chooseT = (p.chooseT ?? CHOOSE_T) - dt) <= 0) netTimeout(p);
  for (const p of S.players) {
    if (p.down || p.left || p.choosing) continue;
    const kind = p.pendingEvo ? "evo" : p.pendingLv > 0 ? "lv" : S.chestQ.includes(p) ? "chest" : null;
    if (!kind) continue;
    S.P = p;
    if (p.remote) { if (kind === "chest") netChest(p); else netAsk(p, kind); continue; }
    if (state !== "play") continue; // l'hôte a déjà un choix ouvert
    p.choosing = true; p.chooseT = CHOOSE_T; S.chooser = p;
    if (kind === "evo") openEvo(); else if (kind === "lv") openLevelUp(); else openChest(p);
    if (state === "play") { p.choosing = false; S.chooser = null; } // Super Potion prise automatiquement
  }
  S.P = S.players[0];
}
function grant(ch) {
  const P = S.P;
  if (ch.kind === "move") { if (P.moves[ch.id] && !P.moves[ch.id].tmp) P.moves[ch.id].lv++; else P.moves[ch.id] = { lv:1, t:.2, since:S.t }; }
  else if (ch.kind === "item") {
    P.items[ch.id] = ch.lv;
    if (ch.id === "carbone") P.dmgMul *= 1.12;
    if (ch.id === "orbevie") { P.dmgMul *= 1.04; P.cdMul *= .98; }
    if (ch.id === "pvplus") { P.maxHp += 20; P.hp = Math.min(P.maxHp, P.hp + 20); }
    if (ch.id === "vivegriffe") P.cdMul *= .92;
    if (ch.id === "restes") P.regen += .4;
    if (ch.id === "rappel") P.revives = (P.revives || 0) + 1;
  } else P.hp = Math.min(P.maxHp, P.hp + 40);
}
function openChest(who, remote) {
  // Coffre de boss : améliore 1, 3 ou 5 capacités / objets déjà possédés (comme dans Vampire Survivors)
  if (who) S.chestQ.splice(S.chestQ.indexOf(who), 1);
  const P = S.P = who || S.chestQ.shift() || S.P; if (!remote) { S.chooser = P; state = "chest"; sfx("chest"); }
  const r = Math.random(), n = r < .1 ? 5 : r < .4 ? 3 : 1, got = [];
  for (let i = 0; i < n; i++) {
    const pool = [...realMoves(P).filter(([id, m]) => m.lv < MOVES[id].max).map(([id, m]) => ({ kind:"move", id, lv:m.lv + 1 })),
                  ...Object.entries(P.items).filter(([id, lv]) => lv < ITEMS[id].max).map(([id, lv]) => ({ kind:"item", id, lv:lv + 1 }))];
    const ch = pool.length ? pool[Math.random() * pool.length | 0] : { kind:"heal" };
    grant(ch); got.push(ch);
  }
  if (remote) NET.lastChest = { n, got }; else showChest(n, got, P);
}
function showChest(n, got, P) {
  NET.lastChest = { n, got };
  $("chestTitle").textContent = n === 5 ? "Hyper Ball… 5 améliorations !" : n === 3 ? "Super Ball… 3 améliorations !" : "Poké Ball !"; if (S.players.length > 1) $("chestTitle").textContent = `Joueur ${P.idx + 1} · ` + $("chestTitle").textContent;
  $("chestSub").textContent = "Tu as trouvé une Poké Ball. Voici ce qu'elle contenait :";
  $("chestList").innerHTML = got.map((ch, i) => {
    const name = ch.kind === "move" ? MOVES[ch.id].name : ch.kind === "item" ? itemIcon(ch.id) + ITEMS[ch.id].name : itemIcon("superpotion") + "Super Potion";
    const tag = ch.kind === "heal" ? "+40 PV" : `Niveau ${ch.lv}`;
    return `<div class="chestRow" style="animation-delay:${1.5 + i * .35}s">${name}<small>${tag}</small></div>`;
  }).join("");
  $("chest").hidden = false; $("chestBtn").focus({ preventScroll:true });
}
function closeChest() { if (NET.role === "guest") { $("chest").hidden = true; state = "netplay"; netSend({ t:"chestok" }); return; } doneChoosing(S.chooser || S.P); }
let choices = [];
function reroll() { if (state !== "levelup" || !(S.rerolls > 0)) return; if (NET.role === "guest") { netSend({ t:"reroll" }); return; } S.rerolls--; S.P = S.chooser || S.P; openLevelUp(); }
function openEvo() {
  sfx("levelup"); state = "levelup"; $("autoPotRow").hidden = true;
  choices = Object.keys(EEVEE).map(id => ({ kind:"evo", id }));
  $("luTitle").textContent = `${pTag()}Quoi ? Évoli évolue !`;
  $("luSub").textContent = "Choisis son évolution : elle donne son type à Évoli et débloque les capacités de ce type.";
  const box = $("luCards"); box.innerHTML = "";
  choices.forEach((ch, i) => {
    const E = EEVEE[ch.id], col = TYPE_COLORS[E.type], b = document.createElement("button"); b.className = "card"; b.type = "button"; b.style.setProperty("--c", col);
    b.innerHTML = `<span class="key">${i+1}</span><canvas width="240" height="120" class="evoPrev"></canvas><div class="card-body"><span class="tag">Évolution</span><h3>${E.name} <span class="chip" style="--c:${col}">${TYPE_NAMES[E.type]}</span></h3><p>Apprend ${MOVES[E.move].name}. ${E.bonus}</p></div>`;
    b.addEventListener("click", () => applyChoice(ch)); box.appendChild(b);
    const c = b.querySelector("canvas"), g = c.getContext("2d"), kind = ch.id + (S.P.shiny ? "_s" : "");
    const draw = now => { if (state !== "levelup" || !c.isConnected) return; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 240, 120); drawMon(g, kind, 120, 56, 26, false, now / 1000, 1, 1, true); requestAnimationFrame(draw); };
    requestAnimationFrame(draw);
  });
  $("levelup").hidden = false; $("rerollBtn").hidden = true;
  box.querySelector("button")?.focus({ preventScroll:true });
}
let autoPotion = false; try { autoPotion = localStorage.getItem("pokesurv-autopotion") === "1"; } catch (e) {}
function openLevelUp(given) {
  if (!given && S.P.pendingEvo) return openEvo();
  const next = given || buildChoices(), onlyHeal = next.every(ch => ch.kind === "heal");
  if (onlyHeal && autoPotion && !given) { // tout est au maximum : la Super Potion est prise directement
    grant(next[0]); S.P.pendingLv--; sfx("heal");
    S.texts.push({ x:S.P.x, y:S.P.y - 34, txt:"Super Potion +40 PV", col:"#7fe08a", life:1.2, label:true });
    refreshHud(); return;
  }
  sfx("levelup");
  state = "levelup"; choices = next;
  $("autoPotRow").hidden = !onlyHeal; $("autoPot").checked = autoPotion;
  $("luTitle").textContent = `${pTag()}${pName()} monte au N.${S.P.lvl - S.P.pendingLv + 1} !`;
  $("luSub").textContent = Object.keys(S.P.moves).length >= MAX_MOVES() ? `${MAX_MOVES()} capacités maximum.` : "Choisis une capacité (CT) ou un objet (6 objets maximum).";
  const box = $("luCards"); box.innerHTML = "";
  choices.forEach((ch, i) => {
    const b = document.createElement("button"); b.className = "card"; b.type = "button";
    let title, tag, desc, col;
    if (ch.kind === "move") {
      const m = MOVES[ch.id]; col = TYPE_COLORS[m.type]; title = m.name;
      tag = ch.lv === 1 ? (m.rare ? "★ Capacité rare" : m.type === ptype() ? "Nouvelle capacité" : "CT · nouvelle capacité") : `Niveau ${ch.lv}`;
      desc = m.desc(ch.lv, S.P);
      title += ` <span class="chip" style="--c:${col}">${TYPE_NAMES[m.type]}</span>`;
    } else if (ch.kind === "item") {
      const it = ITEMS[ch.id]; col = "#e8e2c8"; title = itemIcon(ch.id, "ico big") + it.name; tag = `Objet · niveau ${ch.lv}`; desc = it.desc;
    } else { col = "#7fe08a"; title = itemIcon("superpotion", "ico big") + "Super Potion"; tag = "Soin"; desc = "Récupère 40 PV."; }
    b.style.setProperty("--c", col);
    b.innerHTML = `<span class="key">${i+1}</span><div class="card-body"><span class="tag">${tag}</span><h3>${title}</h3><p>${desc}</p></div>`;
    b.addEventListener("click", () => applyChoice(ch));
    box.appendChild(b);
  });
  $("levelup").hidden = false;
  const rb = $("rerollBtn"); rb.hidden = !(S.rerolls > 0); rb.textContent = `🎲 Relancer (${S.rerolls || 0}) · touche R / Y`;
  box.querySelector("button")?.focus({ preventScroll:true });
}
