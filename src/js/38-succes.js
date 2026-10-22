/* ---------- Écran Succès : vitrine par thèmes (v184) ---------- */
// Grille de cartes (sprite du Pokémon lié, cadre bronze/argent/or selon la récompense, barre de progression),
// onglets de thèmes et filtres Tous / À faire / Obtenus. Les succès secrets restent des « ??? » tant qu'ils sont cachés.
const ACH_ICON = { pika50:["pikachu"], money:["rmiaouss"], surv5:["roucool"], boss:["ronflex"], nohit:["spectrum"], evo:["feu", 2], move5:["pika", 2],
  kills1k:["mackogneur"], win1:["papilusion"], win2:["melodelfe"], win3:["evoli"], win4:["ossatueur", 0, "spirit"], win5:["kangourex"], win6:["smogogo"],
  win7:["artikodin"], win8:["alakazam"], win9:["mew"], win10:["chetiflor"], togepi:["togepi"], mewtwo:["mewtwo"], legend:["electhor"],
  draco:["minidraco"], nuzwin:["fantominus"], shiny:["pika_s", 1], spiky:["pichuspiky"] }; // items6 : image du sac (ACH_BAG)
const ACH_BAG = new Image(); ACH_BAG.src = "data:image/png;base64,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"; // icône « Sac plein » fournie par Raphaël (58×58)
const ACH_CATS = [
  { id:"kanto", name:"Aventure Kanto", icon:"win8", ids:["win1", "win2", "win3", "win4", "win5", "win6", "win7", "win8"] },
  { id:"secret", name:"Secrets & Johto", icon:"win9", ids:["win9", "win10", "togepi"] },
  { id:"combat", name:"Combat", icon:"boss", ids:["surv5", "boss", "nohit", "kills1k", "mewtwo", "legend"] },
  { id:"collec", name:"Collection", icon:"pika50", ids:["pika50", "money", "evo", "move5", "items6", "draco", "shiny"] },
  { id:"defis", name:"Défis", icon:"nuzwin", ids:["nuzwin", "spiky"] },
];
// Meilleurs scores d'une partie, pour les barres de « Hécatombe » et « Sac plein » (sur cet appareil)
let achRec = {}; try { achRec = JSON.parse(localStorage.getItem("pokesurv-achrec") || "{}") || {}; } catch (e) {}
function achRecord(k, v) { if (v > (achRec[k] || 0)) { achRec[k] = v; try { localStorage.setItem("pokesurv-achrec", JSON.stringify(achRec)); } catch (e) {} } }
const achProg = { pika50:() => [dexKills.pikachu || 0, 50, ""], money:() => [moneyEarned(), 1000, ""],
  kills1k:() => [achRec.ko || 0, 1000, "record : "], items6:() => [achRec.items || 0, 6, "record : "] };
