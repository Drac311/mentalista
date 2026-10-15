/* ====================================================================
   ABOUT:BLANK
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
  setTimeout(() => { try { URL.revokeObjectURL(url); } catch(e){} }, 8000);
  setTimeout(() => { try { window.close(); } catch(e){} }, 500);
}

/* ====================================================================
   SISTEMA DE LOGIN / PROGRESO LOCAL
   ==================================================================== */
const Auth = {
  get current(){ return localStorage.getItem('ec_current') || null; },
  set current(v){ v ? localStorage.setItem('ec_current', v) : localStorage.removeItem('ec_current'); },
  get users(){
    try { return JSON.parse(localStorage.getItem('ec_users') || '{}'); }
    catch(e){ return {}; }
  },
  saveUsers(u){ localStorage.setItem('ec_users', JSON.stringify(u)); },
  list(){ return Object.keys(this.users); },
  login(name){
    const users = this.users;
    if (!users[name]){
      users[name] = { name, created: Date.now(), solved: [] };
      this.saveUsers(users);
    }
    this.current = name;
  },
  logout(){ this.current = null; },
  getUser(){ const n = this.current; return n ? (this.users[n] || null) : null; },
  markSolved(caseId){
    const n = this.current;
    if (!n) return;
    const users = this.users;
    if (!users[n]) return;
    if (!users[n].solved.includes(caseId)){
      users[n].solved.push(caseId);
      this.saveUsers(users);
    }
  },
  isSolved(caseId){
    const u = this.getUser();
    return u ? u.solved.includes(caseId) : false;
  },
  countSolved(){
    const u = this.getUser();
    return u ? u.solved.length : 0;
  }
};

/* ====================================================================
   CINEMÁTICA
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

/* ====================================================================
   PARALLAX (solo menús)
   ==================================================================== */
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

/* ====================================================================
   MOTOR 3D — Variables globales
   ==================================================================== */
const World = {
  renderer:null, scene:null, camera:null, canvas:null,
  room:null,
  bounds:{ minX:-5, maxX:5, minZ:-5, maxZ:5 },
  obstacles:[],
  hotspots:[],
  corpsePos:{ x:0, z:0 },
  roomHalf:5, roomHeight:3,
  raycaster:null,
  animId:null, lastTime:0,
  caseData:null,
  onObjectClick:null,
  nearHintEl:null, crosshairEl:null,
  keys:{}, boundEvents:{}
};

const Player = {
  pos: new THREE.Vector3(0, 1.65, 3),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: Math.PI, pitch: -0.1,
  radius: 0.32,
  height: 1.65,
  walkSpeed: 2.6,
  runSpeed: 4.6,
  bobPhase: 0,
  bobAmp: 0,
  pointerLocked: false
};

/* ====================================================================
   TEXTURAS PROCEDURALES
   ==================================================================== */
