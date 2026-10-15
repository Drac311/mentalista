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
    alert('Ya estás en modo limpio.'); return;
  }
  var html = __ORIGINAL_HTML;
  html = html.replace(/<head([^>]*)>/i, '<head$1><scr'+'ipt>window.__clean=true;<\/scr'+'ipt>');
  var blob = new Blob([html], { type:'text/html' });
  var url = URL.createObjectURL(blob);
  var w = window.open(url, '_blank');
  if (!w){ alert('Ventana bloqueada.'); URL.revokeObjectURL(url); return; }
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
    <div class="cine-text">${'HORARIO'.split('').map((c,i)=>`<span style="animation-delay:${i*0.08}s">${c}</span>`).join('')}</div>
    <div class="cine-sub fade-in-2">Agentes Alegando &amp; Alech</div>
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
  setTimeout(() => { cine.classList.add('gone'); setTimeout(() => cine.remove(), 900); }, 3800);
}

/* ====================================================================
   PARALLAX GENERAL (solo para menús)
   ==================================================================== */
let mouseX=0, mouseY=0, currentX=0, currentY=0;
function updatePointer(cx, cy){
  mouseX = (cx / window.innerWidth - 0.5) * 2;
  mouseY = (cy / window.innerHeight - 0.5) * 2;
}
document.addEventListener('mousemove', e => updatePointer(e.clientX, e.clientY));
document.addEventListener('touchmove', e => { if (e.touches[0]) updatePointer(e.touches[0].clientX, e.touches[0].clientY); }, {passive:true});

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
   THREE.JS ENGINE — primera persona
   ==================================================================== */
const T3 = {
  renderer: null, scene: null, camera: null,
  canvas: null,
  keys: {}, yaw: 0, pitch: 0,
  pointerLocked: false,
  hotspots: [],
  animId: null,
  lastTime: 0,
  clock: null,
  roomHalf: 6,
  roomHeight: 3,
  playerRadius: 0.35,
  moveSpeed: 2.8, runMult: 1.9,
  boundEvents: {},
  caseData: null,
  gameState: null,
  onObjectClick: null
};

