/* ---------- Écran Succès : vitrine par thèmes (v184) ---------- */
// Grille de cartes (sprite du Pokémon lié, cadre bronze/argent/or selon la récompense, barre de progression),
// onglets de thèmes et filtres Tous / À faire / Obtenus. Les succès secrets restent des « ??? » tant qu'ils sont cachés.
const ACH_ICON = { pika50:["pikachu"], money:["rmiaouss"], surv5:["roucool"], boss:["ronflex"], nohit:["spectrum"], evo:["feu", 2], move5:["pika", 2],
  kills1k:["mackogneur"], win1:["papilusion"], win2:["nosferalto"], win3:["evoli"], win4:["ectoplasma"], win5:["rhinocorne"], win6:["smogogo"],
  win7:["artikodin"], win8:["alakazam"], win9:["mew"], win10:["chetiflor"], togepi:["togepi"], mewtwo:["mewtwo"], legend:["electhor"],
  draco:["minidraco"], nuzwin:["fantominus"], shiny:["pika_s", 1], spiky:["pichuspiky"] }; // items6 : Poké Ball dessinée
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
  if (!ACH_ICON[id]) { pokeBallIcon(g, 32, 32, 20); return ACH_IMG[id] = c.toDataURL(); }
  const [k, st = 0] = ACH_ICON[id], sh = sheetFor(k, st); if (!sh) return "";
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
