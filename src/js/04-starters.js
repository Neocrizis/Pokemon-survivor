/* ---------- Lignées de starters ---------- */
const LINES = {
  plante: { names:["Bulbizarre","Herbizarre","Florizarre"], type:"plante", move:"tranchherbe", hp:48, speed:150, regen:.4,
            blurb:"Encaisse bien. Engrais : récupère 0,4 PV par seconde. Ses feuilles tournent autour de lui et fauchent tout ce qui s'approche." },
  feu:    { names:["Salamèche","Reptincel","Dracaufeu"], type:"feu", move:"flammeche", hp:38, speed:165, dmg:1.1,
            blurb:"Rapide et fragile. Brasier : +10 % de dégâts. Ses Flammèches visent seules l'ennemi le plus proche." },
  eau:    { names:["Carapuce","Carabaffe","Tortank"], type:"eau", move:"pistolet", hp:44, speed:155, cd:.92,
            blurb:"Équilibré. Torrent : capacités rechargées 8 % plus vite. Son Pistolet à O tire droit devant et transperce plusieurs ennemis." },
  magicarpe:{ names:["Magicarpe","Léviator"], evoLevels:[20], evo:"évolue au N.20",
            type:"eau", move:"magibulle", hp:52, speed:130, dmg:.65,
            blurb:"" },
  pika:   { names:["Pichu","Pikachu","Raichu"], type:"electrik", move:"tonnerre", hp:38, speed:168,
            blurb:"Rapide et nerveux. Statik : un ennemi qui le touche est paralysé 1 s. Tonnerre saute d'ennemi en ennemi. Dans la forêt, Pichu, Pikachu et Raichu sauvages laissent place à Lixy, Luxio et Luxray." },
  evoli:  { names:["Évoli","Évoli","Évoli"], type:"normal", move:"meteores", hp:42, speed:166, evo:"choisit son évolution au N.10, se renforce N.22",
            blurb:"Sauvé du Repaire Rocket. Adaptabilité : +10 % d'expérience. Polyvalent : Météores lance des étoiles qui ne ratent jamais leur cible. Au N.10, choisis : Pyroli, Aquali, Phyllali ou Voltali, et prends son type." },
  draco:  { names:["Minidraco","Draco","Dracolosse"], type:"dragon", move:"dracorage", hp:42, speed:160, evo:"évolue N.10 et N.22, Dracolosse vole",
            blurb:"Attrapé au Parc Safari. Multiécaille : −10 % de dégâts reçus. Draco-Rage crache une boule de flammes draconiques qui explose. Le Dragon résiste au Feu, à l'Eau, à la Plante et à l'Électrik. Dracolosse survole l'eau, les murs et la boue." },
  mew:    { names:["Mew","Mew","Mew"], secret:true, type:"psy", move:"metro1", hp:50, speed:170, dmg:1.1, evo:"n'évolue pas, se renforce N.10 et N.22",
            blurb:"Pokémon fabuleux, retrouvé au fond de la Caverne Azurée. Ses capacités sont des Métronome : chacun lance au hasard une attaque d'un autre starter. Métronome 1 tire les attaques de base, Métronome 6 les plus puissantes." },
  miaouss:{ names:["Miaouss","Persian","Persian"], type:"normal", move:"combogriffe", hp:36, speed:175, crit:.1, evo:"évolue N.10, se renforce N.22",
            blurb:"Très rapide mais fragile, avec 10 % de coups critiques en plus. Combo-Griffe lacère les ennemis proches de plusieurs coups à la suite." },
  // Johto : jouables partout une fois la Caverne Azurée gagnée ; ils n'apprennent que leurs propres capacités
  germignon:{ names:["Germignon","Macronium","Méganium"], secret:true, own:true, type:"plante", move:"feuillemagik", hp:50, speed:152,
            blurb:"Le soutien de l'équipe. Feuille Garde : une aura soigne les alliés proches (et un peu Germignon) et ralentit les ennemis. Feuillemagik lance des feuilles qui vont chercher leur cible." },
  heri:     { names:["Héricendre","Feurisson","Typhlosion"], secret:true, own:true, type:"feu", move:"rouefeu", hp:40, speed:172,
            blurb:"Toujours en mouvement. Torche : courir remplit sa jauge de Chaleur, qui rend ses attaques Feu jusqu'à 40 % plus fortes ; elle retombe s'il s'arrête. Roue de Feu fait tourner autour de lui une traîne de flammes." },
  kaiminus: { names:["Kaiminus","Crocrodil","Aligatueur"], secret:true, own:true, type:"eau", move:"machouille", hp:52, speed:158,
            blurb:"Combat au corps-à-corps. Sans Limite : +15 % de dégâts au contact, et chaque coup le soigne un peu. Mâchouille mord les ennemis les plus proches, de plus en plus vite si tu enchaînes (Frénésie)." },
  togepi:   { names:["Togepi","Togetic","Togekiss"], secret:true, own:true, type:"fee", move:"ventfeerique", hp:42, speed:160, evo:"évolue N.10 et N.22, Togetic et Togekiss volent",
            blurb:"Éclos de l'Œuf confié par l'assistant du Prof. Orme. Sérénité : les effets secondaires de ses capacités (apeurer, charmer) se produisent deux fois plus souvent. Vent Féérique souffle des étincelles qui peuvent apeurer l'ennemi. Togetic et Togekiss survolent l'eau, les murs et la boue." },
};
const flyP = P => ((P.line === "feu" || P.line === "draco") && P.stage === 2) || (P.line === "togepi" && P.stage >= 1); // Dracaufeu, Dracolosse, Togetic et Togekiss volent
const EVO_LEVELS = [10, 22];
const BOSS_SPD = { bossPersian:1.1, bossTauros:1.2, bossArcanin:1.2 }; // les autres boss : +30 %
const EEVEE = { // évolutions d'Évoli : type, capacité offerte, bonus
  pyroli:   { name:"Pyroli",   type:"feu",      move:"flammeche",   bonus:"Dégâts +10 %.",              apply:P => { P.dmgMul *= 1.1; } },
  aquali:   { name:"Aquali",   type:"eau",      move:"pistolet",    bonus:"PV max +30, nage dans l'eau.", apply:P => { P.maxHp += 30; P.hp += 30; } },
  phyllali: { name:"Phyllali", type:"plante",   move:"tranchherbe", bonus:"Récupère 0,3 PV par seconde.", apply:P => { P.regen += .3; } },
  voltali:  { name:"Voltali",  type:"electrik", move:"tonnerre",    bonus:"Vitesse +10 %.",             apply:P => { P.baseSpeed *= 1.1; } },
};
const veiled = d => LEVEL.tower && !LEVEL.sprout && d.ghost && !scopeOn(); // Spectre non identifié (pas de Scope Sylphe)
const foeName = d => veiled(d) ? "???" : d.name;
const ptype = () => S.P.etype || LINES[S.P.line].type; // type actuel du joueur (Évoli prend celui de son évolution)
