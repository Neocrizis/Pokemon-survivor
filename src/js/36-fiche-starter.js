/* Évoli : la liste des évolutions vient d'EEVEE, donc une nouvelle forme ajoutée là apparaît ici toute seule (4 par ligne au-delà de 4).
   Fiche du starter, version modernisée : stats en hexagone (avec la moyenne des starters en pointillés),
   évolution en images, icônes rondes pour les types d'attaque. Se greffe sur renderCar (28-ecran-titre.js). */
const STAT_AX = ["PV", "Attaque", "Vitesse", "Recharge", "Critique", "Régén."];
const statF = L => [L.hp / 56, (L.dmg || 1) / 1.2, (L.speed - 135) / 45, (100 / (L.cd || 1) - 70) / 45, (L.crit || 0) / .2, (L.regen || 0) / .8].map(f => Math.max(0, Math.min(1, f)));
const statV = L => [L.hp, Math.round(100 * (L.dmg || 1)), L.speed, Math.round(100 / (L.cd || 1)), `${Math.round(100 * (L.crit || 0))} %`, String(L.regen || 0).replace(".", ",")];
const statUp = L => [false, (L.dmg || 1) > 1, false, (L.cd || 1) < 1, !!L.crit, !!L.regen];
const TYPE_ICON = { // pictogrammes 24×24, en blanc sur la couleur du type
  feu:"M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1 2 2 3 3 3 0-3-1-4 0-6z", eau:"M12 3c3 5 6 8 6 11a6 6 0 0 1-12 0c0-3 3-6 6-11z",
  plante:"M5 20C4 11 10 4 20 4c0 10-6 16-15 16zm2-2c3-4 6-7 9-9-4 1-7 4-9 9z", electrik:"M13 2L5 14h6l-2 8 9-13h-6l1-7z",
  normal:"M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16zm0 4a4 4 0 1 1 0 8 4 4 0 1 1 0-8z", vol:"M3 15c5-1 9-5 18-10-2 7-6 12-12 13z",
  insecte:"M12 4a3 4 0 1 1 0 8 3 4 0 1 1 0-8zm0 9a2.5 4 0 1 1 0 8 2.5 4 0 1 1 0-8z", poison:"M8 15a4 4 0 1 0 8 0 4 4 0 1 0-8 0zm5-8a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0zM5 9a2 2 0 1 0 4 0 2 2 0 1 0-4 0z",
  roche:"M7 4h10l4 8-4 8H7l-4-8z", sol:"M2 20l7-12 4 6 3-4 6 10z", combat:"M6 9h12v7a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4zM6 5h12v3H6z",
  fee:"M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z", dragon:"M4 4c6 0 12 4 16 16-5-4-9-5-12-4 1-4 0-8-4-12z",
  spectre:"M12 3a7 7 0 0 1 7 7v11l-2.5-2-2.3 2-2.2-2-2.2 2-2.3-2L5 21V10a7 7 0 0 1 7-7z", psy:"M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7zm10-3a3 3 0 1 0 0 6 3 3 0 1 0 0-6z",
  tenebres:"M15 3a9 9 0 1 0 6 15A7 7 0 0 1 15 3z", glace:"M11 2h2v20h-2zM2.3 7l1-1.7 18.4 10.6-1 1.7zM2.3 17L20.7 6.3l1 1.7L3.3 18.7z", acier:"M12 2l9 5v10l-9 5-9-5V7zm0 6a4 4 0 1 0 0 8 4 4 0 1 0 0-8z" };
