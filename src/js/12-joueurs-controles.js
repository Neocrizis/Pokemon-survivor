function nearP(x, y) { // joueur debout le plus proche (cible des ennemis)
  let best = null, bd = Infinity;
  for (const p of S.players) { if (p.down || p.choosing) continue; const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = p; } }
  return best || S.players.find(p => !p.down) || S.players[0];
}
const padList = () => [...(navigator.getGamepads ? navigator.getGamepads() : [])].filter(g => g && g.connected);
function padAxes(gp) {
  const btn = i => !!gp.buttons[i]?.pressed, dz = v => Math.abs(v) < .2 ? 0 : (v - Math.sign(v) * .2) / .8;
  let x = dz(gp.axes[0] || 0), y = dz(gp.axes[1] || 0);
  if (btn(14)) x = -1; if (btn(15)) x = 1; if (btn(12)) y = -1; if (btn(13)) y = 1;
  const rx = gp.axes[2] || 0, ry = gp.axes[3] || 0, aim = Math.hypot(rx, ry) > .35;
  return { x, y, ax:aim ? rx : 0, ay:aim ? ry : 0 };
}
// contrôles : seul, clavier + 1re manette ; à plusieurs, J1 au clavier (et à la souris) et une manette par coéquipier,
// ou une manette chacun s'il y en a assez (J1 garde aussi le clavier)
function ctrlFor(P) {
  if (P.remote) { const n = P.net || {}; return { kb:false, x:n.x || 0, y:n.y || 0, ax:n.ax || 0, ay:n.ay || 0, gp:null, tc:!!n.tc }; } // joueur en ligne : ses touches arrivent par le réseau
  const loc = S.players.filter(p => !p.remote);
  if (loc.length === 1) return { kb:true, x:pad.x, y:pad.y, ax:pad.ax, ay:pad.ay, gp:pad.gp };
  const li = loc.indexOf(P), gps = padList(), gp = gps[li - (gps.length >= loc.length ? 0 : 1)] || null;
  return Object.assign({ kb:li === 0, x:0, y:0, ax:0, ay:0, gp }, gp ? padAxes(gp) : {});
}
const speed = () => S.P.baseSpeed * (1 + .08 * (S.P.items.mouchoir || 0)) * (1 + S.P.stage * .04) * (S.P.dracoT > 0 ? S.P.dracoMul : 1) * (S.P.slowT > 0 ? .55 : 1) * (S.P.ancT > 0 ? 1.1 : 1) * (S.P.nitroT > 0 ? 1 + .04 * (S.P.nitro || 0) : 1); // Laser Glace : ralenti ; Nitrocharge : accéléré

