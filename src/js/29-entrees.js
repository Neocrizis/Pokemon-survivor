/* ---------- Entrées ---------- */
const KEYMAP = { ArrowLeft:"left", KeyA:"left", KeyQ:"left", ArrowRight:"right", KeyD:"right", ArrowUp:"up", KeyW:"up", KeyZ:"up", ArrowDown:"down", KeyS:"down" };
window.addEventListener("keydown", e => {
  if (KEYMAP[e.code]) { keys.add(KEYMAP[e.code]); if (state === "play") e.preventDefault(); }
  if (e.code === "Escape" || e.code === "KeyP") togglePause();
  if (e.code === "KeyM") setMute(!AU.muted);
  const n = parseInt(e.key, 10);
  const typing = e.target && /INPUT|TEXTAREA/.test(e.target.tagName);
  if (state === "menu" && !typing && (e.code === "ArrowLeft" || e.code === "ArrowRight")) { e.preventDefault(); carMove(e.code === "ArrowLeft" ? -1 : 1); }
  else if (state === "menu" && !typing && e.code === "Enter" && !(document.activeElement && document.activeElement.closest("button") && document.activeElement.id !== "sGo")) { e.preventDefault(); chooseStarter(); }
  else if (state === "menu" && !typing && n >= 1 && n <= starterOrder.length && carVisible().includes(starterOrder[n - 1])) chooseStarter(starterOrder[n - 1]);
  else if (state === "levelup" && n >= 1 && n <= choices.length) applyChoice(choices[n - 1]);
  else if (state === "levelup" && e.code === "KeyR") reroll();
});
window.addEventListener("keyup", e => { if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]); });
window.addEventListener("blur", () => { keys.clear(); if (state === "play") togglePause(); netStill(); });
document.addEventListener("visibilitychange", () => { if (document.hidden) { keys.clear(); netStill(); } });
cv.addEventListener("pointerdown", e => { if (state !== "play" && state !== "netplay") return; touch.on = true; touch.id = e.pointerId; touch.ox = touch.x = e.clientX; touch.oy = touch.y = e.clientY; cv.setPointerCapture(e.pointerId); });
cv.addEventListener("pointermove", e => { if (touch.on && e.pointerId === touch.id) { touch.x = e.clientX; touch.y = e.clientY; } });
const endTouch = e => { if (e.pointerId === touch.id) touch.on = false; };
cv.addEventListener("pointerup", endTouch); cv.addEventListener("pointercancel", endTouch);
$("pauseBtn").addEventListener("click", togglePause);
$("dexBtn").addEventListener("click", openDex); $("shopBtn").addEventListener("click", openShop); $("shopClose").addEventListener("click", closeShop);
$("rerollBtn").addEventListener("click", reroll);
$("achBtn").addEventListener("click", openAch); $("carBtn").addEventListener("click", openCareer); $("carClose").addEventListener("click", closeCareer);
for (const id of ["muteBtn", "muteBtn2"]) $(id).addEventListener("click", e => { e.stopPropagation(); auInit(); setMute(!AU.muted); });
$("nuzBtn").addEventListener("click", () => setNuz(!NUZ)); setNuz(NUZ);
setMute(AU.muted);
for (const ev of ["pointerdown", "keydown"]) window.addEventListener(ev, auInit, { capture:true });
document.addEventListener("click", e => { if (e.target.closest(".card, .btn:not(.sGo), .lvbtn")) sfx("click"); }); $("achClose").addEventListener("click", closeAch);
for (const id of ["autoPot", "autoPot2"]) $(id).addEventListener("change", e => { autoPotion = e.target.checked; $("autoPot").checked = $("autoPot2").checked = autoPotion; try { localStorage.setItem("pokesurv-autopotion", autoPotion ? "1" : "0"); } catch (er) {} });
$("autoPot2").checked = autoPotion; refreshMoneyTag(); $("dexClose").addEventListener("click", closeDex);
$("chestBtn").addEventListener("click", closeChest);
$("resumeBtn").addEventListener("click", togglePause);
$("quitBtn").addEventListener("click", () => { if (state !== "pause") return; $("pause").hidden = true; S.quit = true; endGame(false); }); // abandon : écran de fin, puis retour au menu
$("againBtn").addEventListener("click", () => { if (NET.role === "guest") netLobbyBack(); $("end").hidden = true; $("hud").hidden = true; $("xpbar").hidden = true; for (const k of [1, 2, 3]) $("pp" + k).hidden = true; S = null; state = "menu"; $("start").hidden = false; refreshMoneyTag(); refreshLocks(); playTrack(null); });

