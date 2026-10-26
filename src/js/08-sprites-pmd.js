/* ---------- Sprites PMD (SpriteCollab) ---------- */
const DEX = { plante:["0001","0002","0003"], feu:["0004","0005","0006"], eau:["0007","0008","0009"], miaouss:["0052","0053","0053"], pika:["0172","0025","0026"], lixy:"0403", luxio:"0404", luxray:"0405", pichuspiky:"0172sp", evoli:["0133","0133","0133"], evoli_s:["0133s","0133s","0133s"], draco:["0147","0148","0149"], draco_s:["0147s","0148s","0149s"], mew:["0151","0151","0151"], mew_s:["0151s","0151s","0151s"], germignon:["0152","0153","0154"], germignon_s:["0152s","0153s","0154s"], heri:["0155","0156","0157"], heri_s:["0155s","0156s","0157s"], kaiminus:["0158","0159","0160"], kaiminus_s:["0158s","0159s","0160s"], togepi:["0175","0176","0468"], togepi_s:["0175s","0176s","0468s"],
  aquali:"0134", voltali:"0135", pyroli:"0136", phyllali:"0470", aquali_s:"0134s", voltali_s:"0135s", pyroli_s:"0136s", phyllali_s:"0470s",
  plante_s:["0001s","0002s","0003s"], feu_s:["0004s","0005s","0006s"], eau_s:["0007s","0008s","0009s"], miaouss_s:["0052s","0053s","0053s"], pika_s:["0172s","0025s","0026s"], pichuspiky_s:"0172ss",
  chenipan:"0010", chrysacier:"0011", papilusion:"0012", aspicot:"0013", coconfort:"0014", dardargnan:"0015",
  roucool:"0016", pichu:"0172", roucoups:"0017", roucarnage:"0018", pikachu:"0025", raichu:"0026",
  melo:"0173", melofee:"0035", melodelfe:"0036", nosferapti:"0041", nosferalto:"0042", nostenfer:"0169", paras:"0046", parasect:"0047",
  racaillou:"0074", gravalanch:"0075", grolem:"0076", sabelette:"0027", sablaireau:"0028",
  natu:"0177", xatu:"0178", axoloto:"0194", maraiste:"0195", queulorior:"0235", zarbi:"0201", // Ruines d'Alpha
  mystherbe:"0043", ortide:"0044", pomdepik:"0204", foretress:"0205", canarticho:"0083", // Bois aux Chênes
  fantominus:"0092", spectrum:"0093", ectoplasma:"0094", osselait:"0104", ossatueur:"0105", rattata:"0019", rattatac:"0020", chetiflor:"0069", boustiflor:"0070", empiflor:"0071", fouinette:"0161", fouinar:"0162", hoothoot:"0163", noarfang:"0164",
  abo:"0023", arbok:"0024", tadmorv:"0088", grotadmorv:"0089", smogo:"0109", smogogo:"0110", rhinocorne:"0111", rhinoferos:"0112", rhinastoc:"0464", rmiaouss:"0052", rpersian:"0053", celebi:["0251","0251","0251"], celebi_s:["0251s","0251s","0251s"], ronflex:"0143",
  nidoranf:"0029", nidorina:"0030", nidoranm:"0032", nidorino:"0033", psykokwak:"0054", akwakwak:"0055", ramoloss:"0079", flagadoss:"0080", otaria:"0086", lamantine:"0087", magneti:"0081", magneton:"0082", voltorbe:"0100", electrode:"0101", onix:"0095", machoc:"0066", machopeur:"0067", mackogneur:"0068",
  noeunoeuf:"0102", noadkoko:"0103", minidraco:"0147", goupix:"0037", feunard:"0038", caninos:"0058", arcanin:"0059", ponyta:"0077", galopa:"0078", magmar:"0126", mewtwo:"0150", kadabra:"0064", metamorph:"0132", artikodin:"0144", electhor:"0145", sulfura:"0146", lokhlass:"0131", lippoutou:"0124", crustabri:"0091", tygnon:"0107", kicklee:"0106", leviator:"0130", ptera:"0142", alakazam:"0065", kokiyas:"0090", stari:"0120", tentacool:"0072", ferosinge:"0056", colossinge:"0057", magicarpe:["0129","0130"], magicarpe_s:["0129s","0130s"], rapasdepic:"0022", wdraco:"0148", dracolosse:"0149", leveinard:"0113", kangourex:"0115", insecateur:"0123", scarabrute:"0127", tauros:"0128" };
ZARBI_L.forEach((c, i) => { DEX["zarbi_" + c] = i ? "0201_" + String(i).padStart(2, "0") : "0201"; }); // les 28 formes de Zarbi (A à Z, ! et ?)
const SPR = {};
for (const [id, sh] of Object.entries(window.PMD_SHEETS || {})) { const img = new Image(); img.src = sh.src; SPR[id] = { ...sh, img, total: sh.dur.reduce((a, b) => a + b, 0) }; }
const DIR_ROW = [2, 1, 0, 7, 6, 5, 4, 3]; // lignes PMD : bas, bas-droite, droite, haut-droite, haut, haut-gauche, gauche, bas-gauche
const dirOf = (vx, vy) => DIR_ROW[((Math.round(Math.atan2(vy, vx) / (Math.PI / 4)) % 8) + 8) % 8];
function sheetFor(kind, st) { const d = DEX[kind], sh = SPR[Array.isArray(d) ? d[st] : d]; return sh && sh.img.complete && sh.img.naturalWidth ? sh : null; }
function drawSprite(c, sh, x, y, r, dir, t, moving) {
  let tick = moving ? Math.floor(t * 60) % sh.total : 0, f = 0;
  while (tick >= sh.dur[f]) { tick -= sh.dur[f]; f++; }
  const s = r / 7, w = sh.fw * s, h = sh.fh * s;
  ell(c, x, y + r * .75, r * .8, r * .28, "rgba(0,0,0,.3)");
  c.imageSmoothingEnabled = false;
  c.drawImage(sh.img, f * sh.fw, dir * sh.fh, sh.fw, sh.fh, Math.round(x - w / 2), Math.round(y - h / 2), w, h);
}
function drawMon(c, kind, x, y, r, flip, t, st = 0, dir = null, moving = true) {
  const sh = sheetFor(kind, st);
  if (sh) return drawSprite(c, sh, x, y, r, dir ?? (flip ? 6 : 2), t, moving);
  c.save(); c.translate(x, y);
  ell(c, 0, r * 1.05, r * .85, r * .25, "rgba(0,0,0,.28)");
  c.scale(flip ? -1 : 1, 1);
  const drawKind = kind.endsWith("_s") ? kind.slice(0, -2) : kind;
  if (DRAW[drawKind]) DRAW[drawKind](c, r, t, st); else { circ(c, 0, 0, r, "#9a90a8"); eyes(c, 0, -r * .1, r * .3); }
  c.restore();
}
