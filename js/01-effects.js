/* ====================================================================
   01-EFFECTS — Cinemática de arranque + parallax
   ==================================================================== */

function playCinematic(){
  return new Promise(resolve => {
    const cine = document.createElement('div');
    cine.id = 'cinematic';
    cine.innerHTML = `
      <div class="cine-line"></div>
      <div class="cine-text">${'HORARIO'.split('').map((c,i)=>`<span style="animation-delay:${i*0.08}s">${c}</span>`).join('')}</div>
      <div class="cine-sub">Agentes Alegando &amp; Alech</div>
      <div class="cine-stamp">CLASIFICADO</div>
      <div class="cine-flash"></div>`;
    document.body.appendChild(cine);
    setTimeout(() => {
      const l2 = document.createElement('div');
      l2.className = 'cine-text'; l2.style.marginTop = '-10px';
      l2.innerHTML = '4ºA ESO'.split('').map((c,i)=>`<span style="animation-delay:${i*0.08}s">${c}</span>`).join('');
      cine.insertBefore(l2, cine.querySelector('.cine-sub'));
    }, 900);
    setTimeout(() => {
      cine.querySelector('.cine-stamp').classList.add('hit');
      cine.querySelector('.cine-flash').classList.add('on');
    }, 2400);
    setTimeout(() => {
      cine.classList.add('gone');
      setTimeout(() => { cine.remove(); resolve(); }, 900);
    }, 3800);
  });
}

let mouseX=0, mouseY=0, currentX=0, currentY=0;
document.addEventListener('mousemove', e => {
  mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
  mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
});
function animateParallax(){
  currentX += (mouseX - currentX) * 0.08;
  currentY += (mouseY - currentY) * 0.08;
  document.querySelectorAll('.bg-layer').forEach(layer => {
    const depth = parseFloat(layer.dataset.depth) || 1;
    layer.style.transform = `translate3d(${-currentX*depth*18}px, ${-currentY*depth*18}px, 0)`;
  });
  ['menu','lobby','briefing','login-wrap','result'].forEach(cls => {
    const el = document.querySelector('.' + cls);
    if (el) el.style.transform = `translate3d(${currentX*8}px, ${currentY*8}px, 0)`;
  });
  requestAnimationFrame(animateParallax);
}