function makeTex(w, h, drawFn){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawFn(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
function texWoodFloor(){
  return makeTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#3a2414'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++){
      ctx.strokeStyle = `rgba(0,0,0,${0.05 + Math.random()*0.18})`;
      ctx.lineWidth = 1 + Math.random()*2;
      const y = Math.random()*h;
      ctx.beginPath(); ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 16)
        ctx.lineTo(x, y + Math.sin(x*0.03 + i*2)*(2+Math.random()*2));
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.lineWidth = 3;
    for (let y = 0; y < h; y += 64){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    for (let x = 0; x < w; x += 128){ ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  });
}
function texMarble(){
  return makeTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#c8c0b0'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++){
      ctx.strokeStyle = `rgba(60,50,40,${0.15 + Math.random()*0.25})`;
      ctx.lineWidth = 1 + Math.random()*3;
      let x = Math.random()*w, y = Math.random()*h;
      ctx.beginPath(); ctx.moveTo(x, y);
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
  return makeTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2a4a1a'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 12000; i++){
      const r = 20+Math.random()*50, g = 60+Math.random()*80, b = 15+Math.random()*30;
      ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 4);
    }
  });
}
function texWallpaper(base, stripe){
  return makeTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = stripe;
    for (let x = 0; x < w; x += 32) ctx.fillRect(x, 0, 3, h);
    for (let i = 0; i < 3000; i++){
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.06})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
  });
}
function texBrick(){
  return makeTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1a1410'; ctx.fillRect(0, 0, w, h);
    const bw = 64, bh = 32;
    for (let y = 0; y < h; y += bh){
      const off = (y/bh) % 2 === 0 ? 0 : bw/2;
      for (let x = -bw; x < w + bw; x += bw){
        const col = ['#4a2820','#5a3028','#3a1e16','#6a3830'][Math.floor(Math.random()*4)];
        ctx.fillStyle = col;
        ctx.fillRect(x + off + 2, y + 2, bw - 4, bh - 4);
      }
    }
  });
}
function texBooks(){
  return makeTex(256, 256, (ctx, w, h) => {
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
function texCarpet(base, accent){
  return makeTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent; ctx.lineWidth = 8;
    ctx.strokeRect(24, 24, w-48, h-48);
    ctx.lineWidth = 4; ctx.strokeRect(60, 60, w-120, h-120);
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++){
      ctx.beginPath();
      const s = 40 + i*25;
      ctx.moveTo(w/2, h/2 - s); ctx.lineTo(w/2 + s, h/2);
      ctx.lineTo(w/2, h/2 + s); ctx.lineTo(w/2 - s, h/2);
      ctx.closePath(); ctx.stroke();
    }
  });
}
function texCurtain(){
  return makeTex(256, 512, (ctx, w, h) => {
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
  return makeTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0e0d12'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2000; i++){
      ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
  });
}
function texPainting(){
  return makeTex(256, 192, (ctx, w, h) => {
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

/* ====================================================================
   HELPERS DE GEOMETRÍA
   ==================================================================== */
function M(opts){ return new THREE.MeshStandardMaterial(opts); }
function addBox(scene, w, h, d, mat, x, y, z){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  return m;
}
function addCyl(scene, rt, rb, h, mat, x, y, z, seg){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 16), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  return m;
}
function addSphere(scene, r, mat, x, y, z, seg){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg || 16, seg || 12), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  scene.add(m);
  return m;
}
function addObstacle(cx, cz, hw, hd){
  World.obstacles.push({ minX: cx-hw, maxX: cx+hw, minZ: cz-hd, maxZ: cz+hd });
}

/* ====================================================================
   MUEBLES
   ==================================================================== */
function buildDesk(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x5a3a20, roughness: 0.75 });
  const woodDark = M({ color: 0x3a2410, roughness: 0.7 });
  const drawer = M({ color: 0x4a2f18, roughness: 0.7 });
  const handle = M({ color: 0xa8884a, metalness: 0.8, roughness: 0.3 });
  // Tablero
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 1.0), wood);
  top.position.y = 0.76; top.castShadow = true; top.receiveShadow = true;
  g.add(top);
  // Patas
  [[-1,-0.4],[1,-0.4],[-1,0.4],[1,0.4]].forEach(([px, pz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.76, 0.08), woodDark);
    leg.position.set(px, 0.38, pz); leg.castShadow = true;
    g.add(leg);
  });
  // Cajonera
  const dr = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.9), drawer);
  dr.position.set(-0.75, 0.45, 0); dr.castShadow = true;
  g.add(dr);
  for (let i = 0; i < 3; i++){
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.14, 0.04), drawer);
    c.position.set(-0.75, 0.28 + i*0.18, 0.46);
    g.add(c);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), handle);
    h.position.set(-0.75, 0.28 + i*0.18, 0.49);
    g.add(h);
  }
  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildChair(scene, x, z, ry){
  const g = new THREE.Group();
  const w = M({ color: 0x4a2f18, roughness: 0.8 });
  const cushion = M({ color: 0x6a1818, roughness: 0.95 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.5), w);
  seat.position.y = 0.46; seat.castShadow = true;
  g.add(seat);
  const cush = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.44), cushion);
  cush.position.y = 0.52; cush.castShadow = true;
  g.add(cush);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.06), w);
  back.position.set(0, 0.81, -0.22); back.castShadow = true;
  g.add(back);
  [[-0.22,0.22],[0.22,0.22],[-0.22,-0.22],[0.22,-0.22]].forEach(([px, pz]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.46, 0.05), w);
    leg.position.set(px, 0.23, pz); leg.castShadow = true;
    g.add(leg);
  });
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildBookshelf(scene, x, z, ry, W, H){
  W = W || 2.4; H = H || 2.8;
  const g = new THREE.Group();
  const wood = M({ color: 0x3a2410, roughness: 0.8 });
  const booksMat = M({ map: texBooks(), roughness: 0.9 });
  const side = (X) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, 0.4), wood);
    m.position.set(X, H/2, 0); m.castShadow = true;
    g.add(m);
  };
  side(-W/2); side(W/2);
  const topShelf = new THREE.Mesh(new THREE.BoxGeometry(W+0.12, 0.1, 0.4), wood);
  topShelf.position.set(0, H, 0); topShelf.castShadow = true;
  g.add(topShelf);
  const botShelf = new THREE.Mesh(new THREE.BoxGeometry(W+0.12, 0.1, 0.4), wood);
  botShelf.position.set(0, 0.05, 0); botShelf.castShadow = true;
  g.add(botShelf);
  for (let i = 1; i < 4; i++){
    const y = i * (H/4);
    const sh = new THREE.Mesh(new THREE.BoxGeometry(W, 0.06, 0.4), wood);
    sh.position.set(0, y, 0); g.add(sh);
    const bb = new THREE.Mesh(new THREE.BoxGeometry(W-0.3, H/4 - 0.2, 0.3), booksMat);
    bb.position.set(0, y + H/8, 0); bb.castShadow = true;
    g.add(bb);
  }
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildBed(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.85 });
  const mattress = M({ color: 0xd8c8b0, roughness: 0.95 });
  const sheet = M({ color: 0xa8a8b8, roughness: 0.9 });
  const blanket = M({ color: 0x5a1e1e, roughness: 0.95 });
  const pillow = M({ color: 0xf0e8d8, roughness: 0.9 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 2.2), wood);
  base.position.y = 0.2; base.castShadow = true;
  g.add(base);
  const head = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.15), wood);
  head.position.set(0, 0.75, -1.05); head.castShadow = true;
  g.add(head);
  const matt = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.28, 2.1), mattress);
  matt.position.y = 0.42; matt.castShadow = true;
  g.add(matt);
  const sht = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 1.9), sheet);
  sht.position.set(0, 0.6, 0.1); g.add(sht);
  const blk = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.06, 1.0), blanket);
  blk.position.set(0, 0.63, 0.6); blk.castShadow = true;
  g.add(blk);
  const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.4), pillow);
  p1.position.set(-0.5, 0.66, -0.85); g.add(p1);
  const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.16, 0.4), pillow);
  p2.position.set(0.5, 0.66, -0.85); g.add(p2);
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildNightstand(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.8 });
  const handle = M({ color: 0xa8884a, metalness: 0.8, roughness: 0.3 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.05, 0.55), wood);
  top.position.y = 0.6; top.castShadow = true;
  g.add(top);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), wood);
  body.position.y = 0.3; body.castShadow = true;
  g.add(body);
  const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.03), handle);
  h.position.set(0, 0.35, 0.27); g.add(h);
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildWardrobe(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x3a2410, roughness: 0.8 });
  const door = M({ color: 0x4a2f18, roughness: 0.75 });
  const handle = M({ color: 0xa8884a, metalness: 0.8, roughness: 0.3 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.6, 0.7), wood);
  body.position.y = 1.3; body.castShadow = true;
  g.add(body);
  const d1 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.4, 0.04), door);
  d1.position.set(-0.35, 1.3, 0.36); g.add(d1);
  const d2 = new THREE.Mesh(new THREE.BoxGeometry(0.65, 2.4, 0.04), door);
  d2.position.set(0.35, 1.3, 0.36); g.add(d2);
  const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.05), handle);
  h1.position.set(-0.06, 1.3, 0.4); g.add(h1);
  const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.05), handle);
  h2.position.set(0.06, 1.3, 0.4); g.add(h2);
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildSofa(scene, x, z, ry){
  const g = new THREE.Group();
  const fabric = M({ color: 0x4a2a2a, roughness: 0.95 });
  const fabricL = M({ color: 0x5a3a3a, roughness: 0.95 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.9), fabric);
  base.position.set(0, 0.3, 0.15); base.castShadow = true;
  g.add(base);
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.2), fabricL);
  back.position.set(0, 0.8, -0.28); back.castShadow = true;
  g.add(back);
  const a1 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.9), fabric);
  a1.position.set(-1.1, 0.65, 0.15); g.add(a1);
  const a2 = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.9), fabric);
  a2.position.set(1.1, 0.65, 0.15); g.add(a2);
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildPlant(scene, x, z){
  const g = new THREE.Group();
  const potMat = M({ color: 0x5a3a20, roughness: 0.9 });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.2, 0.35, 16), potMat);
  pot.position.y = 0.175; pot.castShadow = true;
  g.add(pot);
  const leafColors = [0x2a5a2a, 0x3a6a3a, 0x1a4a1a, 0x4a7a3a];
  for (let i = 0; i < 30; i++){
    const lm = M({ color: leafColors[Math.floor(Math.random()*4)], roughness: 0.85, side: THREE.DoubleSide });
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.7), lm);
    const ang = Math.random()*Math.PI*2;
    leaf.position.set(Math.cos(ang)*0.15, 0.35 + Math.random()*0.5, Math.sin(ang)*0.15);
    leaf.rotation.y = ang;
    leaf.rotation.x = -0.4 + (Math.random()-0.5)*0.8;
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}
function buildPainting(scene, x, y, z, ry, w, h){
  w = w || 1.8; h = h || 1.3;
  const g = new THREE.Group();
  const frame = M({ color: 0x4a3d22, roughness: 0.6, metalness: 0.15 });
  const fm = new THREE.Mesh(new THREE.BoxGeometry(w+0.2, h+0.2, 0.08), frame);
  fm.castShadow = true;
  g.add(fm);
  const cm = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M({ map: texPainting(), roughness: 0.7 }));
  cm.position.z = 0.05;
  g.add(cm);
  g.position.set(x, y, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildWindow(scene, x, y, z, ry, w, h){
  w = w || 1.8; h = h || 1.5;
  const g = new THREE.Group();
  const frame = M({ color: 0x4a3d22, roughness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x1a2035, emissive: 0x2a3a6a, emissiveIntensity: 0.8,
    transparent: true, opacity: 0.9, metalness: 0.3, roughness: 0.15
  });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(w+0.2, h+0.2, 0.1), frame);
  g.add(fr);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass);
  pane.position.z = 0.06;
  g.add(pane);
  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, h, 0.08), frame);
  vBar.position.z = 0.07; g.add(vBar);
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, 0.08), frame);
  hBar.position.z = 0.07; g.add(hBar);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.12, 20),
    new THREE.MeshBasicMaterial({ color: 0xf0e8d8 }));
  moon.position.set(w/4, h/4, 0.08);
  g.add(moon);
  g.position.set(x, y, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildDoor(scene, x, z, ry, w, h){
  w = w || 1.1; h = h || 2.3;
  const g = new THREE.Group();
  const frame = M({ color: 0x2a1a08, roughness: 0.8 });
  const door = M({ color: 0x3a2410, roughness: 0.75 });
  const handle = M({ color: 0xa8884a, metalness: 0.8, roughness: 0.3 });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(w+0.15, h+0.15, 0.1), frame);
  fr.position.y = h/2; g.add(fr);
  const d = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), door);
  d.position.set(0, h/2, 0.04); g.add(d);
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), handle);
  hd.position.set(w/2 - 0.12, h/2, 0.1); g.add(hd);
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildCeilingLamp(scene, x, z){
  const g = new THREE.Group();
  const metal = M({ color: 0x1a1a1e, metalness: 0.8, roughness: 0.4 });
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.95
  });
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), metal);
  cord.position.y = -0.15; g.add(cord);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 14), bulbMat);
  bulb.position.y = -0.35; g.add(bulb);
  const light = new THREE.PointLight(0xffd682, 1.4, 14, 1.3);
  light.position.y = -0.4;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 20;
  g.add(light);
  g.position.set(x, World.roomHeight, z);
  scene.add(g);
  return g;
}
function buildTableLamp(scene, x, y, z){
  const g = new THREE.Group();
  const metal = M({ color: 0x2a2a30, metalness: 0.85, roughness: 0.35 });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 1.4,
    transparent: true, opacity: 0.92
  });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.03, 16), metal);
  g.add(base);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.35, 8), metal);
  pole.position.y = 0.18; g.add(pole);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.24, 20, 1, true), shadeMat);
  shade.position.y = 0.47; g.add(shade);
  const l = new THREE.PointLight(0xffd682, 0.8, 4, 1.8);
  l.position.y = 0.45; g.add(l);
  g.position.set(x, y, z);
  scene.add(g);
  return g;
}
function buildTree(scene, x, z, scale){
  scale = scale || 1;
  const g = new THREE.Group();
  const trunk = M({ color: 0x3a2410, roughness: 0.95 });
  const l1 = M({ color: 0x1a3a1a, roughness: 0.9 });
  const l2 = M({ color: 0x2a4a2a, roughness: 0.9 });
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15*scale, 0.22*scale, 2*scale, 12), trunk);
  t.position.y = 1*scale; t.castShadow = true;
  g.add(t);
  for (let i = 0; i < 6; i++){
    const s = (0.8 + Math.random()*0.6)*scale;
    const m = Math.random() > 0.5 ? l1 : l2;
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), m);
    leaf.position.set((Math.random()-0.5)*0.8*scale, (2 + Math.random()*1.2)*scale, (Math.random()-0.5)*0.8*scale);
    leaf.castShadow = true;
    g.add(leaf);
  }
  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}
