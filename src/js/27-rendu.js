let frameNo = 0;
const liveChunks = new Set();
function forView(camX, camY, vw, vh, pad, fn) {
  const i0 = Math.floor((camX - pad) / CH), j0 = Math.floor((camY - pad) / CH), i1 = Math.floor((camX + vw + pad) / CH), j1 = Math.floor((camY + vh + pad) / CH);
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(i, j, getChunk(i, j));
}
function drawGround(camX, camY, vw, vh, t) {
  frameNo++; let made = 0;
  cx.fillStyle = LEVEL.rocket ? "#4a505c" : LEVEL.tower ? (LEVEL.sprout ? "#6a4a2c" : "#3a3446") : LEVEL.manor ? "#4a3020" : LEVEL.theme ? CAVE_PAL[LEVEL.theme].base : LEVEL.cave ? "#2c2834" : LEVEL.safari ? "#b89a50" : LEVEL.alph ? (inZone(camX) ? "#050302" : "#e8d090") : "#3d6e38"; cx.fillRect(camX, camY, vw, vh);
  forView(camX, camY, vw, vh, 0, (i, j, c) => {
    if (!c.canvas && made < 2) { renderChunk(i, j); made++; liveChunks.add(c); }
    if (c.canvas) { c.used = frameNo; cx.drawImage(c.canvas, i * CH, j * CH, CH, CH); }
  });
  if (liveChunks.size > 28) { const old = [...liveChunks].sort((a, b) => a.used - b.used).slice(0, liveChunks.size - 28); for (const c of old) { c.canvas = null; liveChunks.delete(c); } }
  // reflets animés sur l'eau
  forView(camX, camY, vw, vh, 200, (i, j, c) => { for (const p of c.ponds) {
    cx.save(); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.strokeStyle = "rgba(220,245,255,.28)"; cx.lineWidth = 1.5;
    for (let k = 0; k < 4; k++) { const w = Math.sin(t * .8 + k * 1.7 + p.ph), x = (k - 1.5) * p.rx * .35, y = (k % 2 - .5) * p.ry * .5 + w * 4; cx.beginPath(); cx.moveTo(x - 14, y); cx.quadraticCurveTo(x, y - 3, x + 14, y); cx.stroke(); }
    cx.restore();
  } });
}
function grassOver(x, y, r, t) {
  if (!tallGrassAt(x, y)) return;
  for (let k = -2; k <= 2; k++) {
    const bx = x + k * r * .32, sway = Math.sin(t * 3 + k + x * .05) * 2.5, h = r * (.55 + (k & 1) * .2);
    cx.fillStyle = LEVEL.safari ? (k & 1 ? "#a8823a" : "#e0be5a") : LEVEL.jade ? (k & 1 ? "#288850" : "#389858") : k & 1 ? "#2f6b33" : "#4d9645";
    cx.beginPath(); cx.moveTo(bx - 4, y + r * .85); cx.quadraticCurveTo(bx + sway * .5, y + r * .85 - h * .6, bx + sway, y + r * .85 - h); cx.quadraticCurveTo(bx + 1, y + r * .85 - h * .4, bx + 4, y + r * .85); cx.fill();
  }
}
function drawCanopy(camX, camY, vw, vh, t, P) {
  forView(camX, camY, vw, vh, 120, (i, j, c) => { for (const tr of c.trees) {
    const cyc = tr.y - tr.r * .55;
    if (tr.x + tr.r * 1.3 < camX || tr.x - tr.r * 1.3 > camX + vw || cyc + tr.r * 1.3 < camY || cyc - tr.r * 1.3 > camY + vh) continue;
    const sp = LEVEL.safari ? acaciaSprite(tr.r, tr.v) : jadeOn() ? jadeTreeSprite(tr.r, tr.v) : canopySprite(tr.r, tr.v), sw = Math.sin(t * .9 + tr.ph) * 1.6;
    const under = S.players.some(p => Math.hypot(p.x - tr.x, p.y - cyc) < tr.r * 1.05);
    cx.globalAlpha = under ? .35 : 1;
    cx.drawImage(sp.cv, tr.x - sp.size / 2 + sw, cyc - sp.size / 2, sp.size, sp.size);
  } });
  cx.globalAlpha = 1;
  if (LEVEL.safari) drawSafariGate(camX, camY, vw, vh);
  drawIlexShrines(camX, camY, vw, vh);
}
const motes = [];
function drawMotes(camX, camY, vw, vh, t, dt) {
  if (LEVEL.rocket) return;
  while (motes.length < 46) motes.push({ x:camX + Math.random() * vw, y:camY + Math.random() * vh, leaf:!LEVEL.cave && !LEVEL.safari && !LEVEL.alph && !LEVEL.burned && Math.random() < .45, ph:Math.random() * 6, s:.6 + Math.random() * .8 });
  for (const m of motes) {
    if (m.leaf) { m.x += (14 + Math.sin(t + m.ph) * 22) * dt; m.y += 24 * m.s * dt; }
    else { m.x += Math.sin(t * .7 + m.ph) * 10 * dt; m.y += Math.cos(t * .5 + m.ph) * 8 * dt; }
    if (m.x < camX - 20) m.x += vw + 40; if (m.x > camX + vw + 20) m.x -= vw + 40;
    if (m.y < camY - 20) m.y += vh + 40; if (m.y > camY + vh + 20) m.y -= vh + 40;
    if (m.leaf) ell(cx, m.x, m.y, 4.5 * m.s, 2.2 * m.s, ["#e0892e", "#c8502a", "#e9b740", "#7fb04a"][Math.floor(m.ph * 10) % 4], t * 2 + m.ph);
    else if (LEVEL.burned) burnedMote(m, t, dt); // Tour Cendrée : cendres et braises qui montent
    else if (LEVEL.manor) { const a = .4 + .4 * Math.sin(t * 3 + m.ph); m.y -= 14 * dt; circ(cx, m.x, m.y, 3 * m.s, `rgba(255,120,40,${a * .25})`); circ(cx, m.x, m.y, 1.1 * m.s, `rgba(255,200,120,${a})`); }
    else if (LEVEL.ice) { const a = .5 + .3 * Math.sin(t * 2 + m.ph); m.y += 26 * m.s * dt; circ(cx, m.x, m.y, 2.2 * m.s, `rgba(255,255,255,${a})`); } // flocons
    else if (LEVEL.lava) { const a = .4 + .4 * Math.sin(t * 3 + m.ph); m.y -= 22 * dt; circ(cx, m.x, m.y, 3 * m.s, `rgba(255,110,30,${a * .25})`); circ(cx, m.x, m.y, 1.2 * m.s, `rgba(255,200,110,${a})`); } // braises
    else if (LEVEL.plant) { const a = Math.max(0, Math.sin(t * 5 + m.ph * 3)); circ(cx, m.x, m.y, 3 * m.s, `rgba(255,230,90,${a * .2})`); circ(cx, m.x, m.y, 1 * m.s, `rgba(255,250,200,${a})`); } // étincelles
    else if (LEVEL.cave) { const a = .3 + .3 * Math.sin(t * 2 + m.ph); circ(cx, m.x, m.y, 3.5 * m.s, `rgba(200,180,255,${a * .2})`); circ(cx, m.x, m.y, 1.1 * m.s, `rgba(230,220,255,${a})`); }
    else { const a = .35 + .35 * Math.sin(t * 2 + m.ph); circ(cx, m.x, m.y, 4 * m.s, `rgba(255,240,160,${a * .25})`); circ(cx, m.x, m.y, 1.4 * m.s, `rgba(255,248,200,${a})`); }
  }
}
/* obscurité de la grotte : halo autour du joueur, Pierres Lune lumineuses */
function drawCaveLight(camX, camY, vw, vh, t, P) {
  const r0 = Math.min(vw, vh) * .26, r1 = Math.max(vw, vh) * .62;
  const dg = cx.createRadialGradient(P.x, P.y, r0, P.x, P.y, r1);
  dg.addColorStop(0, "rgba(6,4,16,0)"); dg.addColorStop(1, LEVEL.tower ? (LEVEL.sprout ? "rgba(26,14,4,.55)" : pokeTowerOn() ? "rgba(30,10,50,.38)" : "rgba(14,4,24,.82)") : LEVEL.theme ? CAVE_PAL[LEVEL.theme].dark : LEVEL.moon ? "rgba(4,6,8,.6)" : "rgba(6,4,16,.78)");
  if (LEVEL.rocket) {
    forView(camX, camY, vw, vh, 60, (i, j, c) => { for (const sp of c.spinners || []) {
      cx.save(); cx.translate(sp.x, sp.y); cx.rotate(Math.atan2(sp.dy, sp.dx)); cx.strokeStyle = "#7ad0ff"; cx.lineWidth = 4; cx.lineCap = "round";
      for (let k = 0; k < 2; k++) { const o = ((t * 40 + k * 22) % 44) - 22; cx.globalAlpha = 1 - Math.abs(o) / 22; cx.beginPath(); cx.moveTo(o - 7, -11); cx.lineTo(o + 5, 0); cx.lineTo(o - 7, 11); cx.stroke(); }
      cx.restore();
    } });
    if (!rocketHG()) forView(camX, camY, vw, vh, 60, (i, j, c) => { for (const m of c.machines || []) { // écrans qui défilent
      const x = m.x - m.w / 2 + 8, y = m.y - m.h / 2 + 7, w = m.w * .45, h = m.h - 14, sc = t * 14 + m.ph * 10, off = sc % 6;
      cx.save(); cx.beginPath(); cx.rect(x, y, w, h); cx.clip(); cx.fillStyle = "#1c2a24"; cx.fillRect(x, y, w, h); cx.fillStyle = "rgba(90,230,140,.75)";
      for (let k = 0; k < h / 6 + 2; k++) cx.fillRect(x + 4, y + 4 + k * 6 - off, (.25 + hash(Math.round(m.x) + k + Math.floor(sc / 6), Math.round(m.y)) * .75) * (w - 8), 2);
      cx.restore();
    } });
    if (rocketHG()) forView(camX, camY, vw, vh, 160, (i, j, c) => { for (const q of c.gens || []) { // arcs électriques entre électrodes et générateur
      cx.save(); cx.globalCompositeOperation = "lighter"; const fl = .6 + .4 * Math.sin(t * 9 + q.ph);
      glow(q.x, q.y - 70, 70, "255,230,120", .18 * fl);
      for (const s of [-1, 1]) {
        const ax = q.x + s * 105, ay = q.y - 30, bx = q.x + s * 56, by = q.y - 44, sd = Math.floor(t * 14 + q.ph * 7 + s);
        glow(ax, ay, 22, "255,240,150", .7 * fl);
        for (const [w, col] of [[5, "rgba(255,200,40,.35)"], [2, "rgba(255,250,210,.95)"]]) {
          cx.strokeStyle = col; cx.lineWidth = w; cx.lineJoin = "round"; cx.beginPath(); cx.moveTo(ax, ay);
          for (let k = 1; k < 6; k++) { const u = k / 6; cx.lineTo(ax + (bx - ax) * u, ay + (by - ay) * u + (hash(sd + k, Math.round(q.x)) - .5) * 14); }
          cx.lineTo(bx, by); cx.stroke();
        }
      }
      cx.restore();
    } });
    const al = .5 + .5 * Math.sin(t * 3); // gyrophare d'alarme
    const vg = cx.createRadialGradient(P.x, P.y, Math.min(vw, vh) * .3, P.x, P.y, Math.max(vw, vh) * .7);
    vg.addColorStop(0, "rgba(40,0,0,0)"); vg.addColorStop(1, `rgba(90,0,10,${.25 + .2 * al})`);
    cx.fillStyle = vg; cx.fillRect(camX - 40, camY - 40, vw + 80, vh + 80);
    cx.save(); cx.globalCompositeOperation = "lighter";
    forView(camX, camY, vw, vh, 60, (i, j, c) => { for (const m of c.machines || []) for (let k = 0; k < 4; k++) {
      const on = Math.sin(t * (2 + k) + m.ph + k) > 0; if (!on) continue;
      glow(m.x - m.w / 2 + m.w * .62 + (k % 2) * 14, m.y - m.h / 2 + 13 + Math.floor(k / 2) * 14, 9, ["255,60,60", "80,255,120", "255,210,60", "80,180,255"][k], .9);
    } });
    cx.restore();
    return;
  }
  if (LEVEL.manor) {
    const dm = cx.createRadialGradient(P.x, P.y, r0, P.x, P.y, r1); dm.addColorStop(0, "rgba(16,6,2,0)"); dm.addColorStop(1, "rgba(16,6,2,.74)");
    cx.fillStyle = dm; cx.fillRect(camX - 40, camY - 40, vw + 80, vh + 80);
    const on = !S.fireOff;
    cx.save(); cx.globalCompositeOperation = "lighter";
    forView(camX, camY, vw, vh, 120, (i, j, c) => {
      if (on) for (const f of c.fires || []) for (let k = -f.len / 2 + 10; k < f.len / 2; k += 22) glow(f.x + Math.cos(f.a) * k, f.y + Math.sin(f.a) * k, 50, "255,120,40", .22 + .06 * Math.sin(t * 9 + k));
      for (const q of c.statues || []) glow(q.x, q.y - 30, 26, on ? "255,140,60" : "120,180,255", .35 + .15 * Math.sin(t * 3 + q.ph));
    });
    cx.restore();
    if (on) forView(camX, camY, vw, vh, 40, (i, j, c) => { for (const f of c.fires || []) for (let k = -f.len / 2 + 6; k < f.len / 2; k += MN.flame ? 16 : 11) {
      const x = f.x + Math.cos(f.a) * k, y = f.y + Math.sin(f.a) * k, fl = 1 + Math.sin(t * 13 + k * .7) * .25;
      if (MN.flame) { const fr = Math.floor(t * 14 + k * .37 + 60) % 6, h = 46 * (1 + Math.sin(t * 7 + k * .9) * .12); cx.drawImage(MN.flame, fr * 40, 0, 40, 81, x - 12, y + 7 - h, 24, h); continue; }
      flameShape(x, y + 4, 5, 22 * fl, "#ff6a1a", Math.sin(t * 8 + k) * 2.5); flameShape(x, y + 4, 2.6, 12 * fl, "#ffd060", Math.sin(t * 8 + k) * 1.5);
    } });
    return;
  }
  if (LEVEL.tower) {
    cx.fillStyle = dg; cx.fillRect(camX - 40, camY - 40, vw + 80, vh + 80);
    cx.save(); cx.globalCompositeOperation = "lighter";
    forView(camX, camY, vw, vh, 80, (i, j, c) => { for (const cd of c.candles || []) {
      const pu = .8 + .2 * Math.sin(t * 9 + cd.ph) + .1 * Math.sin(t * 23 + cd.ph * 3), col = cd.blue ? "110,140,255" : "255,170,80";
      glow(cd.x, cd.y - 14, 70 * pu, col, .32); glow(cd.x, cd.y - 14, 16, col, .9);
    } });
    if (pokeTowerOn()) { cx.restore(); drawTowerFog(camX, camY, vw, vh, t); cx.save(); } else
    for (let k = 0; k < 7; k++) { // brume qui dérive
      const fx = camX + ((k * 211 + t * (8 + k * 3)) % (vw + 400)) - 200, fy = camY + vh * ((k * .37) % 1) + Math.sin(t * .3 + k) * 30;
      glow(fx, fy, 160 + k * 15, LEVEL.sprout ? "220,170,110" : "120,100,170", .07);
    }
    cx.restore();
    forView(camX, camY, vw, vh, 40, (i, j, c) => { for (const cd of c.candles || []) {
      const fl = 1 + Math.sin(t * 14 + cd.ph) * .15;
      flameShape(cd.x, cd.y - 13, 3.2, 9 * fl, cd.blue ? "#6c8cff" : "#ff9a3a", Math.sin(t * 7 + cd.ph) * 1.5); flameShape(cd.x, cd.y - 12, 1.6, 5 * fl, "#f4f6ff");
    } });
    return;
  }
  cx.fillStyle = dg; cx.fillRect(camX - 40, camY - 40, vw + 80, vh + 80);
  cx.save(); cx.globalCompositeOperation = "lighter";
  forView(camX, camY, vw, vh, 80, (i, j, c) => { for (const cr of c.crystals) {
    const pu = .75 + .25 * Math.sin(t * 1.6 + cr.ph), rr = 70 * cr.s * pu, cc = CRYSTAL_COLS[crCol(cr)][3];
    const gg = cx.createRadialGradient(cr.x, cr.y - 8, 2, cr.x, cr.y - 8, rr); gg.addColorStop(0, `rgba(${cc},${.3 * pu})`); gg.addColorStop(1, `rgba(${cc},0)`);
    cx.fillStyle = gg; cx.beginPath(); cx.arc(cr.x, cr.y - 8, rr, 0, Math.PI * 2); cx.fill();
  } });
  cx.restore();
  if (LEVEL.theme) drawMap7Light(camX, camY, vw, vh, t);
}
// lave qui rougeoie, barrières électriques et bobines Tesla, au-dessus de l'obscurité
function drawMap7Light(camX, camY, vw, vh, t) {
  cx.save(); cx.globalCompositeOperation = "lighter";
  if (LEVEL.lava) forView(camX, camY, vw, vh, 160, (i, j, c) => { for (const p of c.lava || []) {
    glow(p.x, p.y, Math.max(p.rx, p.ry) * 1.7, "255,110,30", .4 + .08 * Math.sin(t * 2 + p.ph));
    for (let k = 0; k < 5; k++) { const q = (t * .6 + k * .2 + p.ph) % 1, a = p.ph * 7 + k * 2.3, d = .15 + .6 * ((k * 37 % 10) / 10); glow(p.x + Math.cos(a) * p.rx * d, p.y + Math.sin(a) * p.ry * d, 4 + q * 12, "255,220,120", (1 - q) * .8); }
  } });
  if (LEVEL.plant) forView(camX, camY, vw, vh, 160, (i, j, c) => {
    for (const cr of c.crystals) if (Math.sin(t * 9 + cr.ph * 5) > .6) { // étincelles des bobines
      const x = cr.x, y = cr.y - 31 * cr.s; cx.strokeStyle = "rgba(255,245,170,.9)"; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(x, y);
      for (let k = 1; k < 5; k++) cx.lineTo(x + Math.cos(cr.ph + k + Math.floor(t * 15)) * k * 5, y + Math.sin(cr.ph * 3 + k + Math.floor(t * 15)) * k * 4); cx.stroke();
    }
    for (const g of c.gates || []) {
      const ph = (S.t + g.ph) % g.per, on = ph < g.on, warn = !on && ph > g.per - .7;
      for (const [x, y] of [[g.x1, g.y1], [g.x2, g.y2]]) glow(x, y - 28, on ? 34 : 14, on ? "255,230,90" : warn && Math.sin(t * 40) > 0 ? "255,80,60" : "110,130,160", on ? .85 : .55);
      const L = Math.hypot(g.x2 - g.x1, g.y2 - g.y1) || 1, nx = -(g.y2 - g.y1) / L, ny = (g.x2 - g.x1) / L;
      if (on) {
        glow((g.x1 + g.x2) / 2, (g.y1 + g.y2) / 2, L * .55, "255,220,90", .18);
        cx.save(); cx.globalCompositeOperation = "source-over"; // sol blanc : arc dessiné en couleurs franches, sinon il disparaît
        for (let pass = 0; pass < 3; pass++) {
          cx.strokeStyle = pass === 2 ? "#fffbe0" : pass ? "#ffc800" : "rgba(255,140,0,.45)"; cx.lineWidth = [12, 5, 2][pass]; cx.beginPath();
          const n = 12; for (let k = 0; k <= n; k++) { const u = k / n, jit = k === 0 || k === n ? 0 : (hash(k * 7 + Math.floor(t * 18), g.ph * 100 + pass) - .5) * 16, x = g.x1 + (g.x2 - g.x1) * u + nx * jit, y = g.y1 - 28 + (g.y2 - g.y1) * u + ny * jit; k ? cx.lineTo(x, y) : cx.moveTo(x, y); }
          cx.stroke();
        }
        cx.restore();
      } else if (warn) { cx.save(); cx.setLineDash([6, 8]); cx.strokeStyle = "rgba(255,90,60,.7)"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(g.x1, g.y1 - 28); cx.lineTo(g.x2, g.y2 - 28); cx.stroke(); cx.restore(); }
    }
  });
  cx.restore();
}
// Oiseau Légendaire : obstacles tombés et zones d'explosion (au sol, sous les Pokémon)
function drawIcicle(x, y, r, ph) { // stalactite tombée, plantée dans la glace
  ell(cx, x + 4, y + r * .45, r * 1.15, r * .45, "rgba(20,50,80,.35)");
  for (const [ox, h, w] of [[-r * .45, r * 1.5, r * .4], [r * .45, r * 1.3, r * .38], [0, r * 2.1, r * .55]]) {
    const tip = x + ox + Math.sin(ph + ox) * w * .3, b = y + r * .3;
    poly(cx, [x + ox - w, b, tip, b - h, x + ox + w, b], "#bfe6fa");
    poly(cx, [x + ox, b, tip, b - h, x + ox + w, b], "#7fb8dc");
    poly(cx, [x + ox - w * .6, b - 1, tip, b - h * .95, x + ox - w * .1, b - 1], "rgba(255,255,255,.75)");
  }
}
function drawMap7Under(t) {
  for (const o of S.falls || []) {
    if (o.t > 0) { const k = 1 - o.t / o.max; ell(cx, o.x, o.y, o.r * (.4 + .6 * k), o.r * (.3 + .45 * k), `rgba(10,20,40,${.2 + .35 * k})`); cx.strokeStyle = `rgba(226,81,63,${.3 + .5 * k})`; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(o.x, o.y, o.r, o.r * .75, 0, 0, Math.PI * 2); cx.stroke(); continue; }
    cx.save(); cx.globalAlpha = Math.max(0, Math.min(1, o.life));
    if (o.kind === "ice") drawIcicle(o.x, o.y, o.r, o.ph); else { ell(cx, o.x + 8, o.y + o.r * .45, o.r * 1.05, o.r * .45, "rgba(0,0,0,.4)"); drawBoulder(o.x, o.y, o.r * .85, o.ph); }
    cx.restore();
  }
  for (const f of S.foes) {
    if (f.rest > 0 || f.mb > 0) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(f.x, f.y, f.r * 2.3, f.rest > 0 ? "120,255,160" : f.d.bird ? "255,230,90" : "255,90,60", f.rest > 0 ? .35 : .35 + .3 * Math.sin(t * (12 + 30 * (1 - f.mb / (f.mbMax || 2.4))))); cx.restore(); } // Repos (soin) / charge d'Explosion
    if (f.fuse > 0 && f.d.boomR) { const R = f.d.boomR, k = 1 - f.fuse / .75; circ(cx, f.x, f.y, R * k, `rgba(255,90,60,${.2 + .15 * Math.sin(t * 40)})`); cx.strokeStyle = "rgba(255,90,60,.8)"; cx.lineWidth = 2; cx.beginPath(); cx.arc(f.x, f.y, R, 0, Math.PI * 2); cx.stroke(); }
    if (f.mb > 0) {
      const R = f.mbR || 340, k = 1 - f.mb / (f.mbMax || 2.4), el = !!f.d.bird; circ(cx, f.x, f.y, R * k, el ? `rgba(255,230,70,${.2 + .1 * Math.sin(t * 30)})` : `rgba(255,${120 - 80 * k | 0},40,${.18 + .1 * Math.sin(t * 30)})`);
      cx.save(); cx.setLineDash([14, 10]); cx.lineDashOffset = -t * 60; cx.strokeStyle = el ? `rgba(200,150,0,${.7 + .3 * Math.sin(t * 25)})` : `rgba(255,80,50,${.6 + .3 * Math.sin(t * 25)})`; cx.lineWidth = 4; cx.beginPath(); cx.arc(f.x, f.y, R, 0, Math.PI * 2); cx.stroke(); cx.restore();
    }
  }
}
// au-dessus des Pokémon : objets qui tombent, Laser Glace, gaz toxique, statut des joueurs
function drawMap7Over(t) {
  for (const o of S.falls || []) if (o.t > 0) {
    const k = o.t / o.max, z = k * k * 320;
    if (o.kind === "ice") { const y = o.y - z; poly(cx, [o.x - o.r * .5, y - o.r * 2.2, o.x + o.r * .5, y - o.r * 2.2, o.x, y + o.r * .3], "#bfe6fa"); poly(cx, [o.x, y - o.r * 2.2, o.x + o.r * .5, y - o.r * 2.2, o.x, y + o.r * .3], "#7fb8dc"); }
    else drawBoulder(o.x, o.y - z, o.r * .85, o.ph + o.t * 4);
  }
  for (const f of S.foes) if (f.lz) {
    const z = f.lz, ex = Math.cos(z.a), ey = Math.sin(z.a), L = 900, sx = f.x + ex * f.r * .6, sy = f.y + ey * f.r * .6;
    if (z.ph === "aim") { cx.save(); cx.globalAlpha = .45 + .3 * Math.sin(t * 30); cx.strokeStyle = z.type === "normal" ? "#ffc86a" : "#9ee6ff"; cx.lineWidth = 2.5; cx.setLineDash([12, 8]); cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(f.x + ex * L, f.y + ey * L); cx.stroke(); cx.restore(); cx.save(); cx.globalCompositeOperation = "lighter"; glow(sx, sy, 30 + 10 * Math.sin(t * 20), "160,225,255", .8); cx.restore(); }
    else {
      cx.save(); cx.lineCap = "round"; cx.globalCompositeOperation = "lighter";
      const hy = z.type === "normal"; // Ultralaser : orange et blanc
      for (const [w, col] of hy ? [[46, "rgba(255,120,30,.28)"], [26, "rgba(255,200,90,.55)"], [10, "rgba(255,252,235,.95)"]] : [[46, "rgba(80,170,255,.25)"], [26, "rgba(150,225,255,.5)"], [10, "rgba(240,252,255,.95)"]]) { cx.strokeStyle = col; cx.lineWidth = w * (z.w || 22) / 22 * (1 + .08 * Math.sin(t * 40)); cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(f.x + ex * L, f.y + ey * L); cx.stroke(); }
      glow(sx, sy, 55, hy ? "255,210,120" : "190,240,255", .9); cx.restore();
    }
  }
  for (const g of S.gas || []) {
    const a = Math.max(0, Math.min(1, g.life / 1.2, ((g.life0 || 6) - g.life) * 2 + .2));
    for (let k = 0; k < 9; k++) { const an = k / 9 * Math.PI * 2 + g.ph + t * .3, rr = g.r * (.35 + .4 * ((k * 37) % 10) / 10); circ(cx, g.x + Math.cos(an) * rr, g.y + Math.sin(an) * rr * .7, g.r * .42, `rgba(120,160,70,${.16 * a})`); }
    circ(cx, g.x, g.y, g.r * .6, `rgba(150,90,170,${.12 * a})`);
    for (let k = 0; k < 5; k++) { const an = k * 2.4 + t * .9 + g.ph, rr = g.r * ((k * .17 + t * .15) % 1); circ(cx, g.x + Math.cos(an) * rr, g.y + Math.sin(an) * rr * .7, 2.4, `rgba(200,230,140,${.5 * a})`); }
  }
  for (const p of S.players) {
    if (p.down) continue;
    if (p.parT > 0) { cx.strokeStyle = "rgba(255,235,90,.95)"; cx.lineWidth = 2; for (let k = 0; k < 3; k++) { const a = t * 7 + k * 2.1, x = p.x + Math.cos(a) * p.r * 1.25, y = p.y - p.r * .3 + Math.sin(a) * p.r * .8; cx.beginPath(); cx.moveTo(x - 4, y - 5); cx.lineTo(x + 1, y - 1); cx.lineTo(x - 1, y + 1); cx.lineTo(x + 4, y + 5); cx.stroke(); } }
    if (p.slowT > 0) { cx.save(); cx.globalAlpha = .6; cx.strokeStyle = "#bfeeff"; cx.lineWidth = 3; cx.beginPath(); cx.ellipse(p.x, p.y + p.r * .75, p.r * 1.3, p.r * .5, 0, 0, Math.PI * 2); cx.stroke(); for (let k = 0; k < 4; k++) { const a = k * 1.57 + t; circ(cx, p.x + Math.cos(a) * p.r * 1.3, p.y + p.r * .75 + Math.sin(a) * p.r * .5, 2.5, "#f0fbff"); } cx.restore(); }
  }
}
function drawLight(t) {
  if (LEVEL.cave || LEVEL.ilex || LEVEL.burned) return; // pas de rayons de soleil la nuit au Bois aux Chênes
  cx.save(); cx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 4; i++) {
    const x = (((i * .29 + t * .004) % 1.4) - .2) * W, w = 90 + i * 40;
    const lgr = cx.createLinearGradient(x, 0, x + w, 0); lgr.addColorStop(0, "rgba(255,236,170,0)"); lgr.addColorStop(.5, "rgba(255,236,170,.06)"); lgr.addColorStop(1, "rgba(255,236,170,0)");
    cx.fillStyle = lgr; cx.beginPath(); cx.moveTo(x, 0); cx.lineTo(x + w, 0); cx.lineTo(x + w - H * .45, H); cx.lineTo(x - H * .45, H); cx.fill();
  }
  cx.restore();
}
/* mini-carte */
const mm = document.getElementById("minimap"), mmx = mm.getContext("2d");
let mmT = 0;
function drawMinimap(P) {
  const sz = mm.clientWidth || 110, d = Math.min(DPR, 2); if (mm.width !== sz * d) { mm.width = mm.height = sz * d; }
  const g = mmx, R2 = sz / 2, sc = R2 / 1100;
  g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, sz, sz);
  g.save(); g.beginPath(); g.arc(R2, R2, R2 - 1, 0, Math.PI * 2); g.clip();
  g.fillStyle = LEVEL.ice ? "rgba(60,96,128,.82)" : LEVEL.plant ? "rgba(28,32,40,.85)" : LEVEL.lava ? "rgba(34,14,10,.85)" : LEVEL.cave ? "rgba(22,16,32,.82)" : LEVEL.safari ? "rgba(70,52,22,.8)" : "rgba(14,30,18,.78)"; g.fillRect(0, 0, sz, sz);
  g.translate(R2, R2); g.scale(sc, sc); g.translate(-P.x, -P.y);
  if (LEVEL.league) { const A = arena(); g.fillStyle = "rgba(0,0,0,.55)"; g.fillRect(P.x - 1300, P.y - 1300, 2600, 2600); g.fillStyle = "rgba(170,190,220,.35)"; g.fillRect(A.x0, A.y0, A.x1 - A.x0, A.y1 - A.y0); }
  g.strokeStyle = LEVEL.rocket ? "rgba(232,192,50,.7)" : LEVEL.tower ? "rgba(150,50,90,.8)" : LEVEL.manor ? "rgba(140,40,30,.85)" : LEVEL.cave ? "rgba(150,132,112,.7)" : LEVEL.safari ? "rgba(200,120,70,.85)" : "rgba(196,170,120,.85)"; g.lineWidth = 70; g.beginPath();
  if (LEVEL.safari) szMinimap(g, P); // Parc Safari : les biomes en miniature, pas de sentier
  else { for (let x = P.x - 1200; x <= P.x + 1200; x += 60) x === P.x - 1200 ? g.moveTo(x, pathY(x)) : g.lineTo(x, pathY(x)); g.stroke(); }
  around(P.x, P.y, c => {
    for (const p of c.ponds) { g.fillStyle = "#4f9fc0"; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, p.rot, 0, Math.PI * 2); g.fill(); }
    if (c.lava) for (const p of c.lava) { g.fillStyle = "#ff7a2a"; g.beginPath(); g.ellipse(p.x, p.y, p.rx, p.ry, p.rot, 0, Math.PI * 2); g.fill(); }
    if (c.gates) for (const gt of c.gates) { g.strokeStyle = gateOn(gt) ? "rgba(255,225,80,.95)" : "rgba(120,130,150,.6)"; g.lineWidth = 22; g.beginPath(); g.moveTo(gt.x1, gt.y1); g.lineTo(gt.x2, gt.y2); g.stroke(); }
    for (const t of c.trees) { g.fillStyle = LEVEL.safari ? "rgba(100,110,40,.9)" : "rgba(40,90,45,.9)"; g.beginPath(); g.arc(t.x, t.y, t.r * .8, 0, Math.PI * 2); g.fill(); }
    if (c.walls) for (const w of c.walls) { g.fillStyle = "rgba(120,110,136,.9)"; if (w.tw) { g.fillRect(w.x - w.tw * 16, w.y - w.th * 16, w.tw * 32, w.th * 32); continue; } g.beginPath(); g.arc(w.x, w.y, w.r, 0, Math.PI * 2); g.fill(); }
    if (c.machines) for (const m of c.machines) { g.fillStyle = "rgba(150,160,180,.9)"; g.fillRect(m.x - m.w / 2, m.y - m.h / 2, m.w, m.h); }
    if (c.mwalls) for (const w of c.mwalls) { g.strokeStyle = "rgba(170,150,130,.9)"; g.lineWidth = 24; g.beginPath(); g.moveTo(w.x - Math.cos(w.a) * w.len / 2, w.y - Math.sin(w.a) * w.len / 2); g.lineTo(w.x + Math.cos(w.a) * w.len / 2, w.y + Math.sin(w.a) * w.len / 2); g.stroke(); }
    if (c.fires && !S.fireOff) for (const f of c.fires) { g.strokeStyle = "rgba(255,120,40,.9)"; g.lineWidth = 20; g.beginPath(); g.moveTo(f.x - Math.cos(f.a) * f.len / 2, f.y - Math.sin(f.a) * f.len / 2); g.lineTo(f.x + Math.cos(f.a) * f.len / 2, f.y + Math.sin(f.a) * f.len / 2); g.stroke(); }
    if (c.statues) for (const q of c.statues) { g.fillStyle = "#e0dcff"; g.beginPath(); g.arc(q.x, q.y, 36, 0, Math.PI * 2); g.fill(); }
    if (c.ruins) for (const o of c.ruins) { g.fillStyle = "rgba(150,140,100,.95)"; g.fillRect(o.box.x0, o.box.y0, o.box.x1 - o.box.x0, o.box.y1 - o.box.y0); } // Ruines d'Alpha
    if (c.crates) for (const q of c.crates) { g.fillStyle = "rgba(170,120,70,.9)"; g.fillRect(q.x - 18, q.y - 18, 36, 36); }
    if (c.graves) for (const gr of c.graves) { g.fillStyle = "rgba(160,150,180,.75)"; g.fillRect(gr.x - 14, gr.y - 18, 28, 30); }
    if (c.pillars) for (const q of c.pillars) { g.fillStyle = "rgba(190,180,210,.9)"; g.beginPath(); g.arc(q.x, q.y, q.r * 1.4, 0, Math.PI * 2); g.fill(); }
    if (c.deco) for (const o of c.deco) { g.fillStyle = "rgba(220,220,240,.9)"; g.beginPath(); g.arc(o.x, o.y, 55, 0, Math.PI * 2); g.fill(); }
    if (c.crystals && !LEVEL.moon) for (const cr of c.crystals) { g.fillStyle = cr.col ? "#8fd0ff" : "#f2a8e8"; g.beginPath(); g.arc(cr.x, cr.y, 40, 0, Math.PI * 2); g.fill(); }
  }, 3);
  g.fillStyle = "#e2513f"; for (const f of S.foes) if (!f.d.boss && !f.prop && !f.d.rare) g.fillRect(f.x - 14, f.y - 14, 28, 28);
  g.fillStyle = "#ffb347"; for (const f of S.foes) if (f.d.boss) { g.beginPath(); g.arc(f.x, f.y, 70, 0, Math.PI * 2); g.fill(); }
  const rares = S.foes.filter(f => f.d.rare && f.hp > 0).map(f => [f.x, f.y, f.kind === "minidraco" ? "#7aa8ff" : "#ffd84a"]);
  if (S.dracoJump) rares.push([S.dracoJump.tx, S.dracoJump.ty, "#7aa8ff"]); // Minidraco en plein saut hors de l'eau
  if (S.orme?.on) rares.push([S.orme.x, S.orme.y, "#fff3a0"]); // assistant du Prof. Orme
  if (S.journal && S.journal.x !== undefined) rares.push([S.journal.x, S.journal.y, "#4fe07a"]); // page du journal (Manoir), en vert
  for (const [fx, fy, col] of rares) { // Pokémon dorés et Minidraco du Parc Safari : point clignotant, collé au bord s'il est loin
    let dx = fx - P.x, dy = fy - P.y; const l = Math.hypot(dx, dy) || 1; if (l > 1000) { dx *= 1000 / l; dy *= 1000 / l; }
    const pulse = 1 + .25 * Math.sin(performance.now() / 160);
    g.beginPath(); g.arc(P.x + dx, P.y + dy, 105 * pulse, 0, Math.PI * 2); g.fillStyle = col; g.fill();
    g.lineWidth = 28; g.strokeStyle = "#fff"; g.stroke();
  }
  if (S.players.length > 1) for (const p of S.players) { // un point par joueur ; collé au bord s'il est loin
    let dx = p.x - P.x, dy = p.y - P.y; const l = Math.hypot(dx, dy) || 1; if (l > 1000) { dx *= 1000 / l; dy *= 1000 / l; }
    g.fillStyle = PCOL[p.idx]; g.globalAlpha = p.down ? .5 : 1; g.beginPath(); g.arc(P.x + dx, P.y + dy, p === P ? 85 : 70, 0, Math.PI * 2); g.fill();
    if (p === P) { g.lineWidth = 24; g.strokeStyle = "#fff"; g.stroke(); } g.globalAlpha = 1;
  }
  g.restore();
  if (S.players.length === 1) { g.fillStyle = "#fff"; g.beginPath(); g.arc(R2, R2, 3.5, 0, Math.PI * 2); g.fill(); }
  g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 1.5; g.beginPath(); g.arc(R2, R2, R2 - 1, 0, Math.PI * 2); g.stroke();
}
function drawBoulder(x, y, r, ph) {
  const pts = []; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + ph, rr = r * (.85 + .2 * Math.sin(k * 2.3 + ph)); pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * .85); }
  const lv = LEVEL.lava; // Route Victoire : roche brune
  poly(cx, pts, lv ? "#6e5246" : "#6e6478"); circ(cx, x - r * .25, y - r * .3, r * .45, lv ? "#94725e" : "#93889e"); circ(cx, x - r * .35, y - r * .4, r * .15, lv ? "#c8a890" : "#c4bacc");
}
function drawProp(f, t) {
  const x = f.x, y = f.y;
  if (f.kind === "berrytree") { // arbre à baies (Baies Sitrus jaunes)
    ell(cx, x, y + 16, 20, 6, "rgba(0,0,0,.28)"); cx.fillStyle = "#7a5432"; cx.fillRect(x - 3, y, 6, 16);
    circ(cx, x, y - 8, 19, "#2f7a3a"); circ(cx, x - 9, y - 4, 12, "#3a8f44"); circ(cx, x + 9, y - 5, 12, "#3a8f44"); circ(cx, x - 3, y - 15, 11, "#4aa652");
    for (const [bx, by] of [[-10, -6], [8, -12], [3, 0], [-2, -18], [12, -2]]) { circ(cx, x + bx, y + by, 3.4, "#f2d23c"); circ(cx, x + bx - 1, y + by - 1, 1.2, "#fff6b0"); }
  } else if (f.kind === "crate") { // caisse de la Team Rocket (Potion)
    ell(cx, x, y + 15, 17, 5, "rgba(0,0,0,.35)"); cx.fillStyle = "#a87a44"; cx.fillRect(x - 14, y - 14, 28, 28); cx.strokeStyle = "#5a3e20"; cx.lineWidth = 2; cx.strokeRect(x - 14, y - 14, 28, 28);
    cx.fillStyle = "#e23a3a"; cx.font = "900 15px 'Pixelify Sans', monospace"; cx.textAlign = "center"; cx.textBaseline = "middle"; cx.fillText("R", x, y + 1); cx.textBaseline = "alphabetic";
  } else if (f.kind === "urn") { // jarre de la Tour (Potion)
    if (pokeTowerOn()) { const q = TW.R.vase, k = .55; ell(cx, x, y + 14, 15, 5, "rgba(0,0,0,.35)"); cx.imageSmoothingEnabled = true; cx.drawImage(TW.img, q[0], q[1], q[2], q[3], x - q[2] * k / 2, y + 16 - q[3] * k, q[2] * k, q[3] * k); return; } // vase de Wind Waker
    ell(cx, x, y + 14, 15, 5, "rgba(0,0,0,.35)");
    cx.fillStyle = "#8a5a3a"; cx.beginPath(); cx.moveTo(x - 6, y - 14); cx.quadraticCurveTo(x - 17, y - 4, x - 9, y + 13); cx.lineTo(x + 9, y + 13); cx.quadraticCurveTo(x + 17, y - 4, x + 6, y - 14); cx.closePath(); cx.fill();
    cx.fillStyle = "#6a4028"; cx.fillRect(x - 7, y - 17, 14, 4); cx.fillStyle = "#b07a4c"; ell(cx, x - 5, y - 4, 3, 6, "#b07a4c");
    cx.strokeStyle = "#d8b060"; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(x - 11, y + 1); cx.lineTo(x + 11, y + 1); cx.stroke();
  } else { // rocher fissuré (Éclate-Roc)
    if (LEVEL.alph && AL.img) { ell(cx, x, y + 12, 17, 5, "rgba(0,0,0,.25)"); cx.imageSmoothingEnabled = false; alSpr(cx, "smash", x - 7 * 2.6, y + 14 - 13 * 2.6, 2.6); return; } // Ruines d'Alpha : rocher Éclate-Roc de HGSS
    if (moonOn()) { const q = MM.R.smash, K = 1.4; ell(cx, x, y + 14, 18, 5, "rgba(0,0,0,.3)"); cx.imageSmoothingEnabled = false; cx.drawImage(MM.img, q[0], q[1], q[2], q[3], x - q[2] * K / 2, y + 16 - q[3] * K, q[2] * K, q[3] * K); return; } // rocher Éclate-Roc de HGSS
    ell(cx, x, y + 13, 20, 6, "rgba(0,0,0,.3)"); drawBoulder(x, y, 18, 1.3);
    cx.strokeStyle = "#3a3240"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x - 4, y - 14); cx.lineTo(x + 1, y - 5); cx.lineTo(x - 3, y + 2); cx.lineTo(x + 4, y + 10);
    cx.moveTo(x + 1, y - 5); cx.lineTo(x + 10, y - 7); cx.stroke();
  }
}
function drawCandy(g, t) {
  if (g.coin) { const w = Math.abs(Math.sin(t * 5 + g.x)) * 6 + 1.5; ell(cx, g.x, g.y, w + 1, 7, "#b0821e"); ell(cx, g.x, g.y, w, 6, "#f6c845"); ell(cx, g.x - w * .3, g.y - 2, w * .3, 2, "#fff2b0"); return; }
  if (g.pick) { const im = PICKS[g.pick].img, b = Math.sin(t * 4 + g.x) * 2, z = g.pick === "chest" ? 40 : g.pick === "flute" || g.pick === "aimant" ? 30 : 26;
    ell(cx, g.x, g.y + 9, 8, 3, "rgba(0,0,0,.25)"); if (g.pick !== "sitrus" && g.pick !== "potion") circ(cx, g.x, g.y - 2 + b, (g.pick === "chest" ? 22 : 13) + Math.sin(t * 6) * 2, "rgba(255,240,150,.25)");
    if (im.complete) { cx.imageSmoothingEnabled = false; cx.drawImage(im, g.x - z / 2, g.y - z / 2 - 2 + b, z, z); } return; }
  if (g.berry) { circ(cx, g.x, g.y, 7, "#3c7ad8"); circ(cx, g.x - 2, g.y - 2, 2.5, "#9cc4ff"); cx.fillStyle = "#3e8a3a"; cx.fillRect(g.x - 1, g.y - 11, 2, 5); return; }
  const col = g.v >= 5 ? "#e2513f" : g.v >= 2 ? "#5fd16a" : "#5aa8f0", s = g.v >= 5 ? 7 : g.v >= 2 ? 6 : 5;
  const bob = Math.sin(t * 4 + g.x) * 1.5;
  poly(cx, [g.x - s, g.y + bob, g.x - s*1.8, g.y - s*.6 + bob, g.x - s*1.8, g.y + s*.6 + bob], col);
  poly(cx, [g.x + s, g.y + bob, g.x + s*1.8, g.y - s*.6 + bob, g.x + s*1.8, g.y + s*.6 + bob], col);
  circ(cx, g.x, g.y + bob, s, col); circ(cx, g.x - s*.3, g.y - s*.3 + bob, s*.35, "rgba(255,255,255,.7)");
}
function render(now) {
  const t = now / 1000;
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (!S) { cx.fillStyle = "#1e3a22"; cx.fillRect(0, 0, W, H); return; }
  const P = S.P, CAM = S.cam || P, vw = W / ZOOM, vh = H / ZOOM; // caméra : centre des joueurs
  const sh = S.shake > 0 ? (Math.random() - .5) * 8 : 0;
  const camX = CAM.x - vw / 2 + sh, camY = CAM.y - vh / 2 + sh;
  cx.setTransform(DPR * ZOOM, 0, 0, DPR * ZOOM, -camX * DPR * ZOOM, -camY * DPR * ZOOM);
  drawGround(camX, camY, vw, vh, t);
  for (const g of S.gems) if (Math.abs(g.x - CAM.x) < vw && Math.abs(g.y - CAM.y) < vh) drawCandy(g, t);
  for (const sl of S.sludge) {
    const a = Math.min(1, sl.life * 1.5, (sl.max - sl.life) * 4);
    ell(cx, sl.x, sl.y, sl.r, sl.r * .62, `rgba(110,40,140,${.75 * a})`); ell(cx, sl.x - sl.r * .2, sl.y - sl.r * .1, sl.r * .55, sl.r * .3, `rgba(170,90,200,${.6 * a})`);
    circ(cx, sl.x + Math.sin(S.t * 2 + sl.ph) * sl.r * .4, sl.y, 2.4 + Math.abs(Math.sin(S.t * 3 + sl.ph)) * 2, `rgba(220,170,240,${.7 * a})`);
  }
  drawMap7Under(t);
  for (const pt of S.patches) ell(cx, pt.x, pt.y + pt.r * .2, pt.r * 1.05, pt.r * .45, `rgba(50,20,10,${.28 * Math.min(1, pt.life / pt.max * 2)})`); // sol roussi
  cx.save(); cx.globalCompositeOperation = "lighter";
  for (const pt of S.patches) glow(pt.x, pt.y - pt.r * .3, pt.r * 1.7, "255,110,30", .5 * Math.min(1, pt.life / pt.max * 2));
  cx.restore();
  for (const pt of S.patches) {
    const a = Math.min(1, pt.life / pt.max * 2), r = pt.r, sz = Math.sqrt(a);
    for (let k = 0; k < 3; k++) {
      const ox = (k - 1) * r * .4, fl = 1 + Math.sin(t * 17 + pt.ph + k * 2.1) * .2, h = r * (k === 1 ? 1.15 : .8) * fl * sz, sw = Math.sin(t * 9 + k * 1.7 + pt.ph) * r * .15;
      flameShape(pt.x + ox, pt.y, r * .34 * sz, h, `rgba(220,60,35,${.9 * a})`, sw);
      flameShape(pt.x + ox, pt.y + r * .05, r * .22 * sz, h * .72, `rgba(250,150,45,${.95 * a})`, sw * .8);
      flameShape(pt.x + ox, pt.y + r * .1, r * .11 * sz, h * .42, `rgba(255,240,175,${a})`, sw * .5);
    }
  }
  for (const c of S.clouds) {
    const a = Math.min(1, c.life * 2, (c.max_life - c.life) * 4 + .2);
    for (let k = 0; k < 16; k++) { const an = k / 16 * Math.PI * 2 + c.ph + t * .4, rr = c.r * (.5 + .45 * ((k * 37) % 10) / 10); circ(cx, c.x + Math.cos(an) * rr, c.y + Math.sin(an) * rr, c.r * .3, `rgba(150,70,170,${.2 * a})`); }
    circ(cx, c.x, c.y, c.r * .75, `rgba(170,90,190,${.14 * a})`);
    for (let k = 0; k < 8; k++) { const an = k * 2.4 + t * 1.3 + c.ph, rr = c.r * ((k * 0.13 + t * .2) % 1); circ(cx, c.x + Math.cos(an) * rr, c.y + Math.sin(an) * rr, 2.2, `rgba(220,160,240,${.6 * a})`); }
  }
  for (const P of S.players) if (P.moves.siphon?.rad && !P.down) {
    const rad = P.moves.siphon.rad;
    const sg = cx.createRadialGradient(P.x, P.y, rad * .2, P.x, P.y, rad);
    sg.addColorStop(0, "rgba(40,120,190,.32)"); sg.addColorStop(.8, "rgba(70,160,220,.2)"); sg.addColorStop(1, "rgba(140,210,240,0)");
    cx.fillStyle = sg; cx.beginPath(); cx.arc(P.x, P.y, rad, 0, Math.PI * 2); cx.fill();
    cx.strokeStyle = "rgba(220,245,255,.45)"; cx.lineWidth = 2.5;
    for (let k = 0; k < 4; k++) { const a0 = -t * 3 + k * Math.PI / 2; cx.beginPath(); for (let q = 0; q <= 14; q++) { const a = a0 + q * .16, rr = rad * (.95 - q * .045); q ? cx.lineTo(P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr) : cx.moveTo(P.x + Math.cos(a) * rr, P.y + Math.sin(a) * rr); } cx.stroke(); }
  }

  for (const rk of S.rocks) {
    if (rk.t > 0) { const k = 1 - rk.t / rk.max; ell(cx, rk.x, rk.y, rk.r * (.4 + .6 * k), rk.r * (.3 + .45 * k), `rgba(10,6,14,${.25 + .35 * k})`); cx.strokeStyle = `rgba(226,81,63,${.3 + .4 * k})`; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(rk.x, rk.y, rk.r, rk.r * .75, 0, 0, Math.PI * 2); cx.stroke(); }
    else { const a = Math.min(1, (rk.t + .7) * 2); cx.globalAlpha = a; drawBoulder(rk.x, rk.y, rk.r * .7, rk.ph); cx.globalAlpha = 1; }
  }
  drawJohtoUnder(t);
  drawAlphUnder(t);
  drawIlexUnder(t);
  drawBurnedUnder(t);
  for (const P of S.players) if (P.moves.grozyeux?.rad && !P.down) {
    const rad = P.moves.grozyeux.rad;
    circ(cx, P.x, P.y, rad, "rgba(226,81,63,.06)");
    cx.save(); cx.setLineDash([10, 12]); cx.lineDashOffset = -t * 30; cx.strokeStyle = "rgba(240,110,90,.45)"; cx.lineWidth = 2; cx.beginPath(); cx.arc(P.x, P.y, rad, 0, Math.PI * 2); cx.stroke(); cx.restore();
  }
  for (const g of S.ghosts) { const o = g.o || P; cx.save(); cx.globalAlpha = g.life / .22 * .35; drawMon(cx, o.line, g.x, g.y, o.r, o.flip, t, o.stage, g.dir, false); cx.restore(); }
  const list = S.foes.filter(f => Math.abs(f.x - CAM.x) < vw / 2 + 120 && Math.abs(f.y - CAM.y) < vh / 2 + 120);
  for (const p of S.players) list.push({ isP:true, y:p.y, p });
  list.sort((a, b) => {
    const magiA = a.isP && a.p.line === "magicarpe", magiB = b.isP && b.p.line === "magicarpe";
    return Number(magiA) - Number(magiB) || a.y - b.y;
  });
  for (const f of list) {
    if (f.isP) {
      const P = S.P = f.p, multi = S.players.length > 1;
      if (P.down) { // K.O. : allongé, en attendant qu'un coéquipier le relève
        cx.save(); cx.globalAlpha = .5; drawMon(cx, pKind(), P.x, P.y, P.r, P.flip, t, P.stage, 0, false); cx.restore();
        cx.save(); cx.setLineDash([6, 6]); cx.strokeStyle = PCOL[P.idx]; cx.globalAlpha = .55; cx.lineWidth = 2; cx.beginPath(); cx.arc(P.x, P.y, 60, 0, Math.PI * 2); cx.stroke(); cx.restore();
        if (P.revT > 0) { cx.strokeStyle = "#fff"; cx.lineWidth = 4; cx.beginPath(); cx.arc(P.x, P.y, P.r + 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, P.revT / 3)); cx.stroke(); }
        cx.font = "bold 11px sans-serif"; cx.textAlign = "center"; cx.fillStyle = PCOL[P.idx]; cx.fillText(`J${P.idx + 1} K.O.`, P.x, P.y - P.r * 2.4 - 6);
        continue;
      }
      if (P.choosing) { // en ligne : fantôme intangible pendant qu'il choisit une amélioration
        cx.save(); cx.globalAlpha = .4 + .1 * Math.sin(t * 4); drawMon(cx, pKind(), P.x, P.y, P.r, P.flip, t, P.stage, dirOf(P.fx, P.fy), false); cx.restore();
        cx.font = "bold 11px sans-serif"; cx.textAlign = "center"; cx.fillStyle = PCOL[P.idx]; cx.fillText(`J${P.idx + 1} choisit… ${Math.max(0, Math.ceil(P.chooseT ?? 0))}`, P.x, P.y - P.r * 2.4 - 6);
        continue;
      }
      if (P.inv > 0 && Math.floor(t * 20) % 2 && P.line !== "magicarpe") continue;
      if (P.evoFlash > 0) { cx.save(); cx.globalAlpha = Math.min(1, P.evoFlash); circ(cx, P.x, P.y, P.r * 2.4 * (1.3 - P.evoFlash * .25), "rgba(255,255,230,.55)"); cx.restore(); }
      const moving = !!P.moving;
      cx.save(); cx.globalAlpha = .55 + .2 * Math.sin(t * 3); cx.strokeStyle = PCOL[P.idx]; cx.lineWidth = 2.5; cx.beginPath(); cx.ellipse(P.x, P.y + P.r * .75, P.r * 1.15, P.r * .45, 0, 0, Math.PI * 2); cx.stroke(); cx.restore();
      if (P.moves.etincelle?.rad) { const rad = P.moves.etincelle.rad; circ(cx, P.x, P.y, rad, "rgba(246,209,58,.07)"); cx.strokeStyle = "rgba(255,240,150,.7)"; cx.lineWidth = 1.6; for (let k = 0; k < 4; k++) { const a = t * 3 + k * 1.57 + Math.sin(t * 13 + k) * .3; cx.beginPath(); cx.moveTo(P.x + Math.cos(a) * rad * .55, P.y + Math.sin(a) * rad * .55); cx.lineTo(P.x + Math.cos(a + .15) * rad * .8, P.y + Math.sin(a + .15) * rad * .8); cx.lineTo(P.x + Math.cos(a + .05) * rad, P.y + Math.sin(a + .05) * rad); cx.stroke(); } }
      cx.save(); if (P.line === "magicarpe" && P.inv > 0) cx.globalAlpha = .5;
      const hop = P.hopAt != null && S.t - P.hopAt < .35 ? Math.sin((S.t - P.hopAt) / .35 * Math.PI) * P.r * .9 : 0; // saut de Trempette
      drawMon(cx, pKind(), P.x, P.y - hop + (sheetFor(pKind(), P.stage) ? 0 : Math.sin(t * 10) * (moving ? 1.5 : .5)), P.r, P.flip, t, P.stage, dirOf(P.fx, P.fy), moving);
      cx.restore();
      if (P.swim) { cx.strokeStyle = "rgba(220,245,255,.6)"; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(P.x, P.y + P.r * .7, P.r * (1 + (t * 1.5 % 1) * .6), P.r * .35 * (1 + (t * 1.5 % 1) * .6), 0, 0, Math.PI * 2); cx.stroke(); }
      else grassOver(P.x, P.y, P.r, t);
      if (multi) { // étiquette et barre de PV au-dessus de chaque joueur
        const y0 = P.y - P.r * 2.4 - 10, k = Math.max(0, P.hp / P.maxHp);
        cx.fillStyle = "rgba(0,0,0,.6)"; cx.fillRect(P.x - 17, y0, 34, 6);
        cx.fillStyle = k > .5 ? "#7fe08a" : k > .2 ? "#f6c845" : "#e2513f"; cx.fillRect(P.x - 16, y0 + 1, 32 * k, 4);
        cx.font = "bold 11px sans-serif"; cx.textAlign = "center"; cx.lineWidth = 3; cx.strokeStyle = "rgba(0,0,0,.7)"; cx.strokeText(`J${P.idx + 1}`, P.x, y0 - 3); cx.fillStyle = PCOL[P.idx]; cx.fillText(`J${P.idx + 1}`, P.x, y0 - 3);
      }
      continue;
    }
    if (f.prop) { drawProp(f, t); continue; }
    if (f.d.snake && !f.under) {
      for (let i = f.trail.length - 1; i >= 1; i--) { const [sx, sy] = f.trail[i]; circ(cx, sx, sy + f.r * .2, f.r * (.85 - i * .04), "rgba(0,0,0,.2)"); circ(cx, sx, sy, f.r * (.8 - i * .04), i % 2 ? "#a49c8a" : "#8e8674"); }
    }
    if (f.dashMode === "aim" && f.d.bigDash) { cx.save(); cx.globalAlpha = .22 + .15 * Math.sin(t * 30); cx.strokeStyle = "#e2513f"; cx.lineWidth = f.r * 1.6; cx.lineCap = "round"; cx.beginPath(); cx.moveTo(f.x, f.y); cx.lineTo(f.x + (f.dx || 0) * 720, f.y + (f.dy || 0) * 720); cx.stroke(); cx.restore(); }
    if (f.dashMode === "aim") { cx.save(); cx.globalAlpha = .35 + .3 * Math.sin(t * 40); circ(cx, f.x, f.y, f.r * 1.25, "#e2513f"); cx.restore(); }
    if (f.under) {
      const shake = f.under === 2 ? Math.sin(t * 60) * 2 : 0, s2 = f.under === 2 ? 1.25 : 1;
      if (f.under === 2) { const wr = f.d.boss ? f.r + 95 : f.r + P.r + 20; cx.strokeStyle = `rgba(226,81,63,${.5 + .3 * Math.sin(t * 40)})`; cx.lineWidth = f.d.boss ? 4 : 2; cx.beginPath(); cx.ellipse(f.x, f.y, wr, wr * .7, 0, 0, Math.PI * 2); cx.stroke(); }
      ell(cx, f.x + shake, f.y + 4, f.r * 1.2 * s2, f.r * .6 * s2, "rgba(10,6,14,.35)");
      ell(cx, f.x + shake, f.y, f.r * 1.05 * s2, f.r * .62 * s2, "#9a7a4e"); ell(cx, f.x - f.r * .25 + shake, f.y - f.r * .2, f.r * .5 * s2, f.r * .28 * s2, "#c4a06a");
      for (let k = 0; k < 4; k++) { const a = t * 9 + k * 1.6 + f.ph, d = f.r * (.8 + .3 * Math.sin(t * 7 + k)); circ(cx, f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * .5 - 2, 2, "#b8945e"); }
      continue;
    }
    if (f.d.ghost) {
      if (f.vanish > 0 && f.bx !== undefined) { // marque violette là où le Spectre va réapparaître
        const k = 1 - f.vanish / (f.vanMax || .45), rr = f.r * (2.2 - k * 1.1);
        ell(cx, f.bx, f.by + f.r * .6, f.r * 1.1, f.r * .45, `rgba(60,20,90,${.25 + .35 * k})`);
        cx.save(); cx.strokeStyle = `rgba(190,130,255,${.35 + .55 * k})`; cx.lineWidth = 2.5; cx.setLineDash([6, 5]); cx.lineDashOffset = -t * 30;
        cx.beginPath(); cx.ellipse(f.bx, f.by + f.r * .6, rr, rr * .45, 0, 0, Math.PI * 2); cx.stroke(); cx.restore();
      }
      const fade = f.vanish > 0 ? f.vanish / (f.vanMax || .45) : f.appear > 0 ? 1 - f.appear / .4 : 1, wob = Math.sin(t * 3 + f.ph) * 3;
      cx.save(); cx.globalCompositeOperation = "lighter"; glow(f.x, f.y + wob, f.r * 2.2, f.d.spirit ? "120,160,255" : "140,90,220", .35 * fade); cx.restore();
      if (veiled(f.d) && TW.img) drawVeiledGhost(cx, f, f.x, f.y + wob, t, fade); // spectre non identifié façon Let's Go
      else if (veiled(f.d)) { // silhouette « ??? » sans Scope Sylphe
        const Rr = f.r * 1.1, y = f.y + wob, x = f.x;
        cx.save(); cx.globalAlpha = fade * .92; cx.beginPath(); cx.moveTo(x - Rr, y + Rr * .85); cx.lineTo(x - Rr, y - Rr * .1); cx.arc(x, y - Rr * .1, Rr, Math.PI, 0); cx.lineTo(x + Rr, y + Rr * .85);
        for (let k = 0; k < 4; k++) { const xa = x + Rr - k * Rr / 2, xb = xa - Rr / 2; cx.quadraticCurveTo((xa + xb) / 2, y + Rr * .85 + (k % 2 ? -1 : 1) * Rr * .22 + Math.sin(t * 6 + k + f.ph) * 2, xb, y + Rr * .85); }
        cx.closePath(); cx.fillStyle = "#231a33"; cx.fill(); cx.strokeStyle = "rgba(170,130,240,.55)"; cx.lineWidth = 1.5; cx.stroke();
        for (const ex of [-.38, .38]) { ell(cx, x + ex * Rr, y - Rr * .2, Rr * .2, Rr * .3, "#f4ecff"); circ(cx, x + ex * Rr + (f.flip ? -1 : 1) * Rr * .06, y - Rr * .14, Rr * .1, "#2a1040"); }
        cx.restore();
      } else {
      cx.save(); cx.globalAlpha = fade * (f.d.spirit ? .6 + .15 * Math.sin(t * 4) : .82 + .12 * Math.sin(t * 5 + f.ph));
      if (f.d.spirit) cx.filter = "grayscale(1) brightness(1.6) drop-shadow(0 0 6px rgba(140,180,255,.9))"; // silhouette spectrale
      drawMon(cx, f.d.sprite || f.kind, f.x, f.y + wob, f.r, f.flip, t + f.ph, 0, f.dir, true); cx.restore(); }
    } else {
    if (f.d.rare) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(f.x, f.y, f.r * 2.6, "255,230,120", .45 + .2 * Math.sin(t * 6)); cx.restore(); }
    if (f.d.mewtwo) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(f.x, f.y, f.r * 2.4, f.raged ? "255,80,160" : "200,120,255", .45 + .15 * Math.sin(t * 5)); cx.restore(); }
    if (f.d.bird) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(f.x, f.y - 10, f.r * 2.4, f.raged ? "255,90,90" : BIRD_COL[f.d.bird], .4 + .15 * Math.sin(t * 5)); cx.restore(); }
    if (f.jz) ell(cx, f.x, f.y + f.r * .6, f.r * (1 - f.jz / 400), f.r * .4 * (1 - f.jz / 400), "rgba(0,0,0,.35)");
    if (f.d.shadow && !f.pure) shadowAura(f, t); // Bois aux Chênes : Pokémon Obscurs
    if (f.copyK) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(f.x, f.y, f.r * 2, "200,120,255", .35 + .1 * Math.sin(t * 6 + f.ph)); cx.restore(); }
    drawMon(cx, f.copyK || f.spr || f.d.sprite || f.kind, f.x, f.y - (f.jz || 0) - (f.d.bird ? 5 * Math.sin(t * 3 + f.ph) - (f.d.sprDy || 0) : 0), f.d.sprR || f.r, f.flip, t + f.ph, f.copySt || 0, f.dir, f.dashMode !== "aim"); }
    if (!f.d.types.includes("vol")) grassOver(f.x, f.y, f.r, t + f.ph);
    if (f.hurt > 0) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(f.x, f.y, f.r * 1.5, "255,255,255", f.hurt / .12 * .75); cx.restore(); }
    if (f.shieldT > 0) { // Barrière de Mewtwo
      cx.save(); cx.globalAlpha = Math.min(1, f.shieldT * 2) * (.55 + .2 * Math.sin(t * 10)); cx.strokeStyle = "#ffb0f0"; cx.lineWidth = 3; cx.fillStyle = "rgba(255,160,240,.12)";
      cx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + t * .8; cx[k ? "lineTo" : "moveTo"](f.x + Math.cos(a) * f.r * 1.5, f.y + Math.sin(a) * f.r * 1.5); } cx.closePath(); cx.fill(); cx.stroke(); cx.restore();
    }
    if (f.d.mother && S.mother) { cx.font = "10px 'Press Start 2P', monospace"; cx.textAlign = "center"; cx.fillStyle = "#e8e0ff"; cx.fillText(Math.ceil(S.mother.t) + " s", f.x, f.y - (veiled(f.d) ? f.r * 1.4 + 10 : f.r * 2.5 + 8)); cx.textAlign = "left"; }
    if (f.sleepT > 0) { cx.font = "700 12px 'Pixelify Sans', monospace"; cx.fillStyle = "#e8e0ff"; cx.fillText("z", f.x + f.r * .6, f.y - f.r - ((t * 15) % 12)); cx.fillText("Z", f.x + f.r * .9 + 4, f.y - f.r - 8 - ((t * 15 + 6) % 12)); }
    if (f.seedT > 0) { cx.strokeStyle = "#3f9a3a"; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(f.x, f.y - f.r * .2); cx.quadraticCurveTo(f.x + 5, f.y - f.r - 2, f.x - 2, f.y - f.r - 8); cx.stroke(); ell(cx, f.x - 5, f.y - f.r - 8, 4, 2, "#6cc24a", -.5); ell(cx, f.x + 2, f.y - f.r - 10, 4, 2, "#6cc24a", .5); }
    if (f.stunT > 0) { for (let k = 0; k < 2; k++) { const a = t * 6 + k * Math.PI; circ(cx, f.x + Math.cos(a) * f.r * .7, f.y - f.r - 6 + Math.sin(a) * 3, 2.6, "#ffe27a"); } }
    if (f.poisonT > 0) { for (let k = 0; k < 2; k++) { const by = f.y - f.r * .2 - ((t * 18 + k * 9) % 16); circ(cx, f.x + (k ? 5 : -5), by, 2.3, "rgba(178,90,184,.9)"); } }
    if (f.burnT > 0) { const fl = Math.sin(t * 20 + f.ph) * 2; ell(cx, f.x - f.r * .5, f.y - f.r * .4 + fl, 3, 6, "rgba(240,128,60,.85)"); ell(cx, f.x + f.r * .4, f.y - f.r * .1 - fl, 2.5, 5, "rgba(255,200,90,.85)"); }
    if (f.slowT > 0) { for (let k = 0; k < 3; k++) { const by = f.y - f.r - 4 - ((t * 20 + k * 7) % 20); circ(cx, f.x + (k - 1) * 6, by, 2.6, "rgba(170,220,255,.8)"); } }
  }

  S.P = P;
  for (const P of S.players) { if (P.down) continue;
  const leaf = P.moves.tranchherbe;
  if (P.moves.feufollet?.list) for (const w of P.moves.feufollet.list) {
    if (w.st === "gone") continue;
    const fl = 1 + Math.sin(t * 16 + w.x * .1) * .15;
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(w.x, w.y - 2, 24, "70,110,255", .75); cx.restore();
    ell(cx, w.x, w.y - 3 * fl, 7, 11 * fl, "rgba(70,105,235,.85)");
    ell(cx, w.x, w.y - 1, 4.5, 7 * fl, "rgba(140,175,255,.95)");
    ell(cx, w.x, w.y + 1, 2.2, 3.5 * fl, "#eef3ff");
  }
  if (leaf?.pts) for (const [lx, ly, a] of leaf.pts) { ell(cx, lx, ly, 11, 5, "#5ec24a", a + 1.2); cx.strokeStyle = "#2f7a2a"; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(lx - Math.cos(a+1.2)*9, ly - Math.sin(a+1.2)*9); cx.lineTo(lx + Math.cos(a+1.2)*9, ly + Math.sin(a+1.2)*9); cx.stroke(); }
  }
  cx.save(); cx.globalCompositeOperation = "lighter";
  for (const s of S.shots) { // traînées lumineuses
    const TR = { elek:"250,215,60", star:"255,225,120", seed:"110,200,80", fire:"255,110,30", dfire:"140,100,255", bubble:"140,200,255", coin:"255,210,90", water:"80,150,240", blast:"255,140,40", fairy:"255,160,215", aura:"110,160,255" }[s.kind];
    if (!TR || !s.tr) continue;
    for (let i = 0; i < s.tr.length; i++) { const q = 1 - i / s.tr.length; glow(s.tr[i][0], s.tr[i][1], s.r * 2 * q + 2, TR, .38 * q); }
    glow(s.x, s.y, s.r * (s.kind === "fire" || s.kind === "dfire" || s.kind === "blast" ? 3.6 : 2.8), TR, .6);
  }
  cx.restore();
  for (const s of S.shots) {
    if (s.kind === "elek") {
      const g2 = cx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r * 1.6); g2.addColorStop(0, "#ffffff"); g2.addColorStop(.35, "#ffe45a"); g2.addColorStop(1, "rgba(246,209,58,0)");
      cx.fillStyle = g2; cx.beginPath(); cx.arc(s.x, s.y, s.r * 1.6, 0, Math.PI * 2); cx.fill();
      cx.strokeStyle = "#fff6b0"; cx.lineWidth = 1.6;
      for (let k = 0; k < 3; k++) { const a = t * 9 + k * 2.1 + s.ph; cx.beginPath(); cx.moveTo(s.x + Math.cos(a) * s.r * .4, s.y + Math.sin(a) * s.r * .4); cx.lineTo(s.x + Math.cos(a + .4) * s.r * 1.2, s.y + Math.sin(a + .4) * s.r * 1.2); cx.lineTo(s.x + Math.cos(a - .1) * s.r * 1.5, s.y + Math.sin(a - .1) * s.r * 1.5); cx.stroke(); }
      continue;
    }
    if (s.kind === "blade") {
      const a = Math.atan2(s.vy, s.vx), k = Math.min(1, s.life * 4);
      cx.save(); cx.translate(s.x, s.y); cx.rotate(a); cx.lineCap = "round";
      for (const [lw, col] of [[16, `rgba(240,200,120,${.3 * k})`], [8, `rgba(255,236,180,${.85 * k})`], [3, `rgba(255,255,255,${k})`]]) {
        cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath(); cx.moveTo(-s.r * .35, -s.r); cx.quadraticCurveTo(s.r * .45, 0, -s.r * .35, s.r); cx.stroke();
      }
      for (let q = 1; q <= 3; q++) { cx.strokeStyle = `rgba(255,236,180,${.25 * k / q})`; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(-s.r * .35 - q * 18, -s.r * .8); cx.quadraticCurveTo(s.r * .3 - q * 18, 0, -s.r * .35 - q * 18, s.r * .8); cx.stroke(); }
      cx.restore(); continue;
    }
    if (s.kind === "airblade") { // Lame d'Air
      const a = Math.atan2(s.vy, s.vx), k = Math.min(1, s.life * 4);
      cx.save(); cx.translate(s.x, s.y); cx.rotate(a); cx.lineCap = "round";
      for (const [lw, col] of [[14, `rgba(170,210,255,${.3 * k})`], [7, `rgba(225,240,255,${.85 * k})`], [2.5, `rgba(255,255,255,${k})`]]) {
        cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath(); cx.moveTo(-s.r * .3, -s.r); cx.quadraticCurveTo(s.r * .5, 0, -s.r * .3, s.r); cx.stroke();
      }
      for (let q = 1; q <= 3; q++) { cx.strokeStyle = `rgba(210,232,255,${.28 * k / q})`; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(-s.r * .3 - q * 14, -s.r * .75); cx.quadraticCurveTo(s.r * .3 - q * 14, 0, -s.r * .3 - q * 14, s.r * .75); cx.stroke(); }
      cx.restore(); continue;
    }
    if (s.kind === "fairy") { // Vent Féérique : étincelle rose
      cx.save(); cx.translate(s.x, s.y); cx.rotate(t * 6 + s.ph); const pts = [];
      for (let k = 0; k < 8; k++) { const rr = k % 2 ? s.r * .35 : s.r * 1.2, a = k / 8 * Math.PI * 2; pts.push(Math.cos(a) * rr, Math.sin(a) * rr); }
      poly(cx, pts, "#ffb3dc"); circ(cx, 0, 0, s.r * .35, "#fff"); cx.restore();
      circ(cx, s.x - s.vx * .03, s.y - s.vy * .03 + Math.sin(t * 20 + s.ph) * 3, 1.8, "rgba(255,255,255,.8)"); continue;
    }
    if (s.kind === "aura") { // Aurasphère : boule d'aura bleue
      const g2 = cx.createRadialGradient(s.x, s.y, 1, s.x, s.y, s.r * 1.5); g2.addColorStop(0, "#ffffff"); g2.addColorStop(.35, "#9cc4ff"); g2.addColorStop(.8, "rgba(60,110,240,.7)"); g2.addColorStop(1, "rgba(60,110,240,0)");
      cx.fillStyle = g2; cx.beginPath(); cx.arc(s.x, s.y, s.r * 1.5, 0, Math.PI * 2); cx.fill();
      cx.strokeStyle = "rgba(200,225,255,.8)"; cx.lineWidth = 1.5;
      for (let k = 0; k < 3; k++) { const a = t * 7 + k * 2.1 + s.ph; cx.beginPath(); cx.arc(s.x, s.y, s.r * 1.15, a, a + 1.1); cx.stroke(); }
      continue;
    }
    if (s.kind === "mleaf") { // Feuillemagik
      cx.save(); cx.translate(s.x, s.y); cx.rotate(Math.atan2(s.vy, s.vx) + Math.sin(t * 12 + s.ph) * .4);
      ell(cx, 0, 0, s.r * 1.5, s.r * .75, "#56c447"); ell(cx, -s.r * .2, -s.r * .15, s.r * .9, s.r * .3, "#a6f080");
      cx.strokeStyle = "#e8ffd0"; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(-s.r * 1.3, 0); cx.lineTo(s.r * 1.3, 0); cx.stroke();
      circ(cx, -s.r * 1.6, 0, 2, `rgba(255,255,200,${.5 + .5 * Math.sin(t * 20 + s.ph)})`); cx.restore(); continue;
    }
    if (s.kind === "star") { // étoile de Météores
      cx.save(); cx.translate(s.x, s.y); cx.rotate(t * 8 + s.ph); const pts = [];
      for (let k = 0; k < 10; k++) { const rr = k % 2 ? s.r * .45 : s.r * 1.25, a = k / 10 * Math.PI * 2 - Math.PI / 2; pts.push(Math.cos(a) * rr, Math.sin(a) * rr); }
      poly(cx, pts, "#ffe066"); cx.strokeStyle = "#fff8d0"; cx.lineWidth = 1.2; cx.stroke(); circ(cx, 0, 0, s.r * .3, "#fffbe8"); cx.restore(); continue;
    }
    if (s.kind === "coin") { const w = Math.abs(Math.sin(t * 14 + s.ph)) * 6 + 1.5; ell(cx, s.x, s.y, w + 1, 7, "#b0821e"); ell(cx, s.x, s.y, w, 6, "#f6c845"); ell(cx, s.x - w * .3, s.y - 2, w * .3, 2, "#fff2b0"); continue; }
    if (s.kind === "seed") { circ(cx, s.x, s.y, s.r, "#8a6a2e"); ell(cx, s.x + 2, s.y - 4, 4, 2, "#6cc24a", -.6); continue; }
    if (s.kind === "blast") { const g2 = cx.createRadialGradient(s.x, s.y, 2, s.x, s.y, s.r * 1.8); g2.addColorStop(0, "#fff6c0"); g2.addColorStop(.4, "#f6a23a"); g2.addColorStop(1, "rgba(226,81,63,0)"); cx.fillStyle = g2; cx.beginPath(); cx.arc(s.x, s.y, s.r * 1.8, 0, Math.PI * 2); cx.fill(); continue; }
    if (s.kind === "bubble") { const wb = Math.sin(t * 8 + s.ph) * 2; circ(cx, s.x + wb, s.y, s.r, "rgba(120,190,250,.45)"); cx.strokeStyle = "rgba(225,245,255,.9)"; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(s.x + wb, s.y, s.r, 0, Math.PI * 2); cx.stroke(); circ(cx, s.x + wb - s.r * .35, s.y - s.r * .35, s.r * .25, "#fff"); continue; }
    if (s.kind === "dfire") { // Draco-Rage : flamme violette
      const a = Math.atan2(s.vy, s.vx), fl = 1 + Math.sin(t * 30 + s.x * .05) * .15, r = s.r;
      cx.save(); cx.translate(s.x, s.y); cx.rotate(a - Math.PI / 2);
      flameShape(0, r * .2, r * 1.15, r * 3.2 * fl, "rgba(90,50,200,.9)", Math.sin(t * 25) * r * .3);
      flameShape(0, r * .25, r * .8, r * 2.3 * fl, "#9a7cff", Math.sin(t * 25 + 1) * r * .2);
      flameShape(0, r * .3, r * .45, r * 1.3 * fl, "#efe8ff");
      cx.restore(); continue;
    }
    if (s.kind === "fire") {
      const a = Math.atan2(s.vy, s.vx), fl = 1 + Math.sin(t * 30 + s.x * .05) * .15, r = s.r;
      cx.save(); cx.translate(s.x, s.y); cx.rotate(a - Math.PI / 2);
      flameShape(0, r * .2, r * 1.15, r * 3.2 * fl, "rgba(220,60,35,.9)", Math.sin(t * 25) * r * .3);
      flameShape(0, r * .25, r * .8, r * 2.3 * fl, "#f69a32", Math.sin(t * 25 + 1) * r * .2);
      flameShape(0, r * .3, r * .45, r * 1.3 * fl, "#fff2a8");
      cx.restore();
    } else {
      const a = Math.atan2(s.vy, s.vx);
      cx.save(); cx.translate(s.x, s.y); cx.rotate(a);
      cx.beginPath(); cx.moveTo(s.r * 1.3, 0); cx.bezierCurveTo(s.r * .9, -s.r * 1.1, -s.r * 2.6, -s.r * .55, -s.r * 2.8, 0); cx.bezierCurveTo(-s.r * 2.6, s.r * .55, s.r * .9, s.r * 1.1, s.r * 1.3, 0);
      cx.fillStyle = "rgba(90,160,245,.92)"; cx.fill(); cx.strokeStyle = "rgba(220,245,255,.9)"; cx.lineWidth = 1.2; cx.stroke();
      ell(cx, s.r * .2, -s.r * .3, s.r * .8, s.r * .28, "rgba(255,255,255,.9)"); cx.restore();
    }
  }
  for (const g of S.gusts) {
    const a = Math.min(1, g.life * 2);
    for (let k = 0; k < 18; k++) {
      const h = k / 18, an = t * 9 + k * 1.9 + g.ph, rr = g.r * (.3 + h * .8);
      cx.strokeStyle = `rgba(${g.col || "235,240,245"},${(.35 + h * .3) * a})`; cx.lineWidth = 2.5;
      cx.beginPath(); cx.ellipse(g.x, g.y - h * g.r * 1.4, rr, rr * .32, 0, an, an + 1.6); cx.stroke();
    }
    ell(cx, g.x, g.y + 4, g.r * .6, g.r * .2, `rgba(0,0,0,${.18 * a})`);
  }
  for (const rk of S.rocks) if (rk.t > 0) { const k = rk.t / rk.max; drawBoulder(rk.x, rk.y - k * k * 260, rk.r * .7, rk.ph + rk.t * 4); }
  for (const s of S.eshots) {
    if (s.star) { cx.save(); cx.translate(s.x, s.y); cx.rotate(t * 5); circ(cx, 0, 0, s.r * 1.9, "rgba(255,190,230,.3)"); const pts = []; for (let k = 0; k < 10; k++) { const rr = k % 2 ? s.r * .45 : s.r * 1.1, a = k / 10 * Math.PI * 2 - Math.PI / 2; pts.push(Math.cos(a) * rr, Math.sin(a) * rr); } poly(cx, pts, "#ffe27a"); circ(cx, 0, 0, s.r * .3, "#fff"); cx.restore(); continue; }
    if (s.cage) { // Cage-Éclair : anneau électrique
      cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.6, "250,220,80", .7); cx.restore();
      cx.strokeStyle = "rgba(110,80,0,.75)"; cx.lineWidth = 4.5; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, Math.PI * 2); cx.stroke();
      cx.strokeStyle = "#ffe14a"; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, Math.PI * 2); cx.stroke();
      cx.strokeStyle = "rgba(255,230,90,.9)"; cx.lineWidth = 1.6; cx.beginPath(); for (let k = 0; k <= 8; k++) { const a = k / 8 * Math.PI * 2 + t * 6, rr = s.r * (k % 2 ? .45 : .85); k ? cx.lineTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr) : cx.moveTo(s.x + Math.cos(a) * rr, s.y + Math.sin(a) * rr); } cx.stroke();
      continue;
    }
    if (s.type === "glace") { // éclat de glace
      const a = Math.atan2(s.vy, s.vx); cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.4, "150,220,255", .6); cx.restore();
      cx.save(); cx.translate(s.x, s.y); cx.rotate(a); poly(cx, [s.r * 1.6, 0, 0, -s.r * .6, -s.r * 1.2, 0, 0, s.r * .6], "#c8f0ff"); poly(cx, [s.r * 1.6, 0, 0, -s.r * .6, -s.r * .2, 0], "#ffffff"); cx.restore();
      continue;
    }
    if (s.type === "sol") { // os qui tournoie
      const z = s.big ? 1.6 : 1; cx.save(); cx.translate(s.x, s.y); cx.rotate(t * 14 + s.x * .01); cx.scale(z, z);
      cx.fillStyle = "#f2ead6"; cx.strokeStyle = "#8a7a60"; cx.lineWidth = 1.2; cx.fillRect(-8, -2, 16, 4); cx.strokeRect(-8, -2, 16, 4);
      for (const ex of [-8, 8]) for (const ey of [-2.5, 2.5]) { circ(cx, ex, ey, 3, "#f2ead6"); cx.beginPath(); cx.arc(ex, ey, 3, 0, Math.PI * 2); cx.stroke(); }
      cx.restore(); continue;
    }
    if (s.type === "poison") { // Acide
      cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.4, "170,70,200", .6); cx.restore();
      circ(cx, s.x, s.y, s.r, "#9a3cb0"); circ(cx, s.x - s.r * .3, s.y - s.r * .3, s.r * .35, "#e0a0f0"); continue;
    }
    if (s.type === "spectre") { // Ball'Ombre
      cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.6, "130,70,220", .7); cx.restore();
      circ(cx, s.x, s.y, s.r, "#2a1440"); circ(cx, s.x, s.y, s.r * .7, "#4a2470");
      cx.strokeStyle = "rgba(200,150,255,.8)"; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(s.x, s.y, s.r * .8, t * 8, t * 8 + 2); cx.stroke(); cx.beginPath(); cx.arc(s.x, s.y, s.r * .5, -t * 10, -t * 10 + 1.6); cx.stroke();
      continue;
    }
    if (s.type === "feu") { // boule de feu
      cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.6, "255,120,40", .65); cx.restore();
      circ(cx, s.x, s.y, s.r, "#ff6a1a"); circ(cx, s.x - s.r * .2, s.y - s.r * .2, s.r * .55, "#ffd060"); continue;
    }
    if (s.type === "dragon" || s.type === "combat" || s.type === "normal" || s.type === "plante") { // Draco-Rage, ondes de Séisme, Tygnon
      const c = { dragon:["120,90,255", "#6a4cf0", "#d8ccff"], combat:["240,120,60", "#c0503a", "#ffd2b0"], normal:["255,230,170", "#c8bf98", "#fff6dc"], plante:["120,230,90", "#4a9a30", "#d8ffc0"] }[s.type];
      cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.6, c[0], .65); cx.restore();
      circ(cx, s.x, s.y, s.r, c[1]); circ(cx, s.x - s.r * .25, s.y - s.r * .25, s.r * .45, c[2]); continue;
    }
    if (s.type === "psy") { // Choc Mental : onde psychique rose
      cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.8, "240,90,150", .7); cx.restore();
      circ(cx, s.x, s.y, s.r, "#f05888"); circ(cx, s.x, s.y, s.r * .5, "#ffd0e4");
      cx.strokeStyle = "rgba(255,170,210,.8)"; cx.lineWidth = 1.5; for (let k = 0; k < 2; k++) { const rr = s.r * (1.3 + ((t * 3 + k * .5) % 1) * 1.2); cx.globalAlpha = 1 - ((t * 3 + k * .5) % 1); cx.beginPath(); cx.arc(s.x, s.y, rr, 0, Math.PI * 2); cx.stroke(); } cx.globalAlpha = 1;
      continue;
    }
    if (s.type === "vol") { // Lame d'Air / Picpic : croissant d'air blanc
      const a = Math.atan2(s.vy, s.vx); cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.2, "200,190,255", .45); cx.restore();
      cx.save(); cx.translate(s.x, s.y); cx.rotate(a); cx.lineCap = "round";
      cx.strokeStyle = "rgba(120,100,200,.8)"; cx.lineWidth = 5; cx.beginPath(); cx.arc(-s.r * .6, 0, s.r * 1.3, -1.1, 1.1); cx.stroke();
      cx.strokeStyle = "#f4f2ff"; cx.lineWidth = 2.6; cx.beginPath(); cx.arc(-s.r * .6, 0, s.r * 1.3, -1.1, 1.1); cx.stroke(); cx.restore();
      continue;
    }
    if (s.type === "tenebres") { // orbe sombre
      cx.save(); cx.globalCompositeOperation = "lighter"; glow(s.x, s.y, s.r * 2.2, "120,80,110", .5); cx.restore();
      circ(cx, s.x, s.y, s.r, "#1c1418"); circ(cx, s.x, s.y, s.r * .62, "#5a3c50"); circ(cx, s.x - s.r * .3, s.y - s.r * .3, s.r * .25, "#c8a0b8"); continue;
    }
    if (s.type === "eau") { const a = Math.atan2(s.vy, s.vx); ell(cx, s.x, s.y, s.r * 2, s.r * .9, "rgba(90,158,240,.85)", a); ell(cx, s.x + Math.cos(a) * 2, s.y + Math.sin(a) * 2, s.r, s.r * .45, "#e8f4ff", a); continue; }
    circ(cx, s.x, s.y, s.r * 1.8, "rgba(246,209,58,.3)");
    for (const [col, w] of [["rgba(110,80,0,.75)", 4.5], ["#fff6b0", 2.5]]) { cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); cx.moveTo(s.x - 6, s.y - 6); cx.lineTo(s.x + 2, s.y - 1); cx.lineTo(s.x - 2, s.y + 1); cx.lineTo(s.x + 6, s.y + 6); cx.stroke(); } // contour sombre : visible aussi sur le sol blanc
  }
  cx.save(); cx.globalCompositeOperation = "lighter";
  for (const fl of S.flames) { const k = fl.life / fl.max, r = 6 + (1 - k) * 18; glow(fl.x, fl.y, r * 1.5, k > .7 ? "255,190,80" : k > .4 ? "245,100,30" : "190,45,25", .42 * Math.min(1, k * 1.8)); if (k > .75) glow(fl.x, fl.y, r * .5, "255,240,190", (k - .75) * 1.6); }
  cx.restore();
  for (const fl of S.flames) { // langues de feu de Lance-Flammes
    const k = fl.life / fl.max; if (k < .2) continue;
    const r = 5 + (1 - k) * 11; cx.save(); cx.translate(fl.x, fl.y); cx.rotate(Math.atan2(fl.vy, fl.vx) + Math.PI / 2); cx.globalAlpha = Math.min(1, k * 1.6) * .85;
    flameShape(0, 0, r * .55, r * 1.9, k > .6 ? "#ffc861" : "#ec6a2a"); flameShape(0, r * .1, r * .28, r * 1.1, "#fff1b8"); cx.restore();
  }
  for (const sl of S.slashes) {
    const k = sl.life / .22, sweep = (1 - k) * 1.1 * sl.side;
    cx.strokeStyle = `rgba(70,150,60,${k})`; cx.lineWidth = 6; cx.lineCap = "round"; cx.beginPath();
    for (let q = 0; q <= 10; q++) { const d = q / 10 * sl.range, an = sl.a - sweep * (1 - q / 10) + Math.sin(q * .9) * .08; q ? cx.lineTo(sl.x + Math.cos(an) * d, sl.y + Math.sin(an) * d) : cx.moveTo(sl.x, sl.y); }
    cx.stroke(); cx.strokeStyle = `rgba(150,215,110,${k})`; cx.lineWidth = 2; cx.stroke();
  }
  for (const e of S.claws) {
    const k = e.life / .16, L = e.range * .75, c0x = (e.o || P).x + Math.cos(e.a) * e.range * .55, c0y = (e.o || P).y + Math.sin(e.a) * e.range * .55, la = e.a + e.side * 1.1;
    const ux = Math.cos(la), uy = Math.sin(la), px = -uy, py = ux;
    cx.lineCap = "round"; cx.strokeStyle = e.big ? `rgba(255,224,150,${k})` : `rgba(255,255,255,${k})`; cx.lineWidth = e.big ? 4.5 : 3;
    for (let q = -1; q <= 1; q++) { const ox = px * q * 8, oy = py * q * 8; cx.beginPath(); cx.moveTo(c0x + ox - ux * L / 2, c0y + oy - uy * L / 2); cx.quadraticCurveTo(c0x + ox + px * 5, c0y + oy + py * 5, c0x + ox + ux * L / 2, c0y + oy + uy * L / 2); cx.stroke(); }
  }
  for (const e of S.eclaws) { // griffes du Persian de Giovanni
    const k = e.life / .2, L = e.range * .8, c0x = e.x + Math.cos(e.a) * e.range * .6, c0y = e.y + Math.sin(e.a) * e.range * .6, la = e.a + e.side * 1.1;
    const ux = Math.cos(la), uy = Math.sin(la), px = -uy, py = ux;
    cx.lineCap = "round";
    for (const [lw, col] of [[e.big ? 12 : 9, `rgba(226,60,60,${.35 * k})`], [e.big ? 5 : 3.5, `rgba(255,235,225,${k})`]]) {
      cx.strokeStyle = col; cx.lineWidth = lw;
      for (let q = -1; q <= 1; q++) { const ox = px * q * 13, oy = py * q * 13; cx.beginPath(); cx.moveTo(c0x + ox - ux * L / 2, c0y + oy - uy * L / 2); cx.quadraticCurveTo(c0x + ox + px * 8, c0y + oy + py * 8, c0x + ox + ux * L / 2, c0y + oy + uy * L / 2); cx.stroke(); }
    }
  }
  for (const ff of S.frostFangs || []) { // Crocs Givre : grande mâchoire de glace qui claque
    const P = ff.o, p = 1 - ff.life / ff.max, k = Math.min(1, ff.life / ff.max * 2.2), R = ff.range;
    cx.save(); cx.translate(P.x, P.y); cx.rotate(ff.a); cx.globalAlpha = k;
    const shut = Math.min(1, p / .35) ** 2, gap = R * .42 * (1 - shut), x0 = R * .25, L = R * .8, n = 6;
    for (const s of [-1, 1]) { // mâchoire du haut (s=-1) et du bas (s=1)
      const y0 = s * (gap + 6);
      cx.fillStyle = "rgba(120,200,240,.85)"; cx.beginPath(); cx.moveTo(x0, y0); cx.quadraticCurveTo(x0 + L * .5, y0 + s * 22, x0 + L, y0); cx.lineTo(x0 + L, y0 + s * 9); cx.quadraticCurveTo(x0 + L * .5, y0 + s * 32, x0, y0 + s * 9); cx.closePath(); cx.fill();
      for (let i = 0; i < n; i++) { const x = x0 + L * (i + .5) / n, h = (i === 0 || i === n - 1 ? 18 : 12) * (R / 120);
        poly(cx, [x - 6, y0, x + 6, y0, x, y0 - s * h], "#f2fcff"); cx.strokeStyle = "rgba(90,170,220,.9)"; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(x - 6, y0); cx.lineTo(x, y0 - s * h); cx.lineTo(x + 6, y0); cx.stroke(); }
    }
    if (shut >= 1) { cx.globalAlpha = k * (1 - (p - .35) / .65); circ(cx, x0 + L * .5, 0, R * .45 * (1 + (p - .35)), "rgba(220,250,255,.35)"); }
    cx.restore();
  }
  for (const b of S.bites) {
    const k = b.life / (b.max || .25), o = b.r * .55 * k, w = b.ice ? 4 : 3;
    const col = b.dark ? `rgba(80,40,100,${.5 + .5 * k})` : b.ice ? `rgba(200,245,255,${.5 + .5 * k})` : `rgba(255,255,255,${.4 + .6 * k})`, fang = b.dark ? "#f4ecff" : b.ice ? "#e8faff" : "#fff";
    if (b.dark) circ(cx, b.x, b.y, b.r * 1.1, `rgba(40,20,60,${.35 * k})`);
    if (b.ice) circ(cx, b.x, b.y, b.r * 1.15, `rgba(140,215,255,${.35 * k})`);
    cx.strokeStyle = col; cx.lineWidth = w;
    cx.beginPath(); cx.arc(b.x, b.y - o, b.r * .8, Math.PI * .15, Math.PI * .85); cx.stroke();
    cx.beginPath(); cx.arc(b.x, b.y + o, b.r * .8, Math.PI * 1.15, Math.PI * 1.85); cx.stroke();
    for (let q = -1; q <= 1; q++) { poly(cx, [b.x + q * 7 - 3, b.y - o + b.r * .7, b.x + q * 7 + 3, b.y - o + b.r * .7, b.x + q * 7, b.y - o + b.r * .7 + 6], fang); poly(cx, [b.x + q * 7 - 3, b.y + o - b.r * .7, b.x + q * 7 + 3, b.y + o - b.r * .7, b.x + q * 7, b.y + o - b.r * .7 - 6], fang); }
  }
  for (const sn of S.suns) { // charge de Lance-Soleil
    const k = 1 - sn.t / sn.max, P = sn.o || S.P;
    circ(cx, P.x, P.y - 6, 10 + k * 22, `rgba(255,230,120,${.25 + k * .35})`); circ(cx, P.x, P.y - 6, 4 + k * 10, `rgba(255,255,220,${.5 + k * .4})`);
  }
  for (const sb of S.sunbeams) {
    const k = sb.life / .5; cx.lineCap = "round";
    cx.strokeStyle = `rgba(255,200,60,${.4 * k})`; cx.lineWidth = sb.w * 1.6; cx.beginPath(); cx.moveTo(sb.sx, sb.sy); cx.lineTo(sb.ex, sb.ey); cx.stroke();
    cx.strokeStyle = `rgba(255,240,150,${.85 * k})`; cx.lineWidth = sb.w; cx.stroke();
    cx.strokeStyle = `rgba(255,255,240,${k})`; cx.lineWidth = sb.w * .35; cx.stroke();
  }
  for (const P of S.players) if (P.dracoT > 0 && !P.down) { // aura de Danse Draco
    const a = Math.min(1, P.dracoT * 2), rr = P.dracoLv >= 5 ? P.r + 55 : P.r + 14;
    cx.save(); cx.globalAlpha = a * (.35 + .15 * Math.sin(t * 8)); circ(cx, P.x, P.y, rr, "rgba(130,100,240,.35)");
    cx.strokeStyle = "#b9a4ff"; cx.lineWidth = 2; for (let k = 0; k < 3; k++) { cx.beginPath(); cx.arc(P.x, P.y, rr - 4, t * 3 + k * 2.09, t * 3 + k * 2.09 + 1); cx.stroke(); } cx.restore();
  }
  for (const bm of S.beams) {
    const k = bm.life / .4, wob = Math.sin(t * 60) * 2;
    cx.lineCap = "round";
    if (bm.psy) { // Rafale Psy
      cx.strokeStyle = `rgba(200,70,170,${.4 * k})`; cx.lineWidth = bm.w * 1.6 + wob; cx.beginPath(); cx.moveTo(bm.sx, bm.sy); cx.lineTo(bm.ex, bm.ey); cx.stroke();
      cx.strokeStyle = `rgba(255,140,220,${.85 * k})`; cx.lineWidth = bm.w * .8; cx.stroke();
      cx.strokeStyle = `rgba(255,240,250,${k})`; cx.lineWidth = bm.w * .3; cx.stroke(); continue;
    }
    if (bm.hyper) { // Ultralaser
      cx.strokeStyle = `rgba(200,120,40,${.45 * k})`; cx.lineWidth = bm.w * 1.6 + wob; cx.beginPath(); cx.moveTo(bm.sx, bm.sy); cx.lineTo(bm.ex, bm.ey); cx.stroke();
      cx.strokeStyle = `rgba(255,214,120,${.85 * k})`; cx.lineWidth = bm.w; cx.stroke();
      cx.strokeStyle = `rgba(255,252,235,${k})`; cx.lineWidth = bm.w * .4; cx.stroke();
      circ(cx, bm.sx, bm.sy, bm.w * (1 + (1 - k) * .4), `rgba(255,236,170,${.8 * k})`); continue;
    }
    cx.strokeStyle = `rgba(40,110,200,${.45 * k})`; cx.lineWidth = bm.w * 1.5 + wob; cx.beginPath(); cx.moveTo(bm.sx, bm.sy); cx.lineTo(bm.ex, bm.ey); cx.stroke();
    cx.strokeStyle = `rgba(110,190,250,${.85 * k})`; cx.lineWidth = bm.w; cx.stroke();
    cx.strokeStyle = `rgba(235,250,255,${k})`; cx.lineWidth = bm.w * .35; cx.stroke();
    circ(cx, bm.sx, bm.sy, bm.w * .9 * (1 + (1 - k) * .4), `rgba(200,235,255,${.8 * k})`);
  }
  drawJohtoOver(t, CAM, vw, vh);
  drawAlphOver(t, CAM, vw, vh);
  drawCelebiP(t);
  drawEvoliObscur(t);
  for (const tl of S.tails) { // Draco-Queue (et Hydroqueue) : arc de queue qui balaie le cercle
    const P = tl.o || S.P, k = tl.life / .3, sw = (1 - k) * Math.PI * 2.2 + tl.a;
    cx.save(); cx.lineCap = "round";
    for (const [lw, col] of tl.water ? [[24, `rgba(60,140,240,${.35 * k})`], [11, `rgba(140,200,255,${.8 * k})`], [3, `rgba(255,255,255,${k})`]] : [[22, `rgba(120,90,240,${.35 * k})`], [10, `rgba(185,164,255,${.8 * k})`], [3, `rgba(255,255,255,${k})`]]) { cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath(); cx.arc(P.x, P.y, tl.r * .85, sw - 1.4, sw); cx.stroke(); }
    cx.restore();
  }
  for (const tn of S.tornados) {
    const a = Math.min(1, tn.life * 2, (tn.max - tn.life) * 4);
    if (tn.twister) { // Ouragan : spirale de vent violet
      const color = tn.waterTwister ? "70,180,245" : "170,150,255", highlight = tn.waterTwister ? "220,250,255" : "235,230,255";
      const tg = cx.createRadialGradient(tn.x, tn.y, 4, tn.x, tn.y, tn.r); tg.addColorStop(0, `rgba(${color},${.35 * a})`); tg.addColorStop(1, `rgba(${color},0)`);
      cx.fillStyle = tg; cx.beginPath(); cx.arc(tn.x, tn.y, tn.r, 0, Math.PI * 2); cx.fill(); cx.lineCap = "round";
      for (let k = 0; k < 9; k++) {
        const h = k / 9, rr = tn.r * (.2 + h * .8), an = t * (9 - h * 4) + k * 1.3 + tn.ph, py = tn.y - h * tn.r * .9;
        cx.strokeStyle = k % 3 ? `rgba(${color},${.85 * a})` : `rgba(${highlight},${.9 * a})`; cx.lineWidth = 3 - h;
        cx.beginPath(); cx.ellipse(tn.x, py, rr, rr * .3, 0, an, an + 2.2); cx.stroke();
      }
      continue;
    }
    const tg = cx.createRadialGradient(tn.x, tn.y, 4, tn.x, tn.y, tn.r); tg.addColorStop(0, `rgba(255,190,215,${.35 * a})`); tg.addColorStop(1, "rgba(255,190,215,0)");
    cx.fillStyle = tg; cx.beginPath(); cx.arc(tn.x, tn.y, tn.r, 0, Math.PI * 2); cx.fill();
    for (let k = 0; k < 26; k++) {
      const h = k / 26, an = t * (7 - h * 3) + k * 2.39 + tn.ph, rr = tn.r * (.25 + h * .75), px = tn.x + Math.cos(an) * rr, py = tn.y - h * tn.r * .9 + Math.sin(an) * rr * .35;
      ell(cx, px, py, 5, 2.6, k % 3 ? `rgba(244,150,190,${.95 * a})` : `rgba(255,236,245,${.95 * a})`, an * 1.7);
    }
  }
  for (const w of S.waves) { // vague de Surf qui ondule
    const a = Math.min(1, w.life * 2.5), R = w.r, n = Math.max(6, Math.round(R / 20)), ph = (w.ph ??= Math.random() * 6) + t * 6, N = 160;
    const edge = (an, amp, off = 0, sh = 0) => R + off + Math.sin(an * n + ph + sh) * amp;
    const wavy = (amp, off) => { cx.beginPath(); for (let q = 0; q <= N; q++) { const an = q / N * Math.PI * 2, rr = edge(an, amp, off); q ? cx.lineTo(w.x + Math.cos(an) * rr, w.y + Math.sin(an) * rr) : cx.moveTo(w.x + Math.cos(an) * rr, w.y + Math.sin(an) * rr); } cx.closePath(); };
    const thick = Math.min(30, R * .35), amp = Math.min(8, R * .08);
    // corps de la vague : anneau ondulé, bleu profond vers turquoise
    wavy(amp, 4); cx.arc(w.x, w.y, Math.max(1, R - thick), 0, Math.PI * 2, true);
    const g = cx.createRadialGradient(w.x, w.y, Math.max(1, R - thick), w.x, w.y, R + amp + 4);
    g.addColorStop(0, `rgba(40,110,200,0)`); g.addColorStop(.45, `rgba(45,125,215,${.55 * a})`); g.addColorStop(.85, `rgba(90,185,240,${.85 * a})`); g.addColorStop(1, `rgba(170,230,255,${.9 * a})`);
    cx.fillStyle = g; cx.fill("evenodd");
    // reflets intérieurs
    for (const [off, al] of [[-thick * .4, .55], [-thick * .75, .35], [-thick * 1.1, .2]]) { // ondulations qui suivent la vague
      cx.beginPath(); for (let q = 0; q <= N; q++) { const an = q / N * Math.PI * 2, rr = Math.max(2, edge(an, amp * .8, off, off * .08)); q ? cx.lineTo(w.x + Math.cos(an) * rr, w.y + Math.sin(an) * rr) : cx.moveTo(w.x + Math.cos(an) * rr, w.y + Math.sin(an) * rr); }
      cx.strokeStyle = `rgba(210,242,255,${al * a})`; cx.lineWidth = 2; cx.stroke();
    }
    // crête d'écume
    cx.save(); cx.globalCompositeOperation = "lighter"; cx.strokeStyle = `rgba(120,190,255,${.3 * a})`; cx.lineWidth = 10; wavy(amp, 4); cx.stroke(); cx.restore();
    cx.strokeStyle = `rgba(245,252,255,${.95 * a})`; cx.lineWidth = 3; cx.lineJoin = "round"; wavy(amp, 4); cx.stroke();
    // rouleaux d'écume sur chaque crête
    for (let k = 0; k < n; k++) {
      const an = ((k + .25) * Math.PI * 2 - ph) / n, rr = edge(an, amp, 4), rx = Math.cos(an), ry = Math.sin(an), tx = -ry, ty = rx;
      const px = w.x + rx * rr, py = w.y + ry * rr;
      cx.beginPath(); cx.moveTo(px - tx * 6, py - ty * 6); cx.quadraticCurveTo(px + rx * 7 + tx * 6, py + ry * 7 + ty * 6, px + tx * 9 - rx * 1, py + ty * 9 - ry * 1);
      cx.strokeStyle = `rgba(255,255,255,${.95 * a})`; cx.lineWidth = 2.6; cx.lineCap = "round"; cx.stroke();
      for (let d = 0; d < 2; d++) circ(cx, px + rx * (8 + d * 4) + tx * (d * 5 + Math.sin(t * 9 + k) * 2), py + ry * (8 + d * 4) + ty * (d * 5), 1.8 - d * .5, `rgba(255,255,255,${.75 * a})`);
    }
  }
  for (const b of S.bolts) {
    const k = b.life / .18, pts = [[b.x + 10, b.y - vh]]; let by = b.y - vh;
    while (by < b.y) { by += 34; pts.push(by >= b.y ? [b.x, b.y] : [b.x + (Math.random() - .5) * 46 * (1 - (by - b.y + vh) / vh), by]); }
    const path = () => { cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) cx.lineTo(x, y); };
    cx.save(); cx.lineJoin = "round"; cx.lineCap = "round"; cx.globalCompositeOperation = "lighter";
    glow(b.x, b.y, (b.big || 34) * 1.6, "250,210,60", .9 * k); glow(b.x, b.y, (b.big || 34) * .6, "255,255,230", k);
    path(); cx.strokeStyle = `rgba(250,210,60,${.35 * k})`; cx.lineWidth = b.big ? 18 : 12; cx.stroke();
    cx.strokeStyle = `rgba(255,240,150,${k})`; cx.lineWidth = b.big ? 7 : 5; cx.stroke();
    cx.strokeStyle = `rgba(255,255,255,${k})`; cx.lineWidth = 2; cx.stroke();
    const mid = pts[Math.floor(pts.length * .6)]; if (mid) { cx.beginPath(); cx.moveTo(mid[0], mid[1]); cx.lineTo(mid[0] + 26, mid[1] + 22); cx.lineTo(mid[0] + 18, mid[1] + 46); cx.strokeStyle = `rgba(255,240,150,${.7 * k})`; cx.lineWidth = 2.5; cx.stroke(); }
    cx.restore();
  }
  for (const c of S.chains) {
    const k = c.life / .18;
    for (const [lw, col] of [[7, `rgba(246,209,58,${.35 * k})`], [3, `rgba(255,248,200,${k})`]]) {
      cx.strokeStyle = col; cx.lineWidth = lw; cx.lineJoin = "round"; cx.beginPath(); cx.moveTo(c.pts[0][0], c.pts[0][1]);
      for (let i = 1; i < c.pts.length; i++) { const [ax, ay] = c.pts[i - 1], [bx, by] = c.pts[i]; for (let q = 1; q <= 4; q++) { const tq = q / 4, j = q < 4 ? (Math.random() - .5) * 18 : 0; cx.lineTo(ax + (bx - ax) * tq - (by - ay) / 60 * j, ay + (by - ay) * tq + (bx - ax) / 60 * j); } }
      cx.stroke();
    }
  }
  cx.save(); cx.globalCompositeOperation = "lighter";
  for (const q of S.parts) { const k = q.life / q.max; glow(q.x, q.y, q.r * 2.6, q.col, k); }
  cx.restore();
  for (const e of S.fxs) if (e.star) { const a = Math.min(1, e.life * 3); cx.save(); cx.translate(e.x, e.y); cx.globalCompositeOperation = "lighter"; for (let k = 0; k < 5; k++) { cx.rotate(Math.PI * 2 / 5); ell(cx, 0, -e.r * .5, e.r * .18, e.r * .55, `rgba(246,162,58,${.6 * a})`); } circ(cx, 0, 0, e.r * .45, `rgba(255,236,150,${.5 * a})`); cx.restore(); }
  for (const e of S.fxs) if (!e.star) { cx.strokeStyle = e.col + (e.life * 3).toFixed(2) + ")"; cx.lineWidth = 3; cx.beginPath(); cx.arc(e.x, e.y, e.r, 0, Math.PI*2); cx.stroke(); }
  if (S.celebi) {
    const c = S.celebi, bob = Math.sin(t * 3) * 5, a = Math.min(1, c.life * 1.5);
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(c.x, c.y + bob, 46, "140,255,150", .55 * a); cx.restore();
    cx.save(); cx.globalAlpha = a; drawMon(cx, "celebi", c.x, c.y + bob, 15, c.x < P.x, t, 0, 0, true); cx.restore();
  }
  drawOrme(t);
  drawIlexOver(t);
  drawBurnedOver(t);
  for (const f of S.foes) if (f.jump) { // zone d'atterrissage de Kangourex géant
    const k = f.jump.t / f.jump.dur; cx.save(); cx.globalAlpha = .25 + .35 * k; cx.strokeStyle = "#e2513f"; cx.lineWidth = 3; cx.fillStyle = "rgba(226,81,63,.15)";
    cx.beginPath(); cx.ellipse(f.jump.tx, f.jump.ty, 110, 80, 0, 0, Math.PI * 2); cx.fill(); cx.stroke(); cx.beginPath(); cx.ellipse(f.jump.tx, f.jump.ty, 110 * k, 80 * k, 0, 0, Math.PI * 2); cx.stroke(); cx.restore();
  }
  if (S.journal) { // page du journal qui volette
    const j = S.journal, bob = Math.sin(t * 3 + j.ph) * 3, rot = Math.sin(t * 2 + j.ph) * .25;
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(j.x, j.y + bob, 34, "255,240,200", .45 + .2 * Math.sin(t * 4)); cx.restore();
    if (MN.page && MN.page.complete) { cx.save(); cx.translate(j.x, j.y + bob); cx.rotate(rot); cx.imageSmoothingEnabled = true; cx.drawImage(MN.page, -12, -13, 24, 26); cx.restore(); } else { cx.save(); cx.translate(j.x, j.y + bob); cx.rotate(rot); cx.fillStyle = "#f2e8cc"; cx.fillRect(-9, -12, 18, 24); cx.strokeStyle = "#a89a7a"; cx.lineWidth = 1; cx.strokeRect(-9, -12, 18, 24);
    cx.strokeStyle = "rgba(80,60,40,.6)"; for (let k = 0; k < 5; k++) { cx.beginPath(); cx.moveTo(-6, -7 + k * 4); cx.lineTo(6 - (k === 4 ? 5 : 0), -7 + k * 4); cx.stroke(); } cx.restore(); }
  }
  if (S.dracoJump) { // Minidraco jaillit de l'étang
    const dj = S.dracoJump, k = Math.min(1, dj.t / .9), x = dj.sx + (dj.tx - dj.sx) * k, y = dj.sy + (dj.ty - dj.sy) * k, z = Math.sin(k * Math.PI) * 90;
    if (k < .3) { cx.save(); cx.strokeStyle = "rgba(220,240,255,.8)"; cx.lineWidth = 2; cx.globalAlpha = 1 - k * 3; cx.beginPath(); cx.ellipse(dj.sx, dj.sy, 14 + k * 90, (14 + k * 90) * .45, 0, 0, Math.PI * 2); cx.stroke(); cx.restore(); }
    ell(cx, x, y + 8, 14 * (1 - z / 200), 5 * (1 - z / 200), "rgba(0,0,0,.3)");
    cx.save(); cx.globalCompositeOperation = "lighter"; glow(x, y - z, 40, "120,170,255", .5); cx.restore();
    drawMon(cx, "minidraco", x, y - z, 16, dj.tx < dj.sx, t, 0, 0, true);
  }
  if (S.rocketStar) { // « … vers d'autres cieux ! » ✦
    const k = S.rocketStar.t += 1 / 60, sx = P.x + 60 + k * 160, sy = P.y - 60 - k * 260;
    if (k < 1.6) { cx.save(); cx.globalCompositeOperation = "lighter"; glow(sx, sy, 22 + Math.sin(k * 30) * 8, "255,250,200", 1 - k / 1.6); cx.restore(); } else S.rocketStar = null;
  }
  drawMap7Over(t);
  if (LEVEL.league) drawLeagueOver(camX, camY, vw, vh, t);
  drawCanopy(camX, camY, vw, vh, t, P);
  drawAlphRoofs(camX, camY, vw, vh);
  drawIlexTop(camX, camY, vw, vh, t);
  drawBurnedTop(camX, camY, vw, vh, t);
  drawMotes(camX, camY, vw, vh, t, Math.min(.05, t - (render.lt || t))); render.lt = t;
  if (LEVEL.cave) drawCaveLight(camX, camY, vw, vh, t, CAM);
  if (S.white > 0) { cx.fillStyle = `rgba(255,255,255,${Math.min(1, S.white / .8)})`; cx.fillRect(camX - 60, camY - 60, vw + 120, vh + 120); } // écran blanc : Mewtwo s'enfuit
  cx.textAlign = "center";
  for (const tx of S.texts) {
    cx.globalAlpha = Math.min(1, tx.life * 3);
    cx.font = tx.label ? "700 15px 'Pixelify Sans', monospace" : `${tx.big ? 11 : 9}px 'Press Start 2P', monospace`;
    cx.lineWidth = 3; cx.strokeStyle = "rgba(0,0,0,.7)"; cx.strokeText(tx.txt, tx.x, tx.y); cx.fillStyle = tx.col; cx.fillText(tx.txt, tx.x, tx.y);
  }
  cx.globalAlpha = 1;

  // écran
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawWeather(t); // Tour Cendrée : soleil, pluie, orage
  if (S.celebi) { // flèche vers Célébi quand il est hors de l'écran
    const c = S.celebi, sx = (c.x - camX) * ZOOM, sy = (c.y - camY) * ZOOM;
    if (sx < 0 || sy < 0 || sx > W || sy > H) {
      const a = Math.atan2(sy - H / 2, sx - W / 2), ex = Math.max(30, Math.min(W - 30, sx)), ey = Math.max(30, Math.min(H - 30, sy));
      cx.save(); cx.translate(ex, ey); cx.rotate(a); poly(cx, [12, 0, -8, -9, -8, 9], `rgba(150,255,160,${.7 + .3 * Math.sin(t * 6)})`); cx.restore();
    }
  }
  const arrowTo = (x, y, col) => { // flèche au bord de l'écran vers une cible hors champ
    const sx = (x - camX) * ZOOM, sy = (y - camY) * ZOOM; if (sx >= 0 && sy >= 0 && sx <= W && sy <= H) return;
    const a = Math.atan2(sy - H / 2, sx - W / 2), ex = Math.max(30, Math.min(W - 30, sx)), ey = Math.max(30, Math.min(H - 30, sy));
    cx.save(); cx.translate(ex, ey); cx.rotate(a); poly(cx, [12, 0, -8, -9, -8, 9], col); cx.restore();
  };
  if (S.journal) arrowTo(S.journal.x, S.journal.y, `rgba(255,240,200,${.7 + .3 * Math.sin(t * 6)})`);
  if (S.orme?.on) arrowTo(S.orme.x, S.orme.y, `rgba(255,236,160,${.7 + .3 * Math.sin(t * 6)})`);
  if (S.dracoJump) arrowTo(S.dracoJump.tx, S.dracoJump.ty, `rgba(130,180,255,${.7 + .3 * Math.sin(t * 6)})`);
  for (const f of S.foes) if (f.d.rare && f.hp > 0) arrowTo(f.x, f.y, `rgba(255,170,200,${.7 + .3 * Math.sin(t * 6)})`);
  if (NET.started) for (const p of S.players) if (p.idx !== (NET.role === "guest" ? NET.idx : 0)) arrowTo(p.x, p.y, PCOL[p.idx]); // en ligne : coéquipiers hors de l'écran
  const vg = cx.createRadialGradient(W/2, H/2, Math.min(W, H) * .35, W/2, H/2, Math.max(W, H) * .75);
  vg.addColorStop(0, "rgba(10,20,12,0)"); vg.addColorStop(1, "rgba(6,16,8,.5)"); cx.fillStyle = vg; cx.fillRect(0, 0, W, H);
  drawLight(t);
  mmT -= 1; if (mmT <= 0 && (state === "play" || state === "netplay")) { drawMinimap(NET.started ? S.players[NET.role === "guest" ? NET.idx : 0] || CAM : CAM); mmT = 6; }
  if (S.msgs[0]) {
    const m = S.msgs[0], bw = Math.min(W - 32, 520), bx = (W - bw) / 2, by = H - 124 - Math.max(0, S.foes.filter(f => f.d.boss).length - 1) * 38;
    cx.globalAlpha = Math.min(1, m.life * 2);
    cx.fillStyle = "#f8f6ec"; cx.strokeStyle = "#2a3a6a"; cx.lineWidth = 4;
    cx.beginPath(); cx.roundRect(bx, by, bw, 52, 8); cx.fill(); cx.stroke();
    cx.fillStyle = "#1e1e28"; cx.font = "600 15px 'Rubik', sans-serif"; cx.textAlign = "left"; cx.fillText(m.txt, bx + 16, by + 31, bw - 32);
    cx.globalAlpha = 1;
  }
  if (touch.on) {
    cx.strokeStyle = "rgba(255,255,255,.35)"; cx.lineWidth = 2; cx.beginPath(); cx.arc(touch.ox, touch.oy, 50, 0, Math.PI*2); cx.stroke();
    const dx = touch.x - touch.ox, dy = touch.y - touch.oy, l = Math.min(50, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
    circ(cx, touch.ox + Math.cos(a) * l, touch.oy + Math.sin(a) * l, 20, "rgba(255,255,255,.35)");
  }
}

let hudT = 0;
function frame(now) {
  const dt = Math.max(0, Math.min(.05, (now - last) / 1000 || 0)); last = now; // jamais négatif (après un choix de niveau)
  pollPad(dt);
  if (state === "play" || (NET.role === "host" && NET.started && S && (state === "levelup" || state === "chest"))) { update(dt); hudT -= dt; if (hudT <= 0 && S) { refreshHud(); hudT = .08; } }
  if (NET.role) netFrame(now, dt);
  render(now);
  requestAnimationFrame(frame);
}