const achShown = a => !a.secret || achs[a.id] || (a.id === "win10" || a.id === "togepi" ? achs.win9 : achs.win8); // même règle qu'avant la v184
const achRank = a => a.reward >= 100 ? "or" : a.reward >= 30 ? "argent" : "bronze";
const ACH_IMG = {};
function achIcon(id) {
  if (ACH_IMG[id]) return ACH_IMG[id];
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  if (!ACH_ICON[id]) { if (!ACH_BAG.complete) return ACH_BAG.src; g.drawImage(ACH_BAG, 3, 3); return ACH_IMG[id] = c.toDataURL(); }
  const [k, st = 0, fx] = ACH_ICON[id], sh = sheetFor(k, st); if (!sh) return "";
  if (fx === "spirit") { g.globalAlpha = .8; g.filter = "grayscale(1) brightness(1.6) drop-shadow(0 0 4px rgba(140,180,255,.9))"; } // esprit de la Mère Ossatueur, comme en jeu
  const b = sheetBox(sh), sc = Math.min(56 / b.h, 56 / b.w, 3);
  g.drawImage(sh.img, b.x0, b.y0, b.w, b.h, 32 - b.w * sc / 2, 32 - b.h * sc / 2, b.w * sc, b.h * sc);
  return ACH_IMG[id] = c.toDataURL();
}
const ACH_UI = { cat:"all", filter:"all" };
const fr = n => n.toLocaleString("fr-FR");
function achCard(a) {
  const ok = !!achs[a.id], hid = !achShown(a), r = achRank(a), p = !ok && !hid && achProg[a.id] && achProg[a.id]();
  const bar = p ? `<i class="acBar"><i style="width:${Math.min(100, p[0] / p[1] * 100)}%"></i></i><span class="acProg">${p[2]}${fr(Math.min(p[0], p[1]))} / ${fr(p[1])}</span>` : "";
  const unl = a.unlock && !hid ? `<span class="acUnl">Débloque ${unlockNames(a)}</span>` : "";
  return `<div class="acCard ${r} ${ok ? "ok" : "todo"}"><span class="acIco ${ok ? "" : hid ? "sil" : "off"}"><img src="${achIcon(a.id)}" alt=""></span>`
    + `<div class="acTxt"><b>${hid ? "???" : a.name}</b><small>${hid ? "Succès secret : continue d'explorer…" : a.desc}</small>${unl}${bar}</div>`
    + `<div class="acRew"><span class="acMed">${r === "or" ? "OR" : r === "argent" ? "ARG" : "BRZ"}</span>${hid ? "?" : a.reward} ₽${ok ? "<em>✓ Obtenu</em>" : ""}</div></div>`;
}
function renderAch() {
  const all = ACHS.filter(a => achs[a.id]).length;
  $("achSub").innerHTML = `<span class="acGlobal"><b>${all}</b> / ${ACHS.length} succès <i class="acBar big"><i style="width:${all / ACHS.length * 100}%"></i></i></span><span class="acMoney"><b>${fr(achMoney())} ₽</b> gagnés</span>`;
  const n = c => c.ids.filter(id => achs[id]).length, cat = ACH_CATS.find(c => c.id === ACH_UI.cat);
  const tab = (id, name, ico, got, tot, sil) => `<button type="button" class="acTab ${ACH_UI.cat === id ? "on" : ""}" data-cat="${id}">${ico ? `<img class="${sil ? "sil" : ""}" src="${ico}" alt="">` : ""}<span>${name}<i class="acBar"><i style="width:${got / tot * 100}%"></i></i></span><b>${got}/${tot}</b></button>`;
  const tabs = tab("all", "Tous", "", all, ACHS.length) + ACH_CATS.map(c => tab(c.id, c.name, achIcon(c.icon), n(c), c.ids.length, !achShown(ACHS.find(a => a.id === c.icon)))).join("");
  const list = (cat ? cat.ids.map(id => ACHS.find(a => a.id === id)) : ACHS).filter(Boolean);
  const todo = list.filter(a => !achs[a.id]).length;
  const chip = (id, txt) => `<button type="button" class="acChip ${ACH_UI.filter === id ? "on" : ""}" data-filter="${id}">${txt}</button>`;
  const shown = list.filter(a => ACH_UI.filter === "all" || (ACH_UI.filter === "todo") === !achs[a.id]).sort((x, y) => !!achs[x.id] - !!achs[y.id]);
  $("achList").innerHTML = `<div class="acTabs">${tabs}</div><div class="acChips">${chip("all", `Tous · ${list.length}`)}${chip("todo", `À faire · ${todo}`)}${chip("done", `Obtenus · ${list.length - todo}`)}</div>`
    + `<div class="acGrid">${shown.map(achCard).join("") || `<p class="acEmpty">${ACH_UI.filter === "todo" ? "Tout est obtenu ici, bravo !" : "Rien d'obtenu ici pour l'instant."}</p>`}</div>`;
}
$("achList").addEventListener("click", e => {
  const t = e.target.closest("[data-cat], [data-filter]"); if (!t) return;
  if (t.dataset.cat) ACH_UI.cat = t.dataset.cat; else ACH_UI.filter = t.dataset.filter;
  renderAch(); sfx("click");
});