function buildBench(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x5a3a20, roughness: 0.85 });
  const metal = M({ color: 0x2a2a30, metalness: 0.8, roughness: 0.4 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.5), wood);
  seat.position.y = 0.5; seat.castShadow = true; g.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.08), wood);
  back.position.set(0, 0.78, -0.2); g.add(back);
  [[-0.75,0],[0.75,0]].forEach(([px, pz]) => {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.4), metal);
    l.position.set(px, 0.25, pz); g.add(l);
  });
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}
function buildLampPost(scene, x, z){
  const g = new THREE.Group();
  const metal = M({ color: 0x1a1a1e, metalness: 0.7, roughness: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 1.8 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 4, 8), metal);
  pole.position.y = 2; pole.castShadow = true; g.add(pole);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), lightMat);
  lamp.position.y = 4.1; g.add(lamp);
  const pl = new THREE.PointLight(0xffd682, 1.4, 10, 1.5);
  pl.position.y = 4.1; g.add(pl);
  g.position.set(x, 0, z);
  scene.add(g);
  return g;
}
function buildRug(scene, x, z, w, d, rot){
  const mat = M({ map: texCarpet('#5a2818', 'rgba(212,160,23,0.4)'), roughness: 1 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 3.5, d || 2.4), mat);
  m.rotation.x = -Math.PI/2;
  m.rotation.z = rot || 0;
  m.position.set(x || 0, 0.006, z || 0);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
function buildCurtain(scene, x, y, z, ry, w, h){
  const tex = texCurtain();
  tex.repeat.set(w/1.5, 1);
  const mat = M({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  m.castShadow = true;
  scene.add(m);
  return m;
}

/* ====================================================================
   CADÁVER — posturas + variantes
   ==================================================================== */
const CORPSE_POSES = {
  supine:  { armL: 1.2, armR: 1.2, legL: 0.12, legR: -0.12 },
  side:    { armL: 1.4, armR: 0.8, legL: 0.5,  legR: -0.1 },
  prone:   { armL: 1.4, armR: -1.4, legL: 0.1,  legR: -0.1 },
  curled:  { armL: 2.2, armR: 2.2, legL: 1.4,  legR: 1.4 },
  seated:  { armL: 0.3, armR: 0.3, legL: 1.5,  legR: -1.5 }
};
function buildCorpse(scene, poseKey, x, z, ry){
  poseKey = poseKey || 'supine';
  const pose = CORPSE_POSES[poseKey] || CORPSE_POSES.supine;
  const g = new THREE.Group();

  const skin = M({ color: 0xd8c8b8, roughness: 0.95 });
  const blood = new THREE.MeshStandardMaterial({ color: 0x5a0a08, roughness: 0.6, transparent: true, opacity: 0.85 });
  const bloodDark = new THREE.MeshStandardMaterial({ color: 0x3a0605, roughness: 0.7, transparent: true, opacity: 0.75 });

  // Mancha de sangre
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), blood);
  pool.rotation.x = -Math.PI/2;
  pool.position.y = 0.008;
  pool.scale.set(1, 1.5, 1);
  g.add(pool);
  for (let i = 0; i < 10; i++){
    const s = new THREE.Mesh(new THREE.CircleGeometry(0.08 + Math.random()*0.22, 16), bloodDark);
    s.rotation.x = -Math.PI/2;
    s.position.set((Math.random()-0.5)*2.4, 0.01, (Math.random()-0.5)*2.8);
    s.scale.set(1, 0.6 + Math.random()*0.8, 1);
    g.add(s);
  }

  const yb = 0.13;
  // Cabeza
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), skin);
  head.position.set(0, yb, -0.66); head.scale.set(0.9, 1.05, 1.15); head.castShadow = true;
  g.add(head);
  // Cuello
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.11, 0.14), skin);
  neck.position.set(0, yb, -0.5); neck.castShadow = true;
  g.add(neck);
  // Torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.26, 0.82), skin);
  torso.position.set(0, yb, 0); torso.castShadow = true;
  g.add(torso);
  // Cadera
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.24, 0.26), skin);
  hips.position.set(0, yb, 0.52); hips.castShadow = true;
  g.add(hips);

  function buildArm(side, rotY){
    const grp = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.42), skin);
    upper.position.z = -0.21; upper.castShadow = true; grp.add(upper);
    const lower = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.4), skin);
    lower.position.z = -0.62; lower.castShadow = true; grp.add(lower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), skin);
    hand.position.z = -0.85; hand.castShadow = true; grp.add(hand);
    grp.position.set(side * 0.35, yb, -0.24);
    grp.rotation.y = rotY;
    return grp;
  }
  g.add(buildArm(-1, pose.armL));
  g.add(buildArm(1, pose.armR));

  function buildLeg(side, rotY){
    const grp = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.52), skin);
    thigh.position.z = 0.26; thigh.castShadow = true; grp.add(thigh);
    const calf = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.5), skin);
    calf.position.z = 0.78; calf.castShadow = true; grp.add(calf);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.24), skin);
    foot.position.set(0, -0.02, 1.13); foot.castShadow = true; grp.add(foot);
    grp.position.set(side * 0.14, yb, 0.6);
    grp.rotation.y = rotY;
    return grp;
  }
  g.add(buildLeg(-1, pose.legL));
  g.add(buildLeg(1, pose.legR));

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  return g;
}

/* ====================================================================
   HABITACIONES
   ==================================================================== */
function roomBase(scene, config){
  const SIZE = config.size;
  const H = config.height;
  World.roomHalf = SIZE/2;
  World.roomHeight = H;
  World.bounds = { minX: -SIZE/2 + 0.45, maxX: SIZE/2 - 0.45, minZ: -SIZE/2 + 0.45, maxZ: SIZE/2 - 0.45 };
  const half = SIZE/2;

  // Suelo
  const fTex = config.floorTex();
  fTex.repeat.set(SIZE/2, SIZE/2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: fTex, roughness: 0.9 }));
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Techo
  const cTex = texCeiling();
  cTex.repeat.set(SIZE/2, SIZE/2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: cTex, roughness: 1 }));
  ceil.rotation.x = Math.PI/2;
  ceil.position.y = H;
  ceil.receiveShadow = true;
  scene.add(ceil);

  // Paredes
  const wTex = config.wallTex();
  wTex.repeat.set(SIZE/2, H/2);
  const wallMat = M({ map: wTex, roughness: 0.95 });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  const walls = [
    { pos: [0, H/2, -half], rot: 0 },
    { pos: [0, H/2, half], rot: Math.PI },
    { pos: [-half, H/2, 0], rot: Math.PI/2 },
    { pos: [half, H/2, 0], rot: -Math.PI/2 }
  ];
  walls.forEach(w => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(...w.pos);
    m.rotation.y = w.rot;
    m.receiveShadow = true;
    scene.add(m);
  });

  // Rodapié
  const bb = M({ color: 0x3a2f1e, roughness: 0.8 });
  const bh = 0.15, bt = 0.06;
  [
    { p: [0, bh/2, -half + bt/2], s: [SIZE, bh, bt] },
    { p: [0, bh/2, half - bt/2], s: [SIZE, bh, bt] },
    { p: [-half + bt/2, bh/2, 0], s: [bt, bh, SIZE] },
    { p: [half - bt/2, bh/2, 0], s: [bt, bh, SIZE] }
  ].forEach(({p, s}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...s), bb);
    m.position.set(...p);
    m.receiveShadow = true;
    scene.add(m);
  });
}

