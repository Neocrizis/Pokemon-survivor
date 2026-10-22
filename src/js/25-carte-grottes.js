function caveChunk(ci, cj) {
  const R = rng(Math.floor(hash(ci + 4000, cj - 2000) * 4294967295));
  const x0 = ci * CH, y0 = cj * CH, ponds = [], walls = [], spikes = [], crystals = [], shrooms = [], solids = [], lava = [], gates = [], th = LEVEL.theme;
  const clear = (x, y, m) => Math.hypot(x, y - START_Y) > 260 && !nearPath(x, y, m);
  const inPond = (x, y, m) => ponds.some(p => ((x-p.x) / (p.rx + m))**2 + ((y-p.y) / (p.ry + m))**2 < 1) || lava.some(p => ((x-p.x) / (p.rx + m))**2 + ((y-p.y) / (p.ry + m))**2 < 1);
  if ((th === "ice" && R() < .3) || (th === "azure" && R() < .5)) { const px = x0 + 130 + R() * 252, py = y0 + 130 + R() * 252; if (clear(px, py, 200)) ponds.push({ x:px, y:py, rx:80 + R() * 60, ry:55 + R() * 30, rot:(R() - .5) * .6, ph:R() * 6 }); } // eau glacée de l'Île Écume
  if (th === "lava") for (let i = 0; i < 2; i++) { if (R() > .5) continue; const px = x0 + 110 + R() * 292, py = y0 + 110 + R() * 292; if (Math.hypot(px, py - START_Y) > 340 && !inPond(px, py, 60)) lava.push({ x:px, y:py, rx:70 + R() * 70, ry:45 + R() * 35, rot:(R() - .5) * .8, ph:R() * 6 }); } // lacs de lave
  const tries = Math.round((1 + forestDensity(x0 + CH/2, y0 + CH/2) * 7) * (th === "lava" ? 1.5 : th === "plant" ? .7 : LEVEL.league ? .55 : 1));
  for (let i = 0; i < tries; i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (forestDensity(x, y) < .42 || !clear(x, y, 140) || inPond(x, y, 70)) continue;
    if (walls.some(w => Math.hypot(w.x - x, w.y - y) < 175)) continue;
    walls.push({ x, y, r:th === "lava" ? 50 + R() * 46 : 40 + R() * 36, ph:R() * 6, n:8 + Math.floor(R() * 4) });
  }
  if (LEVEL.moon) for (const w of walls) { // Mont Sélénite : longues crêtes rocheuses comme dans Rouge Feu
    const hz = R() < .5, len = 4 + Math.floor(R() * 6), thick = 2 + (R() < .35 ? 1 : 0), T = 32;
    let tw = hz ? len : thick, th = hz ? thick : len;
    const ox = w.x, oy = w.y, ok = (a, b) => { const W = a * T, H = b * T; w.x = Math.max(x0 + 50 + W / 2, Math.min(x0 + CH - 50 - W / 2, ox)); w.y = Math.max(y0 + 50 + H / 2, Math.min(y0 + CH - 50 - H / 2, oy)); for (let u = -W / 2; u <= W / 2; u += 24) for (let v = -H / 2; v <= H / 2; v += 24) { const px = w.x + u, py = w.y + v; if (px < x0 + 50 || px > x0 + CH - 50 || py < y0 + 50 || py > y0 + CH - 50 || !clear(px, py, 70) || inPond(px, py, 30) || walls.some(o => o !== w && o.tw && Math.abs(o.x - px) < o.tw * T / 2 + 70 && Math.abs(o.y - py) < o.th * T / 2 + 70)) return false; } return true; };
    while ((hz ? tw : th) > 3 && !ok(tw, th)) hz ? tw-- : th--;
    if (!ok(tw, th)) { tw = th = 2; } // repli : petit rocher rond
    w.tw = tw; w.th = th; w.r = Math.hypot(tw, th) * T / 2;
  }
  const craters = [], inRidge = (x, y, m) => walls.some(w => w.tw ? Math.abs(w.x - x) < w.tw * 16 + m && Math.abs(w.y - y) < w.th * 16 + m : Math.hypot(w.x - x, w.y - y) < w.r + m);
  const busy = (x, y, m) => LEVEL.moon && (inRidge(x, y, m) || craters.some(c => Math.hypot(c.x - x, c.y - y) < 40 + m)); // rien ne se superpose au Mont Sélénite
  if (LEVEL.moon && R() < .45) { const x = x0 + 60 + R() * (CH - 120), y = y0 + 60 + R() * (CH - 120); if (clear(x, y, 90) && !inRidge(x, y, 50)) craters.push({ x, y }); }
  for (let i = 0; i < 6; i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (!clear(x, y, 80) || inPond(x, y, 30) || walls.some(w => Math.hypot(w.x - x, w.y - y) < w.r + 34) || busy(x, y, 60) || spikes.some(k => Math.hypot(k.x - x, k.y - y) < 55)) continue;
    spikes.push({ x, y, r:9 + R() * 9, ph:R() * 6 });
  }
  for (let i = 0; i < 3; i++) {
    if (R() < .35) continue;
    const x = x0 + R() * CH, y = y0 + R() * CH;
    if (!clear(x, y, 60) || inPond(x, y, 20) || walls.some(w => Math.hypot(w.x - x, w.y - y) < w.r + 20) || busy(x, y, 30) || spikes.some(k => Math.hypot(k.x - x, k.y - y) < 50)) continue;
    crystals.push({ x, y, s:.8 + R() * .6, col:R() < .55 ? 0 : 1, ph:R() * 6 });
  }
  for (let i = 0; i < 3; i++) { const x = x0 + R() * CH, y = y0 + R() * CH; if (!th && !nearPath(x, y, 70) && !inPond(x, y, 10) && !busy(x, y, 30) && !spikes.some(k => Math.hypot(k.x - x, k.y - y) < 50) && !crystals.some(c => Math.hypot(c.x - x, c.y - y) < 60)) shrooms.push({ x, y, ph:R() * 6 }); }
  if (th === "plant" && R() < .75) { // Centrale : barrière électrique entre deux pylônes
    const x = x0 + 80 + R() * (CH - 160), y = y0 + 80 + R() * (CH - 160), a = R() * Math.PI, h = 85 + R() * 45;
    if (Math.hypot(x, y - START_Y) > 330 && !walls.some(w => Math.hypot(w.x - x, w.y - y) < w.r + h + 20))
      gates.push({ x1:x - Math.cos(a) * h, y1:y - Math.sin(a) * h, x2:x + Math.cos(a) * h, y2:y + Math.sin(a) * h, ph:R() * 6, per:5 + R() * 2, on:2.4 + R() * .8 });
  }
  for (const g of gates) solids.push({ x:g.x1, y:g.y1, r:13 }, { x:g.x2, y:g.y2, r:13 }, { x:(g.x1 + g.x2) / 2, y:(g.y1 + g.y2) / 2, r:Math.hypot(g.x2 - g.x1, g.y2 - g.y1) / 2, gate:g });
  for (const w of walls) {
    if (!w.tw) { solids.push({ x:w.x, y:w.y, r:w.r * .88 }); continue; }
    const W = w.tw * 32, H = w.th * 32, rr = Math.min(W, H) / 2 * .92, hz = W >= H; // chapelet de cercles le long de la crête
    for (let d = -(Math.max(W, H) / 2 - rr); d <= Math.max(W, H) / 2 - rr + .1; d += rr * .9) solids.push({ x:w.x + (hz ? d : 0), y:w.y + (hz ? 0 : d), r:rr });
  }
  for (const k of spikes) solids.push({ x:k.x, y:k.y, r:k.r });
  for (const c of crystals) solids.push({ x:c.x, y:c.y, r:9 * c.s });
  for (const p of ponds) {
    const span = Math.max(0, p.rx - p.ry);
    for (let k = -2; k <= 2; k++) solids.push({ x:p.x + Math.cos(p.rot) * k * span / 2, y:p.y + Math.sin(p.rot) * k * span / 2, r:p.ry * .9, pond:true });
  }
  return { ponds, trees:[], rocks:[], logs:[], walls, spikes, crystals, shrooms, lava, gates, craters, solids, canvas:null, used:0 };
}
const CRYSTAL_COLS = [["#f6c4ee", "#d27ad0", "#8a3f9a", "255,170,235"], ["#c4ecff", "#6cb6f0", "#2f6aa8", "150,210,255"], ["#ffd8a8", "#ff8a3a", "#a8401c", "255,140,60"], ["#fff6c0", "#f6d13a", "#a88a20", "255,230,120"]];
// Oiseau Légendaire : couleurs de l'Île Écume, de la Centrale électrique et de la Route Victoire
const CAVE_PAL = {
  ice:   { base:"#a8c8dc", g:[150, 40, -14, 184, 34, -12, 208, 28, -8], path:[222, 18, 234, 14, 244, 10], dark:"rgba(8,28,52,.58)", gravel:["#8fb2ca", "#bcd6e8", "#eef8ff"], pebble:["#b4d0e2", "#94b8d0"],
           crack:"rgba(255,255,255,.55)", foot:"rgba(170,200,224,.6)", rim:"#d4ebf7", rimStones:["#e8f6fd", "#bcd8ea"], wall:["#f2fbff", "#a6cfe8", "#4e86b0"], wallTop:"rgba(255,255,255,.5)", wallLine:"rgba(40,90,130,.7)",
           spike:["#4e80a8", "#86b8d6", "#bfe2f4", "#f0fbff"], spikeHi:"#ffffff", crystal:1 },
  plant: { base:"#dfe4e8", g:[224, 0, 0, 229, 0, 0, 232, 0, 0], path:[224, 0, 229, 0, 232, 0], dark:"rgba(10,16,26,.22)", gravel:["#30363e", "#545c66", "#7c848e"], pebble:["#646c76", "#4a5058"],
           crack:"rgba(0,0,0,0)", foot:"rgba(0,0,0,0)", rim:"#3a4048", rimStones:["#5a626c", "#454c55"], wall:["#aab4c0", "#66707c", "#353b44"], wallTop:"rgba(220,230,240,.3)", wallLine:"rgba(16,20,26,.85)",
           spike:["#2a2f36", "#454d57", "#d8ae2e", "#f2d257"], spikeHi:"#fff5c0", crystal:3 },
  lava:  { base:"#2a1e1c", g:[50, 22, -14, 40, 18, -12, 40, 16, -10], path:[94, 16, 80, 14, 72, 12], dark:"rgba(14,4,2,.74)", gravel:["#1a1214", "#3a2a26", "#5a4038"], pebble:["#4a3632", "#2e2220"],
           crack:"rgba(255,110,30,.7)", foot:"rgba(40,28,24,.6)", rim:"#2a1a16", rimStones:["#4a3430", "#352420"], wall:["#9a6a52", "#5e3a2e", "#2a1814"], wallTop:"rgba(210,150,120,.28)", wallLine:"rgba(20,8,4,.85)",
           spike:["#1e1416", "#3a2824", "#5a3e34", "#7e5646"], spikeHi:"#ff9a5a", crystal:2 },
};
Object.assign(CAVE_PAL, { // Ligue Indigo : une arène par membre du Conseil 4, puis la salle du Champion
  olga:   { ...CAVE_PAL.ice, base:"#b8d4e4", g:[176, 30, -10, 204, 26, -8, 226, 20, -6], path:[214, 14, 230, 12, 244, 8], dark:"rgba(10,30,56,.5)" },
  aldo:   { base:"#8a7a66", g:[138, 26, -12, 120, 22, -12, 98, 18, -10], path:[176, 16, 156, 14, 124, 12], dark:"rgba(20,12,6,.6)", gravel:["#5a4c3e", "#7a6a58", "#a8967e"], pebble:["#7a6a58", "#5e5042"],
            crack:"rgba(40,26,14,.5)", foot:"rgba(90,70,50,.45)", rim:"#5a4c3e", rimStones:["#8a7a66", "#6a5c4c"], wall:["#c8b8a0", "#8a7660", "#4a3c2e"], wallTop:"rgba(240,225,200,.3)", wallLine:"rgba(30,20,10,.8)",
            spike:["#4a3c2e", "#6a5a48", "#8a7a66", "#b0a088"], spikeHi:"#f0e0c0", crystal:2 },
  agatha: { base:"#2a2036", g:[44, 18, -8, 34, 14, -8, 58, 20, -10], path:[70, 14, 56, 12, 88, 14], dark:"rgba(8,2,18,.88)", gravel:["#1a1424", "#3a2e4a", "#54466a"], pebble:["#3e3250", "#2a2238"],
            crack:"rgba(150,90,220,.35)", foot:"rgba(60,46,80,.5)", rim:"#2a2036", rimStones:["#4a3e5e", "#352c46"], wall:["#7a6a94", "#4a3e60", "#221a30"], wallTop:"rgba(200,170,240,.22)", wallLine:"rgba(10,4,20,.85)",
            spike:["#221a30", "#3a2e4e", "#6a4e9a", "#9a7ad0"], spikeHi:"#e0c8ff", crystal:0 },
  peter:  { base:"#28344e", g:[42, 16, -8, 54, 16, -8, 82, 20, -10], path:[96, 12, 90, 12, 126, 14], dark:"rgba(6,8,24,.7)", gravel:["#18203a", "#33405e", "#4e5c80"], pebble:["#3a4868", "#26304a"],
            crack:"rgba(140,110,255,.45)", foot:"rgba(50,60,90,.5)", rim:"#28344e", rimStones:["#46547a", "#323e5c"], wall:["#8a96b8", "#4e5a7c", "#1e2640"], wallTop:"rgba(200,210,255,.25)", wallLine:"rgba(8,10,24,.85)",
            spike:["#1e2640", "#34406a", "#5e4ec8", "#9a8af0"], spikeHi:"#e8e0ff", crystal:1 },
  azure:  { base:"#1e3a4a", g:[34, 58, 74, 42, 70, 88, 52, 86, 104], path:[60, 96, 112, 74, 110, 128], dark:"rgba(2,10,22,.8)", gravel:["#12283a", "#2a4c62", "#4a7894"], pebble:["#2e5670", "#1c3a4e"],
            crack:"rgba(90,200,255,.35)", foot:"rgba(40,70,90,.5)", rim:"#1c3444", rimStones:["#3a6680", "#2a4c62"], wall:["#6a9ab8", "#2e5a78", "#10263a"], wallTop:"rgba(170,220,255,.25)", wallLine:"rgba(4,14,26,.85)",
            spike:["#10263a", "#24506e", "#3a86b0", "#7ac8f0"], spikeHi:"#d8f4ff", crystal:1 },
  champ:  { base:"#d8ccb4", g:[220, 16, -6, 206, 14, -6, 180, 12, -6], path:[176, 10, 52, 8, 52, 8], dark:"rgba(30,20,10,.32)", gravel:["#b8a888", "#cfc2a6", "#ece2cc"], pebble:["#c8b896", "#a8987a"],
            crack:"rgba(150,120,70,.25)", foot:"rgba(0,0,0,0)", rim:"#a8987a", rimStones:["#e0d2b4", "#c4b494"], wall:["#f4ecdc", "#c8b896", "#7a6a50"], wallTop:"rgba(255,250,235,.5)", wallLine:"rgba(60,46,26,.7)",
            spike:["#7a6a50", "#a8987a", "#d8b84a", "#f4d870"], spikeHi:"#fff6d0", crystal:3 },
});
const crCol = cr => LEVEL.theme ? CAVE_PAL[LEVEL.theme].crystal : cr.col;
function themeFloor(g, x0, y0, R, th) { // détails du sol propres à chaque carte
  if (th === "plant") { // sol d'usine : plaques d'acier rivetées, caillebotis, allée en tôle striée bordée de bandes de sécurité
    const T = 64;
    for (let ty = Math.floor(y0 / T) * T; ty < y0 + CH; ty += T) for (let tx = Math.floor(x0 / T) * T; tx < x0 + CH; tx += T) {
      const v = (hash(tx / T + 9, ty / T - 2) - .5) * 10, kind = hash(tx / T - 4, ty / T + 13);
      const pg = g.createLinearGradient(tx, ty, tx + T, ty + T); pg.addColorStop(0, `rgb(${236 + v},${240 + v},${242 + v})`); pg.addColorStop(1, `rgb(${212 + v},${218 + v},${222 + v})`); // carrelage blanc de laboratoire
      g.fillStyle = pg; g.fillRect(tx, ty, T, T);
      if (kind < .1) { // caillebotis
        g.fillStyle = "#5a636c"; g.fillRect(tx + 6, ty + 6, T - 12, T - 12); g.strokeStyle = "#b8c0c8"; g.lineWidth = 2;
        for (let k = 0; k <= 6; k++) { g.beginPath(); g.moveTo(tx + 6 + k * (T - 12) / 6, ty + 6); g.lineTo(tx + 6 + k * (T - 12) / 6, ty + T - 6); g.stroke(); }
        g.beginPath(); g.moveTo(tx + 6, ty + T / 2); g.lineTo(tx + T - 6, ty + T / 2); g.stroke();
      } else if (kind < .16) { // trappe d'accès
        g.strokeStyle = "rgba(90,100,110,.6)"; g.lineWidth = 2; g.strokeRect(tx + 12, ty + 12, T - 24, T - 24);
        g.fillStyle = "#c8a030"; g.fillRect(tx + T / 2 - 6, ty + T / 2 - 2, 12, 4);
      }
      g.strokeStyle = "rgba(120,132,142,.55)"; g.lineWidth = 1.5; g.strokeRect(tx + 1, ty + 1, T - 2, T - 2);
      g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 1; g.beginPath(); g.moveTo(tx + 3, ty + T - 3); g.lineTo(tx + 3, ty + 3); g.lineTo(tx + T - 3, ty + 3); g.stroke();
      for (const [rx, ry] of [[7, 7], [T - 7, 7], [7, T - 7], [T - 7, T - 7]]) circ(g, tx + rx, ty + ry, 1.6, "#a8b2bc");
    }
    for (let i = 0; i < 6; i++) ell(g, x0 + R() * CH, y0 + R() * CH, 6 + R() * 14, 3 + R() * 7, "rgba(60,70,80,.12)", R() * 3); // traces
    for (let k = 0; k < 2; k++) { // câbles posés au sol
      let x = x0 + R() * CH, y = y0 + R() * CH, an = Math.round(R() * 4) * Math.PI / 2; const pts = [[x, y]];
      for (let q = 0; q < 5; q++) { if (R() < .4) an += (R() < .5 ? 1 : -1) * Math.PI / 2; x += Math.cos(an) * 64; y += Math.sin(an) * 64; pts.push([x, y]); }
      for (const [w, col] of [[7, "#121418"], [4, k ? "#c8402e" : "#2e6ab0"]]) { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = "round"; g.beginPath(); pts.forEach(([px, py], q) => q ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); }
    }
    // allée en tôle striée, bordée de bandes jaunes et noires
    const band = (w, col, dash) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); for (let x = x0 - 40; x <= x0 + CH + 40; x += 16) x === x0 - 40 ? g.moveTo(x, pathY(x)) : g.lineTo(x, pathY(x)); g.stroke(); g.setLineDash([]); };
    band(124, "#e8c032"); band(124, "#22242a", [14, 14]); band(106, "#9aa4ae"); band(102, "#c4ccd4");
    g.save(); g.beginPath(); for (let x = x0 - 40; x <= x0 + CH + 40; x += 16) x === x0 - 40 ? g.moveTo(x, pathY(x) - 50) : g.lineTo(x, pathY(x) - 50); for (let x = x0 + CH + 40; x >= x0 - 40; x -= 16) g.lineTo(x, pathY(x) + 50); g.closePath(); g.clip();
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 2.2; // motif de tôle striée
    for (let y = Math.floor((y0 - 200) / 18) * 18; y < y0 + CH + 200; y += 18) for (let x = Math.floor((x0 - 40) / 18) * 18; x < x0 + CH + 40; x += 18) {
      const o = ((x / 18 + y / 18) & 1) ? 1 : -1; g.beginPath(); g.moveTo(x + 4, y + 9 - o * 4); g.lineTo(x + 13, y + 9 + o * 4); g.stroke();
    }
    g.restore();
    for (let x = Math.ceil(x0 / 360) * 360; x < x0 + CH; x += 360) { // pictogramme haute tension sur l'allée
      const y = pathY(x); g.save(); g.translate(x, y); g.rotate(Math.atan2(pathY(x + 1) - y, 1));
      poly(g, [0, -30, 30, 22, -30, 22], "#e8c032"); poly(g, [0, -22, 22, 17, -22, 17], "#22242a");
      poly(g, [3, -14, -7, 3, 0, 3, -4, 15, 8, -3, 1, -3], "#e8c032"); g.restore();
    }
  } else if (LEVEL.league) { // Ligue Indigo : dalles de l'arène, grand cercle de combat au centre
    const T = 96, tile = { olga:["rgba(255,255,255,.45)", "rgba(60,110,150,.25)"], aldo:["rgba(255,240,210,.12)", "rgba(40,26,14,.35)"], agatha:["rgba(170,130,230,.10)", "rgba(0,0,0,.45)"], peter:["rgba(160,170,255,.10)", "rgba(0,0,20,.45)"], champ:["rgba(255,255,255,.4)", "rgba(120,90,40,.3)"] }[th];
    g.lineWidth = 2;
    for (let ty = Math.floor(y0 / T) * T; ty < y0 + CH; ty += T) for (let tx = Math.floor(x0 / T) * T; tx < x0 + CH; tx += T) {
      g.strokeStyle = tile[1]; g.strokeRect(tx + 1, ty + 1, T - 2, T - 2);
      g.strokeStyle = tile[0]; g.beginPath(); g.moveTo(tx + 3, ty + T - 3); g.lineTo(tx + 3, ty + 3); g.lineTo(tx + T - 3, ty + 3); g.stroke();
    }
    const ring = { olga:"rgba(255,255,255,.55)", aldo:"rgba(240,225,190,.4)", agatha:"rgba(170,110,255,.35)", peter:"rgba(150,130,255,.45)", champ:"rgba(200,60,50,.55)" }[th];
    for (const [rr, w] of [[300, 8], [60, 6]]) { g.strokeStyle = ring; g.lineWidth = w; g.beginPath(); g.arc(0, START_Y, rr, 0, Math.PI * 2); g.stroke(); }
    if (th === "champ") { // tapis rouge le long de l'allée
      g.strokeStyle = "#d8b84a"; g.lineWidth = 98; g.beginPath(); for (let x = x0 - 40; x <= x0 + CH + 40; x += 16) x === x0 - 40 ? g.moveTo(x, pathY(x)) : g.lineTo(x, pathY(x)); g.stroke();
      g.strokeStyle = "#a82a26"; g.lineWidth = 86; g.stroke();
    }
    if (th === "olga") for (let k = 0; k < 50; k++) circ(g, x0 + R() * CH, y0 + R() * CH, .8 + R() * 1.2, "rgba(255,255,255,.85)");
    if (th === "agatha") for (let k = 0; k < 8; k++) ell(g, x0 + R() * CH, y0 + R() * CH, 30 + R() * 50, 12 + R() * 16, "rgba(120,70,190,.12)", R() * 3);
  } else if (th === "ice") { // congères et givre scintillant
    for (let k = 0; k < 10; k++) ell(g, x0 + R() * CH, y0 + R() * CH, 20 + R() * 40, 8 + R() * 14, "rgba(255,255,255,.2)", (R() - .5) * .6);
    for (let k = 0; k < 70; k++) circ(g, x0 + R() * CH, y0 + R() * CH, .8 + R() * 1.2, "rgba(255,255,255,.85)");
  } else if (th === "lava") { // braises et cendres
    for (let k = 0; k < 16; k++) { const x = x0 + R() * CH, y = y0 + R() * CH, s = 2 + R() * 4; ell(g, x, y, s, s * .65, "rgba(255,110,30,.5)"); ell(g, x, y, s * .45, s * .3, "rgba(255,220,120,.7)"); }
    for (let k = 0; k < 40; k++) circ(g, x0 + R() * CH, y0 + R() * CH, 1 + R() * 1.6, "rgba(150,140,135,.35)");
  }
}
function drawGenerator(g, w) { // Centrale : générateur cylindrique (à la place des massifs rocheux)
  const r = w.r * .9, top = w.y - r * .55, bot = w.y + r * .3, WR = rng(Math.floor(w.ph * 1e6));
  ell(g, w.x + 10, bot + r * .2, r * 1.1, r * .5, "rgba(0,0,0,.42)");
  const bg = g.createLinearGradient(w.x - r, 0, w.x + r, 0); bg.addColorStop(0, "#3a4048"); bg.addColorStop(.3, "#aeb8c4"); bg.addColorStop(.65, "#76808c"); bg.addColorStop(1, "#30363e");
  g.fillStyle = bg; g.fillRect(w.x - r, top, r * 2, bot - top); ell(g, w.x, bot, r, r * .42, bg);
  for (let k = 1; k < 4; k++) { const y = top + (bot - top) * k / 4; g.strokeStyle = "rgba(20,24,30,.55)"; g.lineWidth = 2; g.beginPath(); g.ellipse(w.x, y, r, r * .42, 0, 0, Math.PI); g.stroke(); }
  const tg = g.createRadialGradient(w.x - r * .3, top - r * .1, 2, w.x, top, r); tg.addColorStop(0, "#dfe6ee"); tg.addColorStop(1, "#7c8692");
  ell(g, w.x, top, r, r * .42, tg); g.strokeStyle = "rgba(16,20,26,.8)"; g.lineWidth = 2; g.beginPath(); g.ellipse(w.x, top, r, r * .42, 0, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = "rgba(40,46,54,.6)"; g.lineWidth = 2; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(w.x + k * r * .28 - r * .1, top - r * .25); g.lineTo(w.x + k * r * .28 + r * .1, top + r * .25); g.stroke(); }
  poly(g, [w.x - r * .55, bot - r * .05, w.x - r * .35, bot - r * .4, w.x - r * .15, bot - r * .05], "#e8c03a"); // pictogramme danger
  g.fillStyle = "#22262c"; g.fillRect(w.x - r * .37, bot - r * .3, r * .04, r * .14); g.fillRect(w.x - r * .37, bot - r * .13, r * .04, r * .04);
  for (let k = 0; k < 3; k++) circ(g, w.x + r * (.2 + k * .17), bot - r * .2, r * .05, ["#5ae07a", "#f0d050", "#e2513f"][Math.floor(WR() * 3)]);
}
function drawTesla(g, cr) { // Centrale : bobine Tesla (à la place des Pierres Lune)
  const s = cr.s, x = cr.x, y = cr.y;
  ell(g, x + 3, y + 4, 13 * s, 5 * s, "rgba(0,0,0,.4)");
  g.fillStyle = "#3a4048"; g.fillRect(x - 9 * s, y - 4 * s, 18 * s, 7 * s);
  for (let k = 0; k < 5; k++) ell(g, x, y - 6 * s - k * 4 * s, 6 * s, 2.3 * s, k % 2 ? "#b86a32" : "#e09a52");
  g.fillStyle = "#5a626c"; g.fillRect(x - 1.2 * s, y - 28 * s, 2.4 * s, 6 * s);
  circ(g, x, y - 31 * s, 7 * s, "#b8c2cc"); circ(g, x - 2.2 * s, y - 33 * s, 2.6 * s, "#ffffff");
}
function drawPylon(g, x, y) { // Centrale : pylône d'une barrière électrique
  ell(g, x + 4, y + 6, 15, 6, "rgba(0,0,0,.42)");
  g.fillStyle = "#2c3138"; g.fillRect(x - 7, y - 26, 14, 30);
  g.fillStyle = "#e2b93a"; for (let k = 0; k < 3; k++) g.fillRect(x - 7, y - 20 + k * 8, 14, 4);
  circ(g, x, y - 28, 8, "#4a525c"); circ(g, x, y - 28, 4.5, "#a8b8c8"); circ(g, x - 1.5, y - 29.5, 1.6, "#fff");
}
function renderCaveChunk(ci, cj) {
  const c = getChunk(ci, cj), x0 = ci * CH, y0 = cj * CH;
  const cv2 = document.createElement("canvas"); cv2.width = cv2.height = CH * CH_SCALE;
  const g = cv2.getContext("2d"); g.scale(CH_SCALE, CH_SCALE);
  const N = 32, cell = CH / N, lo = document.createElement("canvas"); lo.width = lo.height = N + 2;
  const lg = lo.getContext("2d"), img = lg.createImageData(N + 2, N + 2);
  const th = LEVEL.theme, pal = CAVE_PAL[th], G = pal ? pal.g : [60, 30, -18, 54, 26, -18, 70, 26, -12], Q = pal ? pal.path : [118, 22, 102, 18, 92, 14];
  for (let j = 0; j < N + 2; j++) for (let i = 0; i < N + 2; i++) {
    const wx = x0 + (i - .5) * cell, wy = y0 + (j - .5) * cell, n = fbm(wx / 160, wy / 160), dn = forestDensity(wx, wy);
    let r = G[0] + n * G[1] + dn * G[2], gr = G[3] + n * G[4] + dn * G[5], b = G[6] + n * G[7] + dn * G[8];
    const pt = Math.max(0, Math.min(1, (60 - Math.abs(wy - pathY(wx))) / 26));
    r += (Q[0] + n * Q[1] - r) * pt; gr += (Q[2] + n * Q[3] - gr) * pt; b += (Q[4] + n * Q[5] - b) * pt;
    const k = (j * (N + 2) + i) * 4; img.data[k] = r; img.data[k+1] = gr; img.data[k+2] = b; img.data[k+3] = 255;
  }
  lg.putImageData(img, 0, 0); g.imageSmoothingEnabled = true; g.drawImage(lo, 1, 1, N, N, 0, 0, CH, CH);
  g.translate(-x0, -y0);
  const R = rng(Math.floor(hash(ci - 555, cj + 999) * 4294967295)), moon = moonOn();
  const all = { ponds:[], walls:[], spikes:[], crystals:[], shrooms:[], lava:[], gates:[], craters:[] };
  for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) { const n = getChunk(ci + a, cj + b2); for (const k in all) all[k].push(...(n[k] || [])); }
  if (moon) moonFloor(g, x0, y0, all.craters); // Mont Sélénite : tuiles HGSS (25b-mont-selenite.js)
  const GV = pal ? pal.gravel : ["#3a3444", "#6a6274", "#8c8296"], PB = pal ? pal.pebble : ["#7a7086", "#5e566a"];
  // gravier et cailloux
  for (let i = 0; i < (moon ? 0 : 520); i++) {
    const x = x0 + R() * CH, y = y0 + R() * CH, v = R();
    ell(g, x, y, 1 + R() * 2.4, .8 + R() * 1.6, v < .4 ? GV[0] : v < .75 ? GV[1] : GV[2], R() * 3);
  }
  for (let i = 0; i < (moon ? 0 : 26); i++) { const x = x0 + R() * CH, y = y0 + R() * CH, rr = 3 + R() * 5; ell(g, x + 1.5, y + 2, rr, rr * .6, "rgba(10,8,16,.35)"); ell(g, x, y, rr, rr * .7, R() < .5 ? PB[0] : PB[1]); ell(g, x - rr * .3, y - rr * .3, rr * .4, rr * .25, "rgba(255,255,255,.18)"); }
  // fissures (lave : rougeoyantes)
  g.strokeStyle = pal ? pal.crack : "rgba(18,14,26,.55)"; g.lineWidth = th === "lava" ? 2.2 : 1.6; g.lineCap = "round";
  for (let i = 0; i < (moon ? 0 : th === "lava" ? 14 : th === "plant" ? 3 : 9); i++) { let x = x0 + R() * CH, y = y0 + R() * CH, a = R() * Math.PI * 2; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 5; k++) { a += (R() - .5) * 1.2; x += Math.cos(a) * (10 + R() * 14); y += Math.sin(a) * (10 + R() * 14); g.lineTo(x, y); } g.stroke(); }
  // empreintes de sable sur le sentier
  for (let i = 0; i < (moon ? 0 : 40); i++) { const x = x0 + R() * CH, y = y0 + R() * CH; if (nearPath(x, y, 50)) ell(g, x, y, 3 + R() * 3, 1.5 + R() * 1.5, pal ? pal.foot : "rgba(150,132,112,.6)", R() * 3); }
  if (th) themeFloor(g, x0, y0, R, th);
  // ombres des massifs
  if (moon) all.walls.sort((a, b) => a.y - b.y);
  if (!moon) for (const w of all.walls) {
    const sg = g.createRadialGradient(w.x + 14, w.y + 12, w.r * .3, w.x + 14, w.y + 12, w.r * 1.35);
    sg.addColorStop(0, "rgba(8,5,14,.55)"); sg.addColorStop(1, "rgba(8,5,14,0)");
    g.fillStyle = sg; g.beginPath(); g.arc(w.x + 14, w.y + 12, w.r * 1.35, 0, Math.PI * 2); g.fill();
  }
  // lacs souterrains
  for (const p of all.ponds) {
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
    ell(g, 0, 4, p.rx + 14, p.ry + 12, "rgba(10,8,18,.45)");
    ell(g, 0, 0, p.rx + 9, p.ry + 8, pal ? pal.rim : "#4a4456");
    const wg = g.createRadialGradient(-p.rx * .2, -p.ry * .2, 4, 0, 0, p.rx);
    wg.addColorStop(0, "#0e2a3c"); wg.addColorStop(.7, "#1b4a62"); wg.addColorStop(1, "#3c7c90");
    g.fillStyle = wg; g.beginPath(); g.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2); g.fill();
    const LR = rng(Math.floor(p.ph * 1e6));
    for (let k = 0; k < 14; k++) { const a = LR() * Math.PI * 2, rx = Math.cos(a) * (p.rx + 7), ry = Math.sin(a) * (p.ry + 6), rr = 5 + LR() * 6; ell(g, rx, ry, rr, rr * .7, LR() < .5 ? (pal ? pal.rimStones[0] : "#6a6276") : (pal ? pal.rimStones[1] : "#575064")); ell(g, rx - rr * .3, ry - rr * .3, rr * .4, rr * .25, "rgba(255,255,255,.15)"); }
    for (let k = 0; k < 10; k++) { const a = LR() * Math.PI * 2, d = LR() * .8; circ(g, Math.cos(a) * p.rx * d, Math.sin(a) * p.ry * d, 1.4, "rgba(140,240,220,.55)"); }
    if (th === "ice") for (let k = 0; k < 4; k++) { const a = LR() * Math.PI * 2, d = LR() * .6, fx = Math.cos(a) * p.rx * d, fy = Math.sin(a) * p.ry * d, fr = 8 + LR() * 12; ell(g, fx + 2, fy + 2, fr, fr * .6, "rgba(10,40,60,.3)"); ell(g, fx, fy, fr, fr * .6, "#e6f6ff"); ell(g, fx - fr * .2, fy - fr * .15, fr * .5, fr * .25, "#ffffff"); } // plaques de glace flottantes
    g.restore();
  }
  // lacs de lave (Route Victoire)
  for (const p of all.lava) {
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
    ell(g, 0, 5, p.rx + 16, p.ry + 13, "rgba(10,4,2,.5)");
    ell(g, 0, 0, p.rx + 10, p.ry + 9, "#2a1a16");
    const lg2 = g.createRadialGradient(-p.rx * .2, -p.ry * .2, 4, 0, 0, p.rx); lg2.addColorStop(0, "#fff0a0"); lg2.addColorStop(.35, "#ffb030"); lg2.addColorStop(.75, "#f05a14"); lg2.addColorStop(1, "#a8240a");
    g.fillStyle = lg2; g.beginPath(); g.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2); g.fill();
    const LR = rng(Math.floor(p.ph * 1e6));
    for (let k = 0; k < 7; k++) { const a = LR() * Math.PI * 2, d = .25 + LR() * .55, cr = 6 + LR() * 10; ell(g, Math.cos(a) * p.rx * d, Math.sin(a) * p.ry * d, cr, cr * .6, "rgba(60,22,10,.75)", LR() * 3); }
    for (let k = 0; k < 16; k++) { const a = LR() * Math.PI * 2, rx = Math.cos(a) * (p.rx + 6), ry = Math.sin(a) * (p.ry + 5), rr = 5 + LR() * 7; ell(g, rx, ry, rr, rr * .7, LR() < .5 ? "#4a3430" : "#352420"); ell(g, rx - rr * .3, ry - rr * .3, rr * .4, rr * .25, "rgba(255,140,80,.25)"); }
    g.restore();
  }
  // champignons (comme ceux des Paras)
  for (const m of all.shrooms) {
    const MR = rng(Math.floor(m.ph * 1e6));
    for (let k = 0; k < 4; k++) { const mx = m.x + (MR() - .5) * 26, my = m.y + (MR() - .5) * 16, s = 3 + MR() * 3; ell(g, mx + 2, my + 3, s * 1.3, s * .5, "rgba(0,0,0,.3)"); g.fillStyle = "#e8d8bc"; g.fillRect(mx - s * .3, my - s, s * .6, s * 1.2); ell(g, mx, my - s, s * 1.4, s * .9, MR() < .5 ? "#e0622e" : "#c8442a"); circ(g, mx - s * .4, my - s * 1.2, s * .25, "#ffe2a0"); circ(g, mx + s * .5, my - s, s * .2, "#ffe2a0"); }
  }
  // massifs rocheux : roche anguleuse avec arête éclairée
  for (const w of all.walls) {
    if (th === "plant") { drawGenerator(g, w); continue; }
    if (moon) { moonWall(g, w); continue; }
    const WR = rng(Math.floor(w.ph * 1e6)), pts = [], top = [];
    for (let k = 0; k < w.n; k++) { const a = k / w.n * Math.PI * 2 + WR() * .3, rr = w.r * (.82 + WR() * .3); pts.push(w.x + Math.cos(a) * rr, w.y + Math.sin(a) * rr * .92); top.push(w.x - w.r * .12 + Math.cos(a) * rr * .62, w.y - w.r * .2 + Math.sin(a) * rr * .55); }
    const rg = g.createLinearGradient(w.x - w.r, w.y - w.r, w.x + w.r, w.y + w.r);
    const WC = pal ? pal.wall : ["#857c92", "#544c62", "#2c2638"];
    rg.addColorStop(0, WC[0]); rg.addColorStop(.55, WC[1]); rg.addColorStop(1, WC[2]);
    g.fillStyle = rg; g.beginPath(); g.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k+1]); g.closePath(); g.fill();
    g.strokeStyle = pal ? pal.wallLine : "rgba(20,14,30,.8)"; g.lineWidth = 2; g.stroke();
    g.fillStyle = pal ? pal.wallTop : "rgba(170,160,190,.32)"; g.beginPath(); g.moveTo(top[0], top[1]); for (let k = 2; k < top.length; k += 2) g.lineTo(top[k], top[k+1]); g.closePath(); g.fill();
    if (th === "lava") { // relief en terrasses
      g.fillStyle = "rgba(230,170,130,.18)"; g.beginPath(); for (let k = 0; k < top.length; k += 2) { const x = w.x - w.r * .2 + (top[k] - w.x + w.r * .12) * .55, y = w.y - w.r * .34 + (top[k+1] - w.y + w.r * .2) * .5; k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill();
      g.strokeStyle = "rgba(20,8,4,.5)"; g.lineWidth = 1.5; g.stroke();
    }
    if (th === "ice") { g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2.5; g.beginPath(); g.moveTo(w.x - w.r * .55, w.y - w.r * .1); g.lineTo(w.x - w.r * .25, w.y - w.r * .5); g.stroke(); } // reflet
    g.strokeStyle = "rgba(20,14,30,.45)"; g.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) { const a = WR() * Math.PI * 2; g.beginPath(); g.moveTo(w.x + Math.cos(a) * w.r * .2, w.y + Math.sin(a) * w.r * .2); g.lineTo(w.x + Math.cos(a + .3) * w.r * .7, w.y + Math.sin(a + .3) * w.r * .65); g.stroke(); }
  }
  // stalagmites vues de dessus
  for (const k of all.spikes) {
    if (moon) { moonBush(g, k); continue; }
    ell(g, k.x + 6, k.y + 5, k.r * 1.3, k.r * .8, "rgba(8,5,14,.45)");
    for (let q = 0; q < 4; q++) { const rr = k.r * (1 - q * .23); circ(g, k.x - q * k.r * .08, k.y - q * k.r * .14, rr, (pal ? pal.spike : ["#3e374a", "#5a5268", "#7a7088", "#a49ab2"])[q]); }
    circ(g, k.x - k.r * .3, k.y - k.r * .48, k.r * .16, pal ? pal.spikeHi : "#d8d0e4");
  }
  // Pierres Lune (cristaux)
  for (const cr of all.crystals) {
    if (th === "plant") { drawTesla(g, cr); continue; }
    const C = CRYSTAL_COLS[crCol(cr)], s = cr.s;
    const gg = g.createRadialGradient(cr.x, cr.y, 2, cr.x, cr.y, 46 * s); gg.addColorStop(0, `rgba(${C[3]},.35)`); gg.addColorStop(1, `rgba(${C[3]},0)`);
    g.fillStyle = gg; g.beginPath(); g.arc(cr.x, cr.y, 46 * s, 0, Math.PI * 2); g.fill();
    if (moon && crCol(cr) < 2) { moonCrystal(g, cr, crCol(cr)); continue; }
    ell(g, cr.x + 3, cr.y + 4, 12 * s, 5 * s, "rgba(0,0,0,.35)");
    for (const [ox, h, wd, lean] of [[-6, 16, 5, -.35], [6, 14, 5, .4], [0, 24, 6.5, 0]]) {
      g.save(); g.translate(cr.x + ox * s, cr.y + 2 * s); g.rotate(lean);
      poly(g, [0, -h * s, wd * s, -h * s * .7, wd * s, 0, -wd * s, 0, -wd * s, -h * s * .7], C[1]);
      poly(g, [0, -h * s, wd * s, -h * s * .7, wd * s, 0, 0, 0], C[2]);
      poly(g, [0, -h * s, -wd * s * .4, -h * s * .65, -wd * s * .4, -2 * s, 0, -2 * s], C[0]);
      g.restore();
    }
  }
  for (const gt of all.gates) { // marquage au sol des barrières, puis leurs pylônes
    g.save(); g.setLineDash([12, 10]); g.strokeStyle = "rgba(230,190,60,.45)"; g.lineWidth = 4; g.beginPath(); g.moveTo(gt.x1, gt.y1); g.lineTo(gt.x2, gt.y2); g.stroke(); g.restore();
    drawPylon(g, gt.x1, gt.y1); drawPylon(g, gt.x2, gt.y2);
  }
  c.canvas = cv2; return cv2;
}
