/* ---------- HUD ---------- */
let hudCache = "", bossKey = "", hudPortKey = "";
let hudCd = {}, hudCdT = {}, hudLv = {}, hudNew = {}, hudLastT = 1e9; // recharge max vue, niveau précédent et mise en avant (N.2 !) de chaque capacité ; remis à zéro quand le chrono repart
function hudPortrait() { // sprite du Pokémon dans le rond du cadre (redessiné quand il évolue ou que la planche arrive)
  const k = pKind(), sh = sheetFor(k, S.P.stage), key = k + S.P.stage + !!sh;
  if (key === hudPortKey) return; hudPortKey = key;
  const g = $("hudPort").getContext("2d"); g.clearRect(0, 0, 64, 64); g.imageSmoothingEnabled = false;
  if (!sh) return;
  const b = sheetBox(sh), sc = Math.min(52 / b.h, 52 / b.w, 3);
  g.drawImage(sh.img, b.x0, b.y0, b.w, b.h, 32 - b.w * sc / 2, 36 - b.h * sc / 2, b.w * sc, b.h * sc);
}
function refreshHud() {
  const P = S.P, pct = P.hp / P.maxHp, ty = P.eform ? EEVEE[P.eform].type : LINES[P.line].type;
  $("hudName").textContent = pTag() + pName(); $("hudName").style.color = S.players.length > 1 ? PCOL[P.idx] : ""; $("hudLvl").textContent = P.lvl;
  if ($("hudBox").dataset.ty !== ty) { $("hudBox").dataset.ty = ty; $("hudBox").style.setProperty("--tc", TYPE_COLORS[ty]); $("hudType").innerHTML = typeIcon(ty); }
  hudPortrait();
  const fill = $("hpFill"); fill.style.width = (Math.max(0, pct) * 100) + "%";
  fill.style.background = pct > .5 ? "var(--hp)" : pct > .2 ? "var(--hp-low)" : "var(--hp-crit)";
  $("hudBox").classList.toggle("low", pct <= .2 && P.hp > 0);
  $("hpText").textContent = `${Math.ceil(P.hp)} / ${P.maxHp}`;
  $("hudTime").textContent = fmt(S.t); $("hudKills").textContent = S.kills;
  $("xpFill").style.width = (P.xp / P.need * 100) + "%";
  if (S.t + 1 < hudLastT) { hudCd = {}; hudCdT = {}; hudLv = {}; hudNew = {}; hudCache = ""; } hudLastT = S.t;
  const moves = realMoves(P);
  for (const [id, m] of moves) { // une capacité qui monte de niveau (ou qui arrive) est mise en avant 2,5 s
    if (hudLv[id] !== undefined && hudLv[id] !== m.lv) hudNew[id] = { until:S.t + 2.5, txt:`N.${m.lv} !` };
    else if (hudLv[id] === undefined && hudCache) hudNew[id] = { until:S.t + 2.5, txt:"Nouvelle !" };
    hudLv[id] = m.lv;
  }
  const isNew = id => hudNew[id] && S.t < hudNew[id].until;
  const pips = (lv, max) => `<span class="hbPips">${Array.from({ length:max }, (_, k) => `<i${k < lv ? ` class="on"` : ""}></i>`).join("")}</span>`;
  const mv = moves.map(([id, m]) => { const M = MOVES[id], nw = isNew(id);
      return `<span class="hbMv${nw ? " new" : ""}" data-mv="${id}" style="--t:${TYPE_COLORS[M.type]}" title="${M.name} N.${m.lv}${m.cur?.length ? ` : ${m.cur.map(c => MOVES[c].name).join(" + ")}` : ""}">`
        + `<span class="hbIco">${typeIcon(M.type)}</span><b>${M.name}</b>${pips(m.lv, M.max || 5)}${nw ? `<span class="hbToast">${hudNew[id].txt}</span>` : ""}</span>`; }).join("")
    + (Object.keys(P.items).length ? `<span class="hbSep"></span>` : "")
    + Object.entries(P.items).map(([id, lv]) => `<span class="hbIt" title="${ITEMS[id].name} ${lv}">${itemIcon(id, "")}<b>${lv}</b></span>`).join("");
  if (mv !== hudCache) { $("hudMoves").innerHTML = mv; hudCache = mv; }
  for (const el of $("hudMoves").children) { const id = el.dataset.mv, m = id && P.moves[id]; if (!m) continue; // recharge : secteur sombre qui se vide
    const t = Math.max(0, m.t || 0); if (!(t <= hudCd[id]) || t > (hudCdT[id] ?? 0) + .05) hudCd[id] = Math.max(t, .01); hudCdT[id] = t;
    el.firstChild.style.setProperty("--cd", Math.min(1, t / hudCd[id]) * 360 + "deg"); }
  for (let k = 1; k <= 3; k++) { // panneaux de J2, J3 et J4, empilés sous celui de J1
    const el = $("pp" + k), Q = S.players.filter(p => p !== S.P)[k - 1] || null, me = S.P;
    el.hidden = !Q; if (!Q) continue;
    S.P = Q; const name = pName(); S.P = me;
    const q = Math.max(0, Q.hp / Q.maxHp), col = q > .5 ? "var(--hp)" : q > .2 ? "var(--hp-low)" : "var(--hp-crit)";
    const mvs = Object.entries(Q.moves).map(([id, m]) => `<span class="move" style="--c:${TYPE_COLORS[MOVES[id].type]}">${MOVES[id].name} ${m.lv}</span>`).join("")
      + Object.entries(Q.items).map(([id, lv]) => `<span class="move item" style="--c:#e8e2c8">${itemIcon(id)}${ITEMS[id].name} ${lv}</span>`).join("");
    const key = name + Q.lvl + mvs + !!Q.down;
    if (el.dataset.key !== key) {
      el.dataset.key = key; el.style.setProperty("--c", PCOL[Q.idx]); el.classList.toggle("down", !!Q.down);
      el.innerHTML = `<div class="who-name"><span><span class="tagJ">J${Q.idx + 1}</span> · ${name}${Q.down ? " (K.O.)" : ""}</span><span class="lvl">N.${Q.lvl}</span></div>`
        + `<div class="hp-row"><div class="bar"><i></i></div><b></b></div><div class="xpmini"><i></i></div><div class="moves">${mvs}</div>`;
    }
    const fi = el.querySelector(".bar > i"); fi.style.width = (q * 100) + "%"; fi.style.background = col;
    el.querySelector(".hp-row b").textContent = `${Math.ceil(Q.hp)}/${Q.maxHp}`;
    el.querySelector(".xpmini > i").style.width = (Q.xp / Q.need * 100) + "%";
  }
  const bosses = S.foes.filter(f => (f.d.boss || f.d.mini || f.d.event || f.d.mother) && f.hp > 0);
  if (bosses.length) {
    $("boss").hidden = false;
    const key = bosses.map(b => b.kind).join();
    if (key + scopeOn() !== bossKey) { bossKey = key + scopeOn(); $("boss").innerHTML = bosses.map(b => `<div><span>${foeName(b.d)}</span><div class="bar"><i></i></div></div>`).join(""); }
    $("boss").querySelectorAll("i").forEach((el, k) => { el.style.width = Math.max(0, bosses[k].hp / bosses[k].maxHp * 100) + "%"; });
  }
  else $("boss").hidden = true;
}