function roomDespacho(scene){
  const SIZE = 11, H = 3;
  roomBase(scene, { size: SIZE, height: H, floorTex: texWoodFloor, wallTex: () => texWallpaper('#2a2419', 'rgba(0,0,0,0.15)') });
  const half = SIZE/2;

  buildRug(scene, -1, 0, 3.5, 2.5);
  buildPainting(scene, 1.5, 1.9, -half + 0.06, 0, 1.8, 1.3);
  buildPainting(scene, -half + 0.06, 1.9, 2.0, Math.PI/2, 1.2, 0.9);
  buildWindow(scene, -half + 0.06, 1.8, -1.5, Math.PI/2, 1.8, 1.5);
  buildDoor(scene, half - 0.06, 2.0, -Math.PI/2, 1.1, 2.3);

  buildDesk(scene, -2.5, -2.4, Math.PI * 0.15);
  addObstacle(-2.5, -2.4, 1.2, 0.7);
  buildChair(scene, -2.5, -1.2, Math.PI);
  addObstacle(-2.5, -1.2, 0.4, 0.4);
  buildTableLamp(scene, -2.9, 0.8, -2.4);

  buildBookshelf(scene, half - 0.3, 1.2, -Math.PI/2, 2.2, 2.6);
  addObstacle(half - 0.3, 1.2, 0.3, 1.2);

  buildBookshelf(scene, half - 0.3, -1.8, -Math.PI/2, 2.2, 2.6);
  addObstacle(half - 0.3, -1.8, 0.3, 1.2);

  buildPlant(scene, -half + 0.8, -half + 0.8);
  addObstacle(-half + 0.8, -half + 0.8, 0.3, 0.3);

  buildPlant(scene, half - 0.9, half - 0.9);
  addObstacle(half - 0.9, half - 0.9, 0.3, 0.3);

  buildCeilingLamp(scene, 0, 0);
  return { corpsePos: { x: 0.6, z: 1.5, rot: Math.PI * 0.15 }, pose: 'supine', spawn: { x: 0, z: 3.5 } };
}

function roomDormitorio(scene){
  const SIZE = 11, H = 3;
  roomBase(scene, { size: SIZE, height: H, floorTex: texWoodFloor, wallTex: () => texWallpaper('#1f1a22', 'rgba(0,0,0,0.12)') });
  const half = SIZE/2;

  buildRug(scene, 1.5, 1.5, 3.2, 2.4);
  buildPainting(scene, -1.8, 1.9, -half + 0.06, 0, 1.4, 1.0);
  buildWindow(scene, half - 0.06, 1.8, -1.8, -Math.PI/2, 1.8, 1.5);
  buildDoor(scene, -half + 0.06, 2.6, Math.PI/2, 1.1, 2.3);

  buildBed(scene, -half + 2.0, -half + 1.7, 0);
  addObstacle(-half + 2.0, -half + 1.7, 1.1, 1.25);

  buildNightstand(scene, -half + 0.9, -half + 1.7, 0);
  addObstacle(-half + 0.9, -half + 1.7, 0.35, 0.35);
  buildTableLamp(scene, -half + 0.9, 0.65, -half + 1.7);

  buildNightstand(scene, -half + 3.2, -half + 1.7, 0);
  addObstacle(-half + 3.2, -half + 1.7, 0.35, 0.35);
  buildTableLamp(scene, -half + 3.2, 0.65, -half + 1.7);

  buildWardrobe(scene, half - 0.6, -half + 1.5, -Math.PI/2);
  addObstacle(half - 0.6, -half + 1.5, 0.4, 0.8);

  buildPlant(scene, half - 1.2, half - 1.2);
  addObstacle(half - 1.2, half - 1.2, 0.3, 0.3);

  buildCeilingLamp(scene, 0, 0);
  return { corpsePos: { x: 1.2, z: 1.0, rot: Math.PI * 0.3 }, pose: 'side', spawn: { x: -1, z: 3.5 } };
}

function roomBiblioteca(scene){
  const SIZE = 13, H = 3.5;
  roomBase(scene, { size: SIZE, height: H, floorTex: texMarble, wallTex: () => texWallpaper('#1a1810', 'rgba(0,0,0,0.14)') });
  const half = SIZE/2;

  buildPainting(scene, 0, 2.2, -half + 0.06, 0, 2.0, 1.4);
  buildWindow(scene, -half + 0.06, 1.9, -2.5, Math.PI/2, 2.0, 1.6);
  buildWindow(scene, -half + 0.06, 1.9, 2.5, Math.PI/2, 2.0, 1.6);
  buildDoor(scene, half - 0.06, 2.5, -Math.PI/2, 1.1, 2.3);

  // 4 estanterías en la pared trasera
  buildBookshelf(scene, -3.0, -half + 0.3, 0, 2.4, 2.8);
  addObstacle(-3.0, -half + 0.3, 1.25, 0.3);
  buildBookshelf(scene, 0, -half + 0.3, 0, 2.4, 2.8);
  addObstacle(0, -half + 0.3, 1.25, 0.3);
  buildBookshelf(scene, 3.0, -half + 0.3, 0, 2.4, 2.8);
  addObstacle(3.0, -half + 0.3, 1.25, 0.3);

  // Estanterías laterales
  buildBookshelf(scene, -half + 0.3, -1.5, Math.PI/2, 2.4, 2.8);
  addObstacle(-half + 0.3, -1.5, 0.3, 1.25);
  buildBookshelf(scene, -half + 0.3, 1.5, Math.PI/2, 2.4, 2.8);
  addObstacle(-half + 0.3, 1.5, 0.3, 1.25);

  buildBookshelf(scene, half - 0.3, -1.5, -Math.PI/2, 2.4, 2.8);
  addObstacle(half - 0.3, -1.5, 0.3, 1.25);
  buildBookshelf(scene, half - 0.3, 1.5, -Math.PI/2, 2.4, 2.8);
  addObstacle(half - 0.3, 1.5, 0.3, 1.25);

  buildDesk(scene, 0, 1.5, 0);
  addObstacle(0, 1.5, 1.2, 0.7);
  buildChair(scene, 0, 2.7, Math.PI);
  addObstacle(0, 2.7, 0.4, 0.4);
  buildTableLamp(scene, -0.6, 0.8, 1.5);

  buildCeilingLamp(scene, 0, 0);
  return { corpsePos: { x: 0.6, z: 0.5, rot: Math.PI * 0.5 }, pose: 'prone', spawn: { x: 4, z: 4 } };
}

function roomExterior(scene){
  const SIZE = 22;
  World.roomHalf = SIZE/2;
  World.roomHeight = 12;
  World.bounds = { minX: -SIZE/2 + 1, maxX: SIZE/2 - 1, minZ: -SIZE/2 + 1, maxZ: SIZE/2 - 1 };

  // Suelo hierba
  const gt = texGrass();
  gt.repeat.set(10, 10);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: gt, roughness: 1 }));
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Cielo
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0x0a0a1e, side: THREE.BackSide }));
  scene.add(sky);

  // Luna
  const moon = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20),
    new THREE.MeshBasicMaterial({ color: 0xf0e8d8 }));
  moon.position.set(15, 20, -20);
  moon.lookAt(0, 1, 0);
  scene.add(moon);

  // Árboles
  [[-8,-8,1.3], [6,-9,1.1], [-9,5,1.0], [8,6,1.2], [0,-10,1.0], [-4, 8, 1.1], [10, -2, 1.0]].forEach(([x,z,s]) => {
    buildTree(scene, x, z, s);
    addObstacle(x, z, 0.4*s, 0.4*s);
  });

  // Banco
  buildBench(scene, 3, -3, -Math.PI/6);
  addObstacle(3, -3, 1.0, 0.4);

  // Farolas
  buildLampPost(scene, -6, 0);
  addObstacle(-6, 0, 0.2, 0.2);
  buildLampPost(scene, 6, 4);
  addObstacle(6, 4, 0.2, 0.2);
  buildLampPost(scene, -6, -8);
  addObstacle(-6, -8, 0.2, 0.2);

  const ambient = new THREE.PointLight(0x8090ff, 0.5, 40, 1.2);
  ambient.position.set(0, 10, 0);
  scene.add(ambient);

  return { corpsePos: { x: 0, z: 0, rot: Math.PI * 0.1 }, pose: 'curled', spawn: { x: 3, z: 4 } };
}