const typeIcon = t => `<span class="tyi" style="--t:${TYPE_COLORS[t] || "#888"}" title="${TYPE_NAMES[t] || t}"><svg viewBox="0 0 24 24"><path fill-rule="evenodd" d="${TYPE_ICON[t] || TYPE_ICON.normal}"/></svg></span>`;
const FICHE = { evo:[], ef:null, line:null };
function drawRadar(cv, L) {
  const dpr = Math.min(2, Math.round(devicePixelRatio || 1)) || 1, W = 300, H = 222; cv.width = W * dpr; cv.height = H * dpr;
  const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = W / 2, cy = H / 2 + 2, R = 64, pt = (k, f) => [cx + Math.sin(k * Math.PI / 3) * R * f, cy - Math.cos(k * Math.PI / 3) * R * f];
  const poly = (fs, fill, stroke, dash) => { g.beginPath(); fs.forEach((f, k) => { const [x, y] = pt(k, f); k ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.setLineDash(dash || []); g.strokeStyle = stroke; g.stroke(); g.setLineDash([]); } };
  g.lineWidth = 1; for (const r of [.25, .5, .75, 1]) poly(Array(6).fill(r), r === 1 ? "rgba(0,0,0,.04)" : null, "#d9cfb2");
  for (let k = 0; k < 6; k++) { const [x, y] = pt(k, 1); g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.strokeStyle = "#e2dac2"; g.stroke(); }
  const base = starterOrder.filter(l => !LINES[l].secret).map(l => statF(LINES[l])), avg = STAT_AX.map((_, k) => base.reduce((a, f) => a + f[k], 0) / base.length);
  g.lineWidth = 1.5; poly(avg, null, "#9a8f70", [4, 3]);
  const col = TYPE_COLORS[L.type], f = statF(L).map(v => Math.max(.04, v));
  g.lineWidth = 2.5; poly(f, col + "88", col);
  f.forEach((v, k) => { const [x, y] = pt(k, v); g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fillStyle = "#fff"; g.fill(); g.strokeStyle = col; g.lineWidth = 2; g.stroke(); });
  const vals = statV(L), ups = statUp(L);
  STAT_AX.forEach((n, k) => {
    const [x, y] = pt(k, 1.32), al = Math.abs(x - cx) < 4 ? "center" : x < cx ? "right" : "left";
    g.textAlign = al; g.textBaseline = "middle";
    g.font = "700 11px Outfit, sans-serif"; g.fillStyle = ups[k] ? "#c8402a" : "#5a5442"; g.fillText(n + (ups[k] ? " ▲" : ""), x, y - 7);
    g.font = "800 14px Outfit, sans-serif"; g.fillStyle = "#2a2a2a"; g.fillText(vals[k], x, y + 8);
  });
}
function evoStages(line) {
  const L = LINES[line];
  if (line === "mew") return null;
  if (line === "evoli") return [[line, 0, L.names[0], ""], ...Object.keys(EEVEE).map(k => [k, 0, EEVEE[k].name, `N.${EVO_LEVELS[0]}`])];
  const n = line === "miaouss" ? 2 : L.names.length;
  return L.names.slice(0, n).map((nm, s) => [line, s, nm, s ? `N.${(L.evoLevels || EVO_LEVELS)[s - 1]}` : "Départ"]);
}
// Évoli : clic sur une évolution = ses attaques dans le panneau de droite (même règle que buildChoices avec le type de l'évolution)
const formMoves = k => { const t = EEVEE[k].type;
  return Object.entries(MOVES).filter(([id, m]) => (!m.line || m.line === "evoli") && !m.tier && ((m.only && [].concat(m.only).includes(t)) || (m.also || []).includes("evoli") || id === EEVEE[k].move))
    .sort((a, b) => (b[0] === EEVEE[k].move) - (a[0] === EEVEE[k].move) || !!a[1].rare - !!b[1].rare); };
function showFormMoves(k) {
  FICHE.ef = FICHE.ef === k ? null : k;
  $("sTal").querySelectorAll(".evoCard").forEach(c => c.classList.toggle("on", c.dataset.k === FICHE.ef));
  if (!FICHE.ef) { renderCar(); return; }
  const mv = formMoves(k), E = EEVEE[k];
  $("sMvN").innerHTML = `<button type="button" class="mvBack">← Évoli</button> ${E.name} · ${mv.length}`;
  $("sMvN").querySelector(".mvBack").addEventListener("click", e => { e.stopPropagation(); FICHE.ef = null; renderCar(); });
  $("sMoves").classList.toggle("many", mv.length > 7);
  $("sMoves").innerHTML = mv.map(([id, m]) => { const d = m.desc(1).split(/(?<=\.) /)[0].replace(/\.$/, "");
    const tg = id === E.move ? `<span class="tg">Offerte au N.${EVO_LEVELS[0]}</span>` : m.rare ? `<span class="tg r">Rare N.${m.rare.minLvl}</span>` : "<span></span>";
    return `<div class="mv">${typeIcon(m.type)}<div><b>${m.name}</b><small>${d}</small></div>${tg}</div>`; }).join("");
  const pk = $("sMoves").closest(".pkbox"); pk.style.setProperty("--fc", TYPE_COLORS[E.type]); pk.classList.add("form");
}
function decorateFiche() {
  const line = carLine, L = LINES[line], box = $("sStats"); if (!box) return;
  if (FICHE.line !== line) { FICHE.line = line; FICHE.ef = null; }
  const pkm = $("sMoves").closest(".pkbox"); pkm.classList.remove("form");
  if (line === "magicarpe") {
    box.innerHTML = `<div class="unknownRadar">${Array.from({ length:6 }, () => "<span>???</span>").join("")}</div>`;
    $("sTal").innerHTML = "";
    return;
  }
  let cv = $("sRadar"); if (!cv) { cv = document.createElement("canvas"); cv.id = "sRadar"; }
  box.innerHTML = ""; box.appendChild(cv); drawRadar(cv, L);
  const t = TALENTS[line], st = evoStages(line);
  FICHE.evo = [];
  $("sTal").innerHTML = (t ? `<div class="talB"><b>${t[0]}</b><span>${t[1]}</span></div>` : "") +
    (line === "evoli" ? `<div class="evoEv"><div class="evoSt"><canvas width="96" height="80" data-k="evoli" data-s="0"></canvas><b>Évoli</b></div><div class="evoCh"><i class="evoAr">›</i><small>N.${EVO_LEVELS[0]}<br>au choix</small></div><div class="evoGrid${Object.keys(EEVEE).length > 4 ? " many" : ""}">${Object.keys(EEVEE).map(k => `<div class="evoCard" role="button" tabindex="0" title="${EEVEE[k].name} : ${EEVEE[k].bonus} Clic : voir ses attaques." data-k="${k}" style="--t:${TYPE_COLORS[EEVEE[k].type]}"><canvas width="64" height="56" data-k="${k}" data-s="0"></canvas><div><b>${EEVEE[k].name} ${typeIcon(EEVEE[k].type)}</b><small>${EEVEE[k].bonus.replace(/\.$/, "")}</small></div></div>`).join("")}</div></div>`
    : st ? `<div class="evoRow${st.length > 3 ? " many" : ""}">${st.map(([k, s, nm, lv], i) => `${i && st.length <= 3 ? '<i class="evoAr">›</i>' : ""}<div class="evoSt"><canvas width="96" height="80" data-k="${k}" data-s="${s}"></canvas><b>${nm}</b><small>${lv}</small></div>`).join("")}</div>`
        : `<div class="evoRow"><small class="evoNo">N'évolue pas : se renforce au N.${EVO_LEVELS[0]} et au N.${EVO_LEVELS[1]}.</small></div>`);
  $("sTal").querySelectorAll(".evoSt canvas, .evoCard canvas").forEach(c => FICHE.evo.push(c));
  $("sTal").querySelectorAll(".evoCard").forEach(c => { c.addEventListener("click", () => showFormMoves(c.dataset.k)); c.addEventListener("keydown", e => { if (e.key === "Enter") showFormMoves(c.dataset.k); }); });
  const mv = lineMoves(line);
  $("sMoves").querySelectorAll(".mv").forEach((row, i) => { const ty = row.querySelector(".ty"); if (ty && mv[i]) ty.outerHTML = typeIcon(mv[i][1].type); });
  $("sCar").querySelectorAll(".mv .tg.a").forEach(tg => { if (!/seulement/.test(tg.textContent)) tg.textContent += " seulement"; });
}
(function evoLoop(ts) {
  if (!$("start").hidden) for (const c of FICHE.evo) {
    const g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height);
    const r = c.width < 80 ? 8 : 9, size = c.dataset.k === "magicarpe" && +c.dataset.s > 0 ? 11.5 : r;
    drawMon(g, c.dataset.k, c.width / 2, c.height / 2 + 4, size, false, ts / 1000, +c.dataset.s, 0, false);
  }
  requestAnimationFrame(evoLoop);
})(0);
const _renderCarFiche = renderCar; renderCar = () => { _renderCarFiche(); decorateFiche(); };
renderCar();
