/* ---------- Fin ---------- */
function fmt(t) { const s = Math.floor(t); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; }
function dmgTableHtml(who) {
  const me = S.P; if (who) S.P = who; // à plusieurs : les dégâts du joueur indiqué
  try { return dmgTableFor(S.players.length > 1 ? S.P.dmgBy : S.dmgBy); } finally { S.P = me; }
}
const dmgSum = p => Object.values(p.dmgBy || {}).reduce((a, v) => a + (+v || 0), 0);
function mvpScore(p, tot) { return dmgSum(p) / (tot || 1) * 100 + 12 * (p.saves || 0) - 8 * (p.deaths || 0); }
function teamHtml() { // récap de fin à plusieurs : une ligne par joueur, le MVP en avant
  if (!S || !S.players || S.players.length < 2) return "";
  const me = S.P, tot = S.players.reduce((a, p) => a + dmgSum(p), 0) || 1;
  const mvp = S.players.slice().sort((a, b) => mvpScore(b, tot) - mvpScore(a, tot))[0];
  const rows = S.players.map(p => {
    S.P = p; const isM = p === mvp, pct = dmgSum(p) / tot * 100;
    return `<tr${isM ? ' class="mvpRow"' : ""}><td><span class="dot" style="background:${PCOL[p.idx]}"></span><b style="color:${PCOL[p.idx]}">J${p.idx + 1}</b> ${netEsc(pName())}${isM ? ' <span class="mvpTag">👑 MVP</span>' : ""}</td>
      <td>N.${p.lvl}</td><td>${Math.round(dmgSum(p)).toLocaleString("fr-FR")} <small>${pct.toFixed(0)} %</small></td><td>${p.kos || 0}</td><td>${p.deaths || 0}</td><td>${p.revived || 0}</td><td>${p.saves || 0}</td></tr>`;
  }).join("");
  S.P = mvp; const mvpLine = `<div class="mvpBanner">👑 MVP : <b style="color:${PCOL[mvp.idx]}">J${mvp.idx + 1} · ${netEsc(pName())}</b></div>`; S.P = me;
  return mvpLine + `<table class="dmgTable teamTable"><thead><tr><th>Joueur</th><th>Niv.</th><th>Dégâts</th><th>K.O. infligés</th><th>Morts</th><th>Résurrections</th><th>Coéquipiers relevés</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function dmgTableFor(dmgBy) {
  const by = { ...(dmgBy || {}) }; for (const id in S.P.moves) by[id] ||= 0;
  const tot = Object.values(by).reduce((a, b) => a + b, 0) || 1;
  const rows = Object.entries(by).filter(([id, v]) => v >= 1 || S.P.moves[id]).sort((a, b) => b[1] - a[1]).map(([id, v]) => {
    const m = MOVES[id], name = m ? m.name : id === "brulure" ? "Brûlure" : "Autre", col = m ? TYPE_COLORS[m.type] : id === "brulure" ? TYPE_COLORS.feu : "#c8c8c8";
    const lv = S.P.moves[id]?.lv, since = S.P.moves[id]?.since || 0, secs = Math.max(1, S.t - since), pct = v / tot * 100;
    return `<tr><td><span class="dot" style="background:${col}"></span>${name}${lv ? ` <small>N.${lv}</small>` : ""}</td><td>${Math.round(v).toLocaleString("fr-FR")}</td>
      <td><span class="bar"><i style="width:${pct}%;background:${col}"></i></span>${pct.toFixed(0)} %</td><td>${m ? (v / secs).toFixed(1) : "–"}</td></tr>`;
  }).join("");
  return rows ? `<table class="dmgTable"><thead><tr><th>Capacité</th><th>Dégâts</th><th>Part</th><th>Dégâts/s</th></tr></thead><tbody>${rows}</tbody></table>` : "";
}
function statsHtml() {
  return `<div><b>${fmt(S.t)}</b>temps</div><div><b>${S.kills}</b>K.O.</div><div><b>N.${S.P.lvl}</b>${pName()}</div><div><b>${NET.role === "guest" ? NET.earned : S.earned || 0} ₽</b>Pokédollars</div>` + (S.nuz ? `<div><b>💀</b>Nuzlocke</div>` : "");
}
function endGame(win) {
  achCheck(win); if (win && S.orme?.ok) teamAch("togepi"); state = "end"; dexSave(); playTrack(null); sfx(win ? "win" : "lose");
  careerRecord(NET.role === "host" ? [S.players[0]] : S.players, win);
  const lv = LEVEL;
  if (win && LEVELS[lv.num]) setLevel(lv.num);
  $("endTitle").textContent = win ? lv.title : S.quit ? "Partie abandonnée" : S.players.length > 1 ? "Toute l'équipe est K.O. !" : `${pName()} est K.O. !`;
  $("endSub").textContent = win ? `${pName()} ${lv.win}` : S.quit ? "Tu rentres au Centre Pokémon. Tes K.O. comptent quand même dans le Pokédex." : "Tu t'es précipité au Centre Pokémon le plus proche. Retente ta chance.";
  $("endStats").innerHTML = statsHtml() + (S.achMsgs?.length ? `<div class="achEnd">${S.achMsgs.join("<br>")}</div>` : "");
  if (win && lv.league) hallOfFame();
  if (win && S.orme?.ok) eggHatch((S.achMsgs || []).some(m => m.includes("Togepi")));
  $("endDmg").innerHTML = teamHtml() + (S.players.length > 1 ? `<h3 class="dmgFor">Tes dégâts (${pTag(S.players[0])}${(S.P = S.players[0], pName())})</h3>` : "") + dmgTableHtml(S.players[0]);
  $("end").hidden = false; $("boss").hidden = true; $("netWait").hidden = true; $("levelup").hidden = true; $("chest").hidden = true; $("lgInter").hidden = true; $("beastPick").hidden = true;
  if (NET.role === "host") { netDexFlush(); netAll("S" + netSnap()); netAll({ t:"end", win, title:$("endTitle").textContent, sub:$("endSub").textContent }); }
  $("againBtn").focus({ preventScroll:true });
}
function hallOfFame() { // Ligue Indigo gagnée : le Pokémon entre au Panthéon
  const P = S.P = S.players[0], ent = { n:pName(), k:pKind(), st:P.stage, lvl:P.lvl, t:Math.round(S.t), mv:realMoves(P).map(e => MOVES[e[0]].name), d:Date.now() };
  let hof = []; try { hof = JSON.parse(localStorage.getItem("pokesurv-hof") || "[]"); } catch (e) {}
  if (!Array.isArray(hof)) hof = [];
  hof.push(ent); hof.sort((a, b) => a.t - b.t); hof = hof.slice(0, 10);
  try { localStorage.setItem("pokesurv-hof", JSON.stringify(hof)); } catch (e) {}
  const best = hof[0], html = `<div class="hof"><canvas id="hofCv" width="160" height="160"></canvas><div><b class="hofT">🏆 Panthéon</b>${ent.n} · N.${ent.lvl} · ${fmt(ent.t)}`
    + `<small>${ent.mv.join(" · ")}</small><small>${best === ent ? "Nouveau record de la Ligue !" : `Record : ${best.n}, ${fmt(best.t)}`}</small>`
    + (career[P.line] ? (T => `<small>Avec ${LINES[P.line].names[0]}, niveaux 1 à 8 : ${fmtH(T.t)} de jeu · ${nFr(T.dmg)} dégâts · ${nFr(T.ko)} K.O.</small>`)(careerTot(career[P.line])) : "") + `</div></div>`;
  $("endStats").insertAdjacentHTML("afterbegin", html);
  const g = $("hofCv").getContext("2d"); g.fillStyle = "rgba(246,200,69,.14)"; g.beginPath(); g.arc(80, 80, 74, 0, Math.PI * 2); g.fill();
  drawMon(g, ent.k, 80, 78, 26, false, 0, ent.st, 0, false);
}
function togglePause() {
  if (AU.music) AU.music.gain.value = state === "play" ? .04 : .13;
  if (state === "play") { state = "pause"; $("pauseStats").innerHTML = statsHtml(); $("pauseDmg").innerHTML = teamHtml() + dmgTableHtml(S.players[0]); $("pause").hidden = false; $("resumeBtn").focus({ preventScroll:true }); }
  else if (state === "pause") { state = "play"; $("pause").hidden = true; last = performance.now(); }
}


