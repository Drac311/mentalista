/* ====================================================================
   ABOUT:BLANK / BLOB
   ==================================================================== */
var __ORIGINAL_HTML = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;

if (window.__clean || location.protocol === 'blob:'){
  document.addEventListener('DOMContentLoaded', function(){
    var b = document.getElementById('blank-btn');
    if (b) b.style.display = 'none';
  });
}
function openClean(){
  if (window.__clean || location.protocol === 'blob:'){
    alert('Ya estás en modo limpio.');
    return;
  }
  var html = __ORIGINAL_HTML;
  html = html.replace(/<head([^>]*)>/i, '<head$1><scr'+'ipt>window.__clean=true;<\/scr'+'ipt>');
  var blob = new Blob([html], { type:'text/html' });
  var url = URL.createObjectURL(blob);
  var w = window.open(url, '_blank');
  if (!w){ alert('Ventana emergente bloqueada.'); URL.revokeObjectURL(url); return; }
  setTimeout(function(){ try { URL.revokeObjectURL(url); } catch(e){} }, 8000);
  setTimeout(function(){ try { window.close(); } catch(e){} }, 500);
}

/* ====================================================================
   CINEMÁTICA
   ==================================================================== */
function playCinematic(){
  const cine = document.createElement('div');
  cine.id = 'cinematic';
  cine.innerHTML = `
    <div class="cine-line"></div>
    <div class="cine-text" id="cine-l1">${'HORARIO'.split('').map((c,i)=>`<span style="animation-delay:${i*0.08}s">${c}</span>`).join('')}</div>
    <div class="cine-sub fade-in-2" id="cine-sub">Agentes Alegando &amp; Alech</div>
    <div class="cine-stamp" id="cine-stamp">CLASIFICADO</div>
    <div class="cine-flash" id="cine-flash"></div>`;
  document.body.appendChild(cine);
  setTimeout(() => {
    const l2 = document.createElement('div');
    l2.className = 'cine-text';
    l2.style.marginTop = '-10px';
    l2.innerHTML = '4ºA ESO'.split('').map((c,i)=>`<span style="animation-delay:${i*0.08}s">${c}</span>`).join('');
    cine.insertBefore(l2, document.getElementById('cine-sub'));
  }, 900);
  setTimeout(() => {
    const st = document.getElementById('cine-stamp');
    const fl = document.getElementById('cine-flash');
    if (st) st.classList.add('hit');
    if (fl) fl.classList.add('on');
  }, 2400);
  setTimeout(() => {
    cine.classList.add('gone');
    setTimeout(() => cine.remove(), 900);
  }, 3800);
}

/* ====================================================================
   PARALLAX GENERAL
   ==================================================================== */
