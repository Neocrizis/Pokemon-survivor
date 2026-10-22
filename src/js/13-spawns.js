/* ---------- Spawns ---------- */
function spawnFoe(kind, x, y) {
  if (S.players.some(p => p.line === "pika") && LEVEL.num === 1) kind = { pichu:"lixy", pikachu:"luxio", raichu:"luxray" }[kind] || kind; // pas de Pichu/Pikachu/Raichu sauvage quand on joue Pichu
  const placed = x !== undefined;
  let tS = LEVEL.league ? Math.min(S.t, 600) : S.t, d = FOES[kind], scale = (d.boss ? 1 : d.event || d.mini || d.mother ? 1 + tS / 400 : 1 + tS / 150) * CURSE() * (d.boss || d.event || d.mini || d.mother ? 1 + .6 * (S.players.length - 1) : 1); // boss : +60 % de PV par joueur en plus
  if (x === undefined) {
    const a = Math.random() * Math.PI * 2, dist = Math.hypot(W, H) / ZOOM / 2 + 60;
    const c = spawnNear(); x = c.x + Math.cos(a) * dist; y = c.y + Math.sin(a) * dist;
    if (LEVEL.league) { // salle fermée : on entre par les bords de la salle, loin des joueurs
      const A = arena();
      for (let k = 0; k < 10; k++) {
        const side = Math.random() * 4 | 0, u = Math.random();
        x = side < 2 ? A.x0 + 40 + u * (A.x1 - A.x0 - 80) : side === 2 ? A.x0 + 40 : A.x1 - 40;
        y = side === 0 ? A.y0 + 40 : side === 1 ? A.y1 - 40 : A.y0 + 40 + u * (A.y1 - A.y0 - 80);
        if (S.players.every(p => Math.hypot(p.x - x, p.y - y) > 420)) break;
      }
    }
  }
  if (LEVEL.league) arenaClamp({ get x() { return x; }, set x(v) { x = v; }, get y() { return y; }, set y(v) { y = v; } }, 40);
  if (!d.boss && LEVEL.foeHp) scale *= 1 + (LEVEL.foeHp - 1) * Math.min(1, tS / 360); // Caverne Azurée : sauvages plus coriaces au fil du temps
  const f = { kind, d, x, y, vx:0, vy:0, hp:d.hp * scale, maxHp:d.hp * scale, r:d.r, hurt:0, leafT:0, ph:Math.random()*10, flip:false, trail:[] };
  f.id = S.fid = (S.fid || 0) + 1;
  if (d.ditto) { // Métamorph prend l'apparence et le type du joueur le plus proche
    const q = S.players.reduce((b, p) => !b || Math.hypot(p.x - x, p.y - y) < Math.hypot(b.x - x, b.y - y) ? p : b, null);
    if (q) { f.copyK = (q.spiky ? "pichuspiky" : q.eform || q.line) + (q.shiny ? "_s" : ""); f.copySt = q.stage; f.copyT = q.etype || LINES[q.line].type; f.r = q.r; }
    if (!S.saidDitto) { S.saidDitto = true; banner("Un Métamorph a pris ton apparence ! Ne te trompe pas de cible…"); }
  }
  if (LEVEL.alph) alphSpawn(f, placed); // Ruines d'Alpha : lettre des Zarbi, Axoloto sortis des étangs
  S.foes.push(f); return f;
}

