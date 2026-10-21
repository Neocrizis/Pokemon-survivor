/* Écran de choix, version compacte : niveaux en badges d'arène, texte du niveau en une phrase (bouton « ? »),
   difficulté du starter en étiquette colorée. Se greffe sur setLevel et renderCar (28-ecran-titre.js). */
const BADGE_COL = lv => lv.league ? "224,176,64" : lv.secret ? "90,150,230" : lv.rocket ? "200,64,64" : lv.manor ? "210,100,50" : lv.safari ? "200,160,64" : lv.tower ? (lv.sprout ? "190,140,80" : "150,110,190") : lv.maps ? "90,170,220" : lv.cave ? "140,120,170" : "110,190,90";
let introOpen = false;
{ const br = $("gameTitle").querySelector("br"); if (br) br.before(" "); } // « Pokémon Survivor » sur une ligne : l'espace remplace le retour à la ligne
function decorateLevels() {
  $("levelPick").classList.add("badges");
  levelBtns.forEach((b, k) => {
    const lv = LEVELS[k], open = levelOpen(k), won = !!achs["win" + (k + 1)];
    b.style.setProperty("--bc", BADGE_COL(lv));
    b.innerHTML = `<span class="bdg">${open ? lvLabel(lv) : "🔒"}${won ? '<i class="won">★</i>' : ""}</span><small>${lv.name}</small>`;
    b.title = `Niveau ${lvLabel(lv)} · ${lv.name}${open ? "" : " (bloqué)"}`;
  });
  const el = $("levelIntro"), full = el.textContent, m = full.match(/^.*?[.!?](?=\s|$)/), first = m ? m[0] : full;
  el.dataset.full = full; el.dataset.first = first;
  renderIntro();
}
function renderIntro() {
  const el = $("levelIntro"), full = el.dataset.full || "", first = el.dataset.first || full;
  if (first.length >= full.length - 2) { el.textContent = full; return; }
  el.innerHTML = ""; el.append(introOpen ? full : first);
  const q = document.createElement("button"); q.type = "button"; q.className = "introMore"; q.textContent = introOpen ? "−" : "?"; q.title = introOpen ? "Réduire" : "En savoir plus";
  q.addEventListener("click", () => { introOpen = !introOpen; renderIntro(); }); el.append(q);
}
const DIFF_CLS = { "Avantagé":"d-av", "Neutre":"d-ne", "Variable":"d-va", "Difficile":"d-di" };
function decorateStarter() {
  const mu = $("sMu"), b = mu.querySelector("b"); if (!b) return;
  const kind = b.textContent, rest = mu.innerHTML.replace(/^<b>.*?<\/b>\s*/, ""), cut = rest.indexOf(". ");
  let d = $("sDiff"); if (!d) { d = document.createElement("span"); d.id = "sDiff"; $("sName").parentNode.appendChild(d); }
  d.className = "sDiff " + (DIFF_CLS[kind] || "d-ne"); d.textContent = `${kind} ${LEVEL.where}`;
  mu.innerHTML = cut >= 0 ? rest.slice(cut + 2) : rest;
  for (const id of ["sPrev", "sNext"]) { const el = $(id), n = el.querySelector("b"); el.title = n ? n.textContent : ""; }
}
const _setLevel = setLevel; setLevel = i => { _setLevel(i); decorateLevels(); };
const _renderCar = renderCar; renderCar = () => { _renderCar(); decorateStarter(); };
setLevel(LEVELS.indexOf(LEVEL) < 0 ? 0 : LEVELS.indexOf(LEVEL));
