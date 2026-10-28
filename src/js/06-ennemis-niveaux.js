/* ---------- Ennemis et niveaux ---------- */
const ZARBI_L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!?".split(""); // Zarbi : une forme par lettre, plus ! et ? (HeartGold/SoulSilver)
const FOES = {
  chenipan:   { name:"Chenipan",   types:["insecte"],          hp:10,  speed:46,  dmg:4,  r:12, xp:1 },
  chrysacier: { name:"Chrysacier", types:["insecte"],          hp:42,  speed:16,  dmg:5,  r:14, xp:3 },
  papilusion: { name:"Papilusion", types:["insecte","vol"],    hp:40,  speed:95,  dmg:8,  r:16, xp:4, erratic:true },
  aspicot:    { name:"Aspicot",    types:["insecte","poison"], hp:13,  speed:56,  dmg:5,  r:12, xp:1 },
  coconfort:  { name:"Coconfort",  types:["insecte","poison"], hp:46,  speed:16,  dmg:6,  r:14, xp:3 },
  dardargnan: { name:"Dardargnan", types:["insecte","poison"], hp:44,  speed:72,  dmg:10, r:16, xp:4, dash:true },
  roucool:    { name:"Roucool",    types:["normal","vol"],     hp:15,  speed:86,  dmg:6,  r:13, xp:2 },
  roucoups:   { name:"Roucoups",   types:["normal","vol"],     hp:38,  speed:96,  dmg:9,  r:16, xp:4 },
  roucarnage: { name:"Roucarnage", types:["normal","vol"],     hp:80,  speed:104, dmg:13, r:20, xp:7 },
  pichu:      { name:"Pichu",      types:["electrik"],         hp:12,  speed:98,  dmg:4,  r:11, xp:2, erratic:true },
  pikachu:    { name:"Pikachu",    types:["electrik"],         hp:22,  speed:82,  dmg:6,  r:13, xp:3, ranged:true },
  lixy:       { name:"Lixy",       types:["electrik"],         hp:12,  speed:98,  dmg:4,  r:11, xp:2, erratic:true },
  luxio:      { name:"Luxio",      types:["electrik"],         hp:22,  speed:82,  dmg:6,  r:13, xp:3, ranged:true },
  berrytree:  { name:"Arbre à baies", types:[], hp:1, speed:0, dmg:0, r:20, xp:0 },
  crackrock:  { name:"Rocher fissuré", types:[], hp:1, speed:0, dmg:0, r:18, xp:0 },
  luxray:     { name:"Luxray",     types:["electrik"],         hp:70,  speed:76,  dmg:11, r:17, xp:6, ranged:true },
  raichu:     { name:"Raichu",     types:["electrik"],         hp:70,  speed:76,  dmg:11, r:17, xp:6, ranged:true },
  bossDard:   { name:"Dardargnan géant", sprite:"dardargnan", types:["insecte","poison"], hp:1800, speed:62, dmg:20, r:40, xp:60, boss:true, dash:true, bigDash:true },
  bossRouc:   { name:"Roucarnage géant", sprite:"roucarnage", types:["normal","vol"],     hp:4800, speed:70, dmg:24, r:46, xp:100, boss:true, dash:true },
  // Mont Sélénite
  melo:       { name:"Mélo",       types:["fee"],             hp:14,  speed:62,  dmg:5,  r:11, xp:1, erratic:true },
  melofee:    { name:"Mélofée",    types:["fee"],             hp:42,  speed:70,  dmg:8,  r:14, xp:3 },
  melodelfe:  { name:"Mélodelfe",  types:["fee"],             hp:95,  speed:74,  dmg:13, r:18, xp:7 },
  nosferapti: { name:"Nosferapti", types:["poison","vol"],     hp:12,  speed:104, dmg:5,  r:12, xp:1, erratic:true },
  nosferalto: { name:"Nosferalto", types:["poison","vol"],     hp:42,  speed:114, dmg:9,  r:16, xp:4, erratic:true },
  nostenfer:  { name:"Nostenfer",  types:["poison","vol"],     hp:75,  speed:134, dmg:12, r:17, xp:6, erratic:true },
  paras:      { name:"Paras",      types:["insecte","plante"], hp:18,  speed:42,  dmg:5,  r:12, xp:1 },
  parasect:   { name:"Parasect",   types:["insecte","plante"], hp:75,  speed:40,  dmg:11, r:17, xp:5 },
  racaillou:  { name:"Racaillou",  types:["roche","sol"],      hp:30,  speed:40,  dmg:7,  r:13, xp:2 },
  gravalanch: { name:"Gravalanch", types:["roche","sol"],      hp:78,  speed:44,  dmg:11, r:16, xp:5 },
  grolem:     { name:"Grolem",     types:["roche","sol"],      hp:140, speed:50,  dmg:16, r:19, xp:8, slide:true },
  sabelette:  { name:"Sabelette",  types:["sol"],              hp:20,  speed:72,  dmg:6,  r:12, xp:2 },
  sablaireau: { name:"Sablaireau", types:["sol"],              hp:62,  speed:84,  dmg:11, r:16, xp:5, burrow:true },
  bossGrolem: { name:"Grolem géant",    sprite:"grolem",    types:["roche","sol"], hp:2400, speed:62, dmg:22, r:44, xp:70,  boss:true, slide:true },
  bossMelo:   { name:"Mélodelfe géant", sprite:"melodelfe", types:["fee"],      hp:6000, speed:78, dmg:24, r:46, xp:110, boss:true },
  // Tour Pokémon
  urn:        { name:"Jarre", types:[], hp:1, speed:0, dmg:0, r:16, xp:0 },
  fantominus: { name:"Fantominus", types:["spectre","poison"], hp:14,  speed:66,  dmg:5,  r:12, xp:1, ghost:true, erratic:true },
  spectrum:   { name:"Spectrum",   types:["spectre","poison"], hp:48,  speed:80,  dmg:9,  r:15, xp:4, ghost:true, blink:true },
  ectoplasma: { name:"Ectoplasma", types:["spectre","poison"], hp:110, speed:78,  dmg:13, r:18, xp:7, ghost:true, blink:true },
  osselait:   { name:"Osselait",   types:["sol"],              hp:26,  speed:58,  dmg:6,  r:12, xp:2, ranged:true, shot:"sol" },
  ossatueur:  { name:"Ossatueur",  types:["sol"],              hp:80,  speed:62,  dmg:11, r:16, xp:5, ranged:true, shot:"sol" },
  rattata:    { name:"Rattata",    types:["normal"],           hp:12,  speed:100, dmg:4,  r:11, xp:1 },
  // Johto : Tour Chétiflor (Mauville)
  chetiflor:  { name:"Chétiflor",  types:["plante","poison"],  hp:14,  speed:60,  dmg:5,  r:12, xp:1, johto:true },
  boustiflor: { name:"Boustiflor", types:["plante","poison"],  hp:46,  speed:54,  dmg:8,  r:15, xp:3, johto:true, ranged:true, shot:"poison" },
  empiflor:   { name:"Empiflor",   types:["plante","poison"],  hp:95,  speed:50,  dmg:12, r:19, xp:6, johto:true },
  fouinette:  { name:"Fouinette",  types:["normal"],           hp:16,  speed:90,  dmg:5,  r:12, xp:1, johto:true },
  fouinar:    { name:"Fouinar",    types:["normal"],           hp:60,  speed:104, dmg:10, r:17, xp:4, johto:true },
  hoothoot:   { name:"Hoothoot",   types:["normal","vol"],     hp:20,  speed:80,  dmg:6,  r:13, xp:2, johto:true, erratic:true },
  noarfang:   { name:"Noarfang",   types:["normal","vol"],     hp:85,  speed:92,  dmg:12, r:18, xp:6, johto:true, ranged:true, shot:"psy" },
  bossChetiflor: { name:"Chétiflor géant", sprite:"chetiflor", types:["plante","poison"], hp:1500, speed:70, dmg:18, r:40, xp:50,  boss:true, johto:true, dash:true, vine:true },
  bossBoustiflor:{ name:"Boustiflor géant", sprite:"boustiflor", types:["plante","poison"], hp:2800, speed:64, dmg:22, r:44, xp:85, boss:true, johto:true, vine:true, spit:true },
  bossEmpiflor:  { name:"Empiflor géant", sprite:"empiflor", types:["plante","poison"], hp:6200, speed:60, dmg:26, r:48, xp:130, boss:true, johto:true, dash:true, bigDash:true, vine:true, leafRing:true },
  // Johto : Ruines d'Alpha (entre Mauville et Écorcia)
  zarbi:      { name:"Zarbi",      types:["psy"],              hp:14,  speed:66,  dmg:5,  r:12, xp:1, johto:true, erratic:true, zarbi:true },
  natu:       { name:"Natu",       types:["psy","vol"],        hp:18,  speed:80,  dmg:5,  r:11, xp:2, johto:true, erratic:true, ranged:true, shot:"vol", shotCd:6 },
  xatu:       { name:"Xatu",       types:["psy","vol"],        hp:75,  speed:78,  dmg:11, r:17, xp:6, johto:true, blink:true, ranged:true, shot:"vol", volley:3 },
  axoloto:    { name:"Axoloto",    types:["eau","sol"],        hp:24,  speed:54,  dmg:6,  r:12, xp:2, johto:true, pond:true, swim:true },
  maraiste:   { name:"Maraiste",   types:["eau","sol"],        hp:115, speed:46,  dmg:13, r:18, xp:7, johto:true, pond:true, swim:true, mud:true },
  queulorior: { name:"Queulorior", types:["normal"],           hp:80,  speed:88,  dmg:10, r:15, xp:8, johto:true, ranged:true, sketch:true },
  bossAxoloto:{ name:"Axoloto géant", sprite:"axoloto", types:["eau","sol"], hp:1600, speed:64, dmg:18, r:40, xp:50, boss:true, johto:true, aquaFan:true, mud:true },
  bossXatu:   { name:"Xatu géant",    sprite:"xatu",    types:["psy","vol"], hp:3000, speed:70, dmg:22, r:44, xp:85, boss:true, johto:true, blink:true, gust:true },
  bossZarbiQ: { name:"Zarbi ? géant", sprite:"zarbi_?", types:["psy"], hp:3400, speed:58, dmg:24, r:44, xp:110, boss:true, johto:true, zarbiBoss:"?" },
  bossZarbiX: { name:"Zarbi ! géant", sprite:"zarbi_!", types:["psy"], hp:3400, speed:62, dmg:24, r:44, xp:110, boss:true, johto:true, zarbiBoss:"!", dash:true, bigDash:true },
  rattatac:   { name:"Rattatac",   types:["normal"],           hp:52,  speed:104, dmg:9,  r:15, xp:4 },
  bossSpectrum:{ name:"Spectrum géant", sprite:"spectrum", types:["spectre","poison"], hp:2600, speed:70, dmg:22, r:44, xp:75, boss:true, ghost:true, dash:true, bigDash:true, toxTrail:true },
  bossOssa:   { name:"Esprit d'Ossatueur", sprite:"ossatueur",  types:["sol"],              hp:2600, speed:66, dmg:22, r:44, xp:75,  boss:true, ghost:true, spirit:true, hideDex:true },
  // Repaire Rocket
  crate:      { name:"Caisse", types:[], hp:1, speed:0, dmg:0, r:16, xp:0 },
  abo:        { name:"Abo",        types:["poison"],           hp:18,  speed:72,  dmg:5,  r:12, xp:1 },
  arbok:      { name:"Arbok",      types:["poison"],           hp:70,  speed:80,  dmg:11, r:17, xp:5, dash:true },
  smogo:      { name:"Smogo",      types:["poison"],           hp:28,  speed:58,  dmg:8,  r:13, xp:2, boom:true },
  smogogo:    { name:"Smogogo",    types:["poison"],           hp:80,  speed:54,  dmg:12, r:17, xp:5, boom:true },
  tadmorv:    { name:"Tadmorv",    types:["poison"],           hp:34,  speed:44,  dmg:7,  r:13, xp:2, sludge:true },
  grotadmorv: { name:"Grotadmorv", types:["poison"],           hp:110, speed:46,  dmg:13, r:18, xp:7, sludge:true },
  rmiaouss:   { name:"Miaouss",    types:["normal"],           hp:20,  speed:92,  dmg:6,  r:12, xp:2, erratic:true },
  rpersian:   { name:"Persian",    types:["normal"],           hp:72,  speed:110, dmg:11, r:16, xp:5 },
  rhinocorne: { name:"Rhinocorne", types:["sol","roche"],      hp:90,  speed:52,  dmg:12, r:16, xp:5, dash:true, evo:"rhinoferos", evoT:25, evoAt:180 },
  // ses évolutions : blindées (dégâts reçus réduits, pas de recul), Rhinastoc a Solide Roc (super efficace réduit)
  rhinoferos: { name:"Rhinoféros", types:["sol","roche"],      hp:200, speed:50,  dmg:17, r:20, xp:10, dash:true, armor:.75, heavy:true, evo:"rhinastoc", evoT:40, evoAt:360 },
  rhinastoc:  { name:"Rhinastoc",  types:["sol","roche"],      hp:420, speed:47,  dmg:22, r:24, xp:16, dash:true, armor:.6, heavy:true, solidRock:true },
  bossArbok:  { name:"Arbok géant",          sprite:"arbok",      types:["poison"],      hp:3000, speed:72, dmg:22, r:44, xp:80,  boss:true, dash:true, spit:true },
  bossPersian:{ name:"Persian de Giovanni", sprite:"rpersian", types:["normal"], hp:7200, speed:100, dmg:24, r:46, xp:130, boss:true, dash:true, claws:true },
  // événements
  // Parc Safari
  nidoranf:   { name:"Nidoran♀",   types:["poison"],           hp:16,  speed:70,  dmg:5,  r:12, xp:1 },
  nidoranm:   { name:"Nidoran♂",   types:["poison"],           hp:16,  speed:76,  dmg:5,  r:12, xp:1 },
  psykokwak:  { name:"Psykokwak",  types:["eau"],              hp:30,  speed:56,  dmg:6,  r:13, xp:2, ranged:true, shot:"eau" },
  nidorina:   { name:"Nidorina",   types:["poison"],           hp:60,  speed:74,  dmg:10, r:16, xp:4 },
  nidorino:   { name:"Nidorino",   types:["poison"],           hp:60,  speed:80,  dmg:10, r:16, xp:4 },
  tauros:     { name:"Tauros",     types:["normal"],           hp:100, speed:96,  dmg:12, r:18, xp:6, dash:true },
  insecateur: { name:"Insécateur", types:["insecte","vol"],    hp:85,  speed:100, dmg:12, r:17, xp:6, dash:true },
  noeuf:      { name:"Noeunoeuf",  sprite:"noeunoeuf", types:["plante","psy"], hp:26, speed:52, dmg:6, r:14, xp:2 },
  noadkoko:   { name:"Noadkoko",   types:["plante","psy"],     hp:110, speed:54,  dmg:13, r:20, xp:7, ranged:true, shot:"psy" },
  mimitoss:   { name:"Mimitoss",   types:["insecte","poison"], hp:28,  speed:50,  dmg:6,  r:13, xp:2, ranged:true, shot:"psy" },
  aeromite:   { name:"Aéromite",   types:["insecte","poison"], hp:70,  speed:92,  dmg:10, r:16, xp:5, erratic:true },
  doduo:      { name:"Doduo",      types:["normal","vol"],     hp:32,  speed:108, dmg:7,  r:14, xp:2, dash:true },
  kangourex:  { name:"Kangourex",  types:["normal"],           hp:130, speed:62,  dmg:14, r:20, xp:8 },
  leveinard:  { name:"Leveinard",  types:["normal"],           hp:70,  speed:58,  dmg:4,  r:16, xp:3, healer:true },
  minidraco:  { name:"Minidraco",  types:["dragon"],           hp:1,   speed:0,   dmg:0,  r:16, xp:0, rare:true, hideDex:true },
  noeunoeuf:  { name:"Noeunoeuf",  types:["plante"],           hp:1,   speed:0,   dmg:0,  r:16, xp:0, rare:true, hideDex:true },
  scarabrute: { name:"Scarabrute", types:["insecte"],          hp:1,   speed:0,   dmg:0,  r:17, xp:0, rare:true, hideDex:true },
  bossKanga:  { name:"Kangourex géant", sprite:"kangourex", types:["normal"], hp:3200, speed:70, dmg:22, r:46, xp:80,  boss:true, stomp:true },
  bossTauros: { name:"Tauros géant",    sprite:"tauros",    types:["normal"], hp:7500, speed:84, dmg:26, r:48, xp:130, boss:true, dash:true, bigDash:true, herd:true },
  // Manoir Pokémon
  goupix:     { name:"Goupix",     types:["feu"],              hp:18,  speed:74,  dmg:5,  r:12, xp:1 },
  caninos:    { name:"Caninos",    types:["feu"],              hp:22,  speed:88,  dmg:6,  r:13, xp:2 },
  ponyta:     { name:"Ponyta",     types:["feu"],              hp:34,  speed:100, dmg:7,  r:14, xp:2, dash:true },
  feunard:    { name:"Feunard",    types:["feu"],              hp:80,  speed:84,  dmg:11, r:17, xp:5, ranged:true, shot:"feu" },
  galopa:     { name:"Galopa",     types:["feu"],              hp:95,  speed:110, dmg:12, r:18, xp:6, dash:true },
  magmar:     { name:"Magmar",     types:["feu"],              hp:110, speed:62,  dmg:13, r:18, xp:7, ranged:true, shot:"feu" },
  arcanin:    { name:"Arcanin",    types:["feu"],              hp:140, speed:100, dmg:15, r:20, xp:8, dash:true },
  bossMagmar: { name:"Magmar géant",  sprite:"magmar",  types:["feu"], hp:3400, speed:66, dmg:24, r:46, xp:90,  boss:true, flamer:true },
  bossArcanin:{ name:"Arcanin géant", sprite:"arcanin", types:["feu"], hp:7800, speed:96, dmg:26, r:48, xp:130, boss:true, dash:true, bigDash:true, embers:true },
  mewtwo:     { name:"Mewtwo", types:["psy"], hp:7000, speed:92, dmg:30, r:46, xp:200, boss:true, mewtwo:true },
  // Caverne Azurée (niveau 9 caché) : Mewtwo revient, deux fois plus fort, avec Ultralaser
  mewtwoC:    { name:"Mewtwo", sprite:"mewtwo", types:["psy"], hp:14000, speed:104, dmg:40, r:50, xp:400, boss:true, mewtwo:true, cave:true, hideDex:true },
  kadabra:    { name:"Kadabra",    types:["psy"],              hp:72,  speed:66,  dmg:12, r:16, xp:6, ranged:true, shot:"psy", blink:true },
  metamorph:  { name:"Métamorph",  types:["normal"],           hp:85,  speed:86,  dmg:12, r:15, xp:7, ranged:true, ditto:true },
  mereossa:   { name:"Mère Ossatueur", sprite:"ossatueur", types:["spectre"], hp:1000, speed:72, dmg:14, r:30, xp:0, ghost:true, spirit:true, mother:true, dexBoss:true },
  ronflex:    { name:"Ronflex", types:["normal"], hp:1100, speed:0, dmg:0, r:42, xp:0, event:true, solid:true, dexBoss:true },
  jarbok:     { name:"Arbok de Jessie", sprite:"arbok", types:["poison"], hp:520, speed:86, dmg:12, r:24, xp:24, mini:true, dash:true },
  jsmogogo:   { name:"Smogogo de James", sprite:"smogogo", types:["poison"], hp:520, speed:62, dmg:12, r:24, xp:24, mini:true, sludge:true },
  jmiaouss:   { name:"Miaouss de la Team Rocket", sprite:"rmiaouss", types:["normal"], hp:380, speed:98, dmg:10, r:20, xp:24, mini:true, ranged:true, shot:"normal" },
  bossEcto:   { name:"Ectoplasma géant",   sprite:"ectoplasma", types:["spectre","poison"], hp:6300, speed:80, dmg:24, r:46, xp:120, boss:true, ghost:true, blink:true },
  // Oiseau Légendaire · Île Écume
  akwakwak:   { name:"Akwakwak",   types:["eau"],              hp:85,  speed:64,  dmg:12, r:17, xp:6, ranged:true, shot:"eau" },
  ramoloss:   { name:"Ramoloss",   types:["eau","psy"],        hp:60,  speed:32,  dmg:9,  r:16, xp:3 },
  flagadoss:  { name:"Flagadoss",  types:["eau","psy"],        hp:150, speed:36,  dmg:14, r:20, xp:8, ranged:true, shot:"psy" },
  otaria:     { name:"Otaria",     types:["eau"],              hp:30,  speed:74,  dmg:6,  r:13, xp:2 },
  lamantine:  { name:"Lamantine",  types:["eau","glace"],      hp:115, speed:64,  dmg:13, r:19, xp:7, ranged:true, shot:"glace" },
  bossFlagadoss:{ name:"Flagadoss géant", sprite:"flagadoss", types:["eau","psy"], hp:3600, speed:46, dmg:24, r:46, xp:90, boss:true, slowbro:true },
  bossLamantine:{ name:"Lamantine géant", sprite:"lamantine", types:["eau","glace"], hp:7400, speed:70, dmg:26, r:48, xp:130, boss:true, iceBeam:true },
  // Oiseau Légendaire · Centrale électrique
  magneti:    { name:"Magnéti",    types:["electrik","acier"], hp:22,  speed:62,  dmg:6,  r:12, xp:2, erratic:true },
  magneton:   { name:"Magnéton",   types:["electrik","acier"], hp:85,  speed:60,  dmg:12, r:18, xp:6, ranged:true, shot:"electrik", volley:3 },
  voltorbe:   { name:"Voltorbe",   types:["electrik"],         hp:24,  speed:84,  dmg:9,  r:12, xp:2, boom:true },
  electrode:  { name:"Électrode",  types:["electrik"],         hp:75,  speed:104, dmg:14, r:16, xp:5, boom:true, boomR:130, cage:true },
  bossGrotadmorv:{ name:"Grotadmorv géant", sprite:"grotadmorv", types:["poison"], hp:3600, speed:56, dmg:24, r:46, xp:90, boss:true, bigSludge:true },
  bossElectrode: { name:"Électrode géant",  sprite:"electrode",  types:["electrik"], hp:7200, speed:78, dmg:26, r:46, xp:130, boss:true, dash:true, megaBoom:true, cage:true },
  // Oiseau Légendaire · Route Victoire
  machoc:     { name:"Machoc",     types:["combat"],           hp:30,  speed:66,  dmg:8,  r:13, xp:2 },
  machopeur:  { name:"Machopeur",  types:["combat"],           hp:90,  speed:70,  dmg:13, r:17, xp:6, dash:true },
  mackogneur: { name:"Mackogneur", types:["combat"],           hp:190, speed:72,  dmg:18, r:20, xp:10, dash:true, heavy:true },
  onix:       { name:"Onix",       types:["roche","sol"],      hp:170, speed:72,  dmg:14, r:18, xp:8, snake:true, burrow:true },
  bossOnix:   { name:"Onix géant", sprite:"onix", types:["roche","sol"], hp:4000, speed:76, dmg:26, r:46, xp:95, boss:true, snake:true, burrow:true },
  bossRhino:  { name:"Rhinoféros géant", sprite:"rhinoferos", types:["sol","roche"], hp:8200, speed:64, dmg:28, r:48, xp:130, boss:true, dash:true, bigDash:true, armor:.6, heavy:true, rockThrow:true },
  // oiseaux légendaires (niveau 7, à 5:00) : PV calculés comme Mewtwo à leur arrivée ; armor ≈ sa Barrière
  artikodin: { name:"Artikodin", types:["glace","vol"],    hp:7000, speed:92, dmg:31, r:46, xp:200, boss:true, bird:"ice",  armor:.54, sprR:24 },
  electhor:  { name:"Électhor",  types:["electrik","vol"], hp:7000, speed:92, dmg:42, r:46, xp:200, boss:true, bird:"elec", armor:.54, sprR:30, sprDy:25 },
  // Ligue Indigo (niveau 8) : Pokémon des salles du Conseil 4 et du Champion
  kokiyas:    { name:"Kokiyas",    types:["eau"],              hp:10,  speed:50,  dmg:4,  r:12, xp:1 },
  stari:      { name:"Stari",      types:["eau"],              hp:12,  speed:84,  dmg:5,  r:12, xp:1, erratic:true },
  tentacool:  { name:"Tentacool",  types:["eau","poison"],     hp:14,  speed:62,  dmg:5,  r:12, xp:1 },
  lippoutou:  { name:"Lippoutou",  types:["glace","psy"],      hp:90,  speed:62,  dmg:12, r:17, xp:6, ranged:true, shot:"glace" },
  crustabri:  { name:"Crustabri",  types:["eau","glace"],      hp:150, speed:50,  dmg:14, r:19, xp:8, armor:.6, heavy:true },
  ferosinge:  { name:"Férosinge",  types:["combat"],           hp:32,  speed:88,  dmg:8,  r:13, xp:2, erratic:true },
  colossinge: { name:"Colossinge", types:["combat"],           hp:95,  speed:92,  dmg:13, r:17, xp:6, dash:true },
  kicklee:    { name:"Kicklee",    types:["combat"],           hp:110, speed:82,  dmg:15, r:18, xp:7, dash:true },
  tygnon:     { name:"Tygnon",     types:["combat"],           hp:110, speed:72,  dmg:14, r:18, xp:7, ranged:true, shot:"combat" },
  magicarpe:  { name:"Magicarpe",  types:["eau"],              hp:12,  speed:40,  dmg:2,  r:12, xp:1, erratic:true },
  lgmini:     { name:"Minidraco",  sprite:"minidraco", types:["dragon"], hp:34, speed:74, dmg:8, r:13, xp:2 },
  rapasdepic: { name:"Rapasdepic", types:["normal","vol"],     hp:70,  speed:110, dmg:12, r:18, xp:6 },
  wdraco:     { name:"Draco",      types:["dragon"],           hp:100, speed:80,  dmg:13, r:18, xp:7, dash:true },
  ptera:      { name:"Ptéra",      types:["roche","vol"],      hp:110, speed:118, dmg:15, r:19, xp:7, dash:true },
  leviator:   { name:"Léviator",   types:["eau","vol"],        hp:230, speed:62,  dmg:18, r:24, xp:12, heavy:true, ranged:true, shot:"eau", sprR:11 },
  // boss des salles : de plus en plus forts, de la salle d'Olga au Champion
  lgLokhlass: { name:"Lokhlass d'Olga",     sprite:"lokhlass",   types:["eau","glace"],      hp:900,  speed:60,  dmg:14, r:44, xp:70,  boss:true, iceBeam:true, lzDmg:7, shDmg:7, sprR:36 },
  lgMacko:    { name:"Mackogneur d'Aldo",   sprite:"mackogneur", types:["combat"],           hp:3000, speed:82,  dmg:22, r:44, xp:90,  boss:true, dash:true, bigDash:true, fist:true },
  lgEcto:     { name:"Ectoplasma d'Agatha", sprite:"ectoplasma", types:["spectre","poison"], hp:4800, speed:84,  dmg:24, r:44, xp:110, boss:true, ghost:true, blink:true, shadowBall:true },
  lgDraco:    { name:"Dracolosse de Peter", sprite:"dracolosse", types:["dragon","vol"],     hp:5800, speed:88,  dmg:26, r:46, xp:130, boss:true, dash:true, bigDash:true, hyper:true },
  lgAlaka:    { name:"Alakazam du Champion", sprite:"alakazam",  types:["psy"],              hp:7000, speed:118, dmg:30, r:44, xp:200, boss:true, alaka:true },
  sulfura:   { name:"Sulfura",   types:["feu","vol"],      hp:7000, speed:92, dmg:42, r:46, xp:200, boss:true, bird:"fire", armor:.54, sprR:26, sprDy:14 },
};
// Johto : Bois aux Chênes. La Dark Ball a corrompu la forêt : ses Pokémon sont Obscurs (aura sombre, un peu plus coriaces et rapides, leur propre entrée au Pokédex)
for (const [k, o] of Object.entries({ chenipan:{}, chrysacier:{}, papilusion:{}, aspicot:{}, coconfort:{}, dardargnan:{}, paras:{}, parasect:{}, nosferapti:{}, noeuf:{}, hoothoot:{}, noarfang:{}, magicarpe:{ swim:true, aqua:true }, mimitoss:{}, aeromite:{}, leviator:{ swim:true, aqua:true } })) // Lac Colère : Magicarpe et Léviator ne quittent pas le lac
  FOES[k + "O"] = { ...FOES[k], ...o, name:FOES[k].name + " Obscur", sprite:FOES[k].sprite || k, hp:Math.round(FOES[k].hp * 1.3), speed:Math.round(FOES[k].speed * 1.1), johto:true, shadow:true };
