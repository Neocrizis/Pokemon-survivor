// Sur GitHub Pages : si une version plus récente est en ligne, on la charge (le navigateur garde sinon l'ancienne en cache)
function netUpdateCheck() {
  if (!/github\.io$/.test(location.hostname) || !window.fetch) return Promise.resolve(false);
  return fetch("version.json?t=" + Date.now(), { cache:"no-store" }).then(r => r.ok ? r.json() : null).then(j => {
    const v = j && String(j.v || ""), num = x => parseInt(String(x).replace(/\D/g, ""), 10) || 0;
    if (!v || num(v) <= num(NET_VER) || new URLSearchParams(location.search).get("v") === v) return false;
    location.replace(location.pathname + "?v=" + encodeURIComponent(v) + location.hash); return true;
  }).catch(() => false);
}
$("verTag").textContent = "Version " + NET_VER.slice(1); // affichée en bas de l'écran d'accueil
// Sauvegarde en ligne (GitHub Pages seulement) : connexion Google + Firestore (projet Firebase de Raphaël, formule gratuite).
// Document saves/{uid} = { dex, shop, ach } en JSON. À la connexion, on fusionne la progression locale et celle du nuage
// en gardant le plus avancé : K.O. du Pokédex au maximum, succès réunis, rangs du Marchand au maximum.
const FIREBASE_CFG = { apiKey:"AIzaSyB4YIUasyNSXSgx7pipdRwipAyAtlPMudM", authDomain:"pokemon-survivor-neo.firebaseapp.com", projectId:"pokemon-survivor-neo",
  storageBucket:"pokemon-survivor-neo.firebasestorage.app", messagingSenderId:"1004214351055", appId:"1:1004214351055:web:525503bb4e34d6d4e633ba" };
