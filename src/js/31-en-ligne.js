/* ---------- En ligne : salons avec code (PeerJS, connexion directe entre navigateurs) ----------
   L'hôte fait tourner la partie ; chaque invité envoie ses touches et reçoit 20 fois par seconde
   ce qu'il y a autour de la caméra (Pokémon, attaques, bonbons…). */
var NET = { role:null, peer:null, conn:null, conns:[], code:null, idx:0, picks:[], myLine:null, lobby:null, started:false, asks:new Map(), earned:0, achMsgs:[], sendT:0, inT:0, tArr:0, gap:50, rtt:0, hist:[], me:null, lastIn:"", inRep:0, lastChest:null };
const NET_PFX = "pokesurv-";
const NET_OPTS = { config:{ iceServers:[{ urls:"stun:stun.l.google.com:19302" }, { urls:"stun:stun1.l.google.com:19302" }, { urls:"stun:stun.cloudflare.com:3478" },
  // relais gratuit (Open Relay) : utilisé seulement si la liaison directe entre les deux box échoue
  { urls:["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443", "turn:openrelay.metered.ca:443?transport=tcp"], username:"openrelayproject", credential:"openrelayproject" }] } };
const NET_VER = "v214";
const netEsc = t => String(t).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
function netLib() {
  if (window.Peer) return Promise.resolve();
  return new Promise((ok, ko) => { const sc = document.createElement("script"); sc.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"; sc.onload = () => window.Peer ? ok() : ko(new Error("lib")); sc.onerror = () => ko(new Error("lib")); document.head.appendChild(sc); });
}
function netMsg(html) { $("netInfo").innerHTML = html; }
function netFail(why) { netMsg(`⚠️ ${netEsc(why)}`); netButtons(); }
function netErr(e) {
  const t = e && e.type;
  if (t === "peer-unavailable") return "Salon introuvable : vérifie le code. L'hôte doit garder la page du jeu ouverte.";
  if (t === "network" || t === "server-error" || t === "socket-error" || t === "socket-closed") return "Impossible de joindre le serveur des salons. Sur la page claude.ai le jeu en ligne est bloqué : ouvre le jeu depuis sa page GitHub.";
  if (t === "browser-incompatible") return "Ce navigateur ne permet pas le jeu en ligne.";
  return "Erreur de connexion (" + (t || "inconnue") + ").";
}
function netCodeGen() { const a = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c = ""; for (let i = 0; i < 5; i++) c += a[Math.random() * a.length | 0]; return c; }
function netSend(o) { try { if (NET.conn && NET.conn.open) NET.conn.send(typeof o === "string" ? o : JSON.stringify(o)); } catch (e) {} }
function netTo(g, o) { try { if (g.conn.open) g.conn.send(typeof o === "string" ? o : JSON.stringify(o)); } catch (e) {} }
function netAll(o) { const m = typeof o === "string" ? o : JSON.stringify(o); for (const g of NET.conns) netTo(g, m); }
function netLink() { return location.origin + location.pathname + "#" + NET.code; }
function netButtons() {
  const on = !!NET.role;
  for (const id of ["netHost", "netJoin", "netCode"]) $(id).hidden = on;
  $("netBox").querySelector(".netOr").hidden = on; $("netQuit").hidden = !on;
  $("netGo").hidden = NET.role !== "host";
}
function netClose() {
  try { NET.peer && NET.peer.destroy(); } catch (e) {}
  Object.assign(NET, { role:null, peer:null, conn:null, conns:[], code:null, idx:0, picks:[], lobby:null, started:false, ask:null, myLine:null, hostV:null });
  $("netWait").hidden = true; netButtons();
  netMsg("Un joueur crée le salon, les autres entrent son code (ou ouvrent son lien). Puis chacun choisit son starter ci-dessous.");
}
const netName = l => LINES[l] ? LINES[l].names[0] : null;
function netLobby() {
  netButtons();
  if (NET.role === "host") {
    const list = [{ idx:0, line:NET.picks[0] }].concat(NET.conns.slice().sort((a, b) => a.idx - b.idx).map(g => ({ idx:g.idx, line:g.line, old:g.v !== NET_VER ? g.v || "?" : "" })));
    const rows = list.map(r => `<b>J${r.idx + 1}${r.idx ? "" : " (toi)"}</b> : ${netName(r.line) || (r.idx ? "choisit…" : "choisis ton starter ↓")}${r.old ? ` <span style="color:#ff8a7a">⚠ version ${netEsc(r.old === "?" ? "ancienne" : r.old)} : il doit rafraîchir sa page</span>` : ""}`).join(" · ");
    netMsg(`Salon <span class="netCodeBig">${NET.code}</span><br>Donne ce code à tes amis, ou ce lien : <input id="netLinkOut" readonly value="${netEsc(netLink())}"><br>${rows}<br>Niveau : <b>${netEsc(LEVEL.name)}</b> (c'est toi qui le choisis en haut)${NET.diag ? `<br><small style="opacity:.75">Réseau : ${netEsc(NET.diag)}</small>` : ""}`);
    $("netLinkOut").addEventListener("focus", e => e.target.select());
    const ready = !!NET.picks[0] && NET.conns.length > 0 && NET.conns.every(g => g.line && g.v === NET_VER); // une autre version ne sait pas lire les envois de l'hôte (écran vert) : on attend qu'il rafraîchisse
    $("netGo").disabled = !ready; $("netGo").textContent = !NET.conns.length ? "En attente d'un autre joueur…" : ready ? "Lancer la partie" : NET.conns.some(g => g.v !== NET_VER) ? "Un joueur doit rafraîchir sa page…" : "En attente des starters…"; $("netGo").classList.toggle("playIco", !!(NET.conns.length && ready));
    netAll({ t:"lobby", level:LEVEL.name, list });
  } else if (NET.role === "guest") {
    const L = NET.lobby, rows = (L && Array.isArray(L.list) ? L.list : []).map(r => `<b>J${(r.idx | 0) + 1}${(r.idx | 0) === NET.idx ? " (toi)" : ""}</b> : ${netName(r.line) || "choisit…"}`).join(" · ");
    netMsg(`Connecté au salon <span class="netCodeBig">${netEsc(NET.code)}</span> en tant que <b>J${NET.idx + 1}</b>.<br>${NET.myLine ? `Ton starter : <b>${netName(NET.myLine)}</b> (tu peux en changer)` : "Choisis ton starter ↓"}${NET.hostV && NET.hostV !== NET_VER ? `<br><span style="color:#ff8a7a">⚠ L'hôte est en ${netEsc(NET.hostV)} et toi en ${NET_VER} : rafraîchissez vos pages pour avoir la même version.</span>` : ""} · Niveau choisi par l'hôte : <b>${netEsc(L && L.level || "…")}</b><br>${rows}<br>L'hôte lance la partie quand tout le monde a choisi.`);
  }
}
function netHost() {
  netClose();
  netMsg("Création du salon…");
  netLib().then(() => {
    const tryOpen = n => {
      const code = netCodeGen(), peer = new Peer(NET_PFX + code, NET_OPTS);
      peer.on("open", () => { Object.assign(NET, { role:"host", peer, code, picks:[null] }); netLobby(); });
      peer.on("connection", conn => { netDiag("un joueur frappe à la porte…"); netAccept(conn); });
      peer.on("error", e => { if (e && e.type === "unavailable-id" && n < 3) { try { peer.destroy(); } catch (er) {} tryOpen(n + 1); } else if (!NET.started) netFail(netErr(e)); });
      peer.on("disconnected", () => { netDiag("liaison au serveur des salons perdue, reconnexion…"); try { if (NET.peer === peer) peer.reconnect(); } catch (e) {} });
    };
    tryOpen(0);
  }, () => netFail("Impossible de charger le module en ligne (PeerJS). Vérifie ta connexion Internet."));
}
function netDiag(t) { NET.diag = t + " [" + NET_VER + "]"; console.log("[net]", t); if (NET.role === "host" && !NET.started) netLobby(); }
function netAccept(conn) {
  const watch = () => { const pc = conn.peerConnection; if (!pc) return setTimeout(watch, 200);
    const st = () => netDiag(`joueur entrant : signal ${pc.signalingState}, liaison ${pc.iceConnectionState}`);
    pc.addEventListener("iceconnectionstatechange", st); pc.addEventListener("signalingstatechange", st); st(); };
  watch();
  conn.on("open", () => {
    if (NET.role !== "host" || NET.started || NET.conns.length >= 3) { try { conn.send(JSON.stringify({ t:NET.started ? "started" : "full" })); } catch (e) {} setTimeout(() => { try { conn.close(); } catch (e) {} }, 400); return; }
    let idx = 1; while (NET.conns.some(g => g.idx === idx)) idx++;
    const g = { conn, idx, line:null }; NET.conns.push(g);
    conn.on("data", d => netHostData(g, netStr(d)));
    conn.on("close", () => netGone(g));
    netTo(g, { t:"welcome", idx, code:NET.code, v:NET_VER });
    sfx("click"); netLobby();
  });
  conn.on("error", e => netDiag("erreur du joueur entrant : " + (e && (e.type || e.message) || "?")));
}
// liaison directe entre les deux ordinateurs, ou passage par un serveur relais (TURN, plus lent)
function netLinkType() {
  const pc = NET.conn && NET.conn.peerConnection; if (!pc || !pc.getStats || NET.linkBusy) return;
  NET.linkBusy = true;
  pc.getStats().then(st => {
    let pair = null; st.forEach(r => { if (r.type === "transport" && r.selectedCandidatePairId) pair = st.get(r.selectedCandidatePairId); });
    if (!pair) st.forEach(r => { if (r.type === "candidate-pair" && (r.selected || (r.nominated && r.state === "succeeded"))) pair = pair || r; });
    if (!pair) return;
    const lc = st.get(pair.localCandidateId), rc = st.get(pair.remoteCandidateId);
    NET.link = (lc && lc.candidateType === "relay") || (rc && rc.candidateType === "relay") ? "relais" : "direct";
  }).catch(() => {}).finally(() => { NET.linkBusy = false; });
}
// indicateur de connexion : temps d'aller-retour avec l'hôte
const netPingHtml = (ms, lk) => { const c = ms < 80 ? "good" : ms < 160 ? "mid" : "bad"; return `<span class="ping ${c}" title="Temps de réponse avec l'hôte${lk === "relais" ? ", en passant par un serveur relais" : lk ? ", liaison directe" : ""}">📶 ${ms} ms${lk ? ` · ${lk}` : ""}</span>`; };
function netPingOf(Q) { // ce qu'on affiche à côté d'un joueur (rien hors ligne)
  if (!NET.started) return "";
  if (Q.idx === 0) return `<span class="ping host" title="Ce joueur héberge la partie">🏠 hôte</span>`;
  const ms = NET.role === "guest" && Q.idx === NET.idx ? Math.round(NET.rtt || 0) : Q.ping | 0;
  const lk = NET.role === "guest" && Q.idx === NET.idx ? NET.link : Q.link;
  return ms ? netPingHtml(ms, lk) : `<span class="ping">📶 …</span>`;
}
// instantanés compressés (deflate) : environ 3 fois moins de données à envoyer, donc moins de retard quand la connexion de l'hôte est juste
const NET_Z = 0xC5, NET_CAN_Z = typeof CompressionStream === "function" && typeof DecompressionStream === "function";
function netZip(g, s) {
  if (!NET_CAN_Z || !g.z) return netTo(g, s); // compressé seulement si l'invité sait le décompresser (sinon il ne voit rien)
  g.zPend = (g.zPend || 0) + 1; // file par invité : garde l'ordre ; au-delà de 2 en attente, l'instantané suivant est sauté
  const zip = new Response(new Blob([s]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer();
  g.zq = (g.zq || Promise.resolve()).then(() => zip).then(b => {
    const u = new Uint8Array(b.byteLength + 1); u[0] = NET_Z; u.set(new Uint8Array(b), 1);
    try { if (g.conn.open) g.conn.send(u); } catch (e) {}
  }, () => netTo(g, s)).finally(() => { g.zPend--; });
}
function netGuestRaw(d) { // tout passe dans la même file pour garder l'ordre d'arrivée
  const u = d instanceof ArrayBuffer ? new Uint8Array(d) : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : null;
  const job = u && u[0] === NET_Z
    ? () => new Response(new Blob([u.subarray(1)]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text()
    : () => netStr(d);
  NET.q = (NET.q || Promise.resolve()).then(job).then(netGuestData).catch(e => console.error("[net]", e));
}
const netStr = d => typeof d === "string" ? d : d instanceof ArrayBuffer ? new TextDecoder().decode(d) : String(d);
function netGone(g) {
  if (!NET.conns.includes(g)) return;
  NET.conns = NET.conns.filter(x => x !== g);
  if (NET.started && S) {
    const p = S.players[g.idx];
    if (p) {
      p.remote = false; p.left = true; p.down = true; p.hp = 0; p.inv = 1e9; p.pendingLv = 0; p.pendingEvo = false;
      S.chestQ = S.chestQ.filter(q => q !== p); banner(`J${g.idx + 1} a quitté la partie.`);
      if (NET.asks.has(g)) netAskDone(g);
      p.choosing = false;
      if (state !== "end" && !S.players.some(q => !q.down)) endGame(false);
    }
  } else netLobby();
}
function netHostData(g, raw) {
  let m; try { m = JSON.parse(raw); } catch (e) { return; }
  if (!m || typeof m !== "object") return;
  if (m.t === "in") {
    const p = S && NET.started ? S.players[g.idx] : null;
    g.inT = performance.now();
    if (p && p.remote) { const c = v => Math.max(-1, Math.min(1, +v || 0)); p.net = { x:c(m.x), y:c(m.y), ax:c(m.ax), ay:c(m.ay), tc:!!m.tc }; }
  } else if (m.t === "ping") { netTo(g, { t:"pong", c:m.c }); const p = S && NET.started ? S.players[g.idx] : null, r = +m.r; if (p && r > 0) p.ping = Math.round(Math.min(2000, r));
    if (p && (m.lk === "relais" || m.lk === "direct")) p.link = m.lk;
    if (+m.vw > 0) { g.vw = Math.max(300, Math.min(1100, +m.vw)); g.vh = Math.max(200, Math.min(800, +m.vh || 560)); } } // l'invité mesure son temps de réponse
  else if (m.t === "hi") { g.v = String(m.v || "").slice(0, 12); g.z = m.z === 1; netLobby(); } // version et décompression de l'invité
  else if (m.t === "starter") { if (!NET.started && starterOrder.includes(m.line)) { g.line = m.line; netLobby(); } }
  else if (NET.asks.has(g)) {
    const a = NET.asks.get(g), keep = S.P;
    if (m.t === "pick" && a.kind !== "chest") { const ch = a.choices[m.i | 0]; if (!ch) return; netAskDone(g); applyChoice(ch, a.p); }
    else if (m.t === "reroll" && a.kind === "lv" && S.rerolls > 0) { S.rerolls--; netAskDone(g); S.P = a.p; netAsk(a.p, "lv"); }
    else if (m.t === "chestok" && a.kind === "chest") { netAskDone(g); doneChoosing(a.p); }
    S.P = keep;
  }
}
function netAsk(p, kind) { // montée de niveau d'un joueur en ligne : il choisit sur son écran, la partie continue (il est intangible)
  const g = NET.conns.find(x => x.idx === p.idx);
  if (!g) { p.pendingLv = 0; p.pendingEvo = false; return; }
  const choices = kind === "evo" ? eeveeForms().map(id => ({ kind:"evo", id })) : buildChoices(); // formes d'Évoli : celles débloquées chez l'hôte
  if (!p.choosing) p.chooseT = CHOOSE_T; // une relance ne redonne pas de temps
  p.choosing = true; NET.asks.set(g, { p, g, kind, choices });
  netTo(g, { t:"ask", kind, choices });
}
function netChest(p) {
  const g = NET.conns.find(x => x.idx === p.idx);
  openChest(p, true); // les améliorations sont accordées ici ; la Poké Ball s'ouvre sur l'écran du joueur
  if (!g) return;
  p.choosing = true; p.chooseT = CHOOSE_T; NET.asks.set(g, { p, g, kind:"chest" });
  netTo(g, { t:"chest", n:NET.lastChest.n, got:NET.lastChest.got });
}
function netDexFlush() { if (NET.dexQ && Object.keys(NET.dexQ).length) { netAll({ t:"dex", k:NET.dexQ }); NET.dexQ = {}; } }
function netGuestDex(k) { // l'invité compte dans son Pokédex les K.O. de toute l'équipe
  if (!k || typeof k !== "object") return;
  for (const kind in k) {
    const d = FOES[kind]; if (!d) continue;
    for (let i = Math.min(2000, k[kind] | 0); i > 0; i--) {
      const n = dexKills[kind] = (dexKills[kind] || 0) + 1, t = dexTiers(kind).indexOf(n);
      if (t >= 0) NET.earned += (dexBoss(d) ? DEX_MONEY_BOSS : DEX_MONEY)[t];
    }
  }
  dexDirty = true; dexSave();
}
function netTimeout(p) { // temps écoulé : une amélioration au hasard est prise pour lui
  const pick = cs => cs[Math.random() * cs.length | 0];
  if (p.remote) {
    const g = NET.conns.find(x => x.idx === p.idx), a = g && NET.asks.get(g);
    if (g) netTo(g, { t:"timeout" });
    if (!a) return doneChoosing(p);
    netAskDone(g); if (a.kind === "chest") doneChoosing(p); else applyChoice(pick(a.choices), p);
  } else if (state === "levelup" && choices.length) applyChoice(pick(choices), p);
  else doneChoosing(p);
}
function chooseTimer() { // compte à rebours affiché sur l'écran de celui qui choisit
  let el = $("chooseTimer");
  if (!el) { el = document.createElement("div"); el.id = "chooseTimer"; el.className = "chooseTimer"; document.body.appendChild(el); }
  const left = NET.role === "host" && S?.chooser?.choosing ? S.chooser.chooseT : NET.role === "guest" && NET.askEnd && (state === "levelup" || state === "chest") ? (NET.askEnd - performance.now()) / 1000 : null;
  el.hidden = left === null || !NET.started; if (!el.hidden) { el.textContent = `⏱ ${Math.max(0, Math.ceil(left))} s`; el.classList.toggle("hurry", left < 4); }
}
function netAskDone(g) { const a = NET.asks.get(g); NET.asks.delete(g); return a; }
function netStart() {
  if (NET.role !== "host" || !NET.picks[0] || !NET.conns.length || !NET.conns.every(g => g.line)) return;
  const gs = NET.conns.slice().sort((a, b) => a.idx - b.idx); gs.forEach((g, i) => { g.idx = i + 1; });
  newGame([NET.picks[0], ...gs.map(g => g.line)]); // Oiseau Légendaire : la carte tirée est envoyée aux invités
  for (const g of gs) { const p = S.players[g.idx]; p.remote = true; p.net = { x:0, y:0, ax:0, ay:0 }; }
  NET.started = true; NET.sendT = 0; NET.asks.clear();
  for (const g of gs) netTo(g, { t:"start", level:LEVELS.indexOf(LEVEL), map:LEVEL.mapIdx, idx:g.idx });
  $("hudLevel").textContent += " · en ligne";
}
// instantané envoyé aux invités : tout ce qui est autour de la caméra, nombres arrondis, sans les liens internes
const NET_SKIP = new Set(["P", "boss", "mother", "mewtwo", "bird", "lgBoss", "parts", "chestQ", "dmgBy", "achMsgs", "seq", "players", "foes", "gems"]);
const FOE_KEYS = Object.keys(FOES);
// champs optionnels d'un Pokémon sauvage utiles à l'affichage (envoyés seulement s'ils servent)
const FOE_OPT = ["jump", "vanish", "vanMax", "under", "jz", "dashMode", "bx", "by", "shieldT", "hurt", "appear", "stunT", "slowT", "sleepT", "seedT", "raged", "prop", "poisonT", "burnT", "dx", "dy", "rare", "fuse", "lz", "mb", "mbMax", "mbR", "rest", "spr"];
const NET_DROP = new Set(["d", "pull", "gp", "net", "tr", "hit", "home", "boomer", "tx", "remote", "szFlow"]); // szFlow : carte des chemins du Parc Safari (calcul de l'hôte, ~400 Ko par joueur)
function netRep(k, v) {
  if (k === "o") return v && typeof v === "object" ? v.idx : v;
  if (NET_DROP.has(k)) return undefined;
  if (typeof v === "number") return Number.isInteger(v) ? v : Math.round(v * 100) / 100;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    if (v instanceof Set || v instanceof Map || ArrayBuffer.isView(v)) return undefined; // tableaux typés : données de calcul, énormes en JSON
    if (!/^\d+$/.test(k) && k !== "" && ((v.d && v.kind) || (v.moves && v.line))) return undefined; // référence à un Pokémon ou à un joueur
  }
  return v;
}
function netSnap(c = S.cam, hx = 1050, hy = 700) { // hx, hy : demi-largeur et demi-hauteur de ce que voit l'invité (+ marge)
  const near = o => !o || typeof o.x !== "number" || (Math.abs(o.x - c.x) < hx + 350 && Math.abs(o.y - c.y) < hy + 300);
  const out = {};
  for (const k in S) { if (NET_SKIP.has(k)) continue; const v = S[k]; out[k] = Array.isArray(v) ? v.filter(near) : v; }
  out.cam = c; out.players = S.players; out.texts = (out.texts || []).slice(-60);
  // Pokémon : [espèce, x, y, direction + 8 si retourné, id, PV en %, extras]
  out.fz = S.foes.filter(f => f.hp > 0 && Math.abs(f.x - c.x) < hx && Math.abs(f.y - c.y) < hy).map(f => {
    const a = [FOE_KEYS.indexOf(f.kind), Math.round(f.x), Math.round(f.y), (f.dir || 0) + (f.flip ? 8 : 0), f.id || 0, Math.max(0, Math.min(100, Math.round(f.hp / f.maxHp * 100)))];
    let x = null; for (const k of FOE_OPT) { const v = f[k]; if (v && (typeof v !== "number" || v > 0)) (x ||= {})[k] = v; }
    if (f.r !== f.d.r) (x ||= {}).r = f.r; if (f.d.snake && f.trail.length) (x ||= {}).trail = f.trail.map(t => [Math.round(t[0]), Math.round(t[1])]);
    if (x) a.push(x); return a;
  });
  // bonbons : moins souvent (ils bougent peu)
  if ((NET.gemN = (NET.gemN || 0) + 1) % 4 === 1) { out.gz = []; out.gp = []; for (const g of S.gems) { if (Math.abs(g.x - c.x) > hx || Math.abs(g.y - c.y) > hy) continue; if (g.pick) out.gp.push({ x:Math.round(g.x), y:Math.round(g.y), pick:g.pick }); else out.gz.push(Math.round(g.x), Math.round(g.y), g.v | 0, g.berry ? 1 : g.coin ? 2 : 0); } }
  return JSON.stringify(out, netRep);
}
function netLoad(str) {
  let sn; try { sn = JSON.parse(str); } catch (e) { return; }
  if (!sn || !Array.isArray(sn.players) || !sn.players[NET.idx] || !sn.cam) return;
  sn.foes = [];
  for (const a of Array.isArray(sn.fz) ? sn.fz : []) {
    const kind = FOE_KEYS[a[0]], d = FOES[kind]; if (!d) continue;
    const f = { kind, d, x:+a[1], y:+a[2], dir:a[3] & 7, flip:a[3] >= 8, id:a[4], maxHp:100, hp:Math.max(.1, +a[5]), r:d.r, ph:(a[4] * 1.37) % 10, trail:[] };
    if (a[6] && typeof a[6] === "object") for (const k of FOE_OPT.concat(["r", "trail"])) if (a[6][k] !== undefined) f[k] = a[6][k];
    sn.foes.push(f);
  }
  if (Array.isArray(sn.gz)) { const gs = []; for (let i = 0; i + 3 < sn.gz.length; i += 4) gs.push({ x:sn.gz[i], y:sn.gz[i + 1], v:sn.gz[i + 2], berry:sn.gz[i + 3] === 1, coin:sn.gz[i + 3] === 2 }); for (const g of Array.isArray(sn.gp) ? sn.gp : []) if (g && PICKS[g.pick]) gs.push({ x:+g.x, y:+g.y, pick:g.pick }); NET.gems = gs; }
  sn.gems = NET.gems || [];
  for (const k in sn) if (Array.isArray(sn[k]) && k !== "players") for (const e of sn[k]) if (e && typeof e.o === "number") e.o = sn.players[e.o] || sn.players[0];
  for (const k of ["shots", "eshots", "waves", "clouds", "tornados", "beams", "tails", "suns", "sunbeams", "gusts", "slashes", "patches", "flames", "texts", "fxs", "sludge", "bolts", "rocks", "claws", "eclaws", "bites", "ghosts", "chains", "msgs", "falls", "gas"]) if (!Array.isArray(sn[k])) sn[k] = [];
  sn.parts = []; sn.chestQ = []; sn.P = sn.players[NET.idx]; sn.boss = null; sn.mewtwo = null; sn.bird = null; sn.lgBoss = null; sn.mother = null;
  const now = performance.now(), old = S && S.players ? S : null;
  if (old) NET.gap = Math.min(150, Math.max(25, NET.gap * .8 + (now - NET.tArr) * .2));
  const pf = new Map(); if (old) for (const f of old.foes) if (f.id) pf.set(f.id, f);
  const seed = (o, from) => { o._ax = from ? from.x : o.x; o._ay = from ? from.y : o.y; o._bx = o.x; o._by = o.y; };
  for (const f of sn.foes) seed(f, pf.get(f.id));
  sn.players.forEach((p, i) => seed(p, old && old.players[i]));
  seed(sn.cam, old && old.cam);
  NET.tArr = now; S = sn;
}
function netLerp(now) { // mouvements fluides entre deux instantanés
  // instantané en retard (Wi-Fi…) : au lieu de figer, on prolonge le mouvement jusqu'à 0,8 intervalle de plus (40 ms), puis on attend
  const t = (now - NET.tArr) / NET.gap, a = Math.min(1.8, t), L = o => { if (o._bx === undefined) return;
    const dx = o._bx - o._ax, dy = o._by - o._ay, k = a > 1 && dx * dx + dy * dy > 6400 ? 1 : a; // grand saut (téléportation) : pas de prolongation
    o.x = o._ax + dx * k; o.y = o._ay + dy * k; };
  for (const f of S.foes) L(f); for (const p of S.players) L(p); L(S.cam);
}
// connexion encombrée : on saute un instantané plutôt que d'en empiler (sinon le retard grossit)
const netBusy = g => { const c = g.conn, dc = c && c.dataChannel; return (c && c.bufferSize > 0) || (dc && dc.bufferedAmount > 64e3); };
function netMove() { // déplacement voulu par l'invité (clavier, tactile, manette)
  let mx = 0, my = 0;
  if (keys.has("left")) mx -= 1; if (keys.has("right")) mx += 1; if (keys.has("up")) my -= 1; if (keys.has("down")) my += 1;
  if (touch.on) { const dx = touch.x - touch.ox, dy = touch.y - touch.oy, l = Math.hypot(dx, dy); if (l > 8) { mx = dx / Math.max(l, 50); my = dy / Math.max(l, 50); } }
  mx += pad.x; my += pad.y;
  if (state !== "netplay") mx = my = 0;
  return [Math.max(-1, Math.min(1, mx)), Math.max(-1, Math.min(1, my))];
}
// prédiction : l'invité déplace son Pokémon tout de suite, sans attendre l'aller-retour avec l'hôte.
// Position affichée = dernière position reçue de l'hôte + ses propres pas que l'hôte n'avait pas encore reçus.
function netPredict(now, dt) {
  const p = S.players[NET.idx], H = NET.hist; if (!p || p._bx === undefined) return;
  const off = state !== "netplay" || p.down || p.choosing || p.dashT > 0 || p.parT > 0 || p.kbx || p.kby || LEVEL.ice;
  if (off) { H.length = 0; NET.me = null; return; } // cas rares : on suit simplement l'hôte
  let [mx, my] = netMove(); const ml = Math.hypot(mx, my); if (ml > 1) { mx /= ml; my /= ml; }
  let v = 0; const keep = S.P;
  try { S.P = p; v = speed() * (tallGrassAt(p._bx, p._by) ? .85 : 1) * (p.inSludge ? .75 : 1) * (p.inMud ? .6 : 1); } catch (e) { v = 0; }
  const step = { t:now, dx:mx * v * dt, dy:my * v * dt }; H.push(step);
  const from = NET.tArr - (NET.rtt || 120) - 17; // pas déjà pris en compte dans le dernier instantané
  while (H.length && H[0].t < from - 500) H.shift();
  const o = { x:p._bx, y:p._by }; for (const h of H) if (h.t > from) { o.x += h.dx; o.y += h.dy; }
  try { if (!flyP(p)) collide(o, p.r || 12, ptype() === "eau"); arenaClamp(o, p.r || 12); } catch (e) {}
  S.P = keep;
  const me = NET.me;
  if (!me || Math.hypot(o.x - me.x, o.y - me.y) > 140) NET.me = o; // trop d'écart (téléportation…) : on recale d'un coup
  else { me.x += step.dx; me.y += step.dy; const k = 1 - Math.exp(-dt * 10); me.x += (o.x - me.x) * k; me.y += (o.y - me.y) * k; } // petit écart : on corrige en douceur
  p.x = NET.me.x; p.y = NET.me.y;
  if (S.players.length > 1) { const c = camClamp(p.x, p.y); S.cam.x = c.x; S.cam.y = c.y; } // la caméra suit le Pokémon affiché
}
function netStill() { // l'invité quitte la fenêtre : on prévient l'hôte tout de suite qu'il ne bouge plus
  if (NET.role !== "guest" || !NET.started) return;
  NET.lastIn = JSON.stringify({ t:"in", x:0, y:0, ax:0, ay:0, tc:TOUCH ? 1 : 0 }); netSend(NET.lastIn);
}
function netInput() {
  const P = S && S.P;
  let [mx, my] = netMove();
  let ax = pad.ax, ay = pad.ay;
  if (!ax && !ay && mouse.on && P && S.cam) { ax = mouse.x - W / 2 - (P.x - S.cam.x) * ZOOM; ay = mouse.y - H / 2 - (P.y - S.cam.y) * ZOOM; const l = Math.hypot(ax, ay); if (l < 6) ax = ay = 0; else { ax /= l; ay /= l; } }
  if (state !== "netplay") ax = ay = 0;
  const msg = JSON.stringify({ t:"in", x:+mx.toFixed(2), y:+my.toFixed(2), ax:+ax.toFixed(2), ay:+ay.toFixed(2), tc:TOUCH ? 1 : 0 });
  if (msg !== NET.lastIn || ++NET.inRep % 10 === 0) { NET.lastIn = msg; netSend(msg); }
}
function netFrame(now, dt) {
  chooseTimer();
  if (NET.role === "host" && NET.started && S && NET.conns.length) {
    for (const g of NET.conns) { const p = S.players[g.idx]; if (p && p.remote && p.net && now - (g.inT || now) > 600) p.net = { x:0, y:0, ax:0, ay:0, tc:p.net.tc }; } // plus de nouvelles de l'invité (onglet en arrière-plan…) : il s'arrête
    NET.sendT -= dt; if (NET.sendT <= 0) { NET.sendT = Math.max(0, NET.sendT + 1 / 20); for (const g of NET.conns) { if (netBusy(g) || g.zPend >= 2) continue; const p = S.players[g.idx]; netZip(g, "S" + netSnap(p ? viewFor(p) : S.cam, (g.vw || 930) + 150, (g.vh || 560) + 150)); } } // chacun reçoit ce qui entoure sa caméra, 20 fois par seconde
    if ((NET.dexT = (NET.dexT || 0) - dt) <= 0) { NET.dexT = 2; netDexFlush(); }
  }
  if (NET.role === "guest" && NET.started) {
    if (S && S.players) {
      netLerp(now); netPredict(now, dt);
      if ((NET.pingT = (NET.pingT || 0) - dt) <= 0) { NET.pingT = 1; netLinkType(); netSend({ t:"ping", c:performance.now(), r:Math.round(NET.rtt || 0), vw:Math.round(W / ZOOM / 2), vh:Math.round(H / ZOOM / 2), lk:NET.link || "" }); }
      if (state === "netplay") { hudT -= dt; if (hudT <= 0) { hudT = .08; refreshHud(); } } // délai remis avant : une erreur du HUD ne bloque pas le reste
      if ((NET.achT = (NET.achT || 0) - dt) <= 0) { NET.achT = 1; achCheck(); } // succès de l'invité, sur sa partie
      playTrack(S.foes.some(f => f.d.boss) ? "boss" : LEVEL.track || (LEVEL.cave ? "cave" : "forest"));
    }
    NET.inT -= dt; if (NET.inT <= 0) { NET.inT = 1 / 30; netInput(); }
  }
}
function netJoin(code) {
  code = String(code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{5}$/.test(code)) { netFail("Le code du salon fait 5 caractères (lettres et chiffres)."); return; }
  netClose();
  netMsg(`Connexion au salon ${code}…`);
  netLib().then(() => {
    const peer = new Peer(NET_OPTS); NET.peer = peer;
    let stage = 0, ice = ""; // 0 : serveur pas joint, 1 : serveur joint, 2 : hôte trouvé
    const timer = setTimeout(() => { if (NET.peer === peer && NET.role !== "guest") {
      netFail(stage === 0 ? `Le serveur des salons ne répond pas (étape 1/3). Ton réseau ou un antivirus bloque peut-être 0.peerjs.com. [${NET_VER}]`
        : stage === 1 ? `Serveur joint, mais le salon ${code} ne répond pas (étape 2/3). Vérifie le code et que l'hôte a toujours la page ouverte. [${NET_VER}]`
        : `Salon trouvé, mais la liaison directe entre vos deux ordinateurs est bloquée (étape 3/3, ${ice || "?"}). [${NET_VER}]`);
      try { peer.destroy(); } catch (e) {} NET.peer = null; } }, 25000);
    peer.on("open", () => {
      let conn; // sérialisation par défaut de PeerJS : découpe aussi les gros messages
      try { conn = peer.connect(NET_PFX + code, { reliable:true }); } catch (e) { clearTimeout(timer); netFail("Erreur de connexion : " + (e && e.message || e)); return; }
      conn.on("error", e => { if (!NET.started) netFail("Erreur de connexion : " + (e && (e.type || e.message) || "inconnue")); });
      stage = 1; netMsg(`Serveur joint, recherche du salon ${code}…`);
      NET.conn = conn; NET.code = code;
      const watchIce = () => { const pc = conn.peerConnection; if (!pc) return setTimeout(watchIce, 200);
        pc.addEventListener("signalingstatechange", () => { if (pc.signalingState === "stable" && stage < 2 && NET.role !== "guest") { stage = 2; netMsg(`Le salon ${code} a répondu, liaison avec l'hôte…`); } });
        pc.addEventListener("iceconnectionstatechange", () => { ice = pc.iceConnectionState;
          if (stage < 2 && ice !== "new" && NET.role !== "guest") { stage = 2; netMsg(`Salon ${code} trouvé, liaison avec l'hôte…`); }
          if (ice === "failed" && NET.role !== "guest") { clearTimeout(timer); netFail(`Salon trouvé, mais la liaison entre vos deux ordinateurs a échoué (étape 3/3). [${NET_VER}]`); } }); };
      watchIce();
      conn.on("open", () => { clearTimeout(timer); NET.role = "guest"; netLobby(); netSend({ t:"hi", v:NET_VER, z:NET_CAN_Z ? 1 : 0 }); });
      conn.on("data", netGuestRaw);
      conn.on("close", () => netHostGone());
    });
    peer.on("error", e => { clearTimeout(timer); if (!NET.started) { netFail(netErr(e)); NET.role = null; netButtons(); } });
  }, () => netFail("Impossible de charger le module en ligne (PeerJS). Vérifie ta connexion Internet."));
}
function netPick(line) {
  if (NET.role === "host") { NET.picks[0] = line; netLobby(); }
  else if (NET.role === "guest") { NET.myLine = line; netSend({ t:"starter", line }); netLobby(); }
}
const netValid = c => c && (c.kind === "heal" || (c.kind === "move" && MOVES[c.id]) || (c.kind === "item" && ITEMS[c.id]) || (c.kind === "evo" && EEVEE[c.id]));
function netGuestData(raw) {
  if (typeof raw !== "string") return;
  if (raw[0] === "S") { if (NET.started) netLoad(raw.slice(1)); return; }
  let m; try { m = JSON.parse(raw); } catch (e) { return; }
  if (!m || typeof m !== "object") return;
  if (m.t === "pong") { const r = Math.max(10, Math.min(1000, performance.now() - (+m.c || 0))); NET.rtt = NET.rtt ? NET.rtt * .7 + r * .3 : r; return; }
  if (m.t === "welcome") { NET.idx = m.idx | 0; NET.hostV = String(m.v || "ancienne version").slice(0, 20); netLobby(); if (NET.myLine) netSend({ t:"starter", line:NET.myLine }); }
  else if (m.t === "lobby") { NET.lobby = m; netLobby(); }
  else if (m.t === "full") netFail("Ce salon est complet (4 joueurs maximum).");
  else if (m.t === "started") netFail("La partie de ce salon a déjà commencé. Attends la fin et rejoins-le à nouveau.");
  else if (m.t === "start") {
    const i = m.level | 0; if (!LEVELS[i]) return;
    if (LEVEL !== LEVELS[i]) { LEVEL = LEVELS[i]; chunkData.clear(); nearCache.clear(); liveChunks.clear(); motes.length = 0; }
    pickMap(m.map | 0); if (LEVEL.rooms) setRoom(0);
    NET.idx = m.idx | 0; NET.started = true; S = null; NET.earned = 0; NET.achMsgs = [];
    for (const id of ["start", "end", "pause", "levelup", "chest"]) $(id).hidden = true;
    $("hud").hidden = false; $("xpbar").hidden = false; $("boss").hidden = true;
    $("hudLevel").textContent = `${LEVEL.name}${LEVEL.maps ? " · " + LEVEL.mapName : ""} · en ligne`;
    state = "netplay"; auInit();
  } else if (m.t === "ask" && S && S.players && NET.started) {
    const ok = (Array.isArray(m.choices) ? m.choices : []).filter(netValid).map(c => ({ kind:c.kind, id:c.id, lv:c.lv | 0 }));
    if (!ok.length) return;
    if (m.kind !== "evo" && autoPotion && ok.every(c => c.kind === "heal")) { netSend({ t:"pick", i:0 }); sfx("heal"); return; } // Super Potion prise directement (réglage de l'invité)
    $("chest").hidden = true; NET.askEnd = performance.now() + CHOOSE_T * 1000;
    if (m.kind === "evo") openEvo(ok.filter(c => c.kind === "evo")); else openLevelUp(ok);
  } else if (m.t === "chest" && S && S.players && NET.started) {
    const got = (Array.isArray(m.got) ? m.got : []).filter(netValid).map(c => ({ kind:c.kind, id:c.id, lv:c.lv | 0 }));
    NET.askEnd = performance.now() + CHOOSE_T * 1000; state = "chest"; sfx("chest"); showChest([1, 3, 5].includes(m.n) ? m.n : 1, got, S.P);
  } else if (m.t === "timeout" && NET.started) { // trop lent : l'hôte a choisi au hasard
    $("levelup").hidden = true; $("chest").hidden = true; if (state === "levelup" || state === "chest") state = "netplay"; NET.askEnd = 0;
    $("netWait").textContent = "⏱ Temps écoulé : amélioration choisie au hasard"; $("netWait").hidden = false; setTimeout(() => { $("netWait").hidden = true; }, 1800);
  } else if (m.t === "dex" && NET.started) netGuestDex(m.k);
  else if (m.t === "room" && NET.started && LEVEL.rooms && LEVEL.rooms[m.k | 0]) { setRoom(m.k | 0); $("hudLevel").textContent = `${LEVEL.name} · Salle ${(m.k | 0) + 1}/5 · en ligne`; }
  else if (m.t === "ach" && NET.started && ACHS.some(a => a.id === m.id)) achGet(m.id);
  else if (m.t === "end") netGuestEnd(m);
}
function netGuestEnd(m) {
  achCheck(!!m.win); dexSave(); if (S && S.players) careerRecord([S.players[NET.idx]], !!m.win); // sa progression : succès, niveau suivant débloqué, Pokédex
  if (m.win && LEVELS[LEVEL.num]) setLevel(LEVEL.num);
  NET.started = false; state = "end"; playTrack(null); sfx(m.win ? "win" : "lose");
  for (const id of ["levelup", "chest"]) $(id).hidden = true;
  $("endTitle").textContent = String(m.title || "Fin de la partie"); $("endSub").textContent = String(m.sub || "");
  $("endStats").innerHTML = (S && S.players ? statsHtml() : "") + (NET.achMsgs?.length ? `<div class="achEnd">${NET.achMsgs.map(netEsc).join("<br>")}</div>` : "");
  if (m.win && S?.orme?.ok) eggHatch((NET.achMsgs || []).some(x => String(x).includes("Togepi")));
  const me = S && S.players && S.players[NET.idx];
  $("endDmg").innerHTML = me ? teamHtml() + `<h3 class="dmgFor">Tes dégâts (${pTag(me)}${(S.P = me, pName())})</h3>` + dmgTableHtml(me) : "";
  $("end").hidden = false; $("boss").hidden = true; $("againBtn").focus({ preventScroll:true });
}
function netHostGone() {
  if (NET.role !== "guest") return;
  const inGame = NET.started && state !== "end";
  NET.role = null; NET.conn = null; NET.started = false;
  try { NET.peer && NET.peer.destroy(); } catch (e) {} NET.peer = null;
  if (inGame) netGuestEnd({ title:"L'hôte a quitté la partie", sub:"La partie en ligne est terminée. Tu peux créer ou rejoindre un autre salon." });
  else netFail("L'hôte a fermé le salon.");
}
function netLobbyBack() { if (NET.role === "guest") { NET.started = false; setTimeout(netLobby, 0); } }
function netAfterGame() { if (NET.role === "host") { NET.started = false; NET.asks.clear(); $("netWait").hidden = true; setTimeout(netLobby, 0); } }
$("netBtn").addEventListener("click", () => {
  const show = $("netBox").hidden; $("netBox").hidden = !show; $("netBtn").setAttribute("aria-pressed", String(show));
  if (show) { setPlayers(1); $("mpBtn").hidden = true; } else { netClose(); $("mpBtn").hidden = false; }
});
$("netHost").addEventListener("click", netHost);
addEventListener("beforeunload", () => { try { NET.peer && NET.peer.destroy(); } catch (e) {} });
$("netJoin").addEventListener("click", () => netJoin($("netCode").value));
$("netCode").addEventListener("keydown", e => { e.stopPropagation(); if (e.key === "Enter") netJoin($("netCode").value); });
$("netQuit").addEventListener("click", netClose);
$("netGo").addEventListener("click", netStart);
$("againBtn").addEventListener("click", netAfterGame);
