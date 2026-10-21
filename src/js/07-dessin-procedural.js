/* ---------- Dessin procédural des Pokémon ---------- */
function circ(c, x, y, r, f) { c.beginPath(); c.arc(x, y, r, 0, Math.PI*2); c.fillStyle = f; c.fill(); }
const GLOW = {};
function glowImg(col) { // halo radial pré-rendu, une fois par couleur "r,g,b"
  if (GLOW[col]) return GLOW[col];
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(.3, `rgba(${col},.55)`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return GLOW[col] = c;
}
function glow(x, y, r, col, a = 1) { if (a <= 0 || r <= 0) return; cx.globalAlpha = Math.min(1, a); cx.drawImage(glowImg(col), x - r, y - r, r * 2, r * 2); cx.globalAlpha = 1; }
function flameShape(x, y, w, h, col, sway = 0) {
  cx.beginPath(); cx.moveTo(x, y + h * .3);
  cx.bezierCurveTo(x - w * 1.1, y + h * .25, x - w * .8, y - h * .35, x + sway, y - h);
  cx.bezierCurveTo(x + w * .8, y - h * .35, x + w * 1.1, y + h * .25, x, y + h * .3);
  cx.fillStyle = col; cx.fill();
}
const PART_COL = { feu:["255,120,40","255,220,120"], eau:["80,150,240","210,240,255"], plante:["100,200,70","210,255,160"], electrik:["250,210,50","255,255,200"],
  poison:["180,80,200","240,170,250"], dragon:["130,100,250","215,205,255"], fee:["245,140,200","255,225,245"], normal:["230,220,190","255,255,255"],
  spectre:["150,100,230","220,190,255"], sol:["200,160,100","240,220,180"], glace:["150,220,255","235,250,255"], psy:["240,90,150","255,200,225"],
  acier:["170,180,195","235,240,250"], combat:["200,80,60","255,190,160"], roche:["180,160,110","230,215,180"], tenebres:["70,40,80","170,130,190"] };
function emit(x, y, n, type, o = {}) {
  if (!S || S.parts.length > 650) return;
  const [c1, c2] = PART_COL[type] || PART_COL.normal;
  for (let i = 0; i < n; i++) {
    const a = o.a != null ? o.a + (Math.random() - .5) * (o.spread ?? 1) : Math.random() * Math.PI * 2, sp = (o.sp ?? 150) * (.4 + Math.random() * .8), life = (o.life ?? .35) * (.6 + Math.random() * .7);
    S.parts.push({ x:x + (Math.random() - .5) * (o.jit || 0), y:y + (Math.random() - .5) * (o.jit || 0), vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - (o.up || 0), life, max:life, r:(o.r ?? 2.6) * (.6 + Math.random() * .8), col:Math.random() < .35 ? c2 : c1, g:o.g || 0 });
  }
}
function ell(c, x, y, rx, ry, f, rot = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI*2); c.fillStyle = f; c.fill(); }
function poly(c, pts, f) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i+1]); c.closePath(); c.fillStyle = f; c.fill(); }
function eyes(c, x, y, s, look = 1, angry = false) {
  for (const dx of [0, s * 2.3]) {
    ell(c, x + dx, y, s * .8, s, "#fff");
    circ(c, x + dx + s * .25 * look, y + s * .1, s * .5, "#1b1b22");
    circ(c, x + dx + s * .1, y - s * .35, s * .18, "#fff");
  }
  if (angry) { c.strokeStyle = "#2a2220"; c.lineWidth = s * .45; c.beginPath(); c.moveTo(x - s*.8, y - s*1.4); c.lineTo(x + s*.8, y - s*.8); c.moveTo(x + s*1.5, y - s*.8); c.lineTo(x + s*3.1, y - s*1.4); c.stroke(); }
}
function flame(c, x, y, s, t) {
  const f = 1 + Math.sin(t * 22) * .12 + Math.sin(t * 13) * .08;
  ell(c, x, y - s * .3 * f, s * .7, s * 1.1 * f, "#e2513f");
  ell(c, x, y - s * .2 * f, s * .5, s * .8 * f, "#f6a23a");
  ell(c, x, y, s * .28, s * .45 * f, "#fff2a0");
}

