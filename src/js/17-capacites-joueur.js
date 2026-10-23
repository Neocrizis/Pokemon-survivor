function updateMoves(dt) {
  const P = S.P;
  if (P.line === "mew") updateMetro(P, dt);
  updateJohto(P, dt);
  const gy = P.moves.grozyeux || (P.line === "magicarpe" && P.stage > 0 ? { lv:3 } : null);
  if (gy) {
    const lv = gy.lv, mul = lv >= 3 ? 1.3 : 1.2; gy.rad = (90 + 15 * lv + (lv >= 4 ? 15 : 0)) * AREA();
    for (const f of S.foes) if ((f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (gy.rad + f.r) ** 2) {
      f.leerT = .25; f.leerMul = mul;
      if (lv >= 5 && !(f.slowT > 0)) { f.slowT = .25; f.slowMul = .75; }
    }
  }
  let srcLens = null;
  const tagNew = () => { if (srcLens) [S.shots, S.waves, S.tornados, S.patches].forEach((a, i) => { for (let k = srcLens[i]; k < a.length; k++) a[k].src ||= HIT_SRC; }); };
  for (const [id, m] of Object.entries(P.moves)) {
    tagNew(); HIT_SRC = id; srcLens = [S.shots.length, S.waves.length, S.tornados.length, S.patches.length];
    if (id === "magibulle") {
      m.untouched = (m.untouched || 0) + dt;
    }
    m.t -= dt; const lv = m.lv;
    if (id === "hydrocanon" && m.spinT > 0) {
      const step = Math.min(dt, m.spinT), angle = m.spinA;
      m.spinA += Math.PI * 2 * step / 1.5; m.spinT -= step;
      const len = 900, w = 42 * AREA(), dmg = (12 + 2*lv) * (lv >= 3 ? 1.4 : 1);
      const ex = P.x + Math.cos(angle) * len, ey = P.y + Math.sin(angle) * len;
      S.beams.push({ sx:P.x, sy:P.y, ex, ey, w, life:.08 });
      for (const f of S.foes) {
        const t2 = Math.max(0, Math.min(1, ((f.x - P.x) * Math.cos(angle) * len + (f.y - P.y) * Math.sin(angle) * len) / (len * len)));
        const qx = P.x + Math.cos(angle) * len * t2, qy = P.y + Math.sin(angle) * len * t2;
        if ((f.x - qx) ** 2 + (f.y - qy) ** 2 > (w / 2 + f.r) ** 2 || (m.spinHits.get(f) || 0) > S.t) continue;
        m.spinHits.set(f, S.t + .22); hitFoe(f, dmg, "eau", Math.cos(angle), Math.sin(angle));
      }
      continue;
    }
    if (id === "tranchherbe" || id === "siphon" || id === "feufollet" || id === "combogriffe" || id === "grozyeux" || MOVES[id].tier) continue;
    if (m.t > 0) continue;
    if (JMOVE[id]) { JMOVE[id](P, m, lv, dt); continue; }
    if (id === "meteores") {
      const n = 2 + (lv >= 2) + (lv >= 4) + (lv >= 5) + EXTRA(), tg = nearestFoes(n);
      if (!tg.length) { m.t = .3; continue; }
      m.t = (lv >= 4 ? 1 : 1.25) * P.cdMul;
      const dmg = (9 + 3*lv) * (lv >= 3 ? 1.3 : 1);
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * .55; S.shots.push({ kind:"star", x:P.x, y:P.y - 6, vx:Math.cos(a) * 240, vy:Math.sin(a) * 240, r:7, dmg, life:2.6, pierce:lv >= 5 ? 2 : 1, type:"normal", home:tg[i % tg.length], ph:Math.random() * 6 }); }
    } else if (id === "dracorage") {
      const n = 1 + (lv >= 2) + (lv >= 4) + EXTRA(), ts = nearestFoes(n);
      if (!ts.length && !P.aiming) { m.t = .2; continue; }
      m.t = (lv >= 4 ? .95 : 1.15) * P.cdMul;
      const dmg = (14 + 3*lv) * (lv >= 3 ? 1.4 : 1);
      for (let i = 0; i < n; i++) {
        const f = ts[i % Math.max(1, ts.length)], a = (P.aiming ? P.aimA : Math.atan2(f.y - P.y, f.x - P.x)) + (P.aiming || i >= ts.length ? (i - (n - 1) / 2) * .22 : 0);
        S.shots.push({ kind:"dfire", x:P.x, y:P.y, vx:Math.cos(a)*340, vy:Math.sin(a)*340, r:8 + P.stage, dmg, life:1.3, pierce:1, type:"dragon", boom:true, boomR:(lv >= 5 ? 95 : 55) * AREA(), boomMul:.6 });
      }
    } else if (id === "ouragan") {
      m.t = (lv >= 4 ? 4 : 5.5) * P.cdMul;
      for (let i = 0; i < (lv >= 5 ? 2 : 1) + EXTRA(); i++) {
        const a = Math.random() * Math.PI * 2;
        S.tornados.push({ x:P.x + Math.cos(a) * 30, y:P.y + Math.sin(a) * 30, r:(50 + 9*lv) * AREA(), life:3.5 * DUR(), max:3.5 * DUR(), dmg:(7 + 2*lv) * (lv >= 3 ? 1.4 : 1), tick:0, ph:Math.random() * 6, tx:null, type:"dragon", twister:true });
      }
    } else if (id === "dracoqueue") {
      const rad = (95 + 14*lv + (lv >= 2 ? 15 : 0)) * AREA();
      if (!S.foes.some(f => (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (rad + f.r) ** 2)) { m.t = .2; continue; }
      m.t = (lv >= 4 ? 2 : 2.6) * P.cdMul;
      const dmg = (16 + 4*lv) * (lv >= 3 ? 1.4 : 1);
      for (const f of S.foes) {
        const dx = f.x - P.x, dy = f.y - P.y, dd = Math.hypot(dx, dy) || 1;
        if (dd > rad + f.r) continue;
        hitFoe(f, dmg, "dragon", dx / dd * 4, dy / dd * 4);
        if (!f.d.boss) { f.kbx = dx / dd * 420; f.kby = dy / dd * 420; if (lv >= 5) f.stunT = Math.max(f.stunT || 0, 1); }
      }
      S.tails.push({ r:rad, life:.3, a:Math.random() * 6 });
    } else if (id === "ultralaser") {
      const near = nearestFoes(1)[0];
      if (!near && !P.aiming) { m.t = .3; continue; }
      m.t = (lv >= 4 ? 6 : 8) * P.cdMul;
      const a0 = P.aiming ? P.aimA : Math.atan2(near.y - P.y, near.x - P.x), len = 820, w = (40 + 6*lv) * AREA(), dmg = (120 + 30*lv) * (lv >= 3 ? 1.4 : 1);
      const hit = new Set();
      for (const a of lv >= 5 ? [a0 - .35, a0 - .17, a0, a0 + .17, a0 + .35] : [a0]) {
        const sx = P.x, sy = P.y, ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len;
        S.beams.push({ sx, sy, ex, ey, w, life:.4, hyper:true });
        for (const f of S.foes) {
          if (hit.has(f)) continue;
          const t2 = Math.max(0, Math.min(1, ((f.x - sx) * (ex - sx) + (f.y - sy) * (ey - sy)) / (len * len)));
          const qx = sx + (ex - sx) * t2, qy = sy + (ey - sy) * t2;
          if ((f.x - qx) ** 2 + (f.y - qy) ** 2 < (w / 2 + f.r) ** 2) { hit.add(f); hitFoe(f, dmg, "normal", Math.cos(a) * 4, Math.sin(a) * 4); }
        }
      }
      S.shake = .25; banner(`${pName()} utilise Ultralaser !`);
    } else if (id === "flammeche") {
      m.t = (lv >= 4 ? .75 : .95) * P.cdMul;
      const n = 1 + (lv >= 2) + (lv >= 4) + EXTRA(), dmg = (11 + 2*lv) * (lv >= 3 ? 1.4 : 1);
      const ts = nearestFoes(n).map(f => Math.atan2(f.y - P.y, f.x - P.x)); // toujours automatique, même en visant
      ts.forEach(a => {
        S.shots.push({ kind:"fire", x:P.x, y:P.y, vx:Math.cos(a)*380, vy:Math.sin(a)*380, r:7 + P.stage, dmg, life:1.4, pierce:1, type:"feu", boom: lv >= 5 });
      });
      if (!ts.length) m.t = .2;
    } else if (id === "jackpot") {
      m.t = (lv >= 4 ? 1.2 : 1.6) * P.cdMul;
      const n = 1 + (lv >= 2) + (lv >= 4) + EXTRA(), dmg = (10 + 3*lv) * (lv >= 3 ? 1.4 : 1), ts = nearestFoes(n);
      if (!ts.length && !P.aiming) { m.t = .2; continue; }
      for (let i = 0; i < n; i++) {
        const f = ts[i % Math.max(1, ts.length)];
        const a = P.aiming ? P.aimA + (i - (n - 1) / 2) * .2 : Math.atan2(f.y - P.y, f.x - P.x) + (i >= ts.length ? (Math.random() - .5) * .6 : 0);
        S.shots.push({ kind:"coin", x:P.x, y:P.y, vx:Math.cos(a)*360, vy:Math.sin(a)*360, r:6, dmg, life:1.2, pierce:1, type:"normal", hit:new Set(), bounce:3 + (lv >= 3 ? 1 : 0), coinV:lv >= 5 ? 3 : 1, ph:Math.random() * 6 });
      }
    } else if (id === "morsure") {
      m.t = (lv >= 4 ? .8 : 1.1) * P.cdMul;
      const range = (80 + 8*lv) * AREA(), dmg = (16 + 5*lv) * (lv >= 3 ? 1.4 : 1);
      const ts = nearestFoes(6).filter(f => Math.hypot(f.x - P.x, f.y - P.y) < range + f.r).slice(0, lv >= 2 ? 2 : 1);
      if (!ts.length) { m.t = .15; continue; }
      for (const f of ts) { hitFoe(f, dmg, "normal"); S.bites.push({ x:f.x, y:f.y, r:f.r + 8, life:.25 }); if (Math.random() < (lv >= 5 ? .6 : .3)) f.stunT = 1; }
    } else if (id === "lancesoleil") {
      if (!P.aiming && !nearestFoes(1).length) { m.t = .3; continue; }
      m.t = (lv >= 4 ? 5 : 6.5) * P.cdMul;
      S.suns.push({ t:lv >= 4 ? .6 : 1, max:lv >= 4 ? .6 : 1, lv, o:P });
    } else if (id === "dansedraco") {
      m.t = (lv >= 4 ? 10 : 12) * P.cdMul;
      P.dracoT = (lv >= 3 ? 6 : 5) * DUR(); P.dracoMul = lv >= 5 ? 1.2 : lv >= 4 ? 1.15 : lv >= 2 ? 1.1 : 1.05; P.dracoLv = lv;
      S.texts.push({ x:P.x, y:P.y - 34, txt:"Danse Draco !", col:"#b9a4ff", life:1, label:true });
      S.fxs.push({ x:P.x, y:P.y, r:0, max:70, life:.35, col:"rgba(140,110,240," });
    } else if (id === "cascade") {
      let dx = 0, dy = 0;
      if (P.moving) { dx = P.mvx || 0; dy = P.mvy || 0; }
      else if (P.aiming) { dx = P.fx; dy = P.fy; }
      else { const f = nearestFoes(1)[0]; if (f) { dx = f.x - P.x; dy = f.y - P.y; } }
      const l = Math.hypot(dx, dy); if (!l || P.dashT > 0) { m.t = .3; continue; }
      m.t = (lv >= 4 ? 3 : 4) * P.cdMul;
      const dist = 170 + (lv >= 2 ? 60 : 0) + 15 * lv;
      P.dashT = .24; P.dashBy = "cascade"; P.dvx = dx / l * dist / .24; P.dvy = dy / l * dist / .24; P.inv = Math.max(P.inv, .4); m.hit = new Set();
      if (lv >= 5) m.splash = true;
    } else if (id === "viveattaque") {
      let dx = 0, dy = 0;
      if (P.moving) { dx = P.mvx || 0; dy = P.mvy || 0; }
      else if (P.aiming) { dx = P.fx; dy = P.fy; }
      else { const f = nearestFoes(1)[0]; if (f) { dx = f.x - P.x; dy = f.y - P.y; } }
      const l = Math.hypot(dx, dy); if (!l) { m.t = .3; continue; }
      m.t = (lv >= 4 ? 2.2 : 3) * P.cdMul;
      const dist = 150 + 25*lv + (lv >= 2 ? 30 : 0);
      P.dashT = .2; P.dashBy = "viveattaque"; P.dvx = dx / l * dist / .2; P.dvy = dy / l * dist / .2; P.inv = Math.max(P.inv, .35); m.hit = new Set();
    } else if (id === "tonnerre") {
      m.t = (lv >= 4 ? .7 : .9) * P.cdMul;
      const jumps = (lv >= 2) + (lv >= 4) + (lv >= 5 ? 2 : 0) + EXTRA();
      let cands = nearestFoes(12).filter(f => Math.hypot(f.x - P.x, f.y - P.y) < 280);
      if (P.aiming) { const inCone = cands.filter(f => { let da = Math.atan2(f.y - P.y, f.x - P.x) - P.aimA; da = Math.atan2(Math.sin(da), Math.cos(da)); return Math.abs(da) < .6; }); if (inCone.length) cands = inCone; }
      let f = cands[0] || S.foes.find(g => g.prop && g.hp > 0 && Math.hypot(g.x - P.x, g.y - P.y) < 280); if (!f) { m.t = .15; continue; } // sans ennemi, Tonnerre frappe un arbre à baies proche
      const pts = [[P.x, P.y]], hit = new Set(); let dmg = (11 + 2*lv) * (lv >= 3 ? 1.4 : 1); // même base que Flammèche et Pistolet à O
      for (let j = 0; j <= jumps && f; j++) {
        hit.add(f); pts.push([f.x, f.y]); hitFoe(f, dmg, "electrik"); dmg *= .9;
        const from = f; f = null; let best = 170 * 170 * AREA() * AREA();
        for (const g of S.foes) { if (hit.has(g) || g.hp <= 0 || g.under || g.prop) continue; const d2 = (g.x - from.x) ** 2 + (g.y - from.y) ** 2; if (d2 < best) { best = d2; f = g; } }
      }
      S.chains.push({ pts, life:.18 });
    } else if (id === "cageeclair") {
      m.t = (lv >= 4 ? 3.8 : 5) * P.cdMul;
      const rad = (130 + 20*lv + (lv >= 5 ? 40 : 0)) * AREA(), stun = (lv >= 5 ? 2 : lv >= 3 ? 1.5 : 1) * DUR();
      for (const f of S.foes) if ((f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (rad + f.r) ** 2) { hitFoe(f, 5 + 2*lv, "electrik"); f.stunT = Math.max(f.stunT || 0, f.d.boss ? .4 : stun); }
      S.fxs.push({ x:P.x, y:P.y, r:0, max:rad, life:.35, col:"rgba(246,209,58," });
    } else if (id === "etincelle") {
      m.t = lv >= 4 ? .3 : .4;
      const rad = (P.r + 40 + 8*lv) * AREA(), dmg = (5 + 2*lv) * (lv >= 3 ? 1.4 : 1);
      m.rad = rad;
      for (const f of S.foes) if ((f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (rad + f.r) ** 2) { hitFoe(f, dmg, "electrik"); if (lv >= 5 && Math.random() < .2) f.stunT = Math.max(f.stunT || 0, .5); }
    } else if (id === "bouleelek") {
      m.t = (lv >= 4 ? 1.4 : 1.8) * P.cdMul;
      const ts = nearestFoes(2), n = (lv >= 5 ? 2 : 1) + EXTRA();
      if (!ts.length && !P.aiming) { m.t = .2; continue; }
      const dmg = (18 + 5*lv) * (lv >= 3 ? 1.4 : 1) * (speed() / 160);
      for (let i = 0; i < n; i++) {
        const f = ts[i % Math.max(1, ts.length)], a = (P.aiming ? P.aimA : Math.atan2(f.y - P.y, f.x - P.x)) + (i - (n - 1) / 2) * .25;
        S.shots.push({ kind:"elek", x:P.x, y:P.y, vx:Math.cos(a) * 260, vy:Math.sin(a) * 260, r:6, grow:22, dmg, life:1.6, pierce:1, type:"electrik", boom:true, boomR:(60 + 10*lv + (lv >= 2 ? 15 : 0)) * AREA(), boomMul:1, explodeOnEnd:true, ph:Math.random() * 6 });
      }
    } else if (id === "fatalfoudre") {
      if (m.storm > 0) { m.t = .1; continue; }
      m.t = (lv >= 4 ? 7 : 9) * P.cdMul; m.storm = (lv >= 5 ? 6 : 4) * DUR(); m.tk = 0;
      banner(`${pName()} utilise Fatal-Foudre !`);
    } else if (id === "tranche") {
      const near = nearestFoes(1)[0];
      if (!near && !P.aiming) { m.t = .3; continue; }
      m.t = (lv >= 4 ? 3.5 : 4.5) * P.cdMul;
      const c = P.aiming ? P.aimA : Math.atan2(near.y - P.y, near.x - P.x), w = (44 + 8*lv + (lv >= 2 ? 10 : 0)) * AREA();
      const dmg = (40 + 12*lv) * (lv >= 3 ? 1.4 : 1);
      for (const o of lv >= 5 ? [-.35, 0, .35] : [0]) {
        const a = c + o;
        S.shots.push({ kind:"blade", x:P.x, y:P.y, vx:Math.cos(a) * 1100, vy:Math.sin(a) * 1100, r:w / 2, dmg, life:.7, pierce:999, type:"normal", hit:new Set(), crit:true });
      }
      S.shake = .12;
    } else if (id === "pistolet") {
      m.t = (lv >= 5 ? .6 : .8) * P.cdMul;
      const n = (lv >= 5 ? 3 : lv >= 4 ? 2 : 1) + EXTRA(), dmg = (11 + 2*lv) * (lv >= 3 ? 1.4 : 1), tg = P.tc ? nearestFoes(1)[0] : null;
      const base = tg ? Math.atan2(tg.y - P.y, tg.x - P.x) : Math.atan2(P.fy, P.fx); // sur téléphone : vers l'ennemi le plus proche, comme Flammèche
      for (let i = 0; i < n; i++) {
        const a = base + (i - (n-1)/2) * (n === 2 ? .1 : .22); // à 2 jets, éventail serré pour ne pas rater la cible droit devant
        S.shots.push({ kind:"water", x:P.x, y:P.y, vx:Math.cos(a)*500, vy:Math.sin(a)*500, r:6 + P.stage, dmg, life:.85, pierce:3 + (lv >= 2 ? 2 : 0), type:"eau", hit:new Set() });
      }
    } else if (id === "bullesdo" || id === "magibulle") {
      const magi = id === "magibulle";
      const gyrados = magi && P.stage > 0;
      const n = magi ? 1 + EXTRA() : 2 + (lv >= 2) + (lv >= 4) + EXTRA();
      m.t = (magi ? gyrados ? 1.1 : 2.4 : lv >= 3 ? 1.0 : 1.25) * P.cdMul;
      const dmg = magi ? (4 + 2*lv) * (lv >= 3 ? 1.4 : 1) * (gyrados ? 2.5 : 1) : 6 + 2*lv, ts = nearestFoes(magi ? n : n + 4);
      if (magi && !ts.length) { m.t = .2; continue; }
      if (magi) { P.hopAt = S.t; emit(P.x, P.y + P.r * .6, 10, "eau", { sp:110, life:.45, r:2.5 }); } // Trempette : Magicarpe bondit et éclabousse
      for (let i = 0; i < n; i++) {
        const f = magi ? ts[i % ts.length] : ts.length ? ts[Math.floor(Math.random() * ts.length)] : null;
        const a = magi ? Math.atan2(f.y - P.y, f.x - P.x) : P.aiming ? P.aimA + (Math.random() - .5) * .6 : f ? Math.atan2(f.y - P.y, f.x - P.x) + (Math.random() - .5) * .5 : Math.random() * Math.PI * 2;
        const speed = magi ? gyrados ? 190 : 65 : 230, growth = magi ? Math.min(4, Math.floor(m.untouched / 5)) : 0;
        S.shots.push({ kind:"bubble", x:P.x, y:P.y, vx:Math.cos(a)*speed, vy:Math.sin(a)*speed, r:(gyrados ? 14 : 8) + P.stage + growth * 3, grow:magi ? (gyrados ? 12 : 5) + growth * 2 : 0, dmg, life: magi ? 5 : 1.6, pierce:1, type:"eau", boom:magi, boomR:magi ? ((gyrados ? 115 : 48) + growth * 16 + Math.max(0, lv - 1) * 4) * AREA() : undefined, boomMul:gyrados ? 1 : .65, slow: magi ? lv >= 5 ? .8 : lv >= 2 ? .65 : 0 : lv >= 5 ? .8 : .6, sleepChance:magi && lv >= 5 ? .25 : 0, home:magi ? f : null, homeSpeed:magi ? gyrados ? 240 : 85 : undefined, homeTurn:magi ? gyrados ? 6 : lv >= 4 ? 3.5 : 2.5 : undefined, ph:Math.random() * 6 });
      }
    } else if (id === "vampigraine") {
      m.t = (lv >= 4 ? 1.7 : 2.2) * P.cdMul;
      const n = 1 + (lv >= 2) + (lv >= 4) + (lv >= 5 ? 2 : 0) + EXTRA(), pool = nearestFoes(30).filter(f => !(f.seedT > 0));
      for (let i = 0; i < n && pool.length; i++) {
        const f = pool.splice(Math.floor(Math.random() * Math.min(pool.length, 8)), 1)[0], a = Math.atan2(f.y - P.y, f.x - P.x);
        S.shots.push({ kind:"seed", x:P.x, y:P.y, vx:Math.cos(a)*330, vy:Math.sin(a)*330, r:6, dmg:3, life:1.4, pierce:1, type:"plante", seed:{ dps:(4 + 1.5*lv) * (lv >= 3 ? 1.4 : 1), heal:(.3 + .1*lv) * (lv >= 3 ? 1.4 : 1) } });
      }
      if (!pool.length && n) m.t = .4;
    } else if (id === "poudretoxik") {
      m.t = (lv >= 4 ? 4.5 : 6) * P.cdMul;
      S.clouds.push({ x:P.x, y:P.y, r:20, max:(100 + 16*lv) * AREA(), life:(lv >= 5 ? 3 : 2) * DUR(), max_life:(lv >= 5 ? 3 : 2) * DUR(), follow:lv >= 5, poisonT:(3 + .5*lv) * DUR(), dps:(5 + 2*lv) * (lv >= 3 ? 1.4 : 1), ph:Math.random() * 6 });
    } else if (id === "dansepetale") {
      m.t = (lv >= 4 ? 4.5 : 6) * P.cdMul;
      for (let i = 0; i < (lv >= 5 ? 2 : 1) + EXTRA(); i++) {
        const a = Math.random() * Math.PI * 2;
        S.tornados.push({ x:P.x + Math.cos(a) * 30, y:P.y + Math.sin(a) * 30, r:(48 + 9*lv) * AREA(), life:3.5 * DUR(), max:3.5 * DUR(), dmg:(12 + 4*lv) * (lv >= 3 ? 1.4 : 1), tick:0, ph:Math.random() * 6, tx:null }); // dégâts doublés (Raphaël)
      }
    } else if (id === "fouetlianes") {
      m.t = (lv >= 4 ? .65 : .9) * P.cdMul;
      const range = (95 + 14*lv) * AREA(), dmg = (13 + 4*lv) * (lv >= 3 ? 1.4 : 1);
      // vise l'ennemi le plus proche, et un second groupe derrière au niveau 5
      const near = nearestFoes(12).filter(f => Math.hypot(f.x - P.x, f.y - P.y) < range + f.r + 30);
      if (!near.length) { m.t = .15; continue; }
      const base = P.aiming ? P.aimA : Math.atan2(near[0].y - P.y, near[0].x - P.x);
      const far = near.find(f => { let d = Math.atan2(f.y - P.y, f.x - P.x) - base; d = Math.atan2(Math.sin(d), Math.cos(d)); return Math.abs(d) > 1.6; });
      const dirs = lv >= 5 && far ? [base, Math.atan2(far.y - P.y, far.x - P.x)] : [base];
      for (const b of dirs) for (const side of [-1, 1]) {
        const a = b + side * .35; S.slashes.push({ x:P.x, y:P.y, a, side, range, life:.22 });
        for (const f of S.foes) {
          const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy);
          if (d > range + f.r) continue;
          let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
          if (Math.abs(da) < .55) { hitFoe(f, dmg, "plante", dx / (d || 1) * 3, dy / (d || 1) * 3); if (!f.d.boss) { f.kbx = dx / (d || 1) * 220; f.kby = dy / (d || 1) * 220; } }
        }
      }
    } else if (id === "lanceflammes") {
      const on = (lv >= 4 ? 2 : 1.3) * DUR(), off = 1.3;
      m.burst = (m.burst ?? 0) - 0; m.t = .1;
      m.cyc = ((m.cyc ?? 0) + .1) % (on + off);
      if (m.cyc > on) continue;
      const range = (120 + 18*lv + (lv >= 4 ? 20 : 0)) * AREA(), half = lv >= 5 ? .45 : .32, dmg = (2.4 + .8*lv) * (lv >= 5 ? 1.5 : 1);
      const near = nearestFoes(1)[0];
      const a = P.aiming ? P.aimA : near && Math.hypot(near.x - P.x, near.y - P.y) < range + 60 ? Math.atan2(near.y - P.y, near.x - P.x) : Math.atan2(P.fy, P.fx);
      m.aim = a;
      for (let k = 0; k < 5; k++) { const sa = a + (Math.random() - .5) * half * 1.6, sp = range * (2.3 + Math.random()); S.flames.push({ x:P.x + Math.cos(a) * 12, y:P.y + Math.sin(a) * 12, vx:Math.cos(sa) * sp, vy:Math.sin(sa) * sp, life:.38, max:.38 }); }
      for (const f of S.foes) {
        const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy);
        if (d > range + f.r) continue;
        let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < half + f.r / Math.max(d, 1)) { hitFoe(f, dmg, "feu"); if (lv >= 3) { f.burnT = 2 * DUR(); f.burnDps = Math.max(f.burnDps || 0, 4 + lv); } }
      }
    } else if (id === "deflagration") {
      m.t = (lv >= 4 ? 4 : 5) * P.cdMul;
      const pool = nearestFoes(40), n = (lv >= 5 ? 2 : 1) + EXTRA();
      for (let i = 0; i < n && pool.length; i++) {
        // vise l'ennemi qui a le plus de voisins
        let best = pool[0], bc = -1;
        for (const f of pool.slice(0, 15)) { let c = 0; for (const g of pool) if ((g.x-f.x)**2 + (g.y-f.y)**2 < 90*90) c++; if (c > bc) { bc = c; best = f; } }
        pool.splice(pool.indexOf(best), 1);
        const a = Math.atan2(best.y - P.y, best.x - P.x), d = Math.hypot(best.x - P.x, best.y - P.y);
        S.shots.push({ kind:"blast", x:P.x, y:P.y, vx:Math.cos(a)*320, vy:Math.sin(a)*320, r:12 + P.stage*2, dmg:(30 + 10*lv) * (lv >= 3 ? 1.4 : 1), life:d / 320 + .05, pierce:1, type:"feu", boom:true, boomR:(70 + 14*lv) * AREA(), boomMul:1, burn:{ t:3, dps:6 + lv }, star:true, explodeOnEnd:true });
      }
      if (!pool.length) m.t = .5;
    } else if (id === "danseflamme") {
      m.t = .14;
      if (!P.moving) continue;
      S.patches.push({ x:P.x + (Math.random() - .5) * 8, y:P.y + P.r * .6, r:(18 + 2*lv + (lv >= 4 ? 8 : 0)) * AREA(), life:(1.6 + .4*lv) * DUR(), max:(1.6 + .4*lv) * DUR(), dmg:(3 + lv) * (lv >= 5 ? 1.6 : 1), burn: lv >= 3, ph:Math.random() * 6 });
    } else if (id === "hydrocanon") {
      const gyarados = P.line === "magicarpe" && P.stage > 0;
      const near = nearestFoes(1)[0];
      if (!near && !P.aiming) { m.t = .3; continue; }
      if (gyarados) {
        m.t = (lv >= 4 ? 4 : 4.8) * P.cdMul;
        const target = nearestFoes(1)[0], a = P.aiming ? P.aimA : target ? Math.atan2(target.y - P.y, target.x - P.x) : Math.atan2(P.fy, P.fx);
        if (lv >= 5) {
          m.spinA = a; m.spinT = 1.5; m.spinHits = new Map();
        } else {
          const len = 900, w = (34 + 4*lv) * AREA(), dmg = (40 + 8*lv) * (lv >= 3 ? 1.4 : 1);
          const ex = P.x + Math.cos(a) * len, ey = P.y + Math.sin(a) * len;
          S.beams.push({ sx:P.x, sy:P.y, ex, ey, w, life:.4 });
          for (const f of S.foes) {
            const t2 = Math.max(0, Math.min(1, ((f.x - P.x) * Math.cos(a) * len + (f.y - P.y) * Math.sin(a) * len) / (len * len)));
            const qx = P.x + Math.cos(a) * len * t2, qy = P.y + Math.sin(a) * len * t2;
            if ((f.x - qx) ** 2 + (f.y - qy) ** 2 <= (w / 2 + f.r) ** 2) hitFoe(f, dmg, "eau", Math.cos(a), Math.sin(a));
          }
        }
        S.shake = lv >= 5 ? .3 : .2;
        continue;
      }
      m.t = (lv >= 4 ? 3.2 : 4) * P.cdMul;
      const a = P.aiming ? P.aimA : Math.atan2(near.y - P.y, near.x - P.x), len = 760, w = (26 + 5*lv) * AREA(), dmg = (70 + 18*lv) * (lv >= 3 ? 1.4 : 1);
      const offs = lv >= 5 ? [-w * .5, w * .5] : [0];
      for (const o of offs) {
        const sx = P.x - Math.sin(a) * o, sy = P.y + Math.cos(a) * o, ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len;
        S.beams.push({ sx, sy, ex, ey, w, life:.4 });
        for (const f of S.foes) {
          const t2 = Math.max(0, Math.min(1, ((f.x - sx) * (ex - sx) + (f.y - sy) * (ey - sy)) / (len * len)));
          const qx = sx + (ex - sx) * t2, qy = sy + (ey - sy) * t2;
          if ((f.x - qx) ** 2 + (f.y - qy) ** 2 < (w / 2 + f.r) ** 2) { hitFoe(f, dmg, "eau", Math.cos(a) * 4, Math.sin(a) * 4); if (!f.d.boss) { f.kbx = Math.cos(a) * 260; f.kby = Math.sin(a) * 260; } }
        }
      }
      S.shake = .15;
    } else if (id === "surf") {
      m.t = (lv >= 4 ? 3.2 : 4) * P.cdMul;
      S.waves.push({ x:P.x, y:P.y, r:12, max:(100 + 18*lv + (lv >= 5 ? 40 : 0)) * AREA(), life:.65, dmg:(6 + 3*lv) * (lv >= 3 ? 1.4 : 1) * (lv >= 5 ? 1.3 : 1), push:280 + 50*lv, hit:new Set() });
    } else if (id === "eclair") {
      m.t = (lv >= 4 ? 1.45 : 1.8) * P.cdMul;
      const n = 1 + (lv >= 2) + (lv >= 4) + (lv >= 5 ? 2 : 0) + EXTRA(), dmg = (20 + 4*lv) * (lv >= 3 ? 1.4 : 1);
      const pool = nearestFoes(40);
      for (let i = 0; i < n && pool.length; i++) {
        const f = pool.splice(Math.floor(Math.random()*pool.length), 1)[0];
        S.bolts.push({ x:f.x, y:f.y, life:.18 }); emit(f.x, f.y, 10, "electrik", { sp:260, life:.3 });
        for (const g of S.foes) if ((g.x-f.x)**2 + (g.y-f.y)**2 < (34 * AREA())**2) hitFoe(g, dmg, "electrik");
      }
      if (!pool.length && n) m.t = .3;
    }
  }
  tagNew(); srcLens = null;
  HIT_SRC = "feufollet";
  const wisp = P.moves.feufollet;
  if (wisp) {
    const lv = wisp.lv, n = 2 + (lv >= 2) + (lv >= 4) + EXTRA(), burn = { t:4 * DUR(), dps:(6 + 2*lv) * (lv >= 3 ? 1.4 : 1) };
    wisp.list = wisp.list || [];
    while (wisp.list.length < n) wisp.list.push({ x:P.x, y:P.y, st:"orbit", cd:Math.random(), tgt:null });
    wisp.list.forEach((w, i) => {
      const oa = S.t * 2.2 + i / n * Math.PI * 2, ox = P.x + Math.cos(oa) * 58, oy = P.y + Math.sin(oa) * 46 - 10;
      if (w.st === "orbit") {
        w.x += (ox - w.x) * Math.min(1, dt * 10); w.y += (oy - w.y) * Math.min(1, dt * 10); w.cd -= dt;
        if (w.cd <= 0) { const f = nearestFoes(6).filter(f => !(f.burnT > 1) && Math.hypot(f.x - P.x, f.y - P.y) < 280)[i % 3] || nearestFoes(1).find(f => Math.hypot(f.x - P.x, f.y - P.y) < 280); if (f) { w.st = "go"; w.tgt = f; } else w.cd = .3; }
      } else if (w.st === "go") {
        const f = w.tgt; if (!f || f.hp <= 0) { w.st = "back"; return; }
        const dx = f.x - w.x, dy = f.y - w.y, d = Math.hypot(dx, dy) || 1;
        w.x += dx / d * Math.min(d, 400 * PSPD() * dt); w.y += dy / d * Math.min(d, 400 * PSPD() * dt);
        if (d < f.r + 6) {
          hitFoe(f, 6 + 2*lv, "feu"); f.burnT = burn.t; f.burnDps = Math.max(f.burnDps || 0, burn.dps);
          if (lv >= 5) for (const g of S.foes) if (g !== f && (g.x-f.x)**2 + (g.y-f.y)**2 < (60 * AREA())**2) { g.burnT = burn.t; g.burnDps = Math.max(g.burnDps || 0, burn.dps * .7); }
          S.fxs.push({ x:f.x, y:f.y, r:0, max:f.r * 1.4, life:.2, col:"rgba(120,160,255," });
          // la flamme se consume au contact, puis renaît auprès du joueur après une recharge
          w.st = "gone"; w.cd = (lv >= 4 ? 2.2 : 3) * P.cdMul;
        }
      } else if (w.st === "gone") {
        w.cd -= dt;
        if (w.cd <= 0) { w.st = "orbit"; w.cd = .3; w.x = ox; w.y = oy; S.fxs.push({ x:ox, y:oy, r:0, max:16, life:.2, col:"rgba(120,160,255," }); }
      } else {
        const dx = ox - w.x, dy = oy - w.y, d = Math.hypot(dx, dy) || 1;
        w.x += dx / d * Math.min(d, 420 * PSPD() * dt); w.y += dy / d * Math.min(d, 420 * PSPD() * dt);
        if (d < 8) { w.st = "orbit"; w.cd = (lv >= 4 ? .9 : 1.4) * P.cdMul; }
      }
    });
  }
  HIT_SRC = "siphon";
  const sip = P.moves.siphon;
  if (sip) {
    const lv = sip.lv; sip.rad = (70 + 14*lv + (lv >= 5 ? 30 : 0)) * AREA(); sip.tick = (sip.tick ?? 0) - dt;
    const dmg = (4 + 2*lv) * (lv >= 4 ? 1.4 : 1), hitNow = sip.tick <= 0;
    if (hitNow) sip.tick = lv >= 5 ? .35 : .5;
    for (const f of S.foes) {
      const dx = P.x - f.x, dy = P.y - f.y, d2 = dx*dx + dy*dy;
      if (d2 > (sip.rad + f.r) ** 2) continue;
      if (hitNow) hitFoe(f, dmg, "eau");
      if (lv >= 3 && !f.d.boss) { const d = Math.sqrt(d2) || 1; f.x += dx / d * 30 * dt + dy / d * 40 * dt; f.y += dy / d * 30 * dt - dx / d * 40 * dt; }
    }
  }
  HIT_SRC = "fatalfoudre";
  const ff = P.moves.fatalfoudre;
  if (ff?.storm > 0) {
    ff.storm -= dt; ff.tk -= dt;
    if (ff.tk <= 0) {
      ff.tk = .4; const lv = ff.lv, rad = (50 + 6*lv + (lv >= 2 ? 10 : 0)) * AREA(), dmg = (10 + 4*lv) * (lv >= 3 ? 1.4 : 1); // affaibli pour rester au niveau de Déflagration
      const pool = nearestFoes(30).filter(f => Math.hypot(f.x - P.x, f.y - P.y) < 420);
      if (!pool.length) pool.push(...S.foes.filter(g => g.prop && g.hp > 0 && Math.hypot(g.x - P.x, g.y - P.y) < 420)); // sans ennemi : vise les arbres à baies
      const f = pool[Math.floor(Math.random() * pool.length)];
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 340, x = f ? f.x : P.x + Math.cos(a) * d, y = f ? f.y : P.y + Math.sin(a) * d;
      S.bolts.push({ x, y, life:.18, big:rad }); emit(x, y, 22, "electrik", { sp:rad * 5, life:.4, r:3 });
      for (const g of S.foes) if ((g.x - x) ** 2 + (g.y - y) ** 2 < (rad + g.r) ** 2) hitFoe(g, dmg, "electrik");
      S.shake = Math.max(S.shake, .06);
    }
  }
  HIT_SRC = "combogriffe";
  const cg = P.moves.combogriffe;
  if (cg) {
    const lv = cg.lv, range = (58 + 5*lv + (lv >= 5 ? 14 : 0)) * AREA();
    if (!cg.hits) {
      if (cg.t <= 0) {
        const near = nearestFoes(1)[0];
        if (!near || Math.hypot(near.x - P.x, near.y - P.y) > range + near.r + 40) cg.t = .12;
        else { const max = lv >= 4 ? 5 : lv >= 2 ? 4 : 3; cg.hits = lv >= 5 ? 5 : 2 + Math.floor(Math.random() * (max - 1)); cg.k = 0; cg.ht = 0; cg.t = (lv >= 4 ? .75 : 1) * P.cdMul; }
      }
    } else if ((cg.ht -= dt) <= 0) {
      cg.ht = lv >= 4 ? .08 : .1;
      const near = nearestFoes(1)[0];
      const a = P.aiming ? P.aimA : near ? Math.atan2(near.y - P.y, near.x - P.x) : Math.atan2(P.fy, P.fx);
      const dmg = (6 + 2*lv) * (lv >= 3 ? 1.3 : 1) * Math.pow(1.15, cg.k), side = cg.k % 2 ? 1 : -1;
      S.claws.push({ a, side, range, life:.16, big:cg.k === cg.hits - 1 });
      for (const f of S.foes) {
        const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy);
        if (d > range + f.r) continue;
        let da = Math.atan2(dy, dx) - a; da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < .75) hitFoe(f, dmg, "normal", dx / (d || 1) * 2, dy / (d || 1) * 2);
      }
      if (++cg.k >= cg.hits) cg.hits = 0;
    }
  }
  HIT_SRC = "cascade";
  const ca = P.moves.cascade;
  if (ca?.hit && P.dashBy === "cascade") {
    if (P.dashT > 0) {
      const dmg = (16 + 5*ca.lv) * (ca.lv >= 3 ? 1.4 : 1), l = Math.hypot(P.dvx, P.dvy) || 1;
      for (const f of S.foes) if (!ca.hit.has(f) && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (f.r + P.r + 18) ** 2) {
        ca.hit.add(f); hitFoe(f, dmg, "eau");
        if (!f.d.boss) { const sx = f.x - P.x, sy = f.y - P.y, side = (sx * -P.dvy + sy * P.dvx) > 0 ? 1 : -1; f.kbx = -P.dvy / l * 320 * side + P.dvx / l * 120; f.kby = P.dvx / l * 320 * side + P.dvy / l * 120; }
      }
      if (Math.random() < .7) S.fxs.push({ x:P.x + (Math.random() - .5) * 26, y:P.y + (Math.random() - .5) * 26, r:0, max:7 + Math.random() * 6, life:.3, col:"rgba(120,190,255," });
    } else if (ca.splash) {
      ca.splash = false; ca.hit = null;
      S.waves.push({ x:P.x, y:P.y, r:12, max:120 * AREA(), life:.5, dmg:20, push:300, hit:new Set(), src:"cascade" });
    } else ca.hit = null;
  }
  // Lance-Soleil : charge puis rayon
  HIT_SRC = "lancesoleil";
  for (const sn of S.suns) {
    if (sn.o && sn.o !== P) continue;
    sn.t -= dt; if (sn.t > 0) continue;
    const near = nearestFoes(1)[0], a0 = P.aiming || !near ? Math.atan2(P.fy, P.fx) : Math.atan2(near.y - P.y, near.x - P.x);
    const lv = sn.lv, len = 900, w = (34 + 7*lv) * AREA(), dmg = (85 + 20*lv) * (lv >= 3 ? 1.4 : 1);
    for (const a of lv >= 5 ? [a0 - .22, a0 + .22] : [a0]) {
      const sx = P.x, sy = P.y, ex = sx + Math.cos(a) * len, ey = sy + Math.sin(a) * len;
      S.sunbeams.push({ sx, sy, ex, ey, w, life:.5 });
      for (const f of S.foes) {
        const t2 = Math.max(0, Math.min(1, ((f.x - sx) * (ex - sx) + (f.y - sy) * (ey - sy)) / (len * len)));
        const qx = sx + (ex - sx) * t2, qy = sy + (ey - sy) * t2;
        if ((f.x - qx) ** 2 + (f.y - qy) ** 2 < (w / 2 + f.r) ** 2) hitFoe(f, dmg, "plante", Math.cos(a) * 2, Math.sin(a) * 2);
      }
    }
    S.shake = Math.max(S.shake, .12);
  }
  S.suns = S.suns.filter(sn => sn.t > 0);
  // Danse Draco : bonus temporaire (+ aura au niveau 5)
  HIT_SRC = "dansedraco";
  if (P.dracoT > 0) {
    P.dracoT -= dt;
    if (P.dracoLv >= 5 && (P.dracoTick = (P.dracoTick || 0) - dt) <= 0) {
      P.dracoTick = .5;
      for (const f of S.foes) if ((f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (P.r + 55 + f.r) ** 2) hitFoe(f, 10, "dragon");
    }
  }
  HIT_SRC = "viveattaque";
  const va = P.moves.viveattaque;
  if (va?.hit && P.dashT > 0 && P.dashBy === "viveattaque") {
    const dmg = (12 + 4*va.lv) * (va.lv >= 3 ? 1.4 : 1);
    for (const f of S.foes) if (!va.hit.has(f) && (f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (f.r + P.r + 12) ** 2) { va.hit.add(f); hitFoe(f, dmg, "normal", P.dvx / 900, P.dvy / 900); if (va.lv >= 5) f.stunT = 1; }
  }
  HIT_SRC = "tranchherbe";
  const leaf = P.moves.tranchherbe;
  if (leaf) {
    const lv = leaf.lv, n = 2 + (lv >= 2) + (lv >= 4) + (lv >= 5 ? 2 : 0) + EXTRA(), rad = ((lv >= 3 ? 56 : 46) + P.stage * 6) * AREA(); // orbite serrée : touche aussi les ennemis collés à toi
    const spd = (lv >= 4 ? 3.8 : 3) * PSPD(), dmg = (11 + 2*lv) * (lv >= 3 ? 1.4 : 1); // même base que Flammèche
    leaf.pts = [];
    // ennemi collé à toi (à l'intérieur de l'orbite) : touché à chaque passage de feuille
    const passT = Math.PI * 2 / (spd * n);
    if (!(leaf.inT > S.t)) { leaf.inT = S.t + passT; for (const f of nearestFoes(2)) if ((f.x - P.x) ** 2 + (f.y - P.y) ** 2 < (rad * .7) ** 2) { f.leafT = S.t + .45; hitFoe(f, dmg, "plante"); } }
    for (let i = 0; i < n; i++) {
      const a = S.t * spd + i / n * Math.PI * 2;
      const lx = P.x + Math.cos(a) * rad, ly = P.y + Math.sin(a) * rad;
      leaf.pts.push([lx, ly, a]);
      for (const f of S.foes) {
        if (f.leafT > S.t) continue;
        if ((f.x-lx)**2 + (f.y-ly)**2 < (f.r + 13)**2) { f.leafT = S.t + .45; hitFoe(f, dmg, "plante", Math.cos(a+1.57) * .3, Math.sin(a+1.57) * .3); }
      }
    }
  }
}