// Johto : Lac Colère. L'onde de la Team Rocket force les Magicarpe à évoluer ; Léviator rouge et ses deux escortes (16f-lac-colere.js)
Object.assign(FOES, {
  bossAeromite: { name:"Aéromite Obscur géant",  sprite:"aeromite",   types:["insecte","poison"], hp:1700, speed:70, dmg:18, r:42, xp:50,  boss:true, johto:true, shadow:true, erratic:true, venom:true },
  bossCarpe:    { name:"Magicarpe Obscur géant", sprite:"magicarpe",  types:["eau"],              hp:1500, speed:52, dmg:16, r:40, xp:60,  boss:true, johto:true, shadow:true, splash:true },
  bossLevO:     { name:"Léviator Obscur géant",  sprite:"leviator",   types:["eau","vol"],        hp:3000, speed:66, dmg:22, r:46, sprR:21, xp:85,  boss:true, johto:true, shadow:true, dash:true, bigDash:true, gyara:true },
  bossLevRouge: { name:"Léviator rouge géant",   sprite:"leviator_s", types:["eau","vol"],        hp:6400, speed:72, dmg:26, r:50, sprR:24, xp:130, boss:true, johto:true, dash:true, bigDash:true, gyara:true, red:true },
  bossLevEsc:   { name:"Léviator Obscur",        sprite:"leviator",   types:["eau","vol"],        hp:1800, speed:70, dmg:18, r:32, sprR:15, xp:40,  boss:true, johto:true, shadow:true, dash:true, gyara:true, escort:true },
});
Object.assign(FOES, {
  mystherbeO: { name:"Mystherbe Obscur", sprite:"mystherbe", types:["plante","poison"], hp:22, speed:50, dmg:5,  r:12, xp:1, johto:true, shadow:true },
  ortideO:    { name:"Ortide Obscur",    sprite:"ortide",    types:["plante","poison"], hp:78, speed:50, dmg:10, r:16, xp:4, johto:true, shadow:true, sludge:true },
  pomdepikO:  { name:"Pomdepik Obscur",  sprite:"pomdepik",  types:["insecte"],         hp:38, speed:54, dmg:9,  r:13, xp:2, johto:true, shadow:true, boom:true, fall:true },
  foretressO: { name:"Foretress Obscur", sprite:"foretress", types:["insecte","acier"], hp:160, speed:44, dmg:14, r:19, xp:7, johto:true, shadow:true, boomR:120, armor:.8, heavy:true, fall:true },
  bossParasect: { name:"Parasect Obscur géant",  sprite:"parasect",  types:["insecte","plante"], hp:1700, speed:58, dmg:18, r:42, xp:50,  boss:true, johto:true, shadow:true, spores:true },
  bossForetress:{ name:"Foretress Obscur géant", sprite:"foretress", types:["insecte","acier"],  hp:3000, speed:46, dmg:22, r:44, xp:85,  boss:true, johto:true, shadow:true, spikes:true, armor:.75, heavy:true },
  bossNoarfang: { name:"Noarfang Obscur géant",  sprite:"noarfang",  types:["normal","vol"],     hp:6400, speed:74, dmg:26, r:46, xp:130, boss:true, johto:true, shadow:true, night:true, dash:true, bigDash:true },
  celebiO:    { name:"Celebi Obscur", sprite:"celebi", types:["psy","plante"], hp:3200, speed:0, dmg:20, r:28, xp:0, boss:true, johto:true, shadow:true, celebiO:true, hideDex:true },
});
// Johto : Tour Cendrée. Les Pokémon qui hantent les décombres sont Obscurs ; Krabby et Caratroc se cachent sous les rochers (Éclate-Roc)
for (const k of ["rattata", "rattatac", "smogo", "smogogo", "magmar"])
  FOES[k + "O"] = { ...FOES[k], name:FOES[k].name + " Obscur", sprite:FOES[k].sprite || k, hp:Math.round(FOES[k].hp * 1.3), speed:Math.round(FOES[k].speed * 1.1), johto:true, shadow:true };