const DRAW = {
  feu(c, r, t, st) {
    const col = ["#f2873a", "#de4f37", "#f08a30"][st];
    if (st === 2) {
      const fl = Math.sin(t * 9) * .15;
      poly(c, [-r*.1, -r*.2, -r*1.3, -r*1.45 - fl*r, -r*1.5, -r*.3], "#2f8a9a");
      poly(c, [ r*.1, -r*.2, -r*.4, -r*1.7 + fl*r, -r*.95, -r*.4], "#3aa0b0");
    }
    c.strokeStyle = col; c.lineWidth = r * .28; c.lineCap = "round";
    c.beginPath(); c.moveTo(-r*.4, r*.45); c.quadraticCurveTo(-r*1.2, r*.6, -r*1.15, -r*.1); c.stroke();
    flame(c, -r*1.15, -r*.25, r * (.32 + st * .08), t);
    ell(c, 0, r*.3, r*.7, r*.68, col);
    ell(c, r*.15, r*.42, r*.38, r*.42, "#f6d98a");
    circ(c, r*.22, -r*.42, r*.58, col);
    if (st === 1) poly(c, [-r*.15, -r*.75, -r*.7, -r*.85, -r*.3, -r*.45], col);
    if (st === 2) { poly(c, [-r*.1, -r*.8, -r*.45, -r*1.2, -r*.05, -r*.95], col); poly(c, [r*.15, -r*.9, -r*.05, -r*1.3, r*.3, -r*1], col); }
    eyes(c, r*.18, -r*.5, r*.13, 1);
    circ(c, -r*.25, r*.95, r*.17, col); circ(c, r*.5, r*.95, r*.17, col);
  },
  eau(c, r, t, st) {
    const col = ["#86c8ec", "#5f92da", "#4a73c4"][st];
    if (st === 1) { for (let i = 0; i < 4; i++) circ(c, -r*1.0 - i*r*.12, r*.1 - i*r*.18 + Math.sin(t*6+i)*r*.04, r*(.35 - i*.03), "#eef3ff"); }
    else if (st === 0) { c.strokeStyle = col; c.lineWidth = r*.22; c.beginPath(); c.arc(-r*1.0, r*.25, r*.22, 0, Math.PI*1.6); c.stroke(); }
    ell(c, -r*.15, r*.2, r*.85, r*.8, "#a8662a");
    ell(c, -r*.15, r*.2, r*.72, r*.67, "#c88a45");
    c.strokeStyle = "#8a5220"; c.lineWidth = r*.07;
    c.beginPath(); c.moveTo(-r*.6, r*.2); c.lineTo(r*.3, r*.2); c.moveTo(-r*.15, -r*.4); c.lineTo(-r*.15, r*.8); c.stroke();
    if (st === 2) { for (const dy of [-r*.35, r*.0]) { c.fillStyle = "#9aa3ae"; c.fillRect(-r*.3, dy - r*.55, r*.95, r*.24); c.fillStyle = "#6a7480"; c.fillRect(r*.55, dy - r*.58, r*.14, r*.3); } }
    ell(c, r*.35, r*.35, r*.42, r*.5, "#f2e2a6");
    circ(c, r*.3, -r*.45, r*.56, col);
    if (st === 1) { poly(c, [r*.0, -r*.7, -r*.45, -r*1.15, -r*.1, -r*.45], "#eef3ff"); }
    eyes(c, r*.25, -r*.52, r*.13, 1);
    circ(c, r*.75, r*.25, r*.17, col); circ(c, r*.05, r*.95, r*.17, col); circ(c, r*.6, r*.95, r*.17, col);
  },
  plante(c, r, t, st) {
    const col = ["#6cc6a8", "#5fb59a", "#4e9e88"][st];
    if (st === 0) { ell(c, -r*.3, -r*.25, r*.55, r*.5, "#3f9a4c"); ell(c, -r*.38, -r*.32, r*.3, r*.28, "#5ab865"); }
    else if (st === 1) {
      for (const a of [-2.4, -1.6, -.8]) ell(c, -r*.3 + Math.cos(a)*r*.55, -r*.15 + Math.sin(a)*r*.45, r*.45, r*.18, "#2f8a3e", a);
      ell(c, -r*.3, -r*.55, r*.38, r*.5, "#e57aa0"); ell(c, -r*.3, -r*.85, r*.18, r*.15, "#c54f7c");
    } else {
      for (const a of [-2.8, -2.0, -1.2, -.4]) ell(c, -r*.3 + Math.cos(a)*r*.85, -r*.1 + Math.sin(a)*r*.6, r*.6, r*.22, "#2f8a3e", a);
      const sw = Math.sin(t*2)*.05;
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI*2 + sw; ell(c, -r*.3 + Math.cos(a)*r*.5, -r*.75 + Math.sin(a)*r*.32, r*.42, r*.24, "#e9606a", a); }
      circ(c, -r*.3, -r*.75, r*.22, "#f4d04a");
    }
    ell(c, 0, r*.3, r*.85, r*.55, col);
    ell(c, -r*.35, r*.15, r*.14, r*.1, "#3d8a75"); ell(c, -r*.0, r*.45, r*.12, r*.09, "#3d8a75");
    circ(c, r*.55, -r*.05, r*.52, col);
    poly(c, [r*.2, -r*.35, r*.25, -r*.75, r*.45, -r*.48], col); poly(c, [r*.7, -r*.45, r*.95, -r*.75, r*.95, -r*.35], col);
    eyes(c, r*.42, -r*.1, r*.12, 1);
    for (const fx of [-r*.55, -r*.15, r*.25, r*.6]) ell(c, fx, r*.8, r*.15, r*.11, col);
  },
  rattata(c, r, t) {
    c.strokeStyle = "#7a4e98"; c.lineWidth = r*.12; c.beginPath(); c.moveTo(-r*.8, r*.2); c.quadraticCurveTo(-r*1.6, r*.0 + Math.sin(t*10)*r*.3, -r*1.3, -r*.6); c.stroke();
    ell(c, 0, r*.15, r*.9, r*.7, "#9a6ac0"); ell(c, r*.2, r*.35, r*.45, r*.38, "#f0dcae");
    circ(c, -r*.05, -r*.75, r*.38, "#9a6ac0"); circ(c, -r*.05, -r*.75, r*.22, "#e8a8c8");
    circ(c, r*.6, -r*.75, r*.38, "#9a6ac0"); circ(c, r*.6, -r*.75, r*.22, "#e8a8c8");
    eyes(c, r*.2, -r*.2, r*.14, 1);
    c.fillStyle = "#fff"; c.fillRect(r*.55, r*.15, r*.12, r*.2);
    c.strokeStyle = "#2a2a2a"; c.lineWidth = 1; c.beginPath(); c.moveTo(r*.8, r*.0); c.lineTo(r*1.25, -r*.15); c.moveTo(r*.8, r*.1); c.lineTo(r*1.25, r*.15); c.stroke();
  },
  chenipan(c, r, t) {
    const w = Math.sin(t*8)*r*.08;
    circ(c, -r*.95, r*.35 + w, r*.38, "#6aae40"); circ(c, -r*.45, r*.25 - w, r*.5, "#7cc04a");
    c.strokeStyle = "#e2513f"; c.lineWidth = r*.12; c.beginPath(); c.moveTo(r*.25, -r*.6); c.lineTo(r*.25, -r*1.05); c.lineTo(r*.0, -r*1.3); c.moveTo(r*.25, -r*1.05); c.lineTo(r*.5, -r*1.3); c.stroke();
    circ(c, r*.3, -r*.05, r*.72, "#7cc04a");
    ell(c, r*.65, r*.25, r*.3, r*.24, "#f2dc7a");
    eyes(c, r*.05, -r*.25, r*.15, 1);
  },
  aspicot(c, r, t) {
    const w = Math.sin(t*8)*r*.08;
    poly(c, [-r*1.5, r*.4, -r*1.05, r*.15, -r*1.05, r*.6], "#cfcfcf");
    circ(c, -r*.9, r*.35 + w, r*.36, "#d8a040"); circ(c, -r*.4, r*.25 - w, r*.48, "#e0aa48");
    circ(c, r*.3, -r*.05, r*.68, "#d8a040");
    poly(c, [r*.1, -r*.6, r*.3, -r*1.3, r*.5, -r*.6], "#cfcfcf");
    circ(c, r*.85, r*.12, r*.22, "#e88aa0");
    eyes(c, r*.05, -r*.2, r*.13, 1);
  },
  roucool(c, r, t) { bird(c, r, t, 0); },
  roucoups(c, r, t) { bird(c, r, t, 1); },
  roucarnage(c, r, t) { bird(c, r, t, 2); },
  chrysacier(c, r, t) { cocoon(c, r, t, "#7cbf48", "#5a9a34"); },
  coconfort(c, r, t) { cocoon(c, r, t, "#e2c040", "#b8962a"); },
  papilusion(c, r, t) {
    const f = Math.abs(Math.sin(t*12));
    for (const sgn of [-1, 1]) {
      c.save(); c.scale(1, 1); c.translate(sgn*r*.2, 0); c.scale(sgn*(.35 + .65*f), 1);
      ell(c, r*.75, -r*.45, r*.75, r*.55, "#f6f4fa", -.3); ell(c, r*.6, r*.45, r*.55, r*.4, "#f6f4fa", .3);
      c.strokeStyle = "#2a2a3a"; c.lineWidth = r*.07; c.beginPath(); c.moveTo(0, 0); c.lineTo(r*1.3, -r*.7); c.moveTo(0, 0); c.lineTo(r*1.0, r*.6); c.stroke();
      circ(c, r*1.35, -r*.75, r*.12, "#2a2a3a");
      c.restore();
    }
    ell(c, 0, r*.1, r*.32, r*.55, "#5a4a9a"); circ(c, r*.1, -r*.45, r*.38, "#5a4a9a");
    circ(c, -r*.05, -r*.48, r*.17, "#d8303a"); circ(c, r*.3, -r*.48, r*.17, "#d8303a");
    c.strokeStyle = "#2a2a3a"; c.lineWidth = r*.05; c.beginPath(); c.moveTo(r*.0, -r*.8); c.lineTo(-r*.15, -r*1.2); c.moveTo(r*.25, -r*.8); c.lineTo(r*.35, -r*1.2); c.stroke();
    ell(c, r*.1, r*.55, r*.18, r*.12, "#5fa8a8");
  },
  dardargnan(c, r, t) {
    const f = Math.sin(t*30)*.4;
    ell(c, -r*.35, -r*.6, r*.6, r*.3, "rgba(220,235,255,.7)", -.5 + f); ell(c, r*.1, -r*.7, r*.55, r*.25, "rgba(220,235,255,.7)", -1 - f);
    ell(c, -r*.55, r*.35, r*.5, r*.42, "#e8c43a"); c.fillStyle = "#2a2a2a"; c.fillRect(-r*.7, r*.2, r*.12, r*.32); c.fillRect(-r*.4, r*.15, r*.12, r*.4);
    poly(c, [-r*1.0, r*.45, -r*1.5, r*.7, -r*.95, r*.6], "#e9e9e9");
    ell(c, r*.05, r*.1, r*.32, r*.42, "#2a2a2a");
    circ(c, r*.35, -r*.3, r*.42, "#e8c43a");
    circ(c, r*.3, -r*.32, r*.14, "#d8303a"); circ(c, r*.6, -r*.32, r*.14, "#d8303a");
    c.strokeStyle = "#2a2a2a"; c.lineWidth = r*.05; c.beginPath(); c.moveTo(r*.3, -r*.7); c.lineTo(r*.2, -r*1.05); c.moveTo(r*.5, -r*.7); c.lineTo(r*.6, -r*1.05); c.stroke();
    poly(c, [r*.3, r*.15, r*1.25, r*.05, r*.4, r*.45], "#d4d4d4"); poly(c, [r*.1, r*.3, r*1.0, r*.65, r*.15, r*.6], "#bdbdbd");
  },
  pikachu(c, r, t) {
    c.strokeStyle = "#8a5a2a"; c.lineWidth = r*.18; c.beginPath(); c.moveTo(-r*.6, r*.4); c.lineTo(-r*.9, r*.1); c.stroke();
    poly(c, [-r*.9, r*.15, -r*1.3, -r*.15, -r*1.05, -r*.3, -r*1.45, -r*.75, -r*.85, -r*.5, -r*1.0, -r*.35, -r*.75, -r*.05], "#f6d13a");
    ell(c, 0, r*.35, r*.65, r*.6, "#f6d13a");
    for (const [ex, a] of [[-r*.1, -.35], [r*.55, .25]]) { c.save(); c.translate(ex, -r*.75); c.rotate(a); ell(c, 0, -r*.45, r*.17, r*.5, "#f6d13a"); ell(c, 0, -r*.78, r*.13, r*.2, "#2a2a2a"); c.restore(); }
    circ(c, r*.2, -r*.35, r*.55, "#f6d13a");
    eyes(c, r*.1, -r*.45, r*.12, 1);
    circ(c, r*.0, -r*.15, r*.13, "#e2513f"); circ(c, r*.65, -r*.15, r*.13, "#e2513f");
    c.fillStyle = "#8a5a2a"; c.fillRect(-r*.45, r*.2, r*.25, r*.07); c.fillRect(-r*.45, r*.35, r*.25, r*.07);
  },
  pichu(c, r, t) { DRAW.pikachu(c, r * .85, t); },
  raichu(c, r, t) {
    c.strokeStyle = "#2a2a2a"; c.lineWidth = r*.08; c.beginPath(); c.moveTo(-r*.5, r*.6); c.quadraticCurveTo(-r*1.4, r*.6, -r*1.3, -r*.5); c.stroke();
    poly(c, [-r*1.3, -r*.5, -r*1.6, -r*.85, -r*1.3, -r*.8, -r*1.45, -r*1.15, -r*1.05, -r*.7, -r*1.25, -r*.72], "#f6d13a");
    ell(c, 0, r*.35, r*.7, r*.65, "#e8963a"); ell(c, r*.15, r*.45, r*.38, r*.42, "#f4e2b8");
    for (const [ex, a] of [[-r*.15, -.6], [r*.6, .5]]) { c.save(); c.translate(ex, -r*.8); c.rotate(a); ell(c, 0, -r*.3, r*.25, r*.4, "#e8963a"); ell(c, 0, -r*.3, r*.13, r*.25, "#7a4a2a"); c.restore(); }
    circ(c, r*.2, -r*.38, r*.58, "#e8963a");
    eyes(c, r*.08, -r*.48, r*.12, 1);
    circ(c, -r*.05, -r*.15, r*.14, "#f6d13a"); circ(c, r*.7, -r*.15, r*.14, "#f6d13a");
  },
  nosferapti(c, r, t) {
    const f = Math.sin(t*20)*r*.35;
    poly(c, [0, 0, -r*1.7, -r*.6 - f, -r*1.2, r*.5], "#a070d0");
    poly(c, [0, 0, r*1.7, -r*.6 - f, r*1.2, r*.5], "#a070d0");
    circ(c, 0, 0, r*.65, "#4a7ac8");
    poly(c, [-r*.5, -r*.3, -r*.6, -r*1.1, -r*.15, -r*.55], "#4a7ac8"); poly(c, [r*.5, -r*.3, r*.6, -r*1.1, r*.15, -r*.55], "#4a7ac8");
    ell(c, 0, r*.15, r*.35, r*.28, "#2a1830"); c.fillStyle = "#fff"; c.fillRect(-r*.2, -r*.08, r*.1, r*.14); c.fillRect(r*.1, -r*.08, r*.1, r*.14);
  },
  abo(c, r, t) {
    for (let i = 5; i >= 0; i--) {
      const x = -i * r * .42, y = Math.sin(t*6 - i*.9) * r * .35 + r*.2;
      circ(c, x, y, r * (.42 - i*.03), i === 3 ? "#e8d050" : "#a050a0");
    }
    c.fillStyle = "#e8d050"; c.fillRect(-r*2.35, r*.15 + Math.sin(t*6 - 5.4)*r*.35, r*.2, r*.15);
    circ(c, r*.3, -r*.15, r*.55, "#a050a0");
    eyes(c, r*.15, -r*.3, r*.12, 1, true);
    c.strokeStyle = "#e2513f"; c.lineWidth = r*.07; c.beginPath(); c.moveTo(r*.8, r*.05); c.lineTo(r*1.1, r*.05 + Math.sin(t*15)*r*.1); c.stroke();
  },
  racaillou(c, r, t) {
    const sw = Math.sin(t*5)*r*.15;
    circ(c, -r*1.05, r*.1 + sw, r*.33, "#857a64"); circ(c, r*1.05, r*.1 - sw, r*.33, "#857a64");
    circ(c, 0, 0, r*.85, "#9a9078");
    ell(c, -r*.35, -r*.4, r*.2, r*.13, "#b2a990"); ell(c, r*.4, r*.45, r*.15, r*.1, "#7d7360");
    c.strokeStyle = "#6c624e"; c.lineWidth = r*.06; c.beginPath(); c.moveTo(-r*.6, r*.3); c.lineTo(-r*.3, r*.5); c.lineTo(-r*.35, r*.7); c.stroke();
    eyes(c, -r*.25, -r*.05, r*.13, 1, true);
    c.strokeStyle = "#2a2220"; c.lineWidth = r*.07; c.beginPath(); c.arc(r*.0, r*.45, r*.18, Math.PI*1.15, Math.PI*1.85); c.stroke();
  },
  ronflex(c, r, t) {
    const b = Math.sin(t*2)*r*.03;
    ell(c, 0, r*.1 + b, r*.95, r*.9, "#2f6a78");
    ell(c, 0, r*.3 + b, r*.68, r*.62, "#f0e2c0");
    circ(c, 0, -r*.62, r*.5, "#2f6a78"); ell(c, 0, -r*.5, r*.36, r*.3, "#f0e2c0");
    poly(c, [-r*.4, -r*.85, -r*.35, -r*1.15, -r*.15, -r*.95], "#2f6a78"); poly(c, [r*.4, -r*.85, r*.35, -r*1.15, r*.15, -r*.95], "#2f6a78");
    c.strokeStyle = "#1b2a2e"; c.lineWidth = r*.04; c.beginPath(); c.moveTo(-r*.22, -r*.6); c.lineTo(-r*.08, -r*.6); c.moveTo(r*.08, -r*.6); c.lineTo(r*.22, -r*.6); c.moveTo(-r*.15, -r*.4); c.lineTo(r*.15, -r*.4); c.stroke();
    c.fillStyle = "#fff"; c.fillRect(-r*.13, -r*.44, r*.05, r*.05); c.fillRect(r*.08, -r*.44, r*.05, r*.05);
    ell(c, -r*.8, r*.25 + b, r*.2, r*.3, "#2f6a78"); ell(c, r*.8, r*.25 + b, r*.2, r*.3, "#2f6a78");
    ell(c, -r*.45, r*.95, r*.25, r*.14, "#f0e2c0"); ell(c, r*.45, r*.95, r*.25, r*.14, "#f0e2c0");
  },
  onix(c, r, t) {
    poly(c, [r*.1, -r*.7, r*.0, -r*1.4, r*.45, -r*.75], "#7a7468");
    circ(c, 0, 0, r*.85, "#a49c8a"); ell(c, -r*.3, -r*.3, r*.25, r*.15, "#c2baa6");
    eyes(c, -r*.1, -r*.1, r*.13, 1, true);
    c.strokeStyle = "#5a5446"; c.lineWidth = r*.06; c.beginPath(); c.moveTo(r*.2, r*.45); c.lineTo(r*.75, r*.3); c.stroke();
  },
};
function bird(c, r, t, st) {
  const f = Math.sin(t*18)*.5, body = ["#b88a50", "#b07a42", "#c48a50"][st];
  ell(c, -r*.5, -r*.1, r*(.8 + st*.15), r*.35, "#8a6234", -.6 - f);
  poly(c, [-r*.8, r*.4, -r*(1.4 + st*.25), r*.6, -r*(1.3 + st*.2), r*.1], st ? "#c8503a" : "#6e4a24");
  circ(c, 0, r*.1, r*.85, body); ell(c, r*.3, r*.25, r*.5, r*.55, "#f0dcb0");
  if (st === 0) poly(c, [-r*.1, -r*.7, r*.1, -r*1.25, r*.35, -r*.7], body);
  else if (st === 1) { poly(c, [-r*.2, -r*.6, -r*.5, -r*1.4, r*.0, -r*.9], "#e2513f"); poly(c, [-r*.05, -r*.7, -r*.2, -r*1.5, r*.25, -r*.8], "#f6c845"); }
  else { const w = Math.sin(t*4)*r*.1; poly(c, [r*.1, -r*.7, -r*1.5, -r*1.4 + w, -r*1.2, -r*.9, -r*.6, -r*.65], "#e2513f"); poly(c, [r*.2, -r*.75, -r*1.1, -r*1.25 + w, -r*.4, -r*.75], "#f6c845"); }
  eyes(c, r*.15, -r*.2, r*.13, 1, st > 0);
  poly(c, [r*.75, -r*.05, r*(1.15 + st*.1), r*.05, r*.75, r*.2], st ? "#d88a8a" : "#7a6a6a");
  ell(c, -r*.3, r*.0, r*(.7 + st*.15), r*.3, "#a07444", .5 + f);
}
function cocoon(c, r, t, col, dark) {
  const w = Math.sin(t*3)*.08;
  c.save(); c.rotate(w);
  poly(c, [r*.1, -r*1.25, r*.75, -r*.2, r*.55, r*.8, -r*.55, r*.8, -r*.75, -r*.2], col);
  c.strokeStyle = dark; c.lineWidth = r*.08; c.beginPath();
  c.moveTo(-r*.6, r*.25); c.lineTo(r*.6, r*.25); c.moveTo(-r*.5, r*.55); c.lineTo(r*.5, r*.55); c.stroke();
  for (const ex of [-r*.05, r*.4]) { ell(c, ex, -r*.25, r*.14, r*.1, "#fff"); circ(c, ex + r*.04, -r*.22, r*.06, "#1b1b22"); c.fillStyle = col; c.fillRect(ex - r*.16, -r*.42, r*.32, r*.15); }
  c.restore();
}