function roomTeatro(scene){
  const SIZE = 12, H = 4.5;
  World.roomHalf = SIZE/2;
  World.roomHeight = H;
  World.bounds = { minX: -SIZE/2 + 0.5, maxX: SIZE/2 - 0.5, minZ: -SIZE/2 + 0.5, maxZ: SIZE/2 - 0.5 };
  const half = SIZE/2;

  // Suelo escenario
  const wt = texWoodFloor();
  wt.repeat.set(4, 4);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: wt, roughness: 0.8 }));
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Techo
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ color: 0x0a0000, roughness: 1 }));
  ceil.rotation.x = Math.PI/2;
  ceil.position.y = H;
  scene.add(ceil);

  // Cortinas
  buildCurtain(scene, 0, H/2, -half + 0.05, 0, SIZE, H);
  buildCurtain(scene, -half + 0.05, H/2, 0, Math.PI/2, SIZE, H);
  buildCurtain(scene, half - 0.05, H/2, 0, -Math.PI/2, SIZE, H);

  // Cortinas frontales
  buildCurtain(scene, -half + 2, H/2, half - 0.05, 0, 2.5, H);
  buildCurtain(scene, half - 2, H/2, half - 0.05, 0, 2.5, H);

  // Focos
  buildCeilingLamp(scene, 0, 0);
  const spot1 = new THREE.PointLight(0xffaa66, 1.5, 8, 1.5);
  spot1.position.set(-2, H - 0.5, 0);
  scene.add(spot1);
  const spot2 = new THREE.PointLight(0xffaa66, 1.5, 8, 1.5);
  spot2.position.set(2, H - 0.5, 0);
  scene.add(spot2);

  // Props
  buildDesk(scene, 2.0, -1.5, Math.PI * 0.1);
  addObstacle(2.0, -1.5, 1.2, 0.7);
  buildChair(scene, -1.5, -1.5, Math.PI * 0.4);
  addObstacle(-1.5, -1.5, 0.4, 0.4);
  buildTableLamp(scene, 1.4, 0.8, -1.5);
  buildPlant(scene, -half + 0.8, -half + 0.8);
  addObstacle(-half + 0.8, -half + 0.8, 0.3, 0.3);

  return { corpsePos: { x: 1.0, z: 1.2, rot: Math.PI * -0.2 }, pose: 'supine', spawn: { x: 0, z: 4 } };
}

const ROOM_BUILDERS = {
  despacho: roomDespacho,
  dormitorio: roomDormitorio,
  biblioteca: roomBiblioteca,
  exterior: roomExterior,
  teatro: roomTeatro
};

/* ====================================================================
   HOTSPOTS
   ==================================================================== */
function makeHotspot(scene, obj, x, y, z, examined){
  const g = new THREE.Group();
  const color = examined ? 0x4ade80 : 0xd4a017;
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.8,
    metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.95
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 14), mat);
  g.add(sphere);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 12, 32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
  ring.rotation.x = Math.PI/2;
  g.add(ring);

  // Label
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = examined ? '#4ade80' : '#d4a017';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, 252, 60);
  ctx.fillStyle = examined ? '#4ade80' : '#d4a017';
  ctx.font = 'bold 22px "Special Elite", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let t = obj.name + (examined ? ' ✓' : '');
  if (t.length > 18) t = t.slice(0, 17) + '…';
  ctx.fillText(t, 128, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: true }));
  sprite.scale.set(1.5, 0.38, 1);
  sprite.position.y = 0.42;
  g.add(sprite);

  g.position.set(x, y, z);
  g.userData.objId = obj.id;
  g.userData.objData = obj;
  g.userData.baseY = y;
  g.userData.phase = Math.random() * Math.PI * 2;
  scene.add(g);
  return g;
}

/* ====================================================================
   INIT ESCENA 3D
   ==================================================================== */
function initWorld(c, g){
  disposeWorld();

  World.caseData = c;
  World.obstacles = [];
  World.hotspots = [];
  Player.keys = {};
  Player.vel.set(0, 0, 0);
  Player.bobPhase = 0;

  const host = document.getElementById('three-host');
  if (!host) return;

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(host.clientWidth || 800, host.clientHeight || 600);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x05050a, 1);
  if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  World.renderer = renderer;
  World.canvas = renderer.domElement;

  // Escena
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05050a, 0.045);
  World.scene = scene;

  // Luces ambientales
  scene.add(new THREE.AmbientLight(0x404050, 0.6));
  const hemi = new THREE.HemisphereLight(0x7080a0, 0x201008, 0.4);
  scene.add(hemi);

  // Cámara
  const camera = new THREE.PerspectiveCamera(75, (host.clientWidth || 800) / (host.clientHeight || 600), 0.05, 100);
  camera.rotation.order = 'YXZ';
  World.camera = camera;

  // Construir habitación
  const roomType = c.sceneType || 'despacho';
  const builder = ROOM_BUILDERS[roomType] || roomDespacho;
  const room = builder(scene);
  World.room = room;

  // Cadáver
  const pose = c.corpsePose || room.pose;
  buildCorpse(scene, pose, room.corpsePos.x, room.corpsePos.z, room.corpsePos.rot);
  World.corpsePos = room.corpsePos;

  // Spawn del jugador
  const sp = room.spawn || { x: 0, z: 3 };
  Player.pos.set(sp.x, Player.height, sp.z);
  const dx = room.corpsePos.x - sp.x;
  const dz = room.corpsePos.z - sp.z;
  Player.yaw = Math.atan2(-dx, -dz);
  Player.pitch = -0.15;
  Player.pointerLocked = false;

  // Hotspots
  const n = c.objects.length;
  const radius = 2.0;
  c.objects.forEach((o, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const hx = room.corpsePos.x + Math.cos(angle) * radius;
    const hz = room.corpsePos.z + Math.sin(angle) * radius;
    const hy = 1.1;
    const examined = g.examined.includes(o.id);
    const hs = makeHotspot(scene, o, hx, hy, hz, examined);
    World.hotspots.push({ mesh: hs, objId: o.id, data: o });
  });

  World.raycaster = new THREE.Raycaster();
  World.crosshairEl = document.querySelector('.crosshair');
  World.nearHintEl = document.querySelector('.near-hint');

  setupControls();

  // Intro de cámara
  const startY = Player.height + 1.5;
  const endY = Player.height;
  const tStart = performance.now();
  const dur = 1200;
  function intro(){
    const t = Math.min(1, (performance.now() - tStart) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    camera.position.y = startY + (endY - startY) * e;
    if (t < 1) requestAnimationFrame(intro);
  }
  camera.position.y = startY;
  intro();

  World.lastTime = performance.now();
  animateWorld();
}

/* ====================================================================
   CONTROLES
   ==================================================================== */
