/* ====================================================================
   11-MAIN — Punto de entrada del juego
   ==================================================================== */

playCinematic().then(() => {
  try { handleSyncHash(); } catch(e){ console.warn(e); }
  render();
  animateParallax();
});