/* ---------- TEXTURAS PROCEDURALES ---------- */
function makeCanvasTex(w, h, drawFn){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawFn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function texWoodFloor(){
  return makeCanvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3a2414'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++){
      ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random()*0.18})`;
      ctx.lineWidth = 1 + Math.random()*2;
      ctx.beginPath();
      const y = Math.random()*h;
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 16)
        ctx.lineTo(x, y + Math.sin(x*0.03 + i*2)*(2+Math.random()*2));
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.7)'; ctx.lineWidth = 3;
    for (let y = 0; y < h; y += 64){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let x = 0; x < w; x += 128){ ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  });
}
function texMarble(){
  return makeCanvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c8c0b0'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++){
      ctx.strokeStyle = `rgba(60,50,40,${0.15 + Math.random()*0.25})`;
      ctx.lineWidth = 1 + Math.random()*3;
      ctx.beginPath();
      let x = Math.random()*w, y = Math.random()*h;
      ctx.moveTo(x, y);
      for (let j = 0; j < 8; j++){
        x += (Math.random()-0.5)*120; y += (Math.random()-0.5)*120;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 128){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 128){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  });
}
function texGrass(){
  return makeCanvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2a4a1a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 12000; i++){
      const r = 20+Math.random()*50, g = 60+Math.random()*80, b = 15+Math.random()*30;
      ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 4);
    }
  });
}
function texWallpaper(baseColor, stripeColor, vertical=true){
  return makeCanvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = baseColor; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = stripeColor;
    if (vertical){
      for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 3, h);
    } else {
      for (let y = 0; y < h; y += 32) ctx.fillRect(0, y, w, 3);
    }
    for (let i = 0; i < 3000; i++){
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.06})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
  });
}
function texWood(base){
  return makeCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 50; i++){
      ctx.strokeStyle = `rgba(0,0,0,${0.08 + Math.random()*0.2})`;
      ctx.lineWidth = 1 + Math.random();
      ctx.beginPath();
      ctx.moveTo(0, Math.random()*h);
      ctx.bezierCurveTo(w*0.3, Math.random()*h, w*0.7, Math.random()*h, w, Math.random()*h);
      ctx.stroke();
    }
  });
}
function texFabric(base){
  return makeCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3){
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.1})`;
      ctx.fillRect(0, y, w, 1);
    }
    for (let x = 0; x < w; x += 3){
      ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.05})`;
      ctx.fillRect(x, 0, 1, h);
    }
  });
}
function texCarpet(base, accent){
  return makeCanvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent; ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, w-48, h-48);
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, w-120, h-120);
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++){
      ctx.beginPath();
      const s = 40 + i*25;
      ctx.moveTo(w/2, h/2 - s); ctx.lineTo(w/2 + s, h/2);
      ctx.lineTo(w/2, h/2 + s); ctx.lineTo(w/2 - s, h/2);
      ctx.closePath(); ctx.stroke();
    }
    for (let i = 0; i < 4000; i++){
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.12})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
  });
}
function texCurtain(){
  return makeCanvasTex(256, 512, (ctx, w, h) => {
    for (let x = 0; x < w; x += 8){
      const g = ctx.createLinearGradient(x, 0, x+8, 0);
      g.addColorStop(0, '#2a0404');
      g.addColorStop(0.5, '#8a1818');
      g.addColorStop(1, '#2a0404');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 8, h);
    }
  });
}
function texCeiling(){
  return makeCanvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0e0d12'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2000; i++){
      ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
  });
}
function texPainting(){
  return makeCanvasTex(256, 192, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w);
    g.addColorStop(0, '#c9a86a');
    g.addColorStop(0.5, '#7a5c2e');
    g.addColorStop(1, '#3a2a14');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(60,40,20,0.8)'; ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++){
      ctx.beginPath();
      ctx.moveTo(Math.random()*w, 0);
      ctx.bezierCurveTo(Math.random()*w, h*0.3, Math.random()*w, h*0.7, Math.random()*w, h);
      ctx.stroke();
    }
  });
}
function texBooks(){
  return makeCanvasTex(256, 256, (ctx, w, h) => {
    const cols = ['#7a2a1a','#2a4a3a','#5a5a1a','#4a1a2a','#1a3a5a','#6a4a1a','#3a1a4a','#2a5a4a'];
    let x = 0;
    while (x < w){
      const bw = 12 + Math.random()*14;
      ctx.fillStyle = cols[Math.floor(Math.random()*cols.length)];
      ctx.fillRect(x, 0, bw-2, h);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x+bw*0.3, h*0.1, 2, h*0.8);
      x += bw;
    }
  });
}

/* ---------- MATERIALES ---------- */
function matStandard(opts){ return new THREE.MeshStandardMaterial(opts); }

/* ---------- HELPERS ---------- */
function boxMesh(w, h, d, mat, x=0, y=0, z=0){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* ---------- MUEBLES ---------- */
function makeDesk(){
  const g = new THREE.Group();
  const wood = matStandard({ color: 0x5a3a20, roughness: 0.75 });
  const woodDark = matStandard({ color: 0x3a2410, roughness: 0.7 });
  g.add(boxMesh(2.2, 0.08, 1.0, wood, 0, 0.75, 0));
  [[-1,-0.4],[1,-0.4],[-1,0.4],[1,0.4]].forEach(([x,z]) => {
    g.add(boxMesh(0.08, 0.75, 0.08, woodDark, x, 0.375, z));
  });
  g.add(boxMesh(0.6, 0.5, 0.85, woodDark, -0.7, 0.45, 0));
  g.add(boxMesh(0.55, 0.02, 0.78, wood, -0.7, 0.72, 0));
  g.add(boxMesh(0.03, 0.03, 0.1, matStandard({color:0xa8884a, metalness:0.7, roughness:0.3}), -0.7, 0.45, 0.44));
  return g;
}
function makeChair(){
  const g = new THREE.Group();
  const w = matStandard({ color: 0x4a2f18, roughness: 0.8 });
  g.add(boxMesh(0.5, 0.06, 0.5, w, 0, 0.46, 0));
  g.add(boxMesh(0.5, 0.55, 0.06, w, 0, 0.78, -0.22));
  [[-0.22,0.22],[0.22,0.22],[-0.22,-0.22],[0.22,-0.22]].forEach(([x,z]) => {
    g.add(boxMesh(0.06, 0.46, 0.06, w, x, 0.23, z));
  });
  return g;
}
function makeBookshelf(){
  const g = new THREE.Group();
  const wood = matStandard({ color: 0x3a2410, roughness: 0.8 });
  const booksTex = texBooks();
  const booksMat = matStandard({ map: booksTex, roughness: 0.9 });
  const W = 2.4, H = 2.8, D = 0.35;
  g.add(boxMesh(0.12, H, D, wood, -W/2, H/2, 0));
  g.add(boxMesh(0.12, H, D, wood, W/2, H/2, 0));
  g.add(boxMesh(W+0.12, 0.1, D, wood, 0, 0.05, 0));
  g.add(boxMesh(W+0.12, 0.1, D, wood, 0, H, 0));
  for (let i = 1; i < 4; i++){
    const shelfY = i * (H/4);
    g.add(boxMesh(W, 0.06, D, wood, 0, shelfY, 0));
    const bookBlock = new THREE.Mesh(new THREE.BoxGeometry(W-0.3, H/4 - 0.2, D-0.1), booksMat);
    bookBlock.position.set(0, shelfY + H/8, 0);
    bookBlock.castShadow = true;
    g.add(bookBlock);
  }
  return g;
}
function makeBed(){
  const g = new THREE.Group();
  const wood = matStandard({ color: 0x4a2f18, roughness: 0.85 });
  const mattress = matStandard({ color: 0xd8c8b0, roughness: 0.95 });
  const sheet = matStandard({ color: 0xa8a8b8, roughness: 0.9 });
  const blanket = matStandard({ color: 0x5a1e1e, roughness: 0.95 });
  const pillow = matStandard({ color: 0xf0e8d8, roughness: 0.9 });
  g.add(boxMesh(2.0, 0.15, 2.2, wood, 0, 0.2, 0));
  g.add(boxMesh(2.0, 1.0, 0.15, wood, 0, 0.75, -1.05));
  g.add(boxMesh(1.95, 0.28, 2.1, mattress, 0, 0.42, 0));
  g.add(boxMesh(1.9, 0.06, 1.9, sheet, 0, 0.59, 0.1));
  g.add(boxMesh(1.9, 0.06, 1.0, blanket, 0, 0.62, 0.6));
  g.add(boxMesh(0.75, 0.16, 0.4, pillow, -0.5, 0.65, -0.85));
  g.add(boxMesh(0.75, 0.16, 0.4, pillow, 0.5, 0.65, -0.85));
  return g;
}
function makeNightstand(){
  const g = new THREE.Group();
  const wood = matStandard({ color: 0x4a2f18, roughness: 0.8 });
  g.add(boxMesh(0.55, 0.05, 0.55, wood, 0, 0.6, 0));
  g.add(boxMesh(0.5, 0.5, 0.5, wood, 0, 0.3, 0));
  g.add(boxMesh(0.05, 0.15, 0.02, matStandard({color:0x8a6a2a}), 0, 0.35, 0.26));
  return g;
}
function makeWardrobe(){
  const g = new THREE.Group();
  const wood = matStandard({ color: 0x3a2410, roughness: 0.8 });
  const door = matStandard({ color: 0x4a2f18, roughness: 0.75 });
  g.add(boxMesh(1.4, 2.6, 0.7, wood, 0, 1.3, 0));
  g.add(boxMesh(0.65, 2.4, 0.04, door, -0.35, 1.3, 0.36));
  g.add(boxMesh(0.65, 2.4, 0.04, door, 0.35, 1.3, 0.36));
  g.add(boxMesh(0.04, 0.15, 0.05, matStandard({color:0xa8884a,metalness:0.7,roughness:0.3}), -0.06, 1.3, 0.4));
  g.add(boxMesh(0.04, 0.15, 0.05, matStandard({color:0xa8884a,metalness:0.7,roughness:0.3}), 0.06, 1.3, 0.4));
  return g;
}
function makeSofa(){
  const g = new THREE.Group();
  const fabric = matStandard({ color: 0x4a2a2a, roughness: 0.95 });
  const fabricL = matStandard({ color: 0x5a3a3a, roughness: 0.95 });
  g.add(boxMesh(2.2, 0.5, 0.9, fabric, 0, 0.3, 0.15));
  g.add(boxMesh(2.2, 0.6, 0.2, fabricL, 0, 0.8, -0.28));
  g.add(boxMesh(0.22, 0.55, 0.9, fabric, -1.1, 0.65, 0.15));
  g.add(boxMesh(0.22, 0.55, 0.9, fabric, 1.1, 0.65, 0.15));
  return g;
}
function makeLamp(){
  const g = new THREE.Group();
  const metal = matStandard({ color: 0x2a2a30, metalness: 0.85, roughness: 0.35 });
  const shade = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.9
  });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.04, 20), metal));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 10), metal).translateY(0.75));
  const shadeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.3, 24, 1, true), shade);
  shadeMesh.position.y = 1.65; shadeMesh.castShadow = true;
  g.add(shadeMesh);
  const light = new THREE.PointLight(0xffd682, 1.6, 8, 1.5);
  light.position.y = 1.55;
  g.add(light);
  return g;
}
function makeTableLamp(){
  const g = new THREE.Group();
  const metal = matStandard({ color: 0x2a2a30, metalness: 0.85, roughness: 0.35 });
  const shade = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 1.4,
    transparent: true, opacity: 0.92
  });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.03, 16), metal));
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), metal).translateY(0.18));
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.24, 20, 1, true), shade);
  s.position.y = 0.47; g.add(s);
  const l = new THREE.PointLight(0xffd682, 1.2, 5, 1.8);
  l.position.y = 0.45; g.add(l);
  return g;
}
function makePlant(){
  const g = new THREE.Group();
  const pot = matStandard({ color: 0x5a3a20, roughness: 0.9 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.35, 16), pot).translateY(0.175));
  const leafColors = [0x2a5a2a, 0x3a6a3a, 0x1a4a1a, 0x4a7a3a];
  for (let i = 0; i < 30; i++){
    const col = leafColors[Math.floor(Math.random()*leafColors.length)];
    const leafMat = matStandard({ color: col, roughness: 0.85, side: THREE.DoubleSide });
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.7), leafMat);
    const ang = Math.random()*Math.PI*2;
    leaf.position.set(Math.cos(ang)*0.15, 0.35 + Math.random()*0.5, Math.sin(ang)*0.15);
    leaf.rotation.y = ang;
    leaf.rotation.x = -0.4 + (Math.random()-0.5)*0.8;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}
function makePainting(w=1.8, h=1.3){
  const g = new THREE.Group();
  const frame = matStandard({ color: 0x4a3d22, roughness: 0.6, metalness: 0.15 });
  const tex = texPainting();
  const canvasMat = matStandard({ map: tex, roughness: 0.7 });
  g.add(boxMesh(w+0.2, h+0.2, 0.08, frame, 0, 0, 0));
  const canvasMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), canvasMat);
  canvasMesh.position.z = 0.05;
  g.add(canvasMesh);
  return g;
}
function makeWindow(w=1.8, h=1.5){
  const g = new THREE.Group();
  const frame = matStandard({ color: 0x4a3d22, roughness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x1a2035, emissive: 0x0a1220, emissiveIntensity: 0.6,
    transparent: true, opacity: 0.85, metalness: 0.3, roughness: 0.15
  });
  g.add(boxMesh(w+0.2, h+0.2, 0.1, frame, 0, 0, 0));
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass);
  pane.position.z = 0.06; g.add(pane);
  g.add(boxMesh(0.06, h, 0.08, frame, 0, 0, 0.07));
  g.add(boxMesh(w, 0.06, 0.08, frame, 0, 0, 0.07));
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(0.12, 20),
    new THREE.MeshBasicMaterial({ color: 0xf0e8d8 })
  );
  moon.position.set(w/4, h/4, 0.07);
  g.add(moon);
  return g;
}
function makeDoor(w=1.1, h=2.3){
  const g = new THREE.Group();
  const frame = matStandard({ color: 0x2a1a08, roughness: 0.8 });
  const door = matStandard({ color: 0x3a2410, roughness: 0.75 });
  g.add(boxMesh(w+0.15, h+0.15, 0.1, frame, 0, h/2, 0));
  g.add(boxMesh(w, h, 0.06, door, 0, h/2, 0.04));
  g.add(boxMesh(0.05, 0.05, 0.05, matStandard({color:0xa8884a, metalness:0.8, roughness:0.2}), w/2 - 0.12, h/2, 0.1));
  return g;
}
function makeTree(scale=1){
  const g = new THREE.Group();
  const trunk = matStandard({ color: 0x3a2410, roughness: 0.95 });
  const leaves1 = matStandard({ color: 0x1a3a1a, roughness: 0.9 });
  const leaves2 = matStandard({ color: 0x2a4a2a, roughness: 0.9 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.15*scale, 0.22*scale, 2*scale, 12), trunk).translateY(1*scale));
  for (let i = 0; i < 5; i++){
    const s = (0.8 + Math.random()*0.6)*scale;
    const m = Math.random() > 0.5 ? leaves1 : leaves2;
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), m);
    leaf.position.set((Math.random()-0.5)*0.8*scale, (2 + Math.random()*1.2)*scale, (Math.random()-0.5)*0.8*scale);
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}
function makeBench(){
  const g = new THREE.Group();
  const wood = matStandard({ color: 0x5a3a20, roughness: 0.85 });
  const metal = matStandard({ color: 0x2a2a30, metalness: 0.8, roughness: 0.4 });
  g.add(boxMesh(1.8, 0.08, 0.5, wood, 0, 0.5, 0));
  g.add(boxMesh(1.8, 0.5, 0.08, wood, 0, 0.75, -0.2));
  [[-0.75,0],[0.75,0]].forEach(([x,z]) => {
    g.add(boxMesh(0.08, 0.5, 0.4, metal, x, 0.25, z));
  });
  return g;
}
function makeLampPost(){
  const g = new THREE.Group();
  const metal = matStandard({ color: 0x1a1a1e, metalness: 0.7, roughness: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 1.8 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 4, 8), metal).translateY(2));
  const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), lightMat);
  l.position.y = 4.1; g.add(l);
  const pl = new THREE.PointLight(0xffd682, 2, 10, 1.5);
  pl.position.y = 4.1; g.add(pl);
  return g;
}
function makeCeilingLamp(){
  const g = new THREE.Group();
  const metal = matStandard({ color: 0x1a1a1e, metalness: 0.8, roughness: 0.4 });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), metal));
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 2.2,
    transparent: true, opacity: 0.95
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 14), bulbMat);
  bulb.position.y = -0.3; g.add(bulb);
  const light = new THREE.PointLight(0xffd682, 2.2, 12, 1.4);
  light.position.y = -0.35;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  g.add(light);
  return g;
}
function makeRug(w=3.5, d=2.4){
  const tex = texCarpet('#5a2818', 'rgba(212,160,23,0.4)');
  const mat = matStandard({ map: tex, roughness: 1 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.005;
  m.receiveShadow = true;
  return m;
}
function makeCurtain(w, h){
  const tex = texCurtain();
  tex.repeat.set(w/1.5, 1);
  const mat = matStandard({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.castShadow = true;
  return m;
}

/* ---------- CADÁVER ---------- */
const CORPSE_POSES = {
  supine:  { armL: 1.2, armR: 1.2, legL: 0.15, legR: -0.15, torsoY: 0 },
  side:    { armL: 1.4, armR: 0.8, legL: 0.4,  legR: -0.1,  torsoY: -0.6 },
  prone:   { armL: 1.4, armR: -1.4, legL: 0.1, legR: -0.1,  torsoY: 0 },
  curled:  { armL: 2.2, armR: 2.2, legL: 1.4,  legR: 1.4,   torsoY: -0.4 },
  seated:  { armL: 0.3, armR: 0.3, legL: 1.5,  legR: -1.5,  torsoY: 0 }
};

function buildCorpse(poseKey, x, z, rotY){
  const pose = CORPSE_POSES[poseKey] || CORPSE_POSES.supine;
  const g = new THREE.Group();

  const chalkMat = new THREE.MeshStandardMaterial({
    color: 0xe8e3d8, roughness: 0.95, metalness: 0, emissive: 0x1a1a15, emissiveIntensity: 0.15
  });
  const bloodMat = new THREE.MeshStandardMaterial({
    color: 0x5a0a08, roughness: 0.6, transparent: true, opacity: 0.85
  });
  const bloodDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3a0605, roughness: 0.7, transparent: true, opacity: 0.75
  });

  // Mancha principal bajo el cuerpo
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), bloodMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.y = 0.008;
  pool.scale.set(1, 1.5, 1);
  g.add(pool);

  // Salpicaduras
  for (let i = 0; i < 8; i++){
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.1 + Math.random()*0.25, 20), bloodDarkMat);
    s.rotation.x = -Math.PI / 2;
    s.position.set((Math.random()-0.5)*2, 0.01, (Math.random()-0.5)*2.4);
    s.scale.set(1, 0.7 + Math.random()*0.8, 1);
    g.add(s);
  }

  // Cuerpo
  const yBase = 0.12;
  // Cabeza
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), chalkMat);
  head.position.set(0, yBase, -0.62);
  head.castShadow = true;
  g.add(head);
  // Cuello
  const neck = boxMesh(0.16, 0.1, 0.12, chalkMat, 0, yBase, -0.48);
  g.add(neck);
  // Torso
  const torso = boxMesh(0.46, 0.24, 0.8, chalkMat, 0, yBase, 0);
  g.add(torso);
  // Cadera
  const hips = boxMesh(0.42, 0.22, 0.24, chalkMat, 0, yBase, 0.5);
  g.add(hips);

  // Brazos — segmentos separados para flexión
  function buildArm(side, armRot){
    const group = new THREE.Group();
    const upper = boxMesh(0.12, 0.12, 0.4, chalkMat, 0, 0, -0.2);
    group.add(upper);
    const lower = boxMesh(0.11, 0.11, 0.38, chalkMat, 0, 0, -0.6);
    group.add(lower);
    group.position.set(side * 0.34, yBase, -0.24);
    group.rotation.y = armRot;
    return group;
  }
  g.add(buildArm(-1, pose.armL));
  g.add(buildArm(1, pose.armR));

  // Piernas
  function buildLeg(side, legRot){
    const group = new THREE.Group();
    const thigh = boxMesh(0.15, 0.15, 0.5, chalkMat, 0, 0, 0.25);
    group.add(thigh);
    const calf = boxMesh(0.13, 0.13, 0.5, chalkMat, 0, 0, 0.75);
    group.add(calf);
    const foot = boxMesh(0.14, 0.09, 0.22, chalkMat, 0, -0.02, 1.08);
    group.add(foot);
    group.position.set(side * 0.13, yBase, 0.6);
    group.rotation.y = legRot;
    return group;
  }
  g.add(buildLeg(-1, pose.legL));
  g.add(buildLeg(1, pose.legR));

  g.position.set(x, 0, z);
  g.rotation.y = rotY + pose.torsoY;
  return g;
}

/* ---------- CONSTRUCTORES DE HABITACIÓN ---------- */
function buildRoomBase(opts){
  const scene = T3.scene;
  const size = opts.size || 12;
  const height = opts.height || 3;
  T3.roomHalf = size / 2;
  T3.roomHeight = height;
  const half = size / 2;

  // Suelo
  const floorTex = opts.floorTex();
  floorTex.repeat.set(size/2, size/2);
  const floorMat = matStandard({ map: floorTex, roughness: 0.9 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(size, size), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Techo
  if (!opts.noCeiling){
    const ceilTex = texCeiling();
    ceilTex.repeat.set(size/2, size/2);
    const ceilMat = matStandard({ map: ceilTex, roughness: 1, color: 0x999999 });
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(size, size), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = height;
    scene.add(ceil);
  }

  // Paredes
  const wallTex = opts.wallTex();
  wallTex.repeat.set(size/2, height/2);
  const wallMat = matStandard({ map: wallTex, roughness: 0.95 });
  const wallGeo = new THREE.PlaneGeometry(size, height);

  const walls = [
    { pos: [0, height/2, -half], rot: 0 },
    { pos: [0, height/2, half], rot: Math.PI },
    { pos: [-half, height/2, 0], rot: Math.PI/2 },
    { pos: [half, height/2, 0], rot: -Math.PI/2 }
  ];
  walls.forEach(({pos, rot}) => {
    const w = new THREE.Mesh(wallGeo, wallMat);
    w.position.set(...pos);
    w.rotation.y = rot;
    w.receiveShadow = true;
    scene.add(w);
  });

  // Rodapié
  const bb = matStandard({ color: 0x3a2f1e, roughness: 0.8 });
  const bh = 0.15, bt = 0.06;
  [
    { p: [0, bh/2, -half + bt/2], s: [size, bh, bt] },
    { p: [0, bh/2, half - bt/2], s: [size, bh, bt] },
    { p: [-half + bt/2, bh/2, 0], s: [bt, bh, size] },
    { p: [half - bt/2, bh/2, 0], s: [bt, bh, size] }
  ].forEach(({p, s}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...s), bb);
    m.position.set(...p);
    scene.add(m);
  });

  return { half, height, size };
}

function sceneDespacho(){
  const { half, height } = buildRoomBase({
    floorTex: texWoodFloor,
    wallTex: () => texWallpaper('#2a2419', 'rgba(0,0,0,0.15)', true)
  });
  // Alfombra
  T3.scene.add(makeRug(3.5, 2.5).translateX(-1).translateZ(0));
  // Cuadro pared trasera
  const p = makePainting(1.8, 1.3);
  p.position.set(1.5, 1.8, -half + 0.06);
  T3.scene.add(p);
  // Ventana pared izquierda
  const w = makeWindow(1.6, 1.4);
  w.position.set(-half + 0.06, 1.7, 1.5);
  w.rotation.y = Math.PI/2;
  T3.scene.add(w);
  // Puerta pared derecha
  const d = makeDoor(1.1, 2.3);
  d.position.set(half - 0.06, 0, -2.5);
  d.rotation.y = -Math.PI/2;
  T3.scene.add(d);
  // Escritorio
  const desk = makeDesk();
  desk.position.set(-2.2, 0, -2.4);
  desk.rotation.y = Math.PI * 0.15;
  T3.scene.add(desk);
  // Silla
  const chair = makeChair();
  chair.position.set(-2.2, 0, -1.2);
  chair.rotation.y = Math.PI;
  T3.scene.add(chair);
  // Estantería pared derecha
  const shelf = makeBookshelf();
  shelf.position.set(half - 0.3, 0, 1);
  shelf.rotation.y = -Math.PI/2;
  T3.scene.add(shelf);
  // Lámpara de mesa en escritorio
  const tl = makeTableLamp();
  tl.position.set(-2.6, 0.79, -2.4);
  T3.scene.add(tl);
  // Planta
  const plant = makePlant();
  plant.position.set(-half + 0.8, 0, -half + 0.8);
  T3.scene.add(plant);
  // Lámpara colgante
  const cl = makeCeilingLamp();
  cl.position.set(0, height, 0);
  T3.scene.add(cl);
}

function sceneDormitorio(){
  const { half, height } = buildRoomBase({
    floorTex: texWoodFloor,
    wallTex: () => texWallpaper('#1f1a22', 'rgba(0,0,0,0.12)', true)
  });
  T3.scene.add(makeRug(3.0, 2.2).translateX(1.5).translateZ(1.5));
  // Cuadro
  const p = makePainting(1.5, 1.1);
  p.position.set(-1.5, 1.9, -half + 0.06);
  T3.scene.add(p);
  // Ventana
  const w = makeWindow(1.8, 1.5);
  w.position.set(half - 0.06, 1.7, -1.5);
  w.rotation.y = -Math.PI/2;
  T3.scene.add(w);
  // Puerta
  const d = makeDoor();
  d.position.set(-half + 0.06, 0, 2.5);
  d.rotation.y = Math.PI/2;
  T3.scene.add(d);
  // Cama
  const bed = makeBed();
  bed.position.set(-half + 2.0, 0, -half + 1.6);
  bed.rotation.y = 0;
  T3.scene.add(bed);
  // Mesilla
  const ns = makeNightstand();
  ns.position.set(-half + 0.9, 0, -half + 1.6);
  T3.scene.add(ns);
  // Lámpara de mesa
  const tl = makeTableLamp();
  tl.position.set(-half + 0.9, 0.65, -half + 1.6);
  T3.scene.add(tl);
  // Armario
  const wr = makeWardrobe();
  wr.position.set(half - 0.5, 0, -half + 1.5);
  wr.rotation.y = -Math.PI/2;
  T3.scene.add(wr);
  // Planta
  const plant = makePlant();
  plant.position.set(half - 1.2, 0, half - 1.2);
  T3.scene.add(plant);
  // Lámpara colgante
  const cl = makeCeilingLamp();
  cl.position.set(0, height, 0);
  T3.scene.add(cl);
}

function sceneBiblioteca(){
  const { half, height } = buildRoomBase({
    floorTex: texMarble,
    wallTex: () => texWallpaper('#1a1810', 'rgba(0,0,0,0.14)', true)
  });
  // 4 estanterías pegadas a las paredes
  const shelfBack1 = makeBookshelf();
  shelfBack1.position.set(-2.4, 0, -half + 0.25);
  T3.scene.add(shelfBack1);
  const shelfBack2 = makeBookshelf();
  shelfBack2.position.set(1.0, 0, -half + 0.25);
  T3.scene.add(shelfBack2);
  const shelfBack3 = makeBookshelf();
  shelfBack3.position.set(4.0, 0, -half + 0.25);
  T3.scene.add(shelfBack3);
  const shelfLeft = makeBookshelf();
  shelfLeft.position.set(-half + 0.25, 0, 0);
  shelfLeft.rotation.y = Math.PI/2;
  T3.scene.add(shelfLeft);
  const shelfRight = makeBookshelf();
  shelfRight.position.set(half - 0.25, 0, 0);
  shelfRight.rotation.y = -Math.PI/2;
  T3.scene.add(shelfRight);
  // Escritorio central
  const desk = makeDesk();
  desk.position.set(0, 0, 1.5);
  T3.scene.add(desk);
  const chair = makeChair();
  chair.position.set(0, 0, 2.7);
  chair.rotation.y = Math.PI;
  T3.scene.add(chair);
  // Lámpara de mesa
  const tl = makeTableLamp();
  tl.position.set(-0.5, 0.79, 1.5);
  T3.scene.add(tl);
  // Lámpara colgante
  const cl = makeCeilingLamp();
  cl.position.set(0, height, 0);
  T3.scene.add(cl);
}

function sceneExterior(){
  const scene = T3.scene;
  const size = 20;
  T3.roomHalf = size/2;
  T3.roomHeight = 10;
  // Suelo (hierba)
  const gt = texGrass();
  gt.repeat.set(10, 10);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    matStandard({ map: gt, roughness: 1 })
  );
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);
  // Muro invisible para colisiones
  // Cielo
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(40, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0x0a0a1e, side: THREE.BackSide })
  );
  scene.add(sky);
  // Árboles
  [[-6,-6,1.2], [5,-7,1.0], [-8,4,0.9], [7,5,1.1], [0,-9,1.0]].forEach(([x,z,s]) => {
    const t = makeTree(s);
    t.position.set(x, 0, z);
    scene.add(t);
  });
  // Banco
  const bench = makeBench();
  bench.position.set(3, 0, -3);
  bench.rotation.y = -Math.PI/6;
  scene.add(bench);
  // Farolas
  const l1 = makeLampPost();
  l1.position.set(-5, 0, 0);
  scene.add(l1);
  const l2 = makeLampPost();
  l2.position.set(5, 0, 3);
  scene.add(l2);
  // Luz ambiental cálida
  const l = new THREE.PointLight(0x8090ff, 0.6, 30, 1.2);
  l.position.set(0, 8, 0);
  scene.add(l);
}

function sceneTeatro(){
  const scene = T3.scene;
  const size = 14;
  const height = 4;
  T3.roomHalf = size/2;
  T3.roomHeight = height;
  const half = size/2;
  // Suelo de escenario
  const wt = texWoodFloor();
  wt.repeat.set(4, 4);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    matStandard({ map: wt, roughness: 0.8 })
  );
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);
  // Techo
  const ceil = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    matStandard({ color: 0x0a0000 })
  );
  ceil.rotation.x = Math.PI/2;
  ceil.position.y = height;
  scene.add(ceil);
  // Pared trasera con cortina
  const curtainMat = new THREE.MeshStandardMaterial({
    map: texCurtain(),
    roughness: 0.9,
    side: THREE.DoubleSide
  });
  curtainMat.map.repeat.set(8, 1);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(size, height), curtainMat);
  back.position.set(0, height/2, -half);
  back.receiveShadow = true;
  scene.add(back);
  // Cortinas laterales
  const left = new THREE.Mesh(new THREE.PlaneGeometry(size, height), curtainMat);
  left.position.set(-half, height/2, 0);
  left.rotation.y = Math.PI/2;
  scene.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(size, height), curtainMat);
  right.position.set(half, height/2, 0);
  right.rotation.y = -Math.PI/2;
  scene.add(right);
  // Cortinas frontales decorativas
  const front1 = new THREE.Mesh(new THREE.PlaneGeometry(2, height), curtainMat);
  front1.position.set(-half + 1, height/2, half - 0.1);
  scene.add(front1);
  const front2 = new THREE.Mesh(new THREE.PlaneGeometry(2, height), curtainMat);
  front2.position.set(half - 1, height/2, half - 0.1);
  scene.add(front2);
  // Mesa en el escenario
  const desk = makeDesk();
  desk.position.set(1.5, 0, -1);
  T3.scene.add(desk);
  const chair = makeChair();
  chair.position.set(-1.5, 0, -1);
  chair.rotation.y = Math.PI * 0.4;
  T3.scene.add(chair);
  // Lámpara
  const tl = makeTableLamp();
  tl.position.set(1.0, 0.79, -1);
  T3.scene.add(tl);
  // Planta
  const plant = makePlant();
  plant.position.set(-half + 0.8, 0, -half + 0.8);
  T3.scene.add(plant);
  // Foco cenital
  const cl = makeCeilingLamp();
  cl.position.set(0, height, 0);
  T3.scene.add(cl);
}

const SCENE_BUILDERS = {
  despacho: sceneDespacho,
  dormitorio: sceneDormitorio,
  biblioteca: sceneBiblioteca,
  exterior: sceneExterior,
  teatro: sceneTeatro
};

/* ---------- CORPSE POSITIONS PER SCENE ---------- */
const CORPSE_DEFAULTS = {
  despacho:  { x: 0.5, z: 1.5, rot: Math.PI * 0.15, pose: 'supine' },
  dormitorio:{ x: 1.0, z: 0.5, rot: Math.PI * 0.25, pose: 'side'   },
  biblioteca:{ x: 0.5, z: 0.5, rot: Math.PI * 0.5,  pose: 'prone'  },
  exterior:  { x: 0,   z: 0,   rot: Math.PI * 0.1,  pose: 'curled' },
  teatro:    { x: 1.0, z: 1.0, rot: Math.PI * -0.2, pose: 'supine' }
};

/* ---------- HOTSPOT MARKERS ---------- */
function makeHotspotMarker(obj){
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0xd4a017,
    emissive: 0xd4a017,
    emissiveIntensity: 1.8,
    metalness: 0.5,
    roughness: 0.3,
    transparent: true,
    opacity: 0.95
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 14), mat);
  g.add(sphere);
  // Anillo exterior
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.02, 12, 32),
    new THREE.MeshBasicMaterial({ color: 0xf0c75e, transparent: true, opacity: 0.7 })
  );
  ring.rotation.x = Math.PI/2;
  g.add(ring);
  g.userData.objId = obj.id;
  g.userData.objData = obj;
  g.userData.baseY = 1.2;
  return g;
}

function makeHotspotLabel(text){
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#d4a017';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 252, 60);
  ctx.fillStyle = '#d4a017';
  ctx.font = 'bold 22px "Special Elite", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let t = text;
  if (t.length > 18) t = t.slice(0, 17) + '…';
  ctx.fillText(t, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, depthTest: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.4, 0.35, 1);
  return sprite;
}

/* ---------- INICIALIZACIÓN ---------- */
function initThreeScene(c, g){
  disposeThree();

  T3.caseData = c;
  T3.gameState = g;
  T3.keys = {};
  T3.yaw = 0;
  T3.pitch = 0;

  const stage = document.getElementById('three-host');
  if (!stage) return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x05050a, 1);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  stage.appendChild(renderer.domElement);
  T3.renderer = renderer;
  T3.canvas = renderer.domElement;
  T3.canvas.style.display = 'block';
  T3.canvas.style.width = '100%';
  T3.canvas.style.height = '100%';
  T3.canvas.style.cursor = 'crosshair';

  // Escena
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05050a, 0.06);
  T3.scene = scene;

  // Cámara
  const camera = new THREE.PerspectiveCamera(70, stage.clientWidth / stage.clientHeight, 0.05, 100);
  camera.position.set(0, 1.65, 0.5);
  camera.rotation.order = 'YXZ';
  T3.camera = camera;

  // Luces ambientales
  const ambient = new THREE.AmbientLight(0x404050, 0.5);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x7080a0, 0x201008, 0.35);
  scene.add(hemi);

  // Construir habitación
  const sceneType = c.sceneType || 'despacho';
  const builder = SCENE_BUILDERS[sceneType] || sceneDespacho;
  builder();

  // Cadáver
  const cd = CORPSE_DEFAULTS[sceneType] || CORPSE_DEFAULTS.despacho;
  const corpsePose = c.corpsePose || cd.pose;
  const corpseX = c.corpsePos ? c.corpsePos.x : cd.x;
  const corpseZ = c.corpsePos ? c.corpsePos.z : cd.z;
  const corpseRot = c.corpsePos ? c.corpsePos.rot : cd.rot;
  const corpse = buildCorpse(corpsePose, corpseX, corpseZ, corpseRot);
  scene.add(corpse);

  // Hotspots
  T3.hotspots = [];
  const n = c.objects.length;
  c.objects.forEach((o, i) => {
    const angle = (i / n) * Math.PI * 2;
    const radius = 2.6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 0.5;
    const marker = makeHotspotMarker(o);
    marker.position.set(x, 1.2, z);
    const label = makeHotspotLabel(o.name);
    label.position.set(0, 0.35, 0);
    marker.add(label);
    // Estado examinado
    if (g.examined.includes(o.id)){
      marker.children.forEach(ch => {
        if (ch.material) {
          ch.material.color.setHex(0x4ade80);
          if (ch.material.emissive) ch.material.emissive.setHex(0x4ade80);
        }
      });
    }
    scene.add(marker);
    T3.hotspots.push({ mesh: marker, objId: o.id, data: o });
  });

  // Raycaster
  T3.raycaster = new THREE.Raycaster();

  // Eventos
  setupThreeControls();
  applyCinematicIntro();

  // Render loop
  T3.lastTime = performance.now();
  animateThree();
}

function applyCinematicIntro(){
  // Pequeña animación de entrada: la cámara baja del techo
  const cam = T3.camera;
  const startY = 3.0;
  const endY = 1.65;
  const duration = 1200;
  const start = performance.now();
  function step(){
    const t = Math.min(1, (performance.now() - start) / duration);
    const e = 1 - Math.pow(1 - t, 3);
    cam.position.y = startY + (endY - startY) * e;
    if (t < 1) requestAnimationFrame(step);
  }
  cam.position.y = startY;
  step();
}

/* ---------- CONTROLES PRIMERA PERSONA ---------- */
function setupThreeControls(){
  const canvas = T3.canvas;

  const onKeyDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    T3.keys[e.code] = true;
    if (['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){
      e.preventDefault();
    }
  };
  const onKeyUp = (e) => { T3.keys[e.code] = false; };

  const onMouseMove = (e) => {
    if (!T3.pointerLocked) return;
    const sens = 0.0022;
    T3.yaw -= e.movementX * sens;
    T3.pitch -= e.movementY * sens;
    T3.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, T3.pitch));
  };

  const onPointerLockChange = () => {
    T3.pointerLocked = document.pointerLockElement === canvas;
    const overlay = document.getElementById('t3-lock-overlay');
    if (overlay) overlay.style.display = T3.pointerLocked ? 'none' : 'flex';
  };

  const onClickCanvas = (e) => {
    if (!T3.pointerLocked){
      canvas.requestPointerLock();
      return;
    }
    // Raycast desde el centro (crosshair)
    T3.raycaster.setFromCamera({ x: 0, y: 0 }, T3.camera);
    const meshes = T3.hotspots.map(h => h.mesh);
    const intersects = T3.raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0){
      let hitObj = intersects[0].object;
      while (hitObj && !hitObj.userData.objId) hitObj = hitObj.parent;
      if (hitObj && hitObj.userData.objId && T3.onObjectClick){
        T3.onObjectClick(hitObj.userData.objId);
      }
    }
  };

  const onResize = () => {
    const stage = document.getElementById('three-host');
    if (!stage || !T3.renderer || !T3.camera) return;
    const w = stage.clientWidth, h = stage.clientHeight;
    T3.camera.aspect = w / h;
    T3.camera.updateProjectionMatrix();
    T3.renderer.setSize(w, h);
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  canvas.addEventListener('click', onClickCanvas);
  window.addEventListener('resize', onResize);

  T3.boundEvents = { onKeyDown, onKeyUp, onMouseMove, onPointerLockChange, onClickCanvas, onResize };
}

function animateThree(){
  T3.animId = requestAnimationFrame(animateThree);
  const now = performance.now();
  const dt = Math.min(0.05, (now - T3.lastTime) / 1000);
  T3.lastTime = now;

  // Movimiento
  const runMult = (T3.keys['ShiftLeft'] || T3.keys['ShiftRight']) ? T3.runMult : 1;
  const speed = T3.moveSpeed * runMult * dt;
  const fwd = new THREE.Vector3(-Math.sin(T3.yaw), 0, -Math.cos(T3.yaw));
  const right = new THREE.Vector3(Math.cos(T3.yaw), 0, -Math.sin(T3.yaw));

  if (T3.keys['KeyW'] || T3.keys['ArrowUp']) T3.camera.position.addScaledVector(fwd, speed);
  if (T3.keys['KeyS'] || T3.keys['ArrowDown']) T3.camera.position.addScaledVector(fwd, -speed);
  if (T3.keys['KeyA'] || T3.keys['ArrowLeft']) T3.camera.position.addScaledVector(right, -speed);
  if (T3.keys['KeyD'] || T3.keys['ArrowRight']) T3.camera.position.addScaledVector(right, speed);

  // Clamp al tamaño de la habitación
  const b = T3.roomHalf - 0.4;
  T3.camera.position.x = Math.max(-b, Math.min(b, T3.camera.position.x));
  T3.camera.position.z = Math.max(-b, Math.min(b, T3.camera.position.z));
  T3.camera.position.y = 1.65;

  // Rotación
  T3.camera.rotation.y = T3.yaw;
  T3.camera.rotation.x = T3.pitch;

  // Animar hotspots (flotación + rotación)
  const t = now * 0.001;
  T3.hotspots.forEach((h, i) => {
    const baseY = 1.2;
    h.mesh.position.y = baseY + Math.sin(t * 2 + i) * 0.05;
    h.mesh.rotation.y = t * 0.5;
    const ring = h.mesh.children.find(c => c.geometry && c.geometry.type === 'TorusGeometry');
    if (ring) ring.rotation.z = t + i;
  });

  T3.renderer.render(T3.scene, T3.camera);
}

function disposeThree(){
  if (T3.animId){
    cancelAnimationFrame(T3.animId);
    T3.animId = null;
  }
  if (document.pointerLockElement){ try { document.exitPointerLock(); } catch(e){} }
  if (T3.scene){
    T3.scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material){
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => {
          if (m.map) m.map.dispose();
          if (m.emissiveMap) m.emissiveMap.dispose();
          m.dispose();
        });
      }
    });
  }
  if (T3.renderer){
    T3.renderer.dispose();
    if (T3.canvas && T3.canvas.parentNode) T3.canvas.parentNode.removeChild(T3.canvas);
  }
  const ev = T3.boundEvents;
  if (ev.onKeyDown) document.removeEventListener('keydown', ev.onKeyDown);
  if (ev.onKeyUp) document.removeEventListener('keyup', ev.onKeyUp);
  if (ev.onMouseMove) document.removeEventListener('mousemove', ev.onMouseMove);
  if (ev.onPointerLockChange) document.removeEventListener('pointerlockchange', ev.onPointerLockChange);
  if (ev.onResize) window.removeEventListener('resize', ev.onResize);
  T3.scene = null;
  T3.camera = null;
  T3.renderer = null;
  T3.canvas = null;
  T3.hotspots = [];
  T3.keys = {};
  T3.boundEvents = {};
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
  disposeThree();
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
  disposeThree();
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
  disposeThree();
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
          <br>🕹️ <b>Controles en partida:</b> <b>WASD</b> para moverte · <b>Ratón</b> para mirar · <b>Shift</b> para correr · <b>Click</b> en hotspots.
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
   JUEGO (con Three.js)
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
        <main class="stage" id="stage">
          <div class="t3-stage-wrap">
            <div id="three-host" class="three-host"></div>
            <div id="t3-lock-overlay" class="t3-lock-overlay">
              <div class="t3-lock-card">
                <div class="t3-lock-icon">🖱️</div>
                <div class="t3-lock-title">Haz clic para mirar</div>
                <div class="t3-lock-keys">
                  <span><b>W</b> <b>A</b> <b>S</b> <b>D</b> moverte</span>
                  <span><b>RATÓN</b> mirar</span>
                  <span><b>SHIFT</b> correr</span>
                  <span><b>CLICK</b> examinar</span>
                  <span><b>ESC</b> liberar cursor</span>
                </div>
              </div>
            </div>
            <div class="t3-crosshair">+</div>
          </div>
          <div id="t3-panel" class="t3-panel"></div>
        </main>
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

  // Handlers
  $('#btn-leave').onclick = () => {
    if (!confirm('¿Salir de la partida?')) return;
    disposeThree();
    try { if (state.conn) state.conn.close(); } catch(e){}
    try { if (state.peer) state.peer.destroy(); } catch(e){}
    state.game = null; state.conn = null; state.peer = null;
    state.view = 'menu'; state.isHost = false; state.status = null;
    render();
  };
  document.querySelectorAll('.suspect').forEach(el => {
    el.onclick = () => { state.localView = { type:'suspect', id: el.dataset.suspect }; renderPanel(c); };
  });
  if (canAccuse) $('#btn-accuse').onclick = openAccusation;

  // Inicializar Three.js
  T3.onObjectClick = (objId) => {
    if (!g.examined.includes(objId)) sendAction({ type:'examine', id: objId });
    state.localView = { type:'object', id: objId };
    renderPanel(c);
  };
  setTimeout(() => initThreeScene(c, g), 50);

  // Panel lateral (interrogatorio / objeto)
  renderPanel(c);

  if (g.result && state.view !== 'result') {
    setTimeout(() => { state.view = 'result'; render(); }, 350);
  }
}

function renderPanel(c){
  const g = state.game;
  const panel = document.getElementById('t3-panel');
  if (!panel) return;
  const view = state.localView;

  if (view.type === 'suspect'){
    const s = c.suspects.find(x => x.id === view.id);
    if (!s) { state.localView = {type:'scene'}; return renderPanel(c); }
    panel.classList.add('show');
    panel.innerHTML = `
      <div class="t3-panel-inner">
        <div class="t3-panel-header">
          <div>
            <div class="t3-panel-label">INTERROGATORIO</div>
            <div class="t3-panel-title">${s.icon} ${esc(s.name)}</div>
            <div class="t3-panel-sub">${esc(s.role)}</div>
          </div>
          <button class="t3-close" id="t3-close-panel">✕</button>
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
      </div>`;
    panel.querySelectorAll('.q-btn').forEach(btn => {
      btn.onclick = () => {
        const key = btn.dataset.q;
        if (!g.asked.includes(key)) sendAction({ type:'ask', key });
      };
    });
    panel.querySelector('#t3-close-panel').onclick = () => {
      state.localView = {type:'scene'};
      panel.classList.remove('show');
      panel.innerHTML = '';
    };
  } else if (view.type === 'object'){
    const o = c.objects.find(x => x.id === view.id);
    if (!o) { state.localView = {type:'scene'}; return renderPanel(c); }
    panel.classList.add('show');
    panel.innerHTML = `
      <div class="t3-panel-inner">
        <div class="t3-panel-header">
          <div>
            <div class="t3-panel-label">ANÁLISIS</div>
            <div class="t3-panel-title">${o.icon} ${esc(o.name)}</div>
          </div>
          <button class="t3-close" id="t3-close-panel">✕</button>
        </div>
        <div class="detail">
          <p>${esc(o.desc)}</p>
          ${o.clue ? `<div class="clue">🔎 ${esc(o.clue)}</div>` : ''}
        </div>
      </div>`;
    panel.querySelector('#t3-close-panel').onclick = () => {
      state.localView = {type:'scene'};
      panel.classList.remove('show');
      panel.innerHTML = '';
    };
  } else {
    panel.classList.remove('show');
    panel.innerHTML = '';
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
  disposeThree();
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
    : `Una acusación sin fundamento. Habéis dejado escapar al verdadero culpable.`;

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