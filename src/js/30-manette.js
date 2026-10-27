/* ---------- Manette (API Gamepad : Xbox, PlayStation…) ---------- */
const mouse = { on:false, x:0, y:0 };
cv.addEventListener("pointermove", e => { if (e.pointerType === "mouse") { mouse.on = true; mouse.x = e.clientX; mouse.y = e.clientY; } });
cv.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") mouse.on = false; });
const pad = { x:0, y:0, ax:0, ay:0, prev:{}, rep:0, held:false, used:false, gp:null };
function overlayButtons() {
  const ov = ["levelup", "chest", "shop", "ach", "career", "dex", "end", "pause", "lgInter", "beastPick", "start", "home", "settings", "legal"].map($).find(el => !el.hidden);
  return ov ? [...ov.querySelectorAll("button")].filter(b => b.getClientRects().length) : [];
}
function padFocus(btns, i) {
  document.querySelectorAll(".padfocus").forEach(b => b.classList.remove("padfocus"));
  const b = btns[(i + btns.length) % btns.length];
  if (b) { b.classList.add("padfocus"); b.focus({ preventScroll:true }); }
}
function pollPad(dt) {
  const gp = [...(navigator.getGamepads ? navigator.getGamepads() : [])].find(g => g && g.connected);
  pad.gp = gp || null;
  if (!gp) { pad.x = pad.y = pad.ax = pad.ay = 0; return; }
  const btn = i => !!gp.buttons[i]?.pressed;
  const dz = v => Math.abs(v) < .2 ? 0 : (v - Math.sign(v) * .2) / .8;
  let x = dz(gp.axes[0] || 0), y = dz(gp.axes[1] || 0);
  if (btn(14)) x = -1; if (btn(15)) x = 1; if (btn(12)) y = -1; if (btn(13)) y = 1;
  pad.x = x; pad.y = y;
  const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0;
  if (Math.hypot(rx, ry) > .35) { pad.ax = rx; pad.ay = ry; if (!S || S.players.length === 1) mouse.on = false; } else pad.ax = pad.ay = 0;
  const now = {}; for (const i of [0, 1, 3, 4, 5, 8, 9]) now[i] = btn(i);
  const prev = pad.prev, hit = i => now[i] && !prev[i]; pad.prev = now;
  if (x || y || Object.values(now).some(Boolean)) { pad.used = true; auInit(); }
  if (hit(9) || hit(8)) togglePause();              // Start / Affichage
  if (state === "play" || state === "netplay") return;
  pad.x = pad.y = 0;                                // pas de déplacement dans les menus
  if (state === "pause" && hit(1)) { togglePause(); return; }
  if (state === "dex" && hit(1)) { closeDex(); return; }
  if (state === "shop" && hit(1)) { closeShop(); return; }
  if (state === "ach" && hit(1)) { closeAch(); return; }
  if (state === "career" && hit(1)) { closeCareer(); return; }
  if (state === "levelup" && hit(3)) { reroll(); return; }
  if (state === "menu" && (hit(4) || hit(5))) { let k = LEVELS.indexOf(LEVEL); do k = (k + (hit(5) ? 1 : -1) + LEVELS.length) % LEVELS.length; while (!levelOpen(k)); setLevel(k); }
  const btns = overlayButtons(); if (!btns.length || !pad.used) return;
  const i = btns.indexOf(document.activeElement);
  if (i >= 0 && !btns[i].classList.contains("padfocus")) padFocus(btns, i);
  if (state === "menu") { const hx = Math.abs(x) > .5 && Math.abs(x) > Math.abs(y) ? Math.sign(x) : 0;
    if (!hx) { pad.crep = 0; pad.cheld = false; } else { pad.crep = (pad.crep || 0) - dt; if (pad.crep <= 0) { pad.crep = pad.cheld ? .2 : .4; pad.cheld = true; carMove(hx); } }
    x = 0; }
  const dir = Math.abs(x) > .5 ? Math.sign(x) : Math.abs(y) > .5 ? Math.sign(y) : 0;
  if (!dir) { pad.rep = 0; pad.held = false; }
  else { pad.rep -= dt; if (pad.rep <= 0) { pad.rep = pad.held ? .16 : .35; pad.held = true; padFocus(btns, i < 0 ? btns.findIndex(b => b.classList.contains("card")) : i + dir); } }
  if (hit(0)) { if (state === "menu" && i < 0) chooseStarter(); else if (i < 0) padFocus(btns, Math.max(0, btns.findIndex(b => b.classList.contains("card")))); else btns[i].click(); }
}
window.addEventListener("gamepadconnected", () => { pad.used = true; });