Object.assign(FOES, {
  krabby:      { name:"Krabby",   types:["eau"],            hp:34,  speed:74, dmg:9,  r:13, xp:2,  johto:true },
  caratroc:    { name:"Caratroc", types:["insecte","roche"], hp:150, speed:26, dmg:7,  r:15, xp:10, johto:true, armor:.5, heavy:true, juice:true },
  // les trois chiens légendaires : chacun change la météo, et s'enfuit une fois vaincu
  bossEntei:   { name:"Entei",   sprite:"entei",   types:["feu"],     hp:2000, speed:96,  dmg:20, r:40, sprR:30, xp:60,  boss:true, johto:true, beast:"sun",   dash:true },
  bossSuicune: { name:"Suicune", sprite:"suicune", types:["eau"],     hp:3600, speed:92,  dmg:22, r:40, sprR:30, xp:95,  boss:true, johto:true, beast:"rain" },
  bossRaikou:  { name:"Raikou",  sprite:"raikou",  types:["electrik"], hp:6400, speed:104, dmg:26, r:40, sprR:30, xp:140, boss:true, johto:true, beast:"storm", dash:true, bigDash:true },
  // l'équipe de Silver, le rival (son starter est celui qui bat le tien)
  rvSpectrum:  { name:"Spectrum de Silver",  sprite:"spectrum",  types:["spectre","poison"], hp:420, speed:84, dmg:12, r:20, xp:20, johto:true, rival:true, ghost:true, blink:true, hideDex:true },
  rvMagneti:   { name:"Magnéti de Silver",   sprite:"magneti",   types:["electrik","acier"], hp:300, speed:70, dmg:10, r:18, xp:16, johto:true, rival:true, erratic:true, ranged:true, shot:"electrik", hideDex:true },
  rvNosferapti:{ name:"Nosferapti de Silver", sprite:"nosferapti", types:["poison","vol"],    hp:320, speed:96, dmg:11, r:18, xp:16, johto:true, rival:true, hideDex:true },
  rvFeurisson: { name:"Feurisson de Silver", sprite:"feurisson", types:["feu"],   hp:640, speed:88, dmg:14, r:22, xp:30, johto:true, rival:true, ranged:true, shot:"feu", hideDex:true },
  rvCrocrodil: { name:"Crocrodil de Silver", sprite:"crocrodil", types:["eau"],   hp:700, speed:82, dmg:15, r:22, xp:30, johto:true, rival:true, ranged:true, shot:"eau", hideDex:true },
  rvMacronium: { name:"Macronium de Silver", sprite:"macronium", types:["plante"], hp:720, speed:78, dmg:14, r:22, xp:30, johto:true, rival:true, ranged:true, shot:"plante", hideDex:true },
});
const LEVELS = [
  { name:"Forêt de Jade", num:1, jade:true, title:"Tu as traversé la Forêt de Jade !", cave:false, where:"en forêt", from:"surgit des arbres",
    intro:"La Forêt de Jade grouille d'insectes, d'oiseaux, de Pichu et de quelques Pikachu. Choisis ton starter et traverse-la jusqu'à Argenta : tiens dix minutes.",
    win:"a tenu dix minutes et Argenta est en vue. Le Mont Sélénite t'attend !",
    matchup:{ feu:["Avantagé", "Le Feu est super efficace sur les insectes de la forêt."],
              eau:["Neutre", "Attention aux Pikachu : leurs éclairs te font double dégâts."],
              plante:["Difficile", "La Plante est peu efficace sur les insectes et les oiseaux, mais Poudre Toxik (Poison) est super efficace sur les insectes."],
              miaouss:["Neutre", "Le Normal n'a ni avantage ni faiblesse ici. Ses coups critiques font la différence."],
              pika:["Avantagé", "L'Électrik est super efficace sur les Roucool et les Papilusion, et les éclairs des Luxio te font peu de dégâts."],
              evoli:["Variable", "Normal au départ (comme Miaouss), puis le type de l'évolution que tu choisis au N.10."],
              draco:["Neutre", "Le Dragon n'a pas d'avantage sur les insectes, mais tu résistes aux éclairs des Pikachu."] },
    rings:["chenipan", "aspicot", "roucool", "papilusion"],
    bosses:[{ at:240, kind:"bossDard" }, { at:450, kind:"bossRouc" }],
    event:{ kind:"celebi", from:90, to:380, chance:1/3 },
    table(m, o) {
      o.push(["chenipan", m < 3 ? 3 : .8], ["aspicot", m < 3 ? 3 : .8], ["roucool", m < 4 ? 2.5 : 1]);
      if (m > .5)  o.push(["pichu", m < 4 ? 1 : .5]);
      if (m > 1)   o.push(["pikachu", .8]);
      if (m > 1.5) o.push(["chrysacier", 1.4], ["coconfort", 1.4]);
      if (m > 2.5) o.push(["roucoups", 2]);
      if (m > 3)   o.push(["papilusion", 1.5 + m / 4], ["dardargnan", 1.5 + m / 4]);
      if (m > 5.5) o.push(["raichu", 1]);
      if (m > 6)   o.push(["roucarnage", 1 + m / 5]);
    } },
  { name:"Mont Sélénite", num:2, title:"Tu es sorti du Mont Sélénite !", cave:true, moon:true, where:"dans la grotte", from:"surgit des ténèbres",
    intro:"Le Mont Sélénite est une grotte obscure : Nosferapti, Racaillou, Paras, Sabelette et la famille Mélofée. Gare aux éboulements des Grolem ! Tiens dix minutes pour rejoindre la sortie.",
    win:"a traversé le Mont Sélénite. Azuria est en vue !",
    matchup:{ plante:["Avantagé", "La Plante est super efficace sur les Racaillou et les Sabelette, et Poudre Toxik (Poison) sur la famille Mélofée (Fée). Peu efficace sur les Nosferapti et les Paras."],
              eau:["Avantagé", "L'Eau écrase les Racaillou et les Sabelette. Éclair n'a aucun effet sur eux."],
              feu:["Neutre", "Le Feu est peu efficace sur les Racaillou, mais il carbonise les Paras !"],
              miaouss:["Difficile", "Le Normal est peu efficace sur les Racaillou et les Grolem. Évite-les et vise le reste."],
              pika:["Difficile", "L'Électrik n'a aucun effet sur les Racaillou, Grolem et Sabelette, mais il foudroie les Nosferapti."],
              evoli:["Variable", "Normal au départ (comme Miaouss), puis le type de l'évolution que tu choisis au N.10."],
              draco:["Difficile", "Les Mélo sont de type Fée et résistent au Dragon : Ultralaser (Normal) les touche normalement."] },
    rings:["nosferapti", "racaillou", "paras", "nosferalto"],
    bosses:[{ at:240, kind:"bossGrolem" }, { at:450, kind:"bossMelo" }],
    event:{ kind:"ronflex", from:60, to:200, chance:1/3 },
    table(m, o) {
      o.push(["nosferapti", m < 3 ? 3 : 1], ["racaillou", m < 3 ? 2.2 : .8], ["paras", m < 3 ? 2 : .6], ["melo", m < 4 ? 1.2 : .4]);
      if (m > .7)  o.push(["sabelette", 1.6]);
      if (m > 1.5) o.push(["melofee", 1.2]);
      if (m > 2.5) o.push(["nosferalto", 1.5 + m / 4], ["gravalanch", 1.2]);
      if (m > 3)   o.push(["parasect", 1.2], ["sablaireau", 1.2 + m / 5]);
      if (m > 5)   o.push(["melodelfe", 1.4], ["grolem", .8 + m / 6]);
      if (m > 6)   o.push(["nostenfer", 1 + m / 5]);
    } },
  { name:"Repaire Rocket", num:3, title:"Tu as démantelé le Repaire Rocket !", cave:true, rocket:true, track:"rocket", prop:"crate", where:"dans le Repaire", from:"sort de l'ombre",
    intro:"Sous le Casino de Céladopole, la Team Rocket cache son repaire : Abo, Smogo, Tadmorv, Rattata et les Miaouss des sbires. Attention aux Smogo qui explosent, aux flaques de Détritus et aux flèches qui t'entraînent ! Giovanni t'attend… Tiens dix minutes.",
    win:"a démantelé le Repaire Rocket. Giovanni a pris la fuite, et l'Évoli qu'il retenait prisonnier veut te suivre ! Direction la Tour Pokémon de Lavanville.",
    matchup:{ plante:["Difficile", "La Plante est peu efficace sur les Pokémon Poison, et leur Acide te fait double dégâts. Elle écrase par contre les Rhinocorne."],
              eau:["Avantagé", "L'Eau est neutre sur le Poison et fait quatre fois plus de dégâts aux Rhinocorne."],
              feu:["Neutre", "Le Feu n'a pas d'avantage sur le Poison et il est peu efficace sur les Rhinocorne."],
              miaouss:["Neutre", "Le Normal n'a ni avantage ni faiblesse sur le Poison. Ses coups critiques font la différence."],
              pika:["Difficile", "L'Électrik est neutre sur le Poison mais n'a aucun effet sur les Rhinocorne."],
              evoli:["Variable", "Normal au départ (comme Miaouss), puis le type de l'évolution que tu choisis au N.10."],
              draco:["Neutre", "Le Dragon n'a ni avantage ni faiblesse face aux Pokémon de la Team Rocket."] },
    rings:["rattata", "abo", "smogo", "rmiaouss"],
    bosses:[{ at:240, kind:"bossArbok" }, { at:450, kind:"bossPersian" }],
    event:{ kind:"rocket", from:90, to:190, chance:1/3 },
    table(m, o) {
      o.push(["rattata", m < 3 ? 2.6 : .8], ["abo", m < 3 ? 2.4 : 1], ["rmiaouss", m < 3 ? 1.6 : .6]);
      if (m > .7)  o.push(["smogo", 1.4]);
      if (m > 1.5) o.push(["tadmorv", 1.2], ["rattatac", 1.4]);
      if (m > 2.5) o.push(["arbok", 1.3 + m / 6], ["rpersian", 1]);
      if (m > 3.5) o.push(["smogogo", 1 + m / 8], ["rhinocorne", .8 + m / 8]);
      if (m > 5)   o.push(["grotadmorv", .8 + m / 6]);
    } },
  { name:"Tour Pokémon", num:4, title:"Tu as gravi la Tour Pokémon !", cave:true, tower:true, track:"tower", prop:"urn", where:"dans la Tour", from:"surgit de la brume",
    intro:"À Lavanville, la Tour Pokémon est hantée : Fantominus, Spectrum, Osselait et Rattata rôdent entre les tombes, et les Spectres traversent les murs. Un Spectre essaie de te barrer le passage, mais impossible de l'identifier : il te faudrait un moyen de les reconnaître pour les battre (le Scope Sylphe, chez le Marchand). Sans lui, les Spectres restent des silhouettes « ??? » qui encaissent deux fois mieux les coups. Tiens dix minutes pour atteindre le sommet.",
    win:"a apaisé les esprits de la Tour Pokémon. Lavanville peut enfin dormir tranquille !",
    matchup:{ plante:["Neutre", "La Plante écrase les Osselait et les Ossatueur (Sol), mais Poudre Toxik est peu efficace sur les Spectres (Spectre/Poison)."],
              eau:["Avantagé", "L'Eau est super efficace sur les Osselait et les Ossatueur, et rien ne lui résiste ici."],
              feu:["Neutre", "Le Feu n'a ni avantage ni faiblesse dans la Tour. Gare aux os des Osselait : super efficaces sur toi !"],
              miaouss:["Difficile", "Le Normal est peu efficace sur les Spectres. En échange, leurs Ball'Ombre n'ont aucun effet sur toi."],
              pika:["Difficile", "L'Électrik n'a aucun effet sur les Osselait et les Ossatueur, et leurs os te font double dégâts. Vise les fantômes !"],
              evoli:["Variable", "Normal au départ (comme Miaouss), puis le type de l'évolution que tu choisis au N.10."],
              draco:["Neutre", "Draco-Rage touche normalement les spectres, mais Ultralaser (Normal) leur fait peu de dégâts."] },
    event:{ kind:"mere", from:70, to:200 },
    rings:["fantominus", "rattata", "osselait", "spectrum"],
    bosses:[{ at:240, kind:"bossSpectrum" }, { at:450, kind:"bossEcto" }],
    table(m, o) {
      o.push(["fantominus", m < 3 ? 3.6 : 1.2], ["rattata", m < 3 ? 2.8 : 1]);
      if (m > .7)  o.push(["osselait", 1.4]);
      if (m > 1.5) o.push(["spectrum", 1.2 + m / 6]);
      if (m > 2.5) o.push(["rattatac", 1.8]);
      if (m > 3.5) o.push(["ossatueur", 1 + m / 6]);
      if (m > 5)   o.push(["ectoplasma", .8 + m / 5]);
    } },
  { name:"Parc Safari", num:5, title:"Tu as exploré le Parc Safari !", cave:false, safari:true, track:"safari", where:"au Parc Safari", from:"surgit des hautes herbes",
    intro:"À Parmanie, le Parc Safari regorge de Pokémon : Nidoran, Psykokwak, Rhinocorne, Tauros et Insécateur se cachent dans les hautes herbes. Ouvre l'œil : Noeunoeuf et Scarabrute traversent parfois le parc en courant, attrape-les avant qu'ils s'enfuient ! Tiens dix minutes.",
    win:"a exploré tout le Parc Safari. Le gardien de Parmanie n'en revient pas !",
    matchup:{ plante:["Difficile", "Les Nidoran (Poison) et les Insécateur (Insecte/Vol) résistent à la Plante. Elle écrase en revanche les Rhinocorne."],
              eau:["Avantagé", "L'Eau est quatre fois efficace sur les Rhinocorne, et rien ne lui résiste vraiment ici."],
              feu:["Neutre", "Le Feu brûle les Insécateur, mais les Psykokwak lui résistent et leurs jets d'eau te font double dégâts."],
              miaouss:["Neutre", "Le Normal n'a ni avantage ni faiblesse ici, sauf contre les Rhinocorne (Roche) qui lui résistent."],
              pika:["Neutre", "L'Électrik foudroie les Psykokwak et les Insécateur, mais n'a aucun effet sur les Rhinocorne."],
              evoli:["Variable", "Normal au départ (comme Miaouss), puis le type de l'évolution que tu choisis au N.10."],
              draco:["Avantagé", "Tu résistes aux jets d'eau des Psykokwak, et Dracolosse survole les points d'eau."] },
    rings:["nidoranf", "nidoranm", "noeuf", "psykokwak"],
    bosses:[{ at:240, kind:"bossKanga" }, { at:450, kind:"bossTauros" }],
    event:{ kind:"draco", from:60, to:330, chance:1/3 },
    table(m, o) { // Pokémon du Parc Safari de RFVF, répartis selon le biome où l'on se trouve (hors partie : tous les biomes)
      const bs = typeof S !== "undefined" && S && S.P ? [szBiomeAt(S.P.x, S.P.y)] : SAFARI_FOES.map((_, b) => b);
      for (const b of bs) for (const [k, from, w] of SAFARI_FOES[b]) if (m >= from) o.push([k, from ? w + m / 8 : m < 3 ? w : w * .4]);
      if (m > 1) o.push(["leveinard", .22]); // rares : soignent quand on les met K.O.
      if (m > 2.5) o.push(["noadkoko", 1.2 + m / 6]); // partout, comme avant
    } },
  { name:"Manoir Pokémon", num:6, title:"Tu as exploré le Manoir Pokémon !", cave:true, manor:true, track:"manor", prop:"urn", where:"dans le Manoir", from:"surgit des décombres",
    intro:"À Cramois'Île, le vieux Manoir Pokémon tombe en ruines. Goupix, Caninos, Ponyta, Magmar et Tadmorv rôdent dans ses couloirs, et des statues actionnent les portes de feu : touche-en une pour éteindre ou rallumer les flammes. Les pages du journal d'un chercheur sont éparpillées dans le manoir… retrouve-les toutes, si tu oses découvrir ce qu'il cache. Tiens dix minutes.",
    win:"a exploré le Manoir Pokémon de fond en comble. Cramois'Île n'a plus de secrets pour toi !",
    matchup:{ plante:["Difficile", "Presque tout le manoir est de type Feu : super efficace sur toi, et la Plante lui fait peu de dégâts."],
              eau:["Avantagé", "L'Eau est super efficace sur tous les Pokémon Feu du manoir. Le meilleur choix ici !"],
              feu:["Difficile", "Les Pokémon Feu résistent à tes flammes. Heureusement, leurs attaques te font peu de dégâts."],
              miaouss:["Neutre", "Le Normal n'a ni avantage ni faiblesse ici. Attention à Mewtwo et à ses attaques psychiques."],
              pika:["Neutre", "L'Électrik n'a ni avantage ni faiblesse contre le Feu. Vise les Tadmorv et les Smogo en priorité."],
              evoli:["Variable", "Normal au départ, puis le type de ton évolution au N.10. Aquali est idéal dans le manoir !"],
              draco:["Avantagé", "Le Dragon résiste au Feu : Magmar, Arcanin et grilles de feu te font moitié moins mal."] },
    rings:["goupix", "caninos", "tadmorv", "ponyta"],
    bosses:[{ at:240, kind:"bossMagmar" }, { at:450, kind:"bossArcanin" }],
    event:{ kind:"journal", from:40, to:60 },
    table(m, o) {
      o.push(["goupix", m < 3 ? 3 : 1], ["caninos", m < 3 ? 2.6 : 1], ["tadmorv", m < 4 ? 1.6 : .8]);
      if (m > .7)  o.push(["ponyta", 1.6]);
      if (m > 1.5) o.push(["smogo", 1.2], ["rattatac", .8]);
      if (m > 2.5) o.push(["feunard", 1.4], ["grotadmorv", 1]);
      if (m > 3.5) o.push(["galopa", 1 + m / 6], ["magmar", 1 + m / 7]);
      if (m > 5)   o.push(["arcanin", .8 + m / 6]);
    } },
  { name:"Oiseau Légendaire", num:7, title:"Tu as trouvé l'Oiseau Légendaire !", cave:true, track:"legend", where:"selon la carte", from:"surgit",
    intro:"Trois Oiseaux Légendaires se cachent à Kanto. À chaque partie, une carte est tirée au sort : l'Île Écume gelée (sol glissant, stalactites qui tombent du plafond), la Centrale électrique (barrières électriques qui s'allument et s'éteignent, gaz toxique) ou la Route Victoire (lacs de lave et reliefs). Tiens dix minutes.",
    win:"a trouvé l'Oiseau Légendaire !",
    matchup:{ plante:["Variable", "Super efficace sur les Pokémon Eau de l'Île Écume et sur les roches de la Route Victoire. Peu efficace à la Centrale (les Magnéti sont en Acier), et la Glace des Lamantine te fait double dégâts."],
              eau:["Variable", "L'Eau écrase les Racaillou, Onix et Rhinocorne de la Route Victoire, mais elle est peu efficace sur l'Île Écume. Gare aux éclairs de la Centrale !"],
              feu:["Variable", "Le Feu fait fondre les Magnéti (Acier) et les Lamantine (Glace), mais l'Eau et la Roche lui résistent. La lave te brûle moitié moins."],
              miaouss:["Difficile", "Le Normal est peu efficace sur les Magnéti (Acier), les Racaillou et les Onix (Roche). Ses coups critiques font la différence."],
              pika:["Variable", "L'Électrik foudroie les Pokémon Eau de l'Île Écume et ne craint pas la paralysie, mais il n'a aucun effet sur les Racaillou et les Onix de la Route Victoire."],
              evoli:["Variable", "Normal au départ, puis le type de ton évolution au N.10. Voltali est idéal sur l'Île Écume, Aquali sur la Route Victoire."],
              draco:["Neutre", "Le Dragon résiste à l'Eau, à l'Électrik et au Feu, mais la Glace des Lamantine lui fait double dégâts. Dracolosse survole la lave et ne glisse pas sur la glace."] },
    maps:[
      { mapName:"Île Écume", theme:"ice", ice:true, plant:false, lava:false, bird:"artikodin", title:"Tu as traversé l'Île Écume !", from:"surgit de la glace", prop:"crackrock", event:null,
        tip:"Le sol est glissant et des stalactites tombent du plafond !",
        win:"a traversé les grottes gelées de l'Île Écume. Tout au fond, un cri glacial résonne : Artikodin t'a vu passer…",
        rings:["psykokwak", "otaria", "ramoloss", "akwakwak"],
        bosses:[{ at:240, kind:"bossFlagadoss" }, { at:450, kind:"bossLamantine" }],
        table(m, o) {
          o.push(["psykokwak", m < 3 ? 3 : 1], ["otaria", m < 3 ? 2.6 : 1], ["ramoloss", m < 4 ? 1.6 : .7]);
          if (m > 1)   o.push(["akwakwak", 1.2 + m / 8]);
          if (m > 2.5) o.push(["lamantine", 1 + m / 7]);
          if (m > 3.5) o.push(["flagadoss", .8 + m / 8]);
        } },
      { mapName:"Centrale électrique", theme:"plant", ice:false, plant:true, lava:false, bird:"electhor", title:"Tu as remis la Centrale en marche !", from:"jaillit des machines", prop:"crackrock", event:null,
        tip:"Les barrières électriques s'allument et s'éteignent : passe quand elles sont coupées !",
        win:"a traversé la Centrale électrique. Les générateurs crépitent… et Électhor s'envole dans un éclair !",
        rings:["magneti", "voltorbe", "tadmorv", "smogo"],
        bosses:[{ at:240, kind:"bossGrotadmorv" }, { at:450, kind:"bossElectrode" }],
        table(m, o) {
          o.push(["magneti", m < 3 ? 3 : 1], ["voltorbe", m < 3 ? 2.2 : 1], ["tadmorv", m < 4 ? 1.6 : .8]);
          if (m > .7)  o.push(["smogo", 1.4]);
          if (m > 1.5) o.push(["magneton", 1.2 + m / 8]);
          if (m > 2.5) o.push(["grotadmorv", 1 + m / 8]);
          if (m > 3)   o.push(["electrode", 1 + m / 7]);
          if (m > 4)   o.push(["smogogo", 1 + m / 8]);
        } },
      { mapName:"Route Victoire", theme:"lava", ice:false, plant:false, lava:true, bird:"sulfura", title:"Tu as franchi la Route Victoire !", from:"surgit de la roche", prop:"crackrock", event:null,
        tip:"Évite les lacs de lave : ils brûlent !",
        win:"a franchi la Route Victoire. Dans un torrent de flammes, Sulfura s'envole vers le Plateau Indigo !",
        rings:["nosferapti", "racaillou", "machoc", "nosferalto"],
        bosses:[{ at:240, kind:"bossOnix" }, { at:450, kind:"bossRhino" }],
        table(m, o) {
          o.push(["nosferapti", m < 3 ? 3 : 1], ["racaillou", m < 3 ? 2.4 : .8], ["machoc", m < 3 ? 2.2 : 1]);
          if (m > .8)  o.push(["gravalanch", 1.3]);
          if (m > 1.5) o.push(["nosferalto", 1.4 + m / 6], ["machopeur", 1.3]);
          if (m > 2.5) o.push(["rhinocorne", 1.2], ["onix", .8 + m / 8]);
          if (m > 3.5) o.push(["grolem", .8 + m / 6], ["mackogneur", 1 + m / 7]);
          if (m > 5)   o.push(["nostenfer", 1 + m / 5]);
        } },
    ] },
  { name:"Ligue Indigo", num:8, title:"Tu es le nouveau Maître de la Ligue Indigo !", cave:true, league:true, track:"legend", where:"à la Ligue", from:"entre dans l'arène",
    intro:"Au Plateau Indigo, le Conseil 4 t'attend : Olga (Glace), Aldo (Combat), Agatha (Spectre) et Peter (Dragon), puis le Champion et son Alakazam. Cinq salles à la suite, de plus en plus difficiles : dans chacune, des Pokémon sauvages te laissent gagner de l'XP, puis le boss arrive. Entre deux salles, tu es soigné. Pas de chrono : bats-les tous !",
    win:"a battu le Conseil 4 et le Champion. Son nom entre au Panthéon !",
    matchup:{ plante:["Variable", "Tu écrases les Pokémon Eau d'Olga, mais sa Glace et les Pokémon Vol de Peter te font double dégâts."],
              eau:["Avantagé", "L'Eau est solide partout. Seuls les Dragons de Peter lui résistent."],
              feu:["Variable", "Le Feu fait fondre la Glace d'Olga, mais l'Eau et les Dragons lui résistent."],
              miaouss:["Difficile", "Les coups d'Aldo (Combat) sont super efficaces sur toi, et les Spectres d'Agatha résistent au Normal."],
              pika:["Variable", "L'Électrik foudroie les Pokémon Eau d'Olga et les Pokémon Vol de Peter, mais pas ses Dragons."],
              evoli:["Variable", "Normal au départ (comme Miaouss), puis le type de l'évolution que tu choisis au N.10."],
              draco:["Variable", "Le Dragon est super efficace sur les Dragons de Peter… et inversement. La Glace d'Olga te fait double dégâts."] },
    bosses:[], event:null,
    rooms:[
      { mapName:"Salle d'Olga", member:"Olga", mtype:"Glace", theme:"olga", ice:true, plant:false, lava:false, wild:140, boss:"lgLokhlass",
        tip:"Le sol gelé fait glisser !", rings:["kokiyas"],
        table(m, o) {
          o.push(["kokiyas", 3], ["stari", 2.4], ["tentacool", 2.4]);
          if (m > .5) o.push(["otaria", 2]);
          if (m > 1)  o.push(["lippoutou", .5 + m / 10], ["crustabri", .6]);
          if (m > 1.5) o.push(["lamantine", .6]);
        } },
      { mapName:"Salle d'Aldo", member:"Aldo", mtype:"Combat", theme:"aldo", ice:false, plant:false, lava:false, wild:90, boss:"lgMacko",
        tip:"Gare aux coups de poing et aux séismes !", rings:["machoc"],
        table(m, o) {
          o.push(["machoc", 3], ["ferosinge", 2.4], ["machopeur", 1.6], ["colossinge", 1.2]);
          o.push(["kicklee", 1 + m / 8], ["tygnon", 1 + m / 8]);
        } },
      { mapName:"Salle d'Agatha", member:"Agatha", mtype:"Spectre", theme:"agatha", ice:false, plant:false, lava:false, wild:90, boss:"lgEcto",
        tip:"La salle est plongée dans le noir…", rings:["fantominus"],
        table(m, o) {
          o.push(["fantominus", 3], ["abo", 2.2], ["smogo", 1.2], ["tadmorv", 1.2]);
          o.push(["spectrum", 1.2], ["nosferalto", 1.6 + m / 8], ["arbok", 1.4 + m / 8]);
          if (m > 1) o.push(["smogogo", .8 + m / 10], ["grotadmorv", .6 + m / 12]); // les évolutions de Smogo et Tadmorv arrivent après la première minute
        } },
      { mapName:"Salle de Peter", member:"Peter", mtype:"Dragon", theme:"peter", ice:false, plant:false, lava:false, wild:90, boss:"lgDraco", windy:true,
        tip:"Des bourrasques balaient la salle !", rings:["lgmini"],
        table(m, o) {
          o.push(["lgmini", 2.6], ["magicarpe", 1.4], ["roucoups", 2], ["rapasdepic", 1.6]);
          o.push(["wdraco", 1.2], ["ptera", 1 + m / 10], ["leviator", .7 + m / 14]);
        } },
      { mapName:"Salle du Champion", member:"le Champion", mtype:"Psy", theme:"champ", ice:false, plant:false, lava:false, wild:90, boss:"lgAlaka",
        tip:"Ton rival t'attend avec son équipe !", rings:["roucarnage"],
        table(m, o) {
          o.push(["roucoups", 1.6], ["roucarnage", 2.6], ["noadkoko", 2.2], ["galopa", 1]);
        } },
    ] },
  { name:"Caverne Azurée", num:9, secret:true, title:"Tu as vaincu Mewtwo !", cave:true, theme:"azure", track:"legend", prop:"crackrock", where:"dans la Caverne Azurée", from:"surgit des eaux sombres",
    intro:"Au nord d'Azuria, la Caverne Azurée n'ouvre qu'aux Maîtres de la Ligue. Kadabra, Raichu, Magnéton, Électrode, Rhinoféros et Métamorph, qui prend ton apparence… Survis dix minutes : Mewtwo t'attend tout au fond, et cette fois il ne fuira pas.",
    win:"a vaincu Mewtwo. Un petit Pokémon rose sort de l'ombre et le suit : Mew !",
    matchup:{ plante:["Variable", "La Plante noie les Rhinoféros et les Akwakwak, mais les Parasect et les Nosferalto lui résistent."],
              eau:["Avantagé", "L'Eau écrase les Rhinoféros. Gare aux éclairs des Raichu, Magnéton et Électrode."],
              feu:["Variable", "Le Feu carbonise les Parasect et fait fondre les Magnéton (Acier), mais les Rhinoféros et les Akwakwak lui résistent."],
              miaouss:["Difficile", "Le Normal est peu efficace sur les Rhinoféros et les Magnéton. Tes coups critiques feront la différence."],
              pika:["Difficile", "L'Électrik n'a aucun effet sur les Rhinoféros, et Raichu, Magnéton et Électrode lui résistent. Mais il foudroie les Akwakwak et les Nosferalto."],
              evoli:["Variable", "Normal au départ, puis le type de ton évolution au N.10. Aquali est idéal contre les Rhinoféros."],
              draco:["Neutre", "Le Dragon résiste à l'Eau et à l'Électrik, très présents ici. Ultralaser fait le ménage."],
              mew:["Variable", "Mewtwo, ton clone, t'attend au fond : à toi de lui montrer qui est l'original !"] },
    rings:["nosferapti", "magneti", "kadabra", "nosferalto"],
    bosses:[{ at:240, kind:"bossElectrode" }, { at:450, kind:"bossRhino" }],
    finalBoss:"mewtwoC", foeHp:1.35,
    table(m, o) {
      o.push(["nosferapti", m < 2 ? 3 : .6], ["paras", m < 2 ? 2.4 : .5], ["magneti", m < 2.5 ? 2 : .6], ["psykokwak", m < 2.5 ? 1.6 : .5]);
      if (m > 1)   o.push(["voltorbe", 1.2], ["kadabra", .5 + m / 10]);
      if (m > 2)   o.push(["nosferalto", 1.3], ["parasect", 1]);
      if (m > 3)   o.push(["magneton", 1 + m / 10], ["akwakwak", 1]);
      if (m > 4)   o.push(["raichu", .8 + m / 10], ["electrode", .8 + m / 10], ["metamorph", .7]);
      if (m > 5.5) o.push(["rhinoferos", .8 + m / 8], ["metamorph", .6 + m / 10]);
    } },
  // ===================== Johto =====================
  { name:"Tour Chétiflor", num:10, label:1, region:"johto", jFirst:true, title:"Tu as gravi la Tour Chétiflor !", cave:true, tower:true, sprout:true, track:"forest", prop:"urn", where:"dans la Tour Chétiflor", from:"surgit entre les planches",
    intro:"À Mauville, la Tour Chétiflor oscille au rythme de son grand pilier, souple comme un Chétiflor. Chétiflor, Rattata, Hoothoot, Fantominus et Fouinette se cachent entre ses poutres, et les Sages y entraînent toute une lignée : Chétiflor géant, puis Boustiflor géant, puis Empiflor géant. Tiens dix minutes pour atteindre le sommet.",
    win:"a gravi la Tour Chétiflor et reçu la bénédiction des Sages. L'aventure à Johto ne fait que commencer !",
    matchup:{ plante:["Difficile", "Les Chétiflor, Boustiflor et Empiflor (Plante/Poison) résistent à la Plante, et Poudre Toxik leur fait peu d'effet."],
              eau:["Difficile", "L'Eau est peu efficace sur toute la lignée de Chétiflor. Vise les Rattata, Fouinette et Hoothoot."],
              feu:["Avantagé", "Le Feu brûle toute la lignée de Chétiflor, et rien ne lui résiste ici."],
              miaouss:["Neutre", "Le Normal frappe tout le monde normalement, sauf les Fantominus. Les coups critiques font le ménage."],
              pika:["Neutre", "L'Électrik foudroie les Hoothoot et les Noarfang (Vol), mais les Chétiflor lui résistent."],
              evoli:["Variable", "Normal au départ, puis le type de ton évolution au N.10. Pyroli est idéal contre les Chétiflor."],
              draco:["Neutre", "Le Dragon n'a pas d'avantage ici, mais il résiste aux Fouet Lianes des Chétiflor géants."],
              mew:["Variable", "Métronome peut tirer n'importe quel type : chaque partie est une surprise."],
              fee:["Neutre", "La Fée et l'Aurasphère glissent sur la lignée de Chétiflor (Poison), mais Lame d'Air (Vol) la tranche sans peine."] },
    rings:["chetiflor", "rattata", "hoothoot", "fantominus"],
    event:{ kind:"orme", from:220, to:250, chance:1/3 }, // l'assistant du Prof. Orme et l'Œuf de Togepi
    bosses:[{ at:170, kind:"bossChetiflor" }, { at:300, kind:"bossBoustiflor" }, { at:450, kind:"bossEmpiflor" }],
    table(m, o) {
      o.push(["chetiflor", m < 3 ? 3.4 : 1], ["rattata", m < 3 ? 2.4 : .8], ["hoothoot", m < 4 ? 2 : 1]);
      if (m > .7)  o.push(["fantominus", 1.2]);
      if (m > 1.5) o.push(["fouinette", 1.6]);
      if (m > 2.5) o.push(["boustiflor", 1.4 + m / 8], ["rattatac", 1.2]);
      if (m > 3.5) o.push(["fouinar", 1 + m / 8]);
      if (m > 4.5) o.push(["noarfang", 1 + m / 6]);
      if (m > 5.5) o.push(["empiflor", .8 + m / 6]);
    } },
  { name:"Ruines d'Alpha", num:11, label:2, region:"johto", title:"Tu as percé le secret des Ruines d'Alpha !", cave:false, alph:true, track:"forest", prop:"crackrock", where:"dans les Ruines d'Alpha", from:"surgit des ruines",
    intro:"Au sud de Mauville, les Ruines d'Alpha gardent les secrets d'une civilisation disparue. Des essaims de Zarbi s'en échappent et s'alignent parfois pour écrire des mots, les Natu se téléportent dans les hautes herbes, les Axoloto et Maraiste surgissent des étangs et un Queulorior copie tes attaques. Un Axoloto géant, puis Xatu géant, gardent les lieux, et les Zarbi ? et ! géants attendent au fond. Résous la dalle-puzzle si elle apparaît, et tiens dix minutes.",
    win:"a percé le secret des Ruines d'Alpha. Les Zarbi retournent dormir dans leurs salles… pour l'instant.",
    matchup:{ plante:["Avantagé", "La Plante fait des ravages sur les Axoloto et Maraiste (Eau/Sol). Attention aux Natu et Xatu, qui volent."],
              eau:["Neutre", "L'Eau touche tout le monde normalement : les Axoloto et Maraiste (Eau/Sol) ne lui résistent pas."],
              feu:["Neutre", "Le Feu brûle les Zarbi et les Natu, mais les Axoloto et Maraiste l'éteignent."],
              miaouss:["Neutre", "Le Normal frappe tout le monde normalement. Les coups critiques font le ménage dans les essaims de Zarbi."],
              pika:["Variable", "L'Électrik foudroie les Natu et Xatu (Vol), mais n'a aucun effet sur les Axoloto et Maraiste (Sol)."],
              evoli:["Variable", "Normal au départ, puis le type de ton évolution au N.10. Phyllali est idéal contre les Axoloto."],
              draco:["Neutre", "Le Dragon n'a ni avantage ni faiblesse face aux Pokémon des ruines."],
              mew:["Variable", "Métronome peut tirer n'importe quel type : chaque partie est une surprise."],
              kaiminus:["Avantagé", "Mâchouille (Ténèbres) croque les Zarbi, Natu et Xatu (Psy)."],
              fee:["Neutre", "La Fée frappe tout le monde normalement, mais Aurasphère (Combat) glisse sur les Zarbi, Natu et Xatu (Psy)."] },
    rings:["zarbi", "natu", "axoloto", "zarbi"],
    event:{ kind:"puzzle", from:200, to:225 }, // une dalle-puzzle (Kabuto, Ptéra, Ho-Oh ou Amonita) à résoudre
    bosses:[{ at:170, kind:"bossAxoloto" }, { at:300, kind:"bossXatu" }, { at:450, kind:"bossZarbiQ" }, { at:450, kind:"bossZarbiX" }],
    table(m, o) {
      o.push(["zarbi", m < 3 ? 3 : 1.8], ["natu", m < 4 ? 2 : 1], ["axoloto", m < 3 ? 1.8 : 1]);
      if (m > 1.5) o.push(["queulorior", .3]);
      if (m > 2.5) o.push(["maraiste", 1 + m / 8]);
      if (m > 3.5) o.push(["xatu", 1 + m / 6]);
      if (m > 5.5) o.push(["zarbi", 1.5]);
    } },
  { name:"Bois aux Chênes", num:12, label:3, region:"johto", title:"Tu as traversé le Bois aux Chênes !", cave:false, jade:true, ilex:true, track:"forest", prop:"berrytree", where:"dans le Bois aux Chênes", from:"surgit des fourrés",
    intro:"Il fait nuit noire au Bois aux Chênes, au sud d'Écorcia : seules les lucioles et ton Pokémon éclairent le sentier. Une Dark Ball y a corrompu la forêt : Chenipan, Aspicot, Paras, Mystherbe, Nosferapti, Hoothoot et Noeunoeuf sont tous devenus Obscurs, et des Pomdepik tombent des arbres. Parasect Obscur géant, puis Foretress et Noarfang Obscurs géants gardent le sentier. Rattrape le Canarticho fugueur : il coupera les arbustes pour toi. Et si un chant brisé résonne entre les arbres… c'est peut-être Celebi. Tiens dix minutes.",
    win:"a traversé le Bois aux Chênes. La lumière revient entre les arbres, et les Pokémon Obscurs retrouvent leur calme.",
    matchup:{ plante:["Difficile", "Insectes, Poison et Vol résistent à la Plante, et presque toute la forêt en fait partie."],
              eau:["Neutre", "L'Eau frappe normalement les insectes, mais les Paras, Mystherbe et Noeunoeuf (Plante) lui résistent."],
              feu:["Avantagé", "Le Feu brûle les insectes, les plantes et même Foretress (Acier) : le Bois aux Chênes est fait pour toi."],
              miaouss:["Neutre", "Le Normal frappe presque tout le monde normalement, sauf Foretress (Acier)."],
              pika:["Neutre", "L'Électrik foudroie Papilusion, Nosferapti, Hoothoot et Noarfang (Vol), mais les plantes lui résistent."],
              evoli:["Variable", "Normal au départ, puis le type de ton évolution au N.10. Pyroli est idéal ici."],
              draco:["Neutre", "Le Dragon n'a pas d'avantage ici, mais il résiste aux feuilles de Celebi Obscur."],
              mew:["Variable", "Métronome peut tirer n'importe quel type : chaque partie est une surprise."],
              kaiminus:["Neutre", "Mâchouille (Ténèbres) croque les Noeunoeuf et Celebi Obscur (Psy), mais l'Eau glisse sur les plantes."],
              fee:["Variable", "La Fée glisse sur les Pokémon Poison et Foretress, mais Lame d'Air (Vol) tranche les insectes et les plantes."] },
    rings:["chenipanO", "parasO", "nosferaptiO", "hoothootO"],
    event:{ kind:"celebiO", from:330, to:420, chance:1/3 }, // Celebi Obscur, à purifier et capturer (Canarticho, lui, vient à chaque partie)
    bosses:[{ at:170, kind:"bossParasect" }, { at:300, kind:"bossForetress" }, { at:450, kind:"bossNoarfang" }],
    table(m, o) {
      o.push(["chenipanO", m < 3 ? 2.6 : .6], ["aspicotO", m < 3 ? 2.6 : .6], ["parasO", m < 3 ? 2 : .8], ["mystherbeO", m < 4 ? 2 : .8]);
      if (m > .7)  o.push(["nosferaptiO", 1.4], ["hoothootO", 1.2]);
      if (m > 1.5) o.push(["chrysacierO", 1.1], ["coconfortO", 1.1], ["pomdepikO", 1.3]);
      if (m > 2.5) o.push(["noeufO", 1.2], ["ortideO", 1 + m / 8]);
      if (m > 3.5) o.push(["papilusionO", 1.2 + m / 6], ["dardargnanO", 1.2 + m / 6], ["parasectO", 1 + m / 8]);
      if (m > 5)   o.push(["noarfangO", 1 + m / 6], ["foretressO", .6 + m / 10]);
    } },
  { name:"Tour Cendrée", num:13, label:4, region:"johto", title:"Tu as exploré la Tour Cendrée !", cave:false, burned:true, track:"legend", prop:"crackrock", where:"dans la Tour Cendrée", from:"surgit des décombres",
    intro:"À Rosalia, la Tour Cendrée n'est plus qu'un plancher calciné percé de trous, où couvent encore des braises. Rattata, Smogo, Nosferapti et Magmar y sont devenus Obscurs, et des Krabby se cachent sous les rochers. Au sous-sol, les trois chiens légendaires se réveillent : Entei et son soleil de plomb, puis Suicune et sa pluie, puis Raikou et son orage. La météo change tout : les attaques Feu et Eau en sortent renforcées ou affaiblies, pour toi aussi. Et ton rival rôde peut-être… Tiens dix minutes.",
    win:"a exploré la Tour Cendrée. Les trois chiens légendaires courent désormais à travers Johto.",
    matchup:{ plante:["Neutre", "La Plante noie les Krabby, mais les Smogo et Nosferapti (Poison) lui résistent, et Entei la brûle."],
              eau:["Variable", "L'Eau éteint les Magmar et Entei, surtout sous la pluie de Suicune. Mais sous le soleil d'Entei, elle perd la moitié de sa force."],
              feu:["Variable", "Sous le soleil d'Entei, le Feu fait +50 % de dégâts. Sous la pluie de Suicune et de Raikou, il en perd la moitié."],
              miaouss:["Neutre", "Le Normal frappe presque tout le monde normalement, et ses coups critiques font le ménage."],
              pika:["Avantagé", "L'Électrik foudroie les Krabby, les Nosferapti et Suicune. Raikou, lui, lui résiste."],
              evoli:["Variable", "Normal au départ, puis le type de ton évolution au N.10. Aquali profite de la pluie, Pyroli du soleil."],
              draco:["Avantagé", "Le Dragon résiste au Feu, à l'Eau et à l'Électrik des trois chiens légendaires."],
              mew:["Variable", "Métronome peut tirer n'importe quel type : la météo peut doubler ta chance… ou la diviser."],
              heri:["Variable", "Le soleil d'Entei attise tes flammes, mais la pluie de Suicune et de Raikou les étouffe."],
              kaiminus:["Variable", "La pluie de Suicune et de Raikou donne +50 % à tes attaques Eau. Sous le soleil d'Entei, méfie-toi."],
              fee:["Neutre", "La Fée frappe presque tout le monde normalement, mais les Smogo (Poison) lui résistent."] },
    rings:["rattataO", "smogoO", "nosferaptiO", "rattataO"],
    event:{ kind:"rival", from:110, to:150, chance:1/3 }, // Silver, le rival, et son équipe
    bosses:[{ at:170, kind:"bossEntei" }, { at:300, kind:"bossSuicune" }, { at:450, kind:"bossRaikou" }],
    table(m, o) {
      o.push(["rattataO", m < 3 ? 3.4 : 1], ["smogoO", m < 4 ? 2.4 : 1.2], ["nosferaptiO", m < 4 ? 1.2 : .8]);
      if (m > 1.2) o.push(["rattatacO", .8 + m / 10]);
      if (m > 2.5) o.push(["magmarO", .3 + m / 20]); // Magmar reste rare, comme au sous-sol de la vraie tour
      if (m > 4)   o.push(["smogogoO", .5 + m / 12]);
    } },
  { name:"Lac Colère", num:14, label:5, region:"johto", title:"Tu as apaisé le Lac Colère !", cave:false, rage:true, track:"forest", prop:"berrytree", where:"au Lac Colère", from:"surgit du lac",
    intro:"Au nord d'Acajou, il pleut sans cesse sur le Lac Colère. Une onde radio de la Team Rocket y rend les Pokémon furieux : Magicarpe, Hoothoot, Noeunoeuf, Pomdepik et Mimitoss sont devenus Obscurs, et l'onde force les Magicarpe à évoluer en Léviator. Aéromite Obscur géant, puis un Magicarpe Obscur géant gardent la rive… et au milieu du lac, un Léviator rouge enrage. Sous la pluie, l'Eau est renforcée et le Feu affaibli. Tiens dix minutes.",
    win:"a apaisé le Lac Colère. Le Léviator rouge s'est calmé, et l'onde de la Team Rocket mène tout droit à Acajou.",
    matchup:{ plante:["Variable", "La Plante noie les Magicarpe, mais les Léviator (Vol) et les insectes lui résistent."],
              eau:["Variable", "La pluie donne +50 % à tes attaques Eau, et tu nages dans le lac. Mais les Magicarpe et les Léviator y résistent."],
              feu:["Difficile", "Sous la pluie, tes attaques Feu perdent la moitié de leur force, même si elles brûlent les insectes et les Noeunoeuf."],
              miaouss:["Neutre", "Le Normal frappe presque tout le monde normalement, et ses coups critiques font le ménage."],
              pika:["Avantagé", "L'Électrik foudroie les Magicarpe, les Hoothoot et surtout les Léviator (Eau et Vol) : dégâts ×4 !"],
              evoli:["Variable", "Normal au départ, puis le type de ton évolution au N.10. Voltali est idéal ici, Aquali profite de la pluie."],
              draco:["Neutre", "Le Dragon résiste à l'Eau des Léviator, mais Draco-Rage du Léviator rouge le frappe fort."],
              mew:["Variable", "Métronome peut tirer n'importe quel type : la pluie peut doubler ta chance… ou la diviser."],
              heri:["Difficile", "La pluie étouffe tes flammes : −50 % sur tes attaques Feu pendant tout le niveau."],
              kaiminus:["Variable", "La pluie donne +50 % à tes attaques Eau, et Mâchouille croque les Noeunoeuf (Psy)."],
              fee:["Neutre", "La Fée frappe presque tout le monde normalement, mais les Mimitoss et Aéromite (Poison) lui résistent."] },
    rings:["magicarpeO", "hoothootO", "mimitossO", "noeufO"],
    event:{ kind:"peter", from:448, to:452, chance:1/3 }, // Peter et son Dracolosse viennent aider contre le Léviator rouge
    bosses:[{ at:170, kind:"bossAeromite" }, { at:300, kind:"bossCarpe" }, { at:450, kind:"bossLevRouge" }],
    table(m, o) { // Poképédia : Magicarpe et Léviator sur l'eau, Hoothoot, Noeunoeuf, Pomdepik, Mimitoss (et Chenipan, Aspicot dans Or et Argent) dans les arbres
      o.push(["magicarpeO", m < 4 ? 3 : 2], ["hoothootO", m < 3 ? 2.2 : 1.2], ["noeufO", 1.2], ["chenipanO", m < 3 ? .8 : .3], ["aspicotO", m < 3 ? .8 : .3]);
      if (m > 1)   o.push(["pomdepikO", 1.3], ["mimitossO", 1.5]);
      if (m > 2.5) o.push(["aeromiteO", .5 + m / 12], ["papilusionO", .4], ["dardargnanO", .4]);
      if (m > 4)   o.push(["leviatorO", .3 + m / 30]); // un Léviator sur dix, comme sur le vrai lac
    } },
];
for (const lv of LEVELS) if (lv.maps) Object.assign(lv, lv.maps[0], { mapIdx:0 });
for (const lv of LEVELS) if (lv.rooms) Object.assign(lv, lv.rooms[0], { roomIdx:0 });
// Ligue Indigo : passe à la salle k (décor, Pokémon sauvages, boss)
function setRoom(k) {
  if (LEVEL.roomIdx !== k) { Object.assign(LEVEL, LEVEL.rooms[k], { roomIdx:k }); chunkData.clear(); nearCache.clear(); liveChunks.clear(); motes.length = 0; }
}
// Oiseau Légendaire : une carte sur trois tirée au sort (k imposé par l'hôte en ligne)
function pickMap(k) {
  if (!LEVEL.maps) return;
  if (!(k >= 0 && k < LEVEL.maps.length)) k = Math.floor(Math.random() * LEVEL.maps.length);
  if (LEVEL.mapIdx !== k) { Object.assign(LEVEL, LEVEL.maps[k], { mapIdx:k }); chunkData.clear(); nearCache.clear(); liveChunks.clear(); motes.length = 0; }
}
// Parc Safari : [Pokémon, minute d'arrivée, poids] pour chaque biome (ordre des images de 26d-parc-safari.js)
const SAFARI_FOES = [
  [["nidoranm", 0, 3], ["nidoranf", 0, 2], ["rhinocorne", 1, 2], ["nidorino", 1.5, 1.4], ["kangourex", 3, 1], ["tauros", 3.5, 1]], // falaises et terre
  [["nidoranf", 0, 3], ["nidoranm", 0, 3], ["noeuf", 0, 2.4], ["doduo", .5, 2], ["psykokwak", .5, 1.5], ["nidorina", 1.5, 1.2], ["nidorino", 1.5, 1.2], ["tauros", 3.5, .8]], // prairie fleurie
  [["paras", 0, 3], ["mimitoss", 0, 3], ["noeuf", 0, 2], ["parasect", 2, 1.4], ["aeromite", 2.5, 1.4], ["insecateur", 4.5, 1.2]], // forêt
  [["psykokwak", 0, 3], ["paras", 0, 2], ["mimitoss", 0, 2], ["ramoloss", .5, 2], ["parasect", 2, 1.2], ["aeromite", 2.5, 1]], // marais
  [["doduo", 0, 3], ["nidoranm", 0, 2], ["nidoranf", 0, 2], ["rhinocorne", 1, 2], ["tauros", 2.5, 1.5], ["kangourex", 3, 1]], // sable et falaises
  [["mimitoss", 0, 3], ["psykokwak", 0, 2.4], ["paras", 0, 2], ["ramoloss", .5, 1.6], ["aeromite", 2.5, 1.4], ["insecateur", 3.5, 1.2]], // forêt et lacs
  [["doduo", 0, 3], ["nidoranm", 0, 2.5], ["rhinocorne", 1, 2], ["nidorino", 1.5, 1.2], ["tauros", 3, 1.2], ["kangourex", 3.5, 1]], // sable blanc et rochers
];
let LEVEL = LEVELS[0];
const GAME_LEN = 600;

function foeTable(t) {
  const o = [];
  LEVEL.table(t / 60, o);
  const total = o.reduce((s, x) => s + x[1], 0);
  let r = Math.random() * total;
  for (const [k, w] of o) { if ((r -= w) <= 0) return k; }
  return o[0][0];
}