function setupControls(){
  const canvas = World.canvas;
  const overlay = document.getElementById('lock-overlay');

  const onKeyDown = e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    Player.keys[e.code] = true;
    if (['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){
      e.preventDefault();
    }
  };
  const onKeyUp = e => { Player.keys[e.code] = false; };

  const onMouseMove = e => {
    if (!Player.pointerLocked) return;
    const s = 0.0022;
    Player.yaw -= e.movementX * s;
    Player.pitch -= e.movementY * s;
    Player.pitch = Math.max(-Math.PI/2 + 0.05, Math.min(Math.PI/2 - 0.05, Player.pitch));
  };

  const onPointerLockChange = () => {
    Player.pointerLocked = document.pointerLockElement === canvas;
    if (overlay) overlay.style.display = Player.pointerLocked ? 'none' : 'flex';
  };

  const onClick = e => {
    if (!Player.pointerLocked){
      canvas.requestPointerLock();
      return;
    }
    // Raycast desde el centro
    World.raycaster.setFromCamera({ x: 0, y: 0 }, World.camera);
    const meshes = World.hotspots.map(h => h.mesh);
    const hits = World.raycaster.intersectObjects(meshes, true);
    if (hits.length > 0 && hits[0].distance < 4.5){
      let o = hits[0].object;
      while (o && !o.userData.objId) o = o.parent;
      if (o && o.userData.objId && World.onObjectClick){
        World.onObjectClick(o.userData.objId);
      }
    }
  };

  const onResize = () => {
    const host = document.getElementById('three-host');
    if (!host || !World.renderer || !World.camera) return;
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    World.camera.aspect = w / h;
    World.camera.updateProjectionMatrix();
    World.renderer.setSize(w, h);
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('pointerlockchange', onPointerLockChange);
  canvas.addEventListener('click', onClick);
  window.addEventListener('resize', onResize);
  window.addEventListener('blur', () => { Player.keys = {}; Player.vel.set(0, 0, 0); });

  if (overlay){
    overlay.addEventListener('click', e => {
      e.stopPropagation();
      canvas.requestPointerLock();
    });
  }

  World.boundEvents = { onKeyDown, onKeyUp, onMouseMove, onPointerLockChange, onClick, onResize };
}

/* ====================================================================
   BUCLE PRINCIPAL
   ==================================================================== */
function animateWorld(){
  World.animId = requestAnimationFrame(animateWorld);
  const now = performance.now();
  const dt = Math.min(0.05, (now - World.lastTime) / 1000);
  World.lastTime = now;

  if (!World.camera || !World.scene || !World.renderer) return;

  const cam = World.camera;

  // Dirección deseada
  const running = Player.keys['ShiftLeft'] || Player.keys['ShiftRight'];
  const speed = running ? Player.runSpeed : Player.walkSpeed;

  const fwdX = -Math.sin(Player.yaw);
  const fwdZ = -Math.cos(Player.yaw);
  const rightX = Math.cos(Player.yaw);
  const rightZ = -Math.sin(Player.yaw);

  let wishX = 0, wishZ = 0;
  if (Player.keys['KeyW'] || Player.keys['ArrowUp']){ wishX += fwdX; wishZ += fwdZ; }
  if (Player.keys['KeyS'] || Player.keys['ArrowDown']){ wishX -= fwdX; wishZ -= fwdZ; }
  if (Player.keys['KeyA'] || Player.keys['ArrowLeft']){ wishX -= rightX; wishZ -= rightZ; }
  if (Player.keys['KeyD'] || Player.keys['ArrowRight']){ wishX += rightX; wishZ += rightZ; }

  const len = Math.hypot(wishX, wishZ);
  if (len > 0){ wishX = wishX / len * speed; wishZ = wishZ / len * speed; }

  // Inercia
  const k = Math.min(1, dt * 12);
  Player.vel.x += (wishX - Player.vel.x) * k;
  Player.vel.z += (wishZ - Player.vel.z) * k;

  // Movimiento
  const r = Player.radius;
  let nx = Player.pos.x + Player.vel.x * dt;
  let nz = Player.pos.z + Player.vel.z * dt;

  // Colisión con bounds
  const b = World.bounds;
  if (nx - r < b.minX){ nx = b.minX + r; Player.vel.x = 0; }
  if (nx + r > b.maxX){ nx = b.maxX - r; Player.vel.x = 0; }
  if (nz - r < b.minZ){ nz = b.minZ + r; Player.vel.z = 0; }
  if (nz + r > b.maxZ){ nz = b.maxZ - r; Player.vel.z = 0; }

  // Colisión con obstáculos (AABB)
  for (const o of World.obstacles){
    const ix = nx + r > o.minX && nx - r < o.maxX;
    const iz = nz + r > o.minZ && nz - r < o.maxZ;
    if (ix && iz){
      // ¿Cuál era la posición previa?
      const prevX = Player.pos.x, prevZ = Player.pos.z;
      const prevInX = prevX + r > o.minX && prevX - r < o.maxX;
      const prevInZ = prevZ + r > o.minZ && prevZ - r < o.maxZ;
      if (!prevInX) { nx = prevX; Player.vel.x = 0; }
      else if (!prevInZ) { nz = prevZ; Player.vel.z = 0; }
      else { nx = prevX; nz = prevZ; Player.vel.x = 0; Player.vel.z = 0; }
    }
  }

  Player.pos.x = nx;
  Player.pos.z = nz;

  // Head bob
  const moving = Math.hypot(Player.vel.x, Player.vel.z) > 0.3;
  Player.bobPhase += dt * (moving ? (running ? 12 : 8.5) : 2.5);
  const targetAmp = moving ? (running ? 0.055 : 0.032) : 0.005;
  Player.bobAmp += (targetAmp - Player.bobAmp) * Math.min(1, dt * 6);
  Player.pos.y = Player.height + Math.sin(Player.bobPhase) * Player.bobAmp;

  // Aplicar a la cámara
  cam.position.copy(Player.pos);
  cam.rotation.y = Player.yaw;
  cam.rotation.x = Player.pitch;
  const targetRoll = (Player.keys['KeyD'] || Player.keys['ArrowRight']) ? -0.02 :
                     (Player.keys['KeyA'] || Player.keys['ArrowLeft']) ? 0.02 : 0;
  cam.rotation.z += (targetRoll - cam.rotation.z) * Math.min(1, dt * 8);

  // Animar hotspots
  const t = now * 0.001;
  World.hotspots.forEach(h => {
    h.mesh.position.y = h.mesh.userData.baseY + Math.sin(t * 2 + h.mesh.userData.phase) * 0.06;
    h.mesh.rotation.y = t * 0.6;
  });

  // Crosshair detection
  World.raycaster.setFromCamera({ x: 0, y: 0 }, World.camera);
  const meshes = World.hotspots.map(h => h.mesh);
  const hits = World.raycaster.intersectObjects(meshes, true);
  if (World.crosshairEl){
    if (hits.length > 0 && hits[0].distance < 4.5){
      World.crosshairEl.classList.add('hot');
      if (World.nearHintEl){
        let o = hits[0].object;
        while (o && !o.userData.objId) o = o.parent;
        if (o && o.userData.objData){
          World.nearHintEl.textContent = 'CLIC · ' + o.userData.objData.name;
        }
      }
    } else {
      World.crosshairEl.classList.remove('hot');
    }
  }

  World.renderer.render(World.scene, World.camera);
}

function disposeWorld(){
  if (World.animId){ cancelAnimationFrame(World.animId); World.animId = null; }
  if (document.pointerLockElement){ try { document.exitPointerLock(); } catch(e){} }

  if (World.scene){
    World.scene.traverse(obj => {
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
  if (World.renderer){
    World.renderer.dispose();
    if (World.canvas && World.canvas.parentNode) World.canvas.parentNode.removeChild(World.canvas);
  }

  const ev = World.boundEvents;
  if (ev.onKeyDown) document.removeEventListener('keydown', ev.onKeyDown);
  if (ev.onKeyUp) document.removeEventListener('keyup', ev.onKeyUp);
  if (ev.onMouseMove) document.removeEventListener('mousemove', ev.onMouseMove);
  if (ev.onPointerLockChange) document.removeEventListener('pointerlockchange', ev.onPointerLockChange);
  if (ev.onResize) window.removeEventListener('resize', ev.onResize);

  World.scene = null; World.camera = null; World.renderer = null; World.canvas = null;
  World.hotspots = []; World.obstacles = []; World.boundKeys = null;
  World.boundEvents = {};
}

/* ====================================================================
   ESTADO / RANKS
   ==================================================================== */
function getCurrentRank(n){
  let r = RANKS[0];
  for (const rk of RANKS) if (n >= rk.minSolved) r = rk;
  return r;
}
function getNextRank(n){
  for (const rk of RANKS) if (n < rk.minSolved) return rk;
  return null;
}

const state = {
  view:'menu', filter:'TODOS',
  roomId:'', caseId:'',
  playerId: '',
  playerName: '',
  playerRole: 'auto',
  isHost:false, peer:null, conn:null,
  game:null, localView:{type:'scene'},
  status:null, statusErr:false, rankUpTo:null
};

const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function genCode(){
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s='';
  for (let i=0;i<4;i++) s += c[Math.floor(Math.random()*c.length)];
  return s;
}
function getPid(){
  let v = localStorage.getItem('ec_pid');
  if (!v){ v = 'p_' + Math.random().toString(36).slice(2,10); localStorage.setItem('ec_pid', v); }
  return v;
}

/* ====================================================================
   ROUTER
   ==================================================================== */
function render(){
  if (!Auth.current) return renderLogin();
  if (state.view === 'menu') return renderMenu();
  if (state.view === 'briefing') return renderBriefing();
  if (state.view === 'lobby') return renderLobby();
  if (state.view === 'result') return renderResult();
  return renderGame();
}

/* ====================================================================
   LOGIN
   ==================================================================== */
function renderLogin(){
  disposeWorld();
  const users = Auth.list();
  const input = document.createElement('div');
  app.innerHTML = `
    <div class="login-wrap">
      <div class="login-card">
        <div class="stamp">CONFIDENCIAL</div>
        <h1>Expediente Criminal</h1>
        <div class="sub">Agentes Alegando &amp; Alech</div>

        ${users.length > 0 ? `
          <label>Perfiles existentes</label>
          <div class="login-users">
            ${users.map(u => `<div class="login-user" data-name="${esc(u)}">${esc(u)}</div>`).join('')}
          </div>` : ''}

        <label>Nombre de agente</label>
        <input id="inp-login" type="text" placeholder="Escribe tu nombre..." maxlength="20" autocomplete="off">
        <button class="btn-primary" id="btn-login">ENTRAR</button>
        <div class="login-hint">
          Tu progreso se guarda en este dispositivo. Cada nombre crea un perfil distinto.
        </div>
      </div>
    </div>`;

  const inp = document.getElementById('inp-login');
  inp.focus();
  const doLogin = (name) => {
    name = (name || '').trim();
    if (!name) { alert('Escribe un nombre'); return; }
    Auth.login(name);
    state.playerName = name;
    state.playerId = getPid();
    state.view = 'menu';
    render();
  };
  document.getElementById('btn-login').onclick = () => doLogin(inp.value);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(inp.value); });
  document.querySelectorAll('.login-user').forEach(el => {
    el.onclick = () => doLogin(el.dataset.name);
  });
}

/* ====================================================================
   MENÚ
   ==================================================================== */
function renderMenu(){
  disposeWorld();
  const solvedList = (Auth.getUser() || {solved:[]}).solved;
  const counts = { 'FÁCIL':0, 'MEDIA':0, 'DIFÍCIL':0 };
  CASES.forEach(c => { if (counts[c.difficulty] != null) counts[c.difficulty]++; });
  const filtered = state.filter === 'TODOS' ? CASES : CASES.filter(c => c.difficulty === state.filter);
  const solvedTotal = solvedList.length;
  const rank = getCurrentRank(solvedTotal);
  const next = getNextRank(solvedTotal);
  const pct = next ? Math.min(100, Math.round((solvedTotal - rank.minSolved) / (next.minSolved - rank.minSolved) * 100)) : 100;

  app.innerHTML = `
    <div class="user-chip">
      <div class="name">👤 ${esc(Auth.current)}</div>
      <button class="switch" id="btn-logout">CAMBIAR</button>
    </div>
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
        ${filtered.map(c => {
          const solved = solvedList.includes(c.id);
          return `
            <div class="case-card ${solved?'solved':''}" data-case="${c.id}">
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
              <div class="btn-play">${solved?'REJUGAR':'ABRIR EXPEDIENTE'}</div>
            </div>`;
        }).join('')}
      </div>
    </div>`;

  $('#btn-logout').onclick = () => {
    if (!confirm('¿Cambiar de agente? Tu progreso queda guardado.')) return;
    Auth.logout();
    state.view = 'menu';
    render();
  };
  document.querySelectorAll('.filter-btn').forEach(b => {
    b.onclick = () => { state.filter = b.dataset.diff; renderMenu(); };
  });
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
  disposeWorld();
  const c = CASES.find(x => x.id === state.caseId);
  if (!c) return renderMenu();
  const sup = SUPERIORS[c.superior] || SUPERIORS.lisboa;
  const solved = Auth.countSolved();
  const rank = getCurrentRank(solved);

  const messages = {
    'FÁCIL': [
      'Agentes, un caso sencillo para empezar. Confío en que lo cerréis rápido.',
      'Nuevo caso. Nada complejo, pero no bajéis la guardia.'
    ],
    'MEDIA': [
      'Este caso es más delicado. Hay varios sospechosos con motivos. No quiero errores.',
      'Es más complejo de lo que parece. Escuchad, examinad, no os fiéis de nadie.'
    ],
    'DIFÍCIL': [
      'Caso de máxima prioridad. El asesino es meticuloso. Si falláis, lo pagaréis caro.',
      'Este es de los que aparecen en los periódicos. Necesito una resolución limpia.'
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
  disposeWorld();
  const c = CASES.find(x => x.id === state.caseId);
  app.innerHTML = `
    <div class="lobby">
      <button class="btn-back" id="btn-back">← VOLVER AL BRIEFING</button>
      <h2>PREPARAR PARTIDA</h2>
      <div class="case-name">${esc(c ? c.title : '')}</div>
      ${state.status ? `<div class="status ${state.statusErr?'err':''}">${esc(state.status)}</div>` : ''}
      <div class="form-box">
        <div class="field">
          <label>Tu rol</label>
          <select id="inp-role">
            <option value="alegando" selected>Agente Alegando</option>
            <option value="alech">Agente Alech</option>
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
          <br>🕹️ <b>Controles:</b> <b>WASD</b> mover · <b>Ratón</b> mirar · <b>Shift</b> correr · <b>Clic</b> examinar · <b>ESC</b> liberar cursor.
        </div>
      </div>
    </div>`;

  $('#btn-back').onclick = () => { state.view='briefing'; state.status=null; render(); };
  $('#btn-create').onclick = () => {
    state.playerName = Auth.current;
    state.playerRole = $('#inp-role').value;
    state.playerId = getPid();
    startHost();
  };
  $('#btn-join').onclick = () => {
    const code = $('#inp-room').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(code)) return alert('Código de 4 caracteres');
    state.playerName = Auth.current;
    state.playerRole = $('#inp-role').value;
    state.playerId = getPid();
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
    if (state.conn && state.conn.open){ try { conn.close(); } catch(e){} return; }
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
    if (err.type === 'unavailable-id'){ setStatus('Reintentando...', true); setTimeout(startHost, 500); }
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
      if (data.type === 'state'){
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
  if (data.type === 'hello'){
    state.game.players[conn.peer] = { name:data.name||'Agente 2', role:data.role||'auto', connected:true };
    broadcastState(); render(); return;
  }
  if (data.type === 'action') applyAction(data.action, conn.peer);
}
function applyAction(action, byPlayer){
  const c = CASES.find(x => x.id === state.game.caseId);
  if (!c) return;
  switch (action.type){
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
      if (s){
        const q = s.questions[parseInt(idx, 10)];
        if (q && q.clue && !state.game.evidence.includes(q.clue)) state.game.evidence.push(q.clue);
      }
      break;
    }
    case 'accuse': {
      if (state.game.result) return;
      const beforeRank = getCurrentRank(Auth.countSolved());
      const correct = action.target === c.killer;
      state.game.result = { win: correct, killer: c.killer, accused: action.target, byPlayer };
      if (correct) Auth.markSolved(c.id);
      const afterRank = getCurrentRank(Auth.countSolved());
      if (correct && afterRank.id !== beforeRank.id) state.rankUpTo = afterRank;
      break;
    }
    case 'reset': {
      state.game.examined = []; state.game.asked = []; state.game.evidence = []; state.game.result = null;
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
    app.innerHTML = `<div class="lobby"><div class="status">${state.status||'Conectando...'} <span>⏳</span></div></div>`;
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
  const myRank = getCurrentRank(Auth.countSolved());

  app.innerHTML = `
    <div class="game">
      <div class="topbar">
        <div class="left">
          <div class="room-badge">SALA ${esc(state.roomId)} ${state.isHost?'👑':'👤'}</div>
          ${players.map(([pid, p]) => `
            <div class="player-pill ${p.connected ? '' : 'off'} ${pid === state.playerId ? 'me' : ''}">
              <span class="dot"></span>
              ${pid === state.playerId ? myRank.icon + ' ' : ''}
              ${esc(p.name)} · ${esc(p.role)}
            </div>`).join('')}
        </div>
        <div class="progress-wrap">
          <span>${found}/${totalClues}</span>
          <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        </div>
        <button id="btn-leave">SALIR</button>
      </div>
      <div class="main">
        <aside class="panel panel-left">
          <h2>👤 Sospechosos</h2>
          ${c.suspects.map(s => `
            <div class="suspect ${view.type==='suspect'&&view.id===s.id?'active':''}" data-suspect="${s.id}">
              <div class="avatar">${s.icon}</div>
              <div style="min-width:0">
                <div class="name">${esc(s.name)}</div>
                <div class="role">${esc(s.role)}</div>
              </div>
            </div>`).join('')}
        </aside>
        <main class="stage">
          <div id="three-host"></div>
          <div class="lock-overlay" id="lock-overlay">
            <div class="lock-card">
              <div class="lock-icon">🖱️</div>
              <div class="lock-title">CLIC PARA JUGAR</div>
              <div class="lock-keys">
                <span><b>W</b> <b>A</b> <b>S</b> <b>D</b> · moverte</span>
                <span><b>RATÓN</b> · mirar</span>
                <span><b>SHIFT</b> · correr</span>
                <span><b>CLIC</b> · examinar</span>
                <span><b>ESC</b> · liberar el ratón</span>
              </div>
            </div>
          </div>
          <div class="crosshair">+</div>
          <div class="near-hint"></div>
          <div class="hud"><b>WASD</b> mover · <b>SHIFT</b> correr · <b>CLIC</b> examinar</div>
          <div class="side-panel" id="side-panel"></div>
        </main>
        <aside class="panel panel-right">
          <h2>📎 Evidencias (${found})</h2>
          ${g.evidence.length === 0
            ? '<div class="empty">Aún no hay pistas.<br>Investigad la escena.</div>'
            : g.evidence.map(e => `<div class="evidence-item">${esc(e)}</div>`).join('')}
          <button class="accuse-btn" id="btn-accuse" ${canAccuse?'':'disabled'}>
            ${g.result ? 'CASO CERRADO' : (canAccuse ? '⚖️ ACUSAR' : 'REUNID 2 PISTAS')}
          </button>
        </aside>
      </div>
    </div>`;

  $('#btn-leave').onclick = () => {
    if (!confirm('¿Salir de la partida?')) return;
    disposeWorld();
    try { if (state.conn) state.conn.close(); } catch(e){}
    try { if (state.peer) state.peer.destroy(); } catch(e){}
    state.game = null; state.conn = null; state.peer = null;
    state.view = 'menu'; state.isHost = false; state.status = null;
    render();
  };
  document.querySelectorAll('.suspect').forEach(el => {
    el.onclick = () => {
      state.localView = { type:'suspect', id: el.dataset.suspect };
      renderSidePanel(c);
      if (document.pointerLockElement) try { document.exitPointerLock(); } catch(e){}
    };
  });
  if (canAccuse) $('#btn-accuse').onclick = openAccusation;

  World.onObjectClick = (objId) => {
    if (!g.examined.includes(objId)) sendAction({ type:'examine', id: objId });
    state.localView = { type:'object', id: objId };
    renderSidePanel(c);
    if (document.pointerLockElement) try { document.exitPointerLock(); } catch(e){}
  };

  setTimeout(() => initWorld(c, g), 50);
  renderSidePanel(c);

  if (g.result && state.view !== 'result'){
    setTimeout(() => { state.view = 'result'; render(); }, 350);
  }
}

function renderSidePanel(c){
  const g = state.game;
  const panel = document.getElementById('side-panel');
  if (!panel) return;
  const view = state.localView;

  if (view.type === 'suspect'){
    const s = c.suspects.find(x => x.id === view.id);
    if (!s){ state.localView = {type:'scene'}; return renderSidePanel(c); }
    panel.classList.add('show');
    panel.innerHTML = `
      <div class="side-panel-inner">
        <div class="side-panel-header">
          <div>
            <div class="side-label">INTERROGATORIO</div>
            <div class="side-title">${s.icon} ${esc(s.name)}</div>
            <div class="side-sub">${esc(s.role)}</div>
          </div>
          <button class="side-close" id="btn-side-close">✕</button>
        </div>
        <div class="q-list">
          ${s.questions.map((q, i) => {
            const key = s.id + '|' + i;
            const asked = g.asked.includes(key);
            return `
              <div>
                <button class="q-btn ${asked?'asked':''}" data-q="${key}">❝ ${esc(q.q)}</button>
                ${asked ? `<div class="answer">${esc(q.a)}${q.clue?`<div class="clue">🔎 ${esc(q.clue)}</div>`:''}</div>` : ''}
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
  } else if (view.type === 'object'){
    const o = c.objects.find(x => x.id === view.id);
    if (!o){ state.localView = {type:'scene'}; return renderSidePanel(c); }
    panel.classList.add('show');
    panel.innerHTML = `
      <div class="side-panel-inner">
        <div class="side-panel-header">
          <div>
            <div class="side-label">ANÁLISIS</div>
            <div class="side-title">${o.icon} ${esc(o.name)}</div>
          </div>
          <button class="side-close" id="btn-side-close">✕</button>
        </div>
        <div class="detail">
          <p>${esc(o.desc)}</p>
          ${o.clue?`<div class="clue">🔎 ${esc(o.clue)}</div>`:''}
        </div>
      </div>`;
  } else {
    panel.classList.remove('show');
    panel.innerHTML = '';
    return;
  }

  const closeBtn = panel.querySelector('#btn-side-close');
  if (closeBtn){
    closeBtn.onclick = () => {
      state.localView = {type:'scene'};
      panel.classList.remove('show');
      panel.innerHTML = '';
    };
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
            <span style="font-size:22px">${s.icon}</span>
            <div>
              <div style="font-weight:600;font-size:14px">${esc(s.name)}</div>
              <div style="font-size:12px;color:var(--text-dim)">${esc(s.role)}</div>
            </div>
          </div>`).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" id="m-cancel">CANCELAR</button>
        <button class="btn-ok" id="m-confirm" disabled style="background:var(--red);color:#fff">CONFIRMAR</button>
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
  disposeWorld();
  const g = state.game;
  const c = CASES.find(x => x.id === g.caseId);
  const killer = c.suspects.find(s => s.id === c.killer);
  const accused = c.suspects.find(s => s.id === g.result.accused);
  const win = g.result.win;
  const accusedByMe = g.result.byPlayer === state.playerId;
  const byPlayer = g.players[g.result.byPlayer];
  const sup = SUPERIORS[c.superior] || SUPERIORS.lisboa;

  const bossMsg = win
    ? 'Buen trabajo, agentes. Habéis cerrado el caso con pruebas sólidas.'
    : 'Una acusación sin fundamento. Habéis dejado escapar al verdadero culpable.';

  app.innerHTML = `
    <div class="result">
      <div class="big-stamp ${win?'':'lose'}">${win?'CASO CERRADO':'CASO SIN RESOLVER'}</div>
      <h2>${win?`Habéis detenido a ${esc(killer.name)}`:`Acusasteis a ${esc(accused.name)}`}</h2>
      <p style="font-size:13px;color:var(--gold-soft);margin-bottom:20px">
        Acusación realizada por <b>${esc(byPlayer?byPlayer.name:'alguien')}</b>${accusedByMe?' (tú)':''}
      </p>
      ${state.rankUpTo ? `
        <div class="rankup">
          <div class="label">▸ ASCENSO DE RANGO</div>
          <div class="icon">${state.rankUpTo.icon}</div>
          <div class="new-rank">${esc(state.rankUpTo.name)}</div>
          <div class="desc">${esc(state.rankUpTo.desc)}</div>
        </div>` : ''}
      <div class="boss-comment">
        <div class="boss-avatar">${sup.icon}</div>
        <div class="boss-text">
          <div class="boss-name">▸ ${esc(sup.name)} · ${esc(sup.role)}</div>
          <div class="boss-message">"${esc(bossMsg)}"</div>
        </div>
      </div>
      <p>${win
        ? esc(c.solution)
        : `La acusación contra ${esc(accused.name)} no se sostiene. El verdadero asesino era <b style="color:var(--red)">${esc(killer.name)}</b> y ha escapado.`}</p>
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
playCinematic().then(() => {
  render();
  animateParallax();
});