// === Init ===
document.getElementById('class-sel').addEventListener('change', updateLoadoutSel);
document.getElementById('loadout-sel').addEventListener('change', updateLoadoutSel);
document.getElementById('player-sel').addEventListener('change', updateLobbyDisplay);
document.getElementById('host-name').addEventListener('input', updateHostLobby);
updateLoadoutSel();

if (window.PQ_VIEWER) {
  RV.startViewer();
} else {
  setPhase('lobby');
  goToLobby();
  RV.installHost();
}

requestAnimationFrame(render);