let mouseX=0, mouseY=0, currentX=0, currentY=0;
function updatePointer(cx, cy){
  mouseX = (cx / window.innerWidth - 0.5) * 2;
  mouseY = (cy / window.innerHeight - 0.5) * 2;
}
document.addEventListener('mousemove', e => updatePointer(e.clientX, e.clientY));
document.addEventListener('touchmove', e => {
  if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

function animateParallax(){
  currentX += (mouseX - currentX) * 0.08;
  currentY += (mouseY - currentY) * 0.08;
  document.querySelectorAll('.bg-layer').forEach(layer => {
    const depth = parseFloat(layer.dataset.depth) || 1;
    layer.style.transform = `translate3d(${-currentX*depth*18}px, ${-currentY*depth*18}px, 0)`;
  });
  ['menu','lobby','briefing'].forEach(cls => {
    const el = document.querySelector('.' + cls);
    if (el) el.style.transform = `translate3d(${currentX*10}px, ${currentY*10}px, 0) rotateX(${currentY*-3}deg) rotateY(${currentX*3}deg)`;
  });
  const game = document.querySelector('.game');
  if (game){
    const main = game.querySelector('.main');
    if (main) main.style.transform = `translate3d(${currentX*4}px, ${currentY*4}px, 0)`;
    const tb = game.querySelector('.topbar');
    if (tb) tb.style.transform = `translate3d(${currentX*3}px, 0, 0)`;
  }
  requestAnimationFrame(animateParallax);
}

function applyTiltToElements(selector){
  document.querySelectorAll(selector).forEach(el => {
    if (el._tiltBound) return;
    el._tiltBound = true;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(y-0.5)*-18}deg) rotateY(${(x-0.5)*18}deg) translateZ(14px) scale(1.03)`;
      el.style.setProperty('--mx', (x*100)+'%');
      el.style.setProperty('--my', (y*100)+'%');
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

/* ====================================================================
   MOTOR 3D — Helpers
   ==================================================================== */

// Crea una caja 3D real con 6 caras.
// Centrada en (x,y,z). Opcionalmente rotada.
function box3d(w, h, d, colors, opts){
  opts = opts || {};
  const x = opts.x||0, y = opts.y||0, z = opts.z||0;
  const rx = opts.rx||0, ry = opts.ry||0, rz = opts.rz||0;
  const c = typeof colors === 'string' ? {all:colors} : colors;
  const F = c.front  || c.all || '#2a2a30';
  const B = c.back   || c.all || '#1c1c22';
  const L = c.left   || c.all || '#232329';
  const R = c.right  || c.all || '#232329';
  const T = c.top    || c.all || '#3a3a42';
  const Bo= c.bottom || c.all || '#0f0f12';
  const tf = `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
  return `<div class="box3d" style="transform:${tf}">
    <div class="face" style="width:${w}px;height:${h}px;background:${F};transform:translate3d(${-w/2}px,${-h/2}px,${d/2}px)"></div>
    <div class="face" style="width:${w}px;height:${h}px;background:${B};transform:translate3d(${-w/2}px,${-h/2}px,${-d/2}px) rotateY(180deg)"></div>
    <div class="face" style="width:${d}px;height:${h}px;background:${R};transform:translate3d(${w/2-d/2}px,${-h/2}px,0) rotateY(90deg)"></div>
    <div class="face" style="width:${d}px;height:${h}px;background:${L};transform:translate3d(${-w/2-d/2}px,${-h/2}px,0) rotateY(-90deg)"></div>
    <div class="face" style="width:${w}px;height:${d}px;background:${T};transform:translate3d(${-w/2}px,${-h/2-d/2}px,0) rotateX(90deg)"></div>
    <div class="face" style="width:${w}px;height:${d}px;background:${Bo};transform:translate3d(${-w/2}px,${h/2-d/2}px,0) rotateX(-90deg)"></div>
  </div>`;
}

function group3d(children, opts){
  opts = opts || {};
  const x = opts.x||0, y = opts.y||0, z = opts.z||0;
  const rx = opts.rx||0, ry = opts.ry||0, rz = opts.rz||0;
  const tf = `translate3d(${x}px,${y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`;
  return `<div class="group3d" style="transform:${tf}">${children}</div>`;
}

/* ====================================================================
   MUEBLES 3D — cada uno es una función que devuelve HTML
   ==================================================================== */

// Escritorio de madera con cajones
function propDesk(){
  const wood = {all:'#5a3a20', top:'#6a4628', bottom:'#3a2410'};
  const woodDark = {all:'#3a2410', top:'#4a2f18'};
  return group3d([
    // Tablero
    box3d(220, 12, 100, wood, {y:-72}),
    // Faldón frontal
    box3d(220, 40, 8, woodDark, {y:-46, z:46}),
    // Patas
    box3d(14, 72, 14, woodDark, {x:-100, y:-36, z:40}),
    box3d(14, 72, 14, woodDark, {x:100, y:-36, z:40}),
    box3d(14, 72, 14, woodDark, {x:-100, y:-36, z:-40}),
    box3d(14, 72, 14, woodDark, {x:100, y:-36, z:-40}),
    // Cajones
    box3d(60, 8, 60, woodDark, {x:-70, y:-56, z:0}),
    box3d(60, 8, 60, woodDark, {x:-70, y:-44, z:0}),
  ]);
}

// Silla de madera
function propChair(){
  const w = {all:'#4a2f18', top:'#5a3a20'};
  return group3d([
    box3d(52, 8, 52, w, {y:-46}),
    box3d(52, 60, 8, w, {y:-78, z:-22}),
    box3d(8, 46, 8, w, {x:-22, y:-23, z:22}),
    box3d(8, 46, 8, w, {x:22, y:-23, z:22}),
    box3d(8, 46, 8, w, {x:-22, y:-23, z:-22}),
    box3d(8, 46, 8, w, {x:22, y:-23, z:-22}),
  ]);
}

// Estantería con libros de colores
function propBookshelf(){
  const shelfWood = {all:'#3a2410', top:'#4a2f18'};
  const shelf = (y) => `
    <div class="box3d" style="transform:translate3d(0,${y}px,0)">
      <div class="face" style="width:280px;height:10px;background:#4a2f18;transform:translate3d(-140px,-5px,10px)"></div>
      <div class="face" style="width:280px;height:10px;background:#2a1a08;transform:translate3d(-140px,-5px,-10px) rotateY(180deg)"></div>
      <div class="face" style="width:20px;height:10px;background:#3a2410;transform:translate3d(130px,-5px,0) rotateY(90deg)"></div>
      <div class="face" style="width:20px;height:10px;background:#3a2410;transform:translate3d(-140px,-5px,0) rotateY(-90deg)"></div>
      <div class="face" style="width:280px;height:20px;background:#5a3a20;transform:translate3d(-140px,-15px,0) rotateX(90deg)"></div>
    </div>`;
  // Libros por balda
  const bookColors = ['#7a2a1a','#2a4a3a','#5a5a1a','#4a1a2a','#1a3a5a','#6a4a1a','#3a1a4a','#2a5a4a','#5a3a5a','#4a3a2a'];
  const shelfBooks = (y) => {
    let books = '';
    let x = -125;
    while (x < 125){
      const bw = 8 + Math.random()*6|0;
      const bh = 40 + Math.random()*30|0;
      const col = bookColors[Math.floor(Math.random()*bookColors.length)];
      books += box3d(bw, bh, 22, {all:col, top:'#000', bottom:'#000'},
                     {x:x+bw/2, y: y - bh/2, z: 0});
      x += bw + 2;
    }
    return books;
  };
  return group3d([
    // Marco
    box3d(20, 300, 24, shelfWood, {x:-140, y:-150}),
    box3d(20, 300, 24, shelfWood, {x:140, y:-150}),
    box3d(300, 22, 24, shelfWood, {y:-11}),
    box3d(300, 22, 24, shelfWood, {y:-289}),
    box3d(280, 10, 22, shelfWood, {y:-100}),
    box3d(280, 10, 22, shelfWood, {y:-200}),
    shelfBooks(-30),
    shelfBooks(-130),
    shelfBooks(-230)
  ]);
}

// Cama con colchón, sábanas, almohada y cabecero
function propBed(){
  const wood = {all:'#4a2f18', top:'#5a3a20'};
  return group3d([
    // Cabecero
    box3d(200, 100, 20, wood, {y:-150, z:-110}),
    // Base
    box3d(200, 30, 220, wood, {y:-35}),
    // Colchón
    box3d(196, 30, 216, {all:'#c8b8a0', top:'#d8c8b0'}, {y:-65}),
    // Sábana superior
    box3d(196, 6, 200, {all:'#8a8a9a', top:'#a8a8b8'}, {y:-83, z:10}),
    // Manta
    box3d(196, 4, 100, {all:'#5a1e1e', top:'#6a2828'}, {y:-86, z:60}),
    // Almohada
    box3d(80, 20, 40, {all:'#e8e0d0', top:'#f8f0e0'}, {x:-50, y:-90, z:-90}),
    box3d(80, 20, 40, {all:'#e8e0d0', top:'#f8f0e0'}, {x:50, y:-90, z:-90}),
  ]);
}

// Mesilla de noche
function propNightstand(){
  const wood = {all:'#4a2f18', top:'#5a3a20'};
  return group3d([
    box3d(50, 12, 50, wood, {y:-56}),
    box3d(50, 44, 46, wood, {y:-30}),
    box3d(46, 6, 6, {all:'#2a1a08'}, {y:-30, z:24}),
  ]);
}

// Armario alto
function propWardrobe(){
  const wood = {all:'#3a2410', top:'#4a2f18', front:'#4a2f18'};
  return group3d([
    box3d(140, 260, 70, wood, {y:-130}),
    // Tiradores
    box3d(6, 20, 4, {all:'#8a6a2a', top:'#a8884a'}, {x:-10, y:-130, z:36}),
    box3d(6, 20, 4, {all:'#8a6a2a', top:'#a8884a'}, {x:10, y:-130, z:36}),
  ]);
}

// Sofá
function propSofa(){
  return group3d([
    box3d(220, 50, 90, {all:'#4a2a2a', top:'#5a3a3a'}, {y:-55, z:20}),
    box3d(220, 70, 20, {all:'#5a3a3a', top:'#6a4a4a'}, {y:-105, z:-30}),
    box3d(20, 70, 90, {all:'#4a2a2a', top:'#5a3a3a'}, {x:-110, y:-85, z:10}),
    box3d(20, 70, 90, {all:'#4a2a2a', top:'#5a3a3a'}, {x:110, y:-85, z:10}),
  ]);
}

// Lámpara de pie
function propFloorLamp(){
  return group3d([
    box3d(20, 4, 20, {all:'#1a1a1e'}, {y:-2}),
    box3d(6, 160, 6, {all:'#2a2a30'}, {y:-84}),
    // Pantalla
    box3d(70, 50, 70, {
      all:'#f0c75e', top:'#ffe08a', bottom:'#d4a017',
      front:'#ffe08a', back:'#e0b04a', left:'#e0b04a', right:'#e0b04a'
    }, {y:-190}),
  ]);
}

// Lámpara de mesa
function propTableLamp(){
  return group3d([
    box3d(24, 4, 24, {all:'#1a1a1e'}, {y:-2}),
    box3d(4, 40, 4, {all:'#2a2a30'}, {y:-24}),
    box3d(40, 30, 40, {
      all:'#f0c75e', top:'#ffe08a', bottom:'#d4a017',
      front:'#ffe08a', back:'#e0b04a', left:'#e0b04a', right:'#e0b04a'
    }, {y:-60}),
  ]);
}

// Planta de interior
function propPlant(){
  const leafColors = ['#2a5a2a','#3a6a3a','#1a4a1a','#4a7a3a','#3a5a2a'];
  let leaves = '';
  for (let i=0;i<16;i++){
    const ang = Math.random()*360;
    const r = 20 + Math.random()*30;
    const h = -30 - Math.random()*50;
    const col = leafColors[Math.floor(Math.random()*leafColors.length)];
    leaves += box3d(10+Math.random()*8, 40+Math.random()*30, 4, {all:col},
                    {x: Math.cos(ang)*r*0.5, y:h, z: Math.sin(ang)*r*0.5, ry: ang});
  }
  return group3d([
    box3d(50, 50, 50, {all:'#5a3a20', top:'#6a4628'}, {y:-25}),
    box3d(40, 8, 40, {all:'#1a0f08'}, {y:-46}),
    leaves
  ]);
}

// Cuadro en pared
function propPainting(){
  return `<div class="box3d" style="transform:translate3d(0,-180,0)">
    <div class="face" style="width:180px;height:130px;background:linear-gradient(135deg,#c9a86a,#7a5c2e 40%,#3a2a14);border:6px solid #4a3d22;box-shadow:0 4px 20px rgba(0,0,0,.8),inset 0 0 30px rgba(0,0,0,.5);transform:translate3d(-90px,-65px,10px)"></div>
  </div>`;
}

// Cuadro pequeño en pared
function propSmallPainting(){
  return `<div class="box3d" style="transform:translate3d(0,-160,0)">
    <div class="face" style="width:100px;height:80px;background:linear-gradient(135deg,#8a5a3a,#3a2a14);border:5px solid #4a3d22;box-shadow:0 4px 16px rgba(0,0,0,.7);transform:translate3d(-50px,-40px,8px)"></div>
  </div>`;
}

// Reloj de pared
function propClock(){
  return `<div class="box3d" style="transform:translate3d(0,-200,0)">
    <div class="face" style="width:80px;height:80px;background:radial-gradient(circle,#e8e0d0,#a89878);border:6px solid #4a3d22;border-radius:50%;box-shadow:0 4px 20px rgba(0,0,0,.7),inset 0 0 10px rgba(0,0,0,.3);transform:translate3d(-40px,-40px,10px);position:relative;overflow:hidden;">
      <div style="position:absolute;top:50%;left:50%;width:2px;height:26px;background:#1a1a1e;transform:translate(-50%,-100%) rotate(45deg);transform-origin:bottom"></div>
      <div style="position:absolute;top:50%;left:50%;width:3px;height:20px;background:#3a2a14;transform:translate(-50%,-100%) rotate(160deg);transform-origin:bottom"></div>
    </div>
  </div>`;
}

// Ventana en pared (para incrustar en una pared concreta)
function windowDecor(w, h, x, y){
  return `
    <div style="position:absolute;top:${y}px;left:${x}px;width:${w}px;height:${h}px;
      background:linear-gradient(180deg,#1a2035 0%,#0c1220 70%,#050810 100%);
      border:6px solid #4a3d22;box-shadow:inset 0 0 40px rgba(0,0,0,.9),0 6px 20px rgba(0,0,0,.6),0 0 40px rgba(120,160,255,.08);">
      <div style="position:absolute;top:50%;left:0;right:0;height:2px;background:#4a3d22;"></div>
      <div style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:#4a3d22;"></div>
      <div style="position:absolute;top:16px;right:24px;width:22px;height:22px;border-radius:50%;
        background:radial-gradient(circle,#f0e8d8,#a89878);
        box-shadow:0 0 20px rgba(240,232,216,.6);"></div>
    </div>`;
}

// Puerta
function doorDecor(w, h, x, y){
  return `
    <div style="position:absolute;top:${y}px;left:${x}px;width:${w}px;height:${h}px;
      background:linear-gradient(180deg,#3a2410,#1e1409);
      border:5px solid #2a1a08;
      box-shadow:inset 0 0 30px rgba(0,0,0,.8);">
      <div style="position:absolute;top:50%;right:12px;width:8px;height:8px;border-radius:50%;
        background:radial-gradient(circle,#c9a86a,#7a5c2e);
        box-shadow:0 0 8px rgba(212,160,23,.6);"></div>
    </div>`;
}

/* ====================================================================
   CUERPO DEL FALLECIDO (silueta con volumen 3D)
   ==================================================================== */
function propCorpse(){
  const tiza = {all:'rgba(230,228,220,.85)', top:'rgba(240,238,230,.9)'};
  const sangre = {all:'rgba(90,10,8,.75)'};
  const sangreOsc = {all:'rgba(60,6,5,.85)'};
  // El cuerpo yace en el suelo: acostado sobre el plano XY, eje Z hacia arriba
  // Torso: 60x40 caja aplanada a ras de suelo
  return group3d([
    // Mancha de sangre bajo el cuerpo
    `<div class="blood3d" style="--bx:-140px;--bz:-30px;--bw:260px;--bh:200px"></div>`,
    // Cabeza
    box3d(44, 50, 44, tiza, {y:-25, z:-90}),
    // Cuello
    box3d(24, 12, 24, tiza, {y:-6, z:-50}),
    // Torso
    box3d(70, 24, 130, tiza, {y:-12, z:10}),
    // Brazo izquierdo
    box3d(20, 18, 90, tiza, {x:-60, y:-9, z:20, rz:-25}),
    box3d(20, 18, 80, tiza, {x:-110, y:-9, z:55, rz:-40}),
    // Brazo derecho
    box3d(20, 18, 90, tiza, {x:60, y:-9, z:20, rz:25}),
    box3d(20, 18, 80, tiza, {x:110, y:-9, z:55, rz:40}),
    // Piernas
    box3d(26, 24, 120, tiza, {x:-22, y:-12, z:140, rz:-3}),
    box3d(26, 24, 120, tiza, {x:22, y:-12, z:140, rz:3}),
    // Pies
    box3d(26, 30, 20, tiza, {x:-22, y:-10, z:210}),
    box3d(26, 30, 20, tiza, {x:22, y:-10, z:210}),
    // Manchas de sangre sueltas
    box3d(30, 3, 40, sangre, {x:-160, y:-1, z:40}),
    box3d(40, 3, 40, sangre, {x:170, y:-1, z:-20}),
    box3d(25, 3, 25, sangreOsc, {x:-120, y:-1, z:-100}),
    box3d(35, 3, 35, sangre, {x:150, y:-1, z:120}),
  ]);
}

/* ====================================================================
   PLANTILLAS DE HABITACIÓN
   ==================================================================== */

// Pared trasera decorada
function buildWallBack(decor){
  return `<div class="wall3d" style="width:1000px;height:350px;
    transform:translate3d(-500px,-350px,-500px);
    background:
      repeating-linear-gradient(90deg,rgba(0,0,0,.06) 0 2px,transparent 2px 48px),
      linear-gradient(180deg,#2a2419 0%,#1a160f 60%,#0f0d08 100%);">
    ${decor||''}
  </div>`;
}
function buildWallLeft(decor){
  return `<div class="wall3d" style="width:1000px;height:350px;
    transform:translate3d(-500px,-350px,500px) rotateY(90deg);
    background:
      repeating-linear-gradient(0deg,rgba(0,0,0,.05) 0 2px,transparent 2px 38px),
      linear-gradient(180deg,#1f1a22 0%,#131018 60%,#0a080d 100%);">
    ${decor||''}
  </div>`;
}
function buildWallRight(decor){
  return `<div class="wall3d" style="width:1000px;height:350px;
    transform:translate3d(500px,-350px,-500px) rotateY(-90deg);
    background:
      repeating-linear-gradient(90deg,rgba(0,0,0,.07) 0 2px,transparent 2px 32px),
      linear-gradient(180deg,#1d1a14 0%,#12100b 60%,#08070a 100%);">
    ${decor||''}
  </div>`;
}

// Habitación base con suelo, techo y 3 paredes
function buildRoomBase(decorBack, decorLeft, decorRight){
  return `
    <div class="floor3d"></div>
    <div class="ceiling3d"></div>
    ${buildWallBack(decorBack)}
    ${buildWallLeft(decorLeft)}
    ${buildWallRight(decorRight)}
  `;
}

/* ====================================================================
   ESCENAS POR CASO (según c.sceneType)
   ==================================================================== */

function sceneDespacho(){
  const decorBack =
    propPainting() +
    propClock();
  const decorLeft =
    windowDecor(280, 190, 360, 60);
  const decorRight =
    doorDecor(120, 300, 80, 40);
  return buildRoomBase(decorBack, decorLeft, decorRight) + `
    <div class="rug3d"></div>
    ${group3d(propDesk(), {x:-120, y:0, z:-380, ry:180})}
    ${group3d(propChair(), {x:-120, y:0, z:-250, ry:180})}
    ${group3d(propBookshelf(), {x:320, y:0, z:-420, ry:-90})}
    ${group3d(propTableLamp(), {x:-30, y:-84, z:-360})}
    ${group3d(propPlant(), {x:-380, y:0, z:-380})}
    ${propCorpse()}
  `;
}

function sceneDormitorio(){
  const decorBack =
    propPainting();
  const decorLeft =
    windowDecor(280, 190, 360, 60);
  const decorRight =
    doorDecor(120, 300, 400, 40);
  return buildRoomBase(decorBack, decorLeft, decorRight) + `
    <div class="rug3d" style="--bw:400px;--bh:280px"></div>
    ${group3d(propBed(), {x:-260, y:0, z:-380, ry:0})}
    ${group3d(propNightstand(), {x:-30, y:0, z:-480})}
    ${group3d(propTableLamp(), {x:-30, y:-68, z:-480})}
    ${group3d(propWardrobe(), {x:340, y:0, z:-380, ry:180})}
    ${group3d(propPlant(), {x:-420, y:0, z:200})}
    ${propCorpse()}
  `;
}

function sceneBiblioteca(){
  const decorBack = propSmallPainting() + propClock();
  const decorLeft = windowDecor(280, 190, 360, 60);
  const decorRight = doorDecor(120, 300, 400, 40);
  return buildRoomBase(decorBack, decorLeft, decorRight) + `
    <div class="rug3d"></div>
    ${group3d(propBookshelf(), {x:-340, y:0, z:-420})}
    ${group3d(propBookshelf(), {x:-40, y:0, z:-420})}
    ${group3d(propBookshelf(), {x:260, y:0, z:-420})}
    ${group3d(propBookshelf(), {x:-420, y:0, z:-100, ry:90})}
    ${group3d(propDesk(), {x:0, y:0, z:60, ry:0})}
    ${group3d(propChair(), {x:0, y:0, z:180, ry:180})}
    ${group3d(propTableLamp(), {x:-80, y:-84, z:60})}
    ${propCorpse()}
  `;
}

function sceneExterior(){
  // Sin paredes, pero con árboles, banco, farola
  const tree = (x,z,scale) => group3d([
    box3d(30*scale, 200*scale, 30*scale, {all:'#3a2410', top:'#4a2f18'}, {y:-100*scale}),
    box3d(180*scale, 160*scale, 180*scale, {all:'#1a3a1a', top:'#2a4a2a', bottom:'#0a1f0a'}, {y:-240*scale}),
  ], {x, y:0, z});
  const decorLeft = windowDecor(280, 190, 360, 60);
  return `
    <div class="floor3d" style="
      background:
        repeating-linear-gradient(45deg,rgba(0,0,0,.08) 0 2px,transparent 2px 60px),
        linear-gradient(180deg,#2a3a1a,#0f1a08);
    "></div>
    <div class="ceiling3d" style="background:linear-gradient(180deg,#0a0a15,#02020a);box-shadow:inset 0 0 400px rgba(0,0,0,1)"></div>
    ${buildWallBack('')}
    ${buildWallLeft(decorLeft)}
    ${tree(-380, -420, 1.2)}
    ${tree(320, -430, 1.0)}
    ${tree(-450, 100, 0.9)}
    ${group3d(propSofa(), {x:200, y:0, z:280, ry:-30})}
    ${group3d(propFloorLamp(), {x:380, y:0, z:180})}
    ${propCorpse()}
  `;
}

function sceneTeatro(){
  // Escenario de teatro: fondo de terciopelo, bambalinas
  const curtainBack = `
    <div class="wall3d" style="width:1200px;height:400px;
      transform:translate3d(-600px,-400px,-500px);
      background:
        repeating-linear-gradient(90deg,
          rgba(0,0,0,.4) 0 6px,
          rgba(120,20,20,.85) 6px 20px,
          rgba(0,0,0,.5) 20px 26px,
          rgba(150,30,30,.75) 26px 42px);
      box-shadow:inset 0 0 200px rgba(0,0,0,.95);"></div>`;
  const curtainLeft = `
    <div class="wall3d" style="width:1200px;height:400px;
      transform:translate3d(-600px,-400px,600px) rotateY(90deg);
      background:repeating-linear-gradient(0deg,rgba(0,0,0,.4) 0 6px,rgba(120,20,20,.85) 6px 20px,rgba(0,0,0,.5) 20px 26px,rgba(150,30,30,.75) 26px 42px);"></div>`;
  const curtainRight = `
    <div class="wall3d" style="width:1200px;height:400px;
      transform:translate3d(600px,-400px,-600px) rotateY(-90deg);
      background:repeating-linear-gradient(90deg,rgba(0,0,0,.4) 0 6px,rgba(120,20,20,.85) 6px 20px,rgba(0,0,0,.5) 20px 26px,rgba(150,30,30,.75) 26px 42px);"></div>`;
  return `
    <div class="floor3d" style="
      background:
        repeating-linear-gradient(90deg,rgba(0,0,0,.3) 0 4px,transparent 4px 100px),
        repeating-linear-gradient(0deg,rgba(40,20,10,.5) 0 8px,rgba(60,30,15,.55) 8px 140px),
        linear-gradient(180deg,#2a1a0e,#0f0804);
      box-shadow:inset 0 0 300px rgba(0,0,0,.95);
    "></div>
    <div class="ceiling3d" style="background:linear-gradient(180deg,#0a0000,#000)"></div>
    ${curtainBack}
    ${curtainLeft}
    ${curtainRight}
    ${group3d(propChair(), {x:-200, y:0, z:-260, ry:200})}
    ${group3d(propDesk(), {x:150, y:0, z:-350, ry:180})}
    ${group3d(propTableLamp(), {x:150, y:-84, z:-380})}
    ${group3d(propPlant(), {x:-380, y:0, z:-380})}
    ${propCorpse()}
  `;
}

const SCENE_TEMPLATES = {
  despacho: sceneDespacho,
  dormitorio: sceneDormitorio,
  biblioteca: sceneBiblioteca,
  exterior: sceneExterior,
  teatro: sceneTeatro
};

/* ====================================================================
   RENDER ESCENA 3D
   ==================================================================== */

const HOTSPOT_LAYOUT = [
  {x:-360, y:-20, z:-420}, // sobre pared izquierda, cerca
  {x:  0,  y:-20, z:-460}, // sobre pared trasera, centro
  {x: 360,  y:-20, z:-420}, // sobre pared derecha
  {x:-260,  y:-20, z: 100}, // suelo izquierda
  {x: 260,  y:-20, z: 100}, // suelo derecha
  {x:  0,   y:-20, z: 200}, // suelo centro
  {x:-260,  y:-20, z:-200}, // suelo izquierda cerca
  {x: 260,  y:-20, z:-200}  // suelo derecha cerca
];

function renderScene3D(c, g){
  const type = c.sceneType || 'despacho';
  const buildScene = SCENE_TEMPLATES[type] || sceneDespacho;

  // Hotspots interactivos
  const hotspots = c.objects.map((o, i) => {
    const p = HOTSPOT_LAYOUT[i % HOTSPOT_LAYOUT.length];
    const examined = g.examined.includes(o.id);
    return `
      <div class="hotspot ${examined?'examined':''}"
           data-obj="${o.id}"
           style="--x:${p.x}px; --y:${p.y}px; --z:${p.z}px">
        <div class="hs-body">
          <span class="hs-icon">${o.icon}</span>
        </div>
        <div class="hs-label">${esc(o.name)}</div>
      </div>`;
  }).join('');

  return `
    <div class="scene-3d" id="scene3d">
      <div class="scene-space" id="sceneSpace">
        ${buildScene()}
        ${hotspots}
      </div>
      <div class="scene-title-3d">▸ ${esc(c.location)} · ESCENA 3D</div>
      <div class="scene-view-btns">
        <button data-view="iso">◱ ISO</button>
        <button data-view="front">▤ FRONTAL</button>
        <button data-view="top">▣ PLANTA</button>
      </div>
      <div class="scene-hint">↔ ARRASTRA PARA ORBITAR · RUEDA PARA ZOOM</div>
    </div>`;
}

/* ====================================================================
   CONTROLES DE CÁMARA
   ==================================================================== */
const camState = {
  dragging:false,
  startX:0, startY:0,
  yaw:-30, pitch:-20, zoom:-900,
  startYaw:-30, startPitch:-20,
  spaceEl:null
};

function applyCam(){
  if (!camState.spaceEl) return;
  camState.spaceEl.style.setProperty('--yaw', camState.yaw + 'deg');
  camState.spaceEl.style.setProperty('--pitch', camState.pitch + 'deg');
  camState.spaceEl.style.setProperty('--zoom', camState.zoom + 'px');
  document.querySelectorAll('.hotspot').forEach(el => {
    el.style.setProperty('--yaw', camState.yaw + 'deg');
    el.style.setProperty('--pitch', camState.pitch + 'deg');
  });
}

function onCamDown(e){
  if (e.target.closest('.hotspot')) return;
  if (e.target.closest('.scene-view-btns')) return;
  camState.dragging = true;
  const p = e.touches ? e.touches[0] : e;
  camState.startX = p.clientX;
  camState.startY = p.clientY;
  camState.startYaw = camState.yaw;
  camState.startPitch = camState.pitch;
}
function onCamMove(e){
  if (!camState.dragging) return;
  const p = e.touches ? e.touches[0] : e;
  const dx = p.clientX - camState.startX;
  const dy = p.clientY - camState.startY;
  camState.yaw = camState.startYaw + dx * 0.5;
  camState.pitch = Math.max(-85, Math.min(30, camState.startPitch - dy * 0.35));
  applyCam();
}
function onCamUp(){ camState.dragging = false; }

document.addEventListener('mousemove', onCamMove);
document.addEventListener('mouseup', onCamUp);
document.addEventListener('touchmove', onCamMove, {passive:true});
document.addEventListener('touchend', onCamUp);

function bindSceneControls(onObjectClick){
  const el = document.getElementById('scene3d');
  if (!el) return;
  const space = document.getElementById('sceneSpace');
  camState.yaw = -30;
  camState.pitch = -20;
  camState.zoom = -900;
  camState.spaceEl = space;
  applyCam();

  el.addEventListener('mousedown', onCamDown);
  el.addEventListener('touchstart', onCamDown, {passive:true});
  el.addEventListener('wheel', e => {
    e.preventDefault();
    camState.zoom = Math.max(-1800, Math.min(-400, camState.zoom - e.deltaY * 0.8));
    applyCam();
  }, {passive:false});

  // Botones de vista
  el.querySelectorAll('.scene-view-btns button').forEach(btn => {
    btn.onclick = e => {
      e.stopPropagation();
      const v = btn.dataset.view;
      if (v === 'iso'){ camState.yaw = -30; camState.pitch = -20; camState.zoom = -900; }
      if (v === 'front'){ camState.yaw = 0; camState.pitch = 0; camState.zoom = -750; }
      if (v === 'top'){ camState.yaw = 0; camState.pitch = -85; camState.zoom = -1100; }
      applyCam();
    };
  });

  // Objetos examinables
  el.querySelectorAll('.hotspot').forEach(hs => {
    hs.addEventListener('click', e => {
      e.stopPropagation();
      onObjectClick(hs.dataset.obj);
    });
  });
}

/* ====================================================================
   ESTADO / RANKS / SOLVED
   ==================================================================== */
const LS = {
  get pid(){ let v=localStorage.getItem('ec_pid'); if(!v){v='p_'+Math.random().toString(36).slice(2,10);localStorage.setItem('ec_pid',v);} return v; },
  get name(){ return localStorage.getItem('ec_name')||''; },
  set name(v){ localStorage.setItem('ec_name',v); },
  get role(){ return localStorage.getItem('ec_role')||'auto'; },
  set role(v){ localStorage.setItem('ec_role',v); }
};
const SOLVED = {
  get all(){ try { return JSON.parse(localStorage.getItem('ec_solved')||'[]'); } catch(e){ return []; } },
  has(id){ return this.all.includes(id); },
  add(id){ const a=this.all; if(!a.includes(id)){ a.push(id); localStorage.setItem('ec_solved', JSON.stringify(a)); } },
  count(){ return this.all.length; }
};
function getCurrentRank(n){
  let r = RANKS[0];
  for (const rank of RANKS) if (n >= rank.minSolved) r = rank;
  return r;
}
function getNextRank(n){
  for (const rank of RANKS) if (n < rank.minSolved) return rank;
  return null;
}

const state = {
  view:'menu', filter:'TODOS', roomId:'', caseId:'',
  playerId: LS.pid, playerName: LS.name, playerRole: LS.role,
  isHost:false, peer:null, conn:null,
  game:null, localView:{type:'scene'},
  status:null, statusErr:false, rankUpTo:null
};

const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function genCode(){ const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }

function render(){
  if (state.view === 'menu') return renderMenu();
  if (state.view === 'briefing') return renderBriefing();
  if (state.view === 'lobby') return renderLobby();
  if (state.view === 'result') return renderResult();
  return renderGame();
}

/* ====================================================================
   MENÚ
   ==================================================================== */
function renderMenu(){
  const counts = { 'FÁCIL':0, 'MEDIA':0, 'DIFÍCIL':0 };
  CASES.forEach(c => { if (counts[c.difficulty] != null) counts[c.difficulty]++; });
  const filtered = state.filter === 'TODOS' ? CASES : CASES.filter(c => c.difficulty === state.filter);
  const solvedTotal = SOLVED.count();
  const rank = getCurrentRank(solvedTotal);
  const next = getNextRank(solvedTotal);
  const pct = next ? Math.min(100, Math.round((solvedTotal - rank.minSolved) / (next.minSolved - rank.minSolved) * 100)) : 100;

  app.innerHTML = `
    <div class="menu">
      <div class="menu-header">
        <div class="stamp">CONFIDENCIAL</div>
        <div class="subtitle">Horario 4ºA ESO</div>
        <h1>Archivo de Casos</h1>
        <div class="agents">Agentes Alegando &amp; Alech</div>
        <div class="rank-card">
          <div class="rank-badge">${rank.icon}</div>
          <div class="rank-info">
            <div class="rank-name">${esc(rank.name)}</div>
            <div class="rank-desc">${esc(rank.desc)}</div>
            <div class="rank-progress"><div class="rank-progress-fill" style="width:${pct}%"></div></div>
            <div class="rank-progress-text">
              ${next ? `${solvedTotal} / ${next.minSolved} → ${esc(next.name)} ${next.icon}` : 'RANGO MÁXIMO'}
            </div>
          </div>
        </div>
        <div class="menu-progress">
          <span>RESUELTOS <b>${solvedTotal}</b> / ${CASES.length}</span>
          <span>FÁCIL <b>${counts.FÁCIL}</b></span>
          <span>MEDIA <b>${counts.MEDIA}</b></span>
          <span>DIFÍCIL <b>${counts.DIFÍCIL}</b></span>
        </div>
      </div>
      <div class="filter-bar">
        <button class="filter-btn ${state.filter==='TODOS'?'active':''}" data-diff="TODOS">TODOS (${CASES.length})</button>
        <button class="filter-btn ${state.filter==='FÁCIL'?'active':''}" data-diff="FÁCIL">FÁCIL (${counts.FÁCIL})</button>
        <button class="filter-btn ${state.filter==='MEDIA'?'active':''}" data-diff="MEDIA">MEDIA (${counts.MEDIA})</button>
        <button class="filter-btn ${state.filter==='DIFÍCIL'?'active':''}" data-diff="DIFÍCIL">DIFÍCIL (${counts.DIFÍCIL})</button>
      </div>
      <div class="menu-section-title">${state.filter === 'TODOS' ? 'Todos los casos' : `Casos ${state.filter}`} (${filtered.length})</div>
      <div class="cases-grid">
        ${filtered.map(c => `
          <div class="case-card ${SOLVED.has(c.id)?'solved':''}" data-case="${c.id}">
            <div class="num">
              <span>${c.num}</span>
              <span class="diff" data-diff="${c.difficulty}">${c.difficulty}</span>
            </div>
            <h3>${esc(c.title)}</h3>
            <div class="meta">
              <b>📍</b> ${esc(c.location)}<br>
              <b>🕐</b> ${esc(c.time)}<br>
              <b>☠️</b> ${esc(c.victim)}
            </div>
            <div class="btn-play">${SOLVED.has(c.id)?'REJUGAR':'ABRIR EXPEDIENTE'}</div>
          </div>
        `).join('')}
      </div>
    </div>`;

  document.querySelectorAll('.filter-btn').forEach(b => {
    b.onclick = () => { state.filter = b.dataset.diff; renderMenu(); };
  });
  applyTiltToElements('.case-card');
  document.querySelectorAll('.case-card').forEach(card => {
    card.addEventListener('click', () => {
      state.caseId = card.dataset.case;
      state.view = 'briefing';
      render();
    });
  });
}

/* ====================================================================
   BRIEFING
   ==================================================================== */
function renderBriefing(){
  const c = CASES.find(x => x.id === state.caseId);
  if (!c) return renderMenu();
  const sup = SUPERIORS[c.superior] || SUPERIORS.lisboa;
  const solved = SOLVED.count();
  const rank = getCurrentRank(solved);

  const messages = {
    'FÁCIL': [
      `Agentes, un caso sencillo para empezar. Confío en que lo cerréis rápido.`,
      `Nuevo caso. Nada complejo, pero no bajéis la guardia.`
    ],
    'MEDIA': [
      `Este caso es más delicado. Hay varios sospechosos con motivos. No quiero errores.`,
      `Es más complejo de lo que parece. Escuchad, examinad, no os fiéis de nadie.`
    ],
    'DIFÍCIL': [
      `Caso de máxima prioridad. El asesino es meticuloso. Si falláis, lo pagaréis caro.`,
      `Este es de los que aparecen en los periódicos. Necesito una resolución limpia.`
    ]
  };
  const pool = messages[c.difficulty] || messages.MEDIA;
  const message = pool[Math.floor(c.num.charCodeAt(c.num.length-1) % pool.length)];

  app.innerHTML = `
    <div class="briefing">
      <button class="btn-back" id="btn-back">← VOLVER AL ARCHIVO</button>
      <div class="briefing-card">
        <div class="briefing-header">
          <div class="briefing-avatar">${sup.icon}</div>
          <div class="briefing-meta">
            <div class="briefing-name">${esc(sup.name)}</div>
            <div class="briefing-role">${esc(sup.role)}</div>
            <div class="briefing-bio">${esc(sup.bio)}</div>
          </div>
        </div>
        <div class="briefing-body">
          <div class="briefing-label">▸ BRIEFING DEL CASO</div>
          <div class="briefing-message">${esc(message)}</div>
          <div class="briefing-label">▸ RESUMEN OPERATIVO</div>
          <dl class="case-summary">
            <dt>CASO</dt><dd>${esc(c.num)} · ${esc(c.title)}</dd>
            <dt>NIVEL</dt><dd>${esc(c.difficulty)}</dd>
            <dt>UBICACIÓN</dt><dd>${esc(c.location)}</dd>
            <dt>HORA</dt><dd>${esc(c.time)}</dd>
            <dt>VÍCTIMA</dt><dd>${esc(c.victim)}</dd>
            <dt>CAUSA</dt><dd>${esc(c.cause)}</dd>
            <dt>TU RANGO</dt><dd>${rank.icon} ${esc(rank.name)}</dd>
          </dl>
          <div class="briefing-actions">
            <button class="btn-secondary" id="btn-back2">CANCELAR</button>
            <button class="btn-primary" id="btn-accept">ACEPTAR MISIÓN →</button>
          </div>
        </div>
      </div>
    </div>`;

  const back = () => { state.view = 'menu'; state.status = null; render(); };
  $('#btn-back').onclick = back;
  $('#btn-back2').onclick = back;
  $('#btn-accept').onclick = () => { state.view = 'lobby'; render(); };
}

/* ====================================================================
   LOBBY
   ==================================================================== */
function renderLobby(){
  const c = CASES.find(x => x.id === state.caseId);
  app.innerHTML = `
    <div class="lobby">
      <button class="btn-back" id="btn-back">← VOLVER AL BRIEFING</button>
      <h2>PREPARAR PARTIDA</h2>
      <div class="case-name">${esc(c ? c.title : '')}</div>
      ${state.status ? `<div class="status ${state.statusErr?'err':''}">${esc(state.status)}</div>` : ''}
      <div class="form-box">
        <div class="field">
          <label>Tu nombre de agente</label>
          <input id="inp-name" type="text" placeholder="Alegando o Alech..." maxlength="20" value="${esc(LS.name)}">
        </div>
        <div class="field">
          <label>Tu rol</label>
          <select id="inp-role">
            <option value="alegando" ${LS.role==='alegando'?'selected':''}>Agente Alegando</option>
            <option value="alech" ${LS.role==='alech'?'selected':''}>Agente Alech</option>
            <option value="auto" ${LS.role==='auto'?'selected':''}>Auto</option>
          </select>
        </div>
        <div class="actions">
          <button class="btn-primary" id="btn-create">➕ CREAR LOBBY</button>
        </div>
        <div class="field" style="margin-top:22px;">
          <label>O únete con un código</label>
          <input id="inp-room" type="text" placeholder="AB12" maxlength="4"
                 style="text-transform:uppercase;letter-spacing:10px;
                 font-family:'Special Elite',monospace;font-size:24px;text-align:center;">
        </div>
        <div class="actions">
          <button class="btn-secondary" id="btn-join">🔗 UNIRSE</button>
        </div>
        <div class="hint">
          💡 <b>Sin servidor:</b> los dos navegadores se conectan directamente entre sí.
        </div>
      </div>
    </div>`;

  $('#btn-back').onclick = () => { state.view='briefing'; state.status=null; render(); };
  $('#btn-create').onclick = () => {
    const name = $('#inp-name').value.trim();
    if (!name) return alert('Pon un nombre');
    LS.name = name; LS.role = $('#inp-role').value;
    state.playerName = name; state.playerRole = LS.role;
    startHost();
  };
  $('#btn-join').onclick = () => {
    const name = $('#inp-name').value.trim();
    if (!name) return alert('Pon un nombre');
    const code = $('#inp-room').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(code)) return alert('Código de 4 caracteres');
    LS.name = name; LS.role = $('#inp-role').value;
    state.playerName = name; state.playerRole = LS.role;
    startGuest(code);
  };
}

/* ====================================================================
   MULTIJUGADOR
   ==================================================================== */
function setStatus(msg, isErr){ state.status = msg; state.statusErr = !!isErr; render(); }
function newGameState(caseId){
  return {
    caseId,
    players: { [state.playerId]: { name: state.playerName, role: state.playerRole, connected: true } },
    examined: [], asked: [], evidence: [], result: null
  };
}
function startHost(){
  const code = genCode();
  state.roomId = code; state.isHost = true;
  state.game = newGameState(state.caseId);
  const peerId = 'ecrim-' + code.toLowerCase();
  setStatus('Iniciando servidor P2P...');
  const peer = new Peer(peerId, { debug: 1 });
  state.peer = peer;
  peer.on('open', () => { state.view='game'; render(); showShareModal(code); });
  peer.on('connection', conn => {
    if (state.conn && state.conn.open) { try { conn.close(); } catch(e){} return; }
    state.conn = conn;
    conn.on('open', () => {
      state.game.players[conn.peer] = { name:'Agente 2', role:'auto', connected:true };
      broadcastState(); render();
    });
    conn.on('data', data => handleGuestMessage(conn, data));
    conn.on('close', () => {
      if (state.game.players[conn.peer]) state.game.players[conn.peer].connected = false;
      state.conn = null; broadcastState(); render();
    });
    conn.on('error', err => console.warn('Conn error', err));
  });
  peer.on('error', err => {
    if (err.type === 'unavailable-id') { setStatus('Reintentando...', true); setTimeout(startHost, 500); }
    else setStatus('Error: ' + err.type, true);
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch(e){} });
}
function startGuest(code){
  state.roomId = code; state.isHost = false;
  const peerId = 'ecrim-' + code.toLowerCase();
  setStatus('Conectando al lobby ' + code + '...');
  const peer = new Peer({ debug: 1 });
  state.peer = peer;
  peer.on('open', () => {
    const conn = peer.connect(peerId, { reliable: true });
    state.conn = conn;
    const timeout = setTimeout(() => { if (!state.game) setStatus('No se pudo conectar.', true); }, 12000);
    conn.on('open', () => {
      clearTimeout(timeout);
      setStatus('Conectado. Esperando estado...');
      conn.send({ type:'hello', name: state.playerName, role: state.playerRole });
    });
    conn.on('data', data => {
      if (data.type === 'state') {
        state.game = data.state;
        state.status = null;
        state.view = 'game';
        render();
      }
    });
    conn.on('close', () => setStatus('Desconectado del host.', true));
    conn.on('error', () => setStatus('Error de conexión.', true));
  });
  peer.on('error', err => {
    if (err.type === 'peer-unavailable') setStatus('Lobby no encontrado.', true);
    else setStatus('Error: ' + err.type, true);
  });
}
function broadcastState(){
  if (!state.isHost || !state.conn || !state.conn.open) return;
  try { state.conn.send({ type:'state', state: state.game }); } catch(e){}
}
function handleGuestMessage(conn, data){
  if (!state.isHost || !state.game) return;
  if (data.type === 'hello') {
    state.game.players[conn.peer] = { name:data.name||'Agente 2', role:data.role||'auto', connected:true };
    broadcastState(); render(); return;
  }
  if (data.type === 'action') applyAction(data.action, conn.peer);
}
function applyAction(action, byPlayer){
  const c = CASES.find(x => x.id === state.game.caseId);
  if (!c) return;
  switch (action.type) {
    case 'examine': {
      if (state.game.examined.includes(action.id)) return;
      state.game.examined.push(action.id);
      const o = c.objects.find(x => x.id === action.id);
      if (o && o.clue && !state.game.evidence.includes(o.clue)) state.game.evidence.push(o.clue);
      break;
    }
    case 'ask': {
      if (state.game.asked.includes(action.key)) return;
      state.game.asked.push(action.key);
      const [sid, idx] = action.key.split('|');
      const s = c.suspects.find(x => x.id === sid);
      if (s) {
        const q = s.questions[parseInt(idx,10)];
        if (q && q.clue && !state.game.evidence.includes(q.clue)) state.game.evidence.push(q.clue);
      }
      break;
    }
    case 'accuse': {
      if (state.game.result) return;
      const beforeRank = getCurrentRank(SOLVED.count());
      const correct = action.target === c.killer;
      state.game.result = { win:correct, killer:c.killer, accused:action.target, byPlayer };
      if (correct) SOLVED.add(c.id);
      const afterRank = getCurrentRank(SOLVED.count());
      if (correct && afterRank.id !== beforeRank.id) state.rankUpTo = afterRank;
      break;
    }
    case 'reset': {
      state.game.examined = []; state.game.asked = [];
      state.game.evidence = []; state.game.result = null;
      break;
    }
  }
  broadcastState(); render();
}
function sendAction(action){
  if (state.isHost) return applyAction(action, state.playerId);
  if (!state.conn || !state.conn.open) return;
  try { state.conn.send({ type:'action', action }); } catch(e){}
}
function showShareModal(code){
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = `
    <div class="modal">
      <h2>🎭 Lobby creado — eres el HOST</h2>
      <p>Dile este código de 4 letras al otro jugador.</p>
      <div class="share-box">
        <div class="lbl">CÓDIGO DE SALA</div>
        <div class="code" id="share-code">${esc(code)}</div>
      </div>
      <div class="modal-actions">
        <button class="btn-ok" id="m-ok">ENTRAR →</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('#share-code').onclick = e => {
    navigator.clipboard.writeText(code).then(() => {
      e.target.textContent = '✓';
      setTimeout(() => e.target.textContent = code, 800);
    });
  };
  modal.querySelector('#m-ok').onclick = () => modal.remove();
}

/* ====================================================================
   JUEGO
   ==================================================================== */
function renderGame(){
  const g = state.game;
  if (!g){
    app.innerHTML = `
      <div class="lobby">
        <div class="status ${state.statusErr?'err':''}">
          ${state.status ? esc(state.status) : 'Conectando...'} <span class="loading">⏳</span>
        </div>
        <div style="text-align:center;">
          <button class="btn-secondary" style="max-width:200px;margin:0 auto;" onclick="location.reload()">← VOLVER</button>
        </div>
      </div>`;
    return;
  }
  const c = CASES.find(x => x.id === g.caseId);
  if (!c) return;
  const view = state.localView;
  const totalClues = getTotalClues(c);
  const found = g.evidence.length;
  const pct = totalClues ? Math.round(found/totalClues*100) : 0;
  const canAccuse = found >= 2 && !g.result;
  const players = Object.entries(g.players || {});
  const myRank = getCurrentRank(SOLVED.count());

  app.innerHTML = `
    <div class="game">
      <div class="topbar">
        <div class="left">
          <div class="room-badge">SALA ${esc(state.roomId)} ${state.isHost?'👑':'👤'}</div>
          ${players.map(([pid, p]) => `
            <div class="player-pill ${p.connected ? '' : 'off'} ${pid === state.playerId ? 'me' : ''}">
              <span class="dot"></span>
              ${pid === state.playerId ? `<span class="rank-ic">${myRank.icon}</span>` : ''}
              ${esc(p.name)} · ${esc(p.role)}
            </div>
          `).join('')}
        </div>
        <div class="progress-wrap">
          <span>${found}/${totalClues}</span>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <div style="display:flex;gap:8px;">
          <button id="btn-leave">SALIR</button>
        </div>
      </div>
      <div class="main">
        <aside class="panel panel-left">
          <h2>👤 Sospechosos</h2>
          ${c.suspects.map(s => `
            <div class="suspect ${view.type === 'suspect' && view.id === s.id ? 'active' : ''}"
                 data-suspect="${s.id}">
              <div class="avatar">${s.icon}</div>
              <div style="min-width:0;">
                <div class="name">${esc(s.name)}</div>
                <div class="role">${esc(s.role)}</div>
              </div>
            </div>`).join('')}
        </aside>
        <main class="stage" id="stage"></main>
        <aside class="panel panel-right">
          <h2>📎 Evidencias (${found})</h2>
          ${g.evidence.length === 0
            ? '<div class="empty">Aún no hay pistas.<br>Investigad la escena.</div>'
            : g.evidence.map(e => `<div class="evidence-item">${esc(e)}</div>`).join('')}
          <button class="accuse-btn" id="btn-accuse" ${canAccuse ? '' : 'disabled'}>
            ${g.result ? 'CASO CERRADO' : (canAccuse ? '⚖️ ACUSAR' : 'REUNID 2 PISTAS')}
          </button>
        </aside>
      </div>
    </div>`;

  $('#btn-leave').onclick = () => {
    if (!confirm('¿Salir de la partida?')) return;
    try { if (state.conn) state.conn.close(); } catch(e){}
    try { if (state.peer) state.peer.destroy(); } catch(e){}
    state.game = null; state.conn = null; state.peer = null;
    state.view = 'menu'; state.isHost = false; state.status = null;
    render();
  };
  document.querySelectorAll('.suspect').forEach(el => {
    el.onclick = () => { state.localView = { type:'suspect', id: el.dataset.suspect }; renderGame(); };
  });
  if (canAccuse) $('#btn-accuse').onclick = openAccusation;

  renderStage(c, view);

  if (g.result && state.view !== 'result') {
    setTimeout(() => { state.view = 'result'; render(); }, 350);
  }
}

function renderStage(c, view){
  const stage = $('#stage');
  const g = state.game;
  if (view.type === 'suspect'){
    const s = c.suspects.find(x => x.id === view.id);
    if (!s) { state.localView = {type:'scene'}; return renderStage(c, {type:'scene'}); }
    stage.innerHTML = `
      <div class="stage-3d">
        <div class="stage-header">
          <div class="label">INTERROGATORIO</div>
          <h2>${s.icon} ${esc(s.name)}</h2>
          <div style="color:var(--text-dim);font-size:13px;margin-top:6px;">${esc(s.role)}</div>
        </div>
        <div class="q-list">
          ${s.questions.map((q, i) => {
            const key = s.id + '|' + i;
            const asked = g.asked.includes(key);
            return `
              <div>
                <button class="q-btn ${asked ? 'asked' : ''}" data-q="${key}">❝ ${esc(q.q)}</button>
                ${asked ? `
                  <div class="answer">
                    ${esc(q.a)}
                    ${q.clue ? `<div class="clue">🔎 ${esc(q.clue)}</div>` : ''}
                  </div>` : ''}
              </div>`;
          }).join('')}
        </div>
        <div style="margin-top:22px;">
          <button class="btn-secondary" style="max-width:220px;" id="btn-scene">← VOLVER A LA ESCENA</button>
        </div>
      </div>`;
    stage.querySelectorAll('.q-btn').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.q;
        if (!g.asked.includes(key)) sendAction({ type:'ask', key });
      };
    });
    $('#btn-scene').onclick = () => { state.localView = {type:'scene'}; renderGame(); };
  } else if (view.type === 'object'){
    const o = c.objects.find(x => x.id === view.id);
    stage.innerHTML = `
      <div class="stage-3d">
        <div class="stage-header">
          <div class="label">ANÁLISIS</div>
          <h2>${o.icon} ${esc(o.name)}</h2>
        </div>
        <div class="detail">
          <p>${esc(o.desc)}</p>
          ${o.clue ? `<div class="clue">🔎 ${esc(o.clue)}</div>` : ''}
        </div>
        <div style="margin-top:22px;">
          <button class="btn-secondary" style="max-width:220px;" id="btn-scene">← VOLVER A LA ESCENA</button>
        </div>
      </div>`;
    $('#btn-scene').onclick = () => { state.localView = {type:'scene'}; renderGame(); };
  } else {
    stage.innerHTML = `
      <div class="stage-3d">
        <div class="stage-header">
          <div class="label">${c.num} · ${c.difficulty}</div>
          <h2>${esc(c.title)}</h2>
          <div style="color:var(--text-dim);font-size:13px;margin-top:6px;">
            📍 ${esc(c.location)} · 🕐 ${esc(c.time)} · ☠️ ${esc(c.victim)} · ⚗️ ${esc(c.cause)}
          </div>
        </div>
        <div class="scene-intro">${esc(c.intro)}</div>
        ${renderScene3D(c, g)}
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);
          color:var(--text-dim);font-size:12px;line-height:1.7;">
          💡 <b style="color:var(--gold);">Escena 3D:</b> arrastra para orbitar, rueda para zoom, botones de vista arriba a la derecha. Toca los hotspots para examinar objetos.
        </div>
      </div>`;
    bindSceneControls((id) => {
      if (!g.examined.includes(id)) sendAction({ type:'examine', id });
      state.localView = { type:'object', id };
      renderGame();
    });
  }
}

function openAccusation(){
  const c = CASES.find(x => x.id === state.game.caseId);
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = `
    <div class="modal">
      <h2 class="red">⚖️ ACUSACIÓN FORMAL</h2>
      <p>Elegid al asesino. La partida acabará para ambos.</p>
      <div class="accuse-list">
        ${c.suspects.map(s => `
          <div class="accuse-opt" data-accuse="${s.id}">
            <span style="font-size:22px;">${s.icon}</span>
            <div>
              <div style="font-weight:600;font-size:14px;">${esc(s.name)}</div>
              <div style="font-size:12px;color:var(--text-dim);">${esc(s.role)}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="m-cancel">CANCELAR</button>
        <button class="btn-ok" id="m-confirm" disabled style="background:var(--red);color:#fff;">CONFIRMAR</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  let target = null;
  modal.querySelectorAll('.accuse-opt').forEach(el => {
    el.onclick = () => {
      modal.querySelectorAll('.accuse-opt').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      target = el.dataset.accuse;
      modal.querySelector('#m-confirm').disabled = false;
    };
  });
  modal.querySelector('#m-cancel').onclick = () => modal.remove();
  modal.querySelector('#m-confirm').onclick = () => { modal.remove(); sendAction({ type:'accuse', target }); };
}

function renderResult(){
  const g = state.game;
  const c = CASES.find(x => x.id === g.caseId);
  const killer = c.suspects.find(s => s.id === c.killer);
  const accused = c.suspects.find(s => s.id === g.result.accused);
  const win = g.result.win;
  const accusedByMe = g.result.byPlayer === state.playerId;
  const byPlayer = g.players[g.result.byPlayer];
  const sup = SUPERIORS[c.superior] || SUPERIORS.lisboa;

  const bossMsg = win
    ? `Buen trabajo, agentes. Habéis cerrado el caso con pruebas sólidas.`
    : `Una acusación sin fundamento. Habéis dejado escapar al verdadero culpable. Revisad las pruebas la próxima vez.`;

  app.innerHTML = `
    <div class="result">
      <div class="big-stamp ${win ? '' : 'lose'}">${win ? 'CASO CERRADO' : 'CASO SIN RESOLVER'}</div>
      <h2>${win ? `Habéis detenido a ${esc(killer.name)}` : `Acusasteis a ${esc(accused.name)}`}</h2>
      <p style="font-size:13px;color:var(--gold-soft);margin-bottom:20px;">
        Acusación realizada por <b>${esc(byPlayer ? byPlayer.name : 'alguien')}</b>${accusedByMe ? ' (tú)' : ''}
      </p>
      ${state.rankUpTo ? `
        <div class="rankup">
          <div class="label">▸ ASCENSO DE RANGO</div>
          <div class="icon">${state.rankUpTo.icon}</div>
          <div class="new-rank">${esc(state.rankUpTo.name)}</div>
          <div class="desc">${esc(state.rankUpTo.desc)}</div>
        </div>
      ` : ''}
      <div class="boss-comment">
        <div class="boss-avatar">${sup.icon}</div>
        <div class="boss-text">
          <div class="boss-name">▸ ${esc(sup.name)} · ${esc(sup.role)}</div>
          <div class="boss-message">"${esc(bossMsg)}"</div>
        </div>
      </div>
      <p>${win
        ? esc(c.solution)
        : `La acusación contra ${esc(accused.name)} no se sostiene. El verdadero asesino era <b style="color:var(--red);">${esc(killer.name)}</b> y ha escapado.`}</p>
      <div class="ev-list">
        <h3>EVIDENCIAS CLAVE DEL CASO</h3>
        <ul>${c.keyEvidence.map(e => `<li>${esc(e)}</li>`).join('')}</ul>
      </div>
      <div class="result-btns">
        <button id="r-retry">REINTENTAR CASO</button>
        <button id="r-home">VOLVER AL ARCHIVO</button>
      </div>
    </div>`;

  $('#r-retry').onclick = () => {
    state.rankUpTo = null;
    sendAction({ type:'reset' });
    state.view = 'game';
    state.localView = {type:'scene'};
    render();
  };
  $('#r-home').onclick = () => {
    try { if (state.conn) state.conn.close(); } catch(e){}
    try { if (state.peer) state.peer.destroy(); } catch(e){}
    state.game = null; state.conn = null; state.peer = null;
    state.view = 'menu'; state.isHost = false; state.status = null;
    state.rankUpTo = null;
    render();
  };
}

function getTotalClues(c){
  let n = 0;
  c.objects.forEach(o => { if (o.clue) n++; });
  c.suspects.forEach(s => s.questions.forEach(q => { if (q.clue) n++; }));
  return n;
}

/* ====================================================================
   ARRANQUE
   ==================================================================== */
try { playCinematic(); } catch(e) {
  const ci = document.getElementById('cinematic');
  if (ci) ci.remove();
}
setTimeout(() => {
  const ci = document.getElementById('cinematic');
  if (ci) ci.remove();
}, 6000);

render();
animateParallax();