/* ---------- Types & table d'efficacité (Gen 1, simplifiée) ---------- */
const METRO = [["tranchherbe", "flammeche", "pistolet", "combogriffe", "eclair", "dracorage"], ["poudretoxik", "lanceflammes", "surf", "morsure", "tonnerre", "ouragan"], ["vampigraine", "feufollet", "bullesdo", "viveattaque", "cageeclair", "dracoqueue"], ["fouetlianes", "danseflamme", "cascade", "tranche", "bouleelek", "dansedraco"], ["dansepetale", "siphon", "grozyeux", "meteores"], ["lancesoleil", "deflagration", "hydrocanon", "jackpot", "fatalfoudre", "ultralaser"]]; // Métronome de Mew : une catégorie d'attaques par emplacement
const METRO_NAMES = k => METRO[k].map(id => MOVES[id].name).join(", ");
const TYPE_COLORS = { feu:"#f0803c", eau:"#5a9ef0", plante:"#72c94e", electrik:"#f6d13a", normal:"#c8bf98", vol:"#a894f0", insecte:"#b0c22a", poison:"#b25ab8", roche:"#c4a845", sol:"#e0c068", combat:"#c0503a", fee:"#f0a0d0", dragon:"#7a5cf0", spectre:"#7058a0", psy:"#f05888", glace:"#7ad4e8", acier:"#a8b4c4", tenebres:"#6a5468" };
const TYPE_NAMES = { feu:"Feu", eau:"Eau", plante:"Plante", electrik:"Électrik", normal:"Normal", vol:"Vol", insecte:"Insecte", poison:"Poison", roche:"Roche", sol:"Sol", combat:"Combat", fee:"Fée", dragon:"Dragon", spectre:"Spectre", psy:"Psy", glace:"Glace", acier:"Acier", tenebres:"Ténèbres" };
const CHART = {
  feu:      { plante:2, insecte:2, glace:2, acier:2, roche:.5, eau:.5, feu:.5, dragon:.5 },
  eau:      { feu:2, roche:2, sol:2, eau:.5, plante:.5, dragon:.5 },
  plante:   { eau:2, roche:2, sol:2, feu:.5, plante:.5, vol:.5, insecte:.5, poison:.5, dragon:.5, acier:.5 },
  electrik: { eau:2, vol:2, plante:.5, electrik:.5, sol:0, dragon:.5 },
  poison:   { plante:2, insecte:2, fee:2, poison:.5, sol:.5, roche:.5, spectre:.5, acier:0 },
  fee:      { combat:2, dragon:2, feu:.5, poison:.5, acier:.5 },
  dragon:   { dragon:2, fee:.5, acier:.5 },          // 0 contre Fée dans les jeux : 0,5 pour que Minidraco reste jouable au Mont Sélénite
  normal:   { roche:.5, spectre:.5, acier:.5 }, // 0 dans les jeux : 0,5 pour que Miaouss reste jouable dans la Tour
  spectre:  { spectre:2, normal:0 },    // Ball'Ombre (ennemis)
  psy:      { poison:2, combat:2, psy:.5, acier:.5 }, // Choc Mental (Noadkoko, Flagadoss)
  glace:    { plante:2, sol:2, vol:2, dragon:2, feu:.5, eau:.5, glace:.5, acier:.5 }, // Laser Glace (Lamantine)
  combat:   { normal:2, roche:2, glace:2, acier:2, tenebres:2, poison:.5, vol:.5, insecte:.5, psy:.5, fee:.5, spectre:0 },
  tenebres: { psy:2, spectre:2, combat:.5, tenebres:.5, fee:.5 }, // Mâchouille (Kaiminus)
  sol:      { feu:2, electrik:2, poison:2, roche:2, acier:2, plante:.5, insecte:.5, vol:0 }, // Os (ennemis)
};
const eff = (atk, defs) => defs.reduce((m, d) => m * (CHART[atk]?.[d] ?? 1), 1);