var CLOUD = { fb:null, user:null, ready:false, timer:0, busy:false };
function cloudSoon() { if (!CLOUD || !CLOUD.user || !CLOUD.ready) return; /* CLOUD pas encore créé si un succès tombe au chargement */ clearTimeout(CLOUD.timer); CLOUD.timer = setTimeout(cloudPush, 2500); }
function shopSpentFor(sh) { let m = 0; for (const u of SHOP) for (let lv = 0; lv < (sh[u.id] || 0); lv++) m += u.cost(lv); return m; }
function mergeSave(a, b) { // a, b : { dex, shop, ach }
  const dex = { ...a.dex }; for (const k in b.dex) dex[k] = Math.max(dex[k] || 0, b.dex[k] || 0);
  const ach = { ...a.ach }; for (const k in b.ach) if (b.ach[k]) ach[k] = true;
  const sh = { ...b.shop, ...a.shop }; for (const u of SHOP) sh[u.id] = Math.max(a.shop[u.id] || 0, b.shop[u.id] || 0);
  if ((b.shop.beastAt || 0) > (a.shop.beastAt || 0)) { sh.beast = b.shop.beast; sh.beastAt = b.shop.beastAt; } // Tour Cendrée : le chien légendaire choisi en dernier l'emporte
  sh.spent = Math.max(a.shop.spent || 0, b.shop.spent || 0, shopSpentFor(sh)); // jamais de Pokédollars gagnés en double
  const career = JSON.parse(JSON.stringify(a.career || {})), bc = b.career || {};
  for (const k in bc) {
    const x = career[k] = career[k] || { lv:{} }, y = bc[k] || {}; x.lv = x.lv || {};
    for (const n in y.lv || {}) { const l = x.lv[n] = x.lv[n] || {}; for (const f of CAR_F) l[f] = Math.max(+l[f] || 0, +y.lv[n][f] || 0); }
    if ((y.st || 0) > (x.st || 0) || ((y.st || 0) === (x.st || 0) && (y.at || 0) > (x.at || 0))) { x.st = y.st || 0; if (y.ef) x.ef = y.ef; }
    x.at = Math.max(x.at || 0, y.at || 0);
  }
  return { dex, shop:sh, ach, career };
}
function cloudApply(m) {
  dexKills = m.dex; shop = m.shop; achs = m.ach; career = m.career || career; dexDirty = false;
  try { localStorage.setItem("pokesurv-dex", JSON.stringify(dexKills)); localStorage.setItem("pokesurv-shop", JSON.stringify(shop)); localStorage.setItem("pokesurv-ach", JSON.stringify(achs)); localStorage.setItem("pokesurv-career", JSON.stringify(career)); } catch (e) {}
  refreshMoneyTag(); refreshLocks(); if (state === "menu") setLevel(Math.max(0, LEVELS.indexOf(LEVEL)));
}
async function cloudPush() {
  const f = CLOUD.fb; if (!f || !CLOUD.user || CLOUD.busy) return; CLOUD.busy = true;
  try { await f.setDoc(f.doc(f.db, "saves", CLOUD.user.uid), { dex:JSON.stringify(dexKills), shop:JSON.stringify(shop), ach:JSON.stringify(achs), career:JSON.stringify(career), at:Date.now(), ver:NET_VER }); cloudLabel(); }
  catch (e) { console.warn("sauvegarde en ligne", e); cloudLabel("⚠️ Sauvegarde : échec, nouvel essai plus tard"); }
  CLOUD.busy = false;
}
async function cloudPull() {
  const f = CLOUD.fb; CLOUD.ready = false;
  try {
    const snap = await f.getDoc(f.doc(f.db, "saves", CLOUD.user.uid)), d = snap.exists() ? snap.data() : null;
    const J = v => { try { return JSON.parse(v || "{}") || {}; } catch (e) { return {}; } };
    const here = { dex:dexKills, shop, ach:achs, career };
    cloudApply(d ? mergeSave(here, { dex:J(d.dex), shop:J(d.shop), ach:J(d.ach), career:J(d.career) }) : here);
    CLOUD.ready = true; await cloudPush();
  } catch (e) { console.warn("sauvegarde en ligne", e); cloudLabel("⚠️ Sauvegarde : impossible de lire la progression en ligne"); }
}
function cloudLabel(err) {
  const b = $("cloudBtn"), u = CLOUD.user;
  b.textContent = err || (u ? `☁️ ${(u.displayName || "Connecté").split(" ")[0]} · synchronisé` : "☁️ Sauvegarde");
  b.title = u ? "Progression synchronisée avec ton compte Google. Clique pour te déconnecter." : "Se connecter avec Google pour retrouver ta progression sur tous tes ordinateurs";
  b.setAttribute("aria-pressed", String(!!u));
}
if (/github\.io$/.test(location.hostname) || location.hostname === "localhost") {
  const V = "https://www.gstatic.com/firebasejs/10.12.2/";
  Promise.all(["firebase-app.js", "firebase-auth.js", "firebase-firestore.js"].map(n => import(V + n))).then(([A, Au, F]) => {
    const app = A.initializeApp(FIREBASE_CFG), auth = Au.getAuth(app);
    CLOUD.fb = { auth, Au, db:F.getFirestore(app), doc:F.doc, getDoc:F.getDoc, setDoc:F.setDoc };
    $("cloudBtn").hidden = false; cloudLabel();
    Au.onAuthStateChanged(auth, u => { CLOUD.user = u; CLOUD.ready = false; cloudLabel(); if (u) cloudPull(); });
  }).catch(e => console.warn("Firebase indisponible", e));
  $("cloudBtn").addEventListener("click", () => {
    const f = CLOUD.fb; if (!f) return;
    if (CLOUD.user) { f.Au.signOut(f.auth); return; } // la progression reste aussi dans ce navigateur
    f.Au.signInWithPopup(f.auth, new f.Au.GoogleAuthProvider()).catch(e => { if (e.code !== "auth/popup-closed-by-user") cloudLabel("⚠️ Connexion impossible : " + (e.code || "erreur")); });
  });
}
netUpdateCheck().then(moved => { if (!moved) netAutoJoin(); });
function netAutoJoin() { // lien d'invitation : …/#CODE rejoint directement le salon
  const h = (location.hash || "").replace("#", "").toUpperCase();
  if (/^[A-Z0-9]{5}$/.test(h)) { $("netBox").hidden = false; $("netBtn").setAttribute("aria-pressed", "true"); $("mpBtn").hidden = true; $("netCode").value = h; netJoin(h); }
}

requestAnimationFrame(t => { last = t; frame(t); });
