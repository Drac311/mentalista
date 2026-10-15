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
  if (window.__clean || location.protocol === 'blob:'){ alert('Ya estás en modo limpio.'); return; }
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
   AUTH
   ==================================================================== */
const Auth = {
  get current(){ return localStorage.getItem('ec_current') || null; },
  set current(v){ v ? localStorage.setItem('ec_current', v) : localStorage.removeItem('ec_current'); },
  get users(){ try { return JSON.parse(localStorage.getItem('ec_users') || '{}'); } catch(e){ return {}; } },
  saveUsers(u){ localStorage.setItem('ec_users', JSON.stringify(u)); },
  list(){ return Object.keys(this.users); },
  login(name){
    const users = this.users;
    if (!users[name]){ users[name] = { name, created: Date.now(), solved: [] }; this.saveUsers(users); }
    this.current = name;
  },
  logout(){ this.current = null; },
  getUser(){ const n = this.current; return n ? (this.users[n] || null) : null; },
  markSolved(id){
    const n = this.current; if (!n) return;
    const u = this.users; if (!u[n]) return;
    if (!u[n].solved.includes(id)){ u[n].solved.push(id); this.saveUsers(u); }
  },
  countSolved(){ const u = this.getUser(); return u ? u.solved.length : 0; }
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
    setTimeout(() => { cine.querySelector('.cine-stamp').classList.add('hit'); cine.querySelector('.cine-flash').classList.add('on'); }, 2400);
    setTimeout(() => { cine.classList.add('gone'); setTimeout(() => { cine.remove(); resolve(); }, 900); }, 3800);
  });
}

/* ====================================================================
   PARALLAX
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
   MOTOR 3D
   ==================================================================== */
const World = {
  renderer:null, scene:null, camera:null, canvas:null,
  bounds:{ minX:-5, maxX:5, minZ:-5, maxZ:5 },
  obstacles:[],       // AABB {minX,maxX,minZ,maxZ}
  interactables:[],   // { mesh, type, data }
  dust:null,
  roomHalf:5, roomHeight:3,
  raycaster:null,
  animId:null, lastTime:0,
  caseData:null,
  mode:'crime',
  currentSuspect:null,
  onInteract:null,
  nearHintEl:null, crosshairEl:null,
  boundEvents:{}
};

const Player = {
  pos: new THREE.Vector3(0, 1.65, 3),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: Math.PI, pitch: -0.1,
  radius: 0.34,
  height: 1.65,
  walkSpeed: 2.8, runSpeed: 5.0,
  bobPhase: 0, bobAmp: 0,
  pointerLocked: false,
  keys:{}
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
  t.anisotropy = 16;
  return t;
}

function texParquet(){
  return makeTex(1024, 1024, (ctx, w, h) => {
    const plankH = 64;
    for (let row = 0; row < h/plankH; row++){
      const offset = (row % 2) * 128;
      const y = row * plankH;
      const shade = 30 + Math.random()*25;
      ctx.fillStyle = `rgb(${shade + 15},${shade + 5},${Math.floor(shade*0.6)})`;
      ctx.fillRect(0, y, w, plankH);
      for (let x = -offset; x < w; x += 256){
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + plankH); ctx.stroke();
      }
      // Vetas
      for (let i = 0; i < 30; i++){
        ctx.strokeStyle = `rgba(20,10,5,${0.1 + Math.random()*0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        const vy = y + Math.random()*plankH;
        ctx.moveTo(0, vy);
        for (let x = 0; x < w; x += 40){
          ctx.lineTo(x, vy + Math.sin(x*0.02 + i)*1.5);
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  });
}

function texMarble(){
  return makeTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#dcd4c0';
    ctx.fillRect(0, 0, w, h);
    // Vetas de mármol
    for (let i = 0; i < 30; i++){
      ctx.strokeStyle = `rgba(${80 + Math.random()*40},${70 + Math.random()*40},${50 + Math.random()*40},${0.15 + Math.random()*0.25})`;
      ctx.lineWidth = 1 + Math.random()*3;
      let x = Math.random()*w, y = Math.random()*h;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 12; j++){
        x += (Math.random()-0.5)*180;
        y += (Math.random()-0.5)*180;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Losas
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += 256){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 256){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  });
}

function texGrass(){
  return makeTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#2a4a1a';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 30000; i++){
      const r = 20 + Math.random()*60;
      const g = 70 + Math.random()*90;
      const b = 15 + Math.random()*40;
      ctx.fillStyle = `rgba(${r|0},${g|0},${b|0},0.75)`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 4);
    }
    // Manchas
    for (let i = 0; i < 50; i++){
      ctx.fillStyle = `rgba(80,60,20,${Math.random()*0.15})`;
      ctx.beginPath();
      ctx.arc(Math.random()*w, Math.random()*h, 20 + Math.random()*50, 0, Math.PI*2);
      ctx.fill();
    }
  });
}

function texWallpaper(base, stripe, stripeWidth){
  stripeWidth = stripeWidth || 4;
  return makeTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = stripe;
    for (let x = 0; x < w; x += 64) ctx.fillRect(x, 0, stripeWidth, h);
    // Textura fina
    for (let i = 0; i < 8000; i++){
      ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
    for (let i = 0; i < 4000; i++){
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.04})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
  });
}

function texBrick(){
  return makeTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#1a1210';
    ctx.fillRect(0, 0, w, h);
    const bw = 128, bh = 64;
    for (let row = 0; row < h/bh; row++){
      const offset = (row % 2) * bw/2;
      for (let x = -bw + offset; x < w; x += bw){
        const shade = 40 + Math.random()*40;
        ctx.fillStyle = `rgb(${shade + 30},${shade + 5},${shade - 10})`;
        ctx.fillRect(x + 3, row*bh + 3, bw - 6, bh - 6);
        // Rugosidad
        for (let i = 0; i < 40; i++){
          ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.15})`;
          ctx.fillRect(x + 3 + Math.random()*(bw-6), row*bh + 3 + Math.random()*(bh-6), 2, 2);
        }
      }
    }
  });
}

function texStone(){
  return makeTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#3a3a42';
    ctx.fillRect(0, 0, w, h);
    const s = 128;
    for (let x = 0; x < w; x += s){
      for (let y = 0; y < h; y += s){
        const shade = 30 + Math.random()*30;
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 5})`;
        ctx.fillRect(x+2, y+2, s-4, s-4);
        for (let i = 0; i < 100; i++){
          ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.06})`;
          ctx.fillRect(x + 2 + Math.random()*(s-4), y + 2 + Math.random()*(s-4), 2, 2);
        }
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    for (let x = 0; x <= w; x += s){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y <= h; y += s){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  });
}

function texBooks(){
  return makeTex(1024, 512, (ctx, w, h) => {
    const colors = ['#7a2a1a','#2a4a3a','#5a5a1a','#4a1a2a','#1a3a5a','#6a4a1a','#3a1a4a','#2a5a4a','#5a3a20','#802020','#203050','#405020'];
    let x = 0;
    while (x < w){
      const bw = 14 + Math.random()*20;
      const bh = h * (0.7 + Math.random()*0.3);
      const col = colors[Math.floor(Math.random()*colors.length)];
      const y = h - bh;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, bw - 2, bh);
      // Lomo con texto
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x + bw*0.35, y + bh*0.2, 2, bh*0.5);
      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + bw - 3, y, 3, bh);
      x += bw + Math.random()*2;
    }
  });
}

function texCarpet(base, accent){
  return makeTex(1024, 1024, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    // Bordes decorativos
    ctx.strokeStyle = accent;
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, w-80, h-80);
    ctx.lineWidth = 6;
    ctx.strokeRect(80, 80, w-160, h-160);
    // Motivo central
    ctx.lineWidth = 4;
    for (let i = 0; i < 6; i++){
      const s = 80 + i*40;
      ctx.beginPath();
      ctx.moveTo(w/2, h/2 - s);
      ctx.lineTo(w/2 + s, h/2);
      ctx.lineTo(w/2, h/2 + s);
      ctx.lineTo(w/2 - s, h/2);
      ctx.closePath();
      ctx.stroke();
    }
    // Textura
    for (let i = 0; i < 12000; i++){
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.1})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
  });
}

function texCeiling(){
  return makeTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(0, 0, w, h);
    // Textura suave
    for (let i = 0; i < 5000; i++){
      ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.05})`;
      ctx.fillRect(Math.random()*w, Math.random()*h, 2, 2);
    }
    // Líneas de placas
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 128){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
    for (let y = 0; y <= h; y += 128){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }
  });
}

function texPainting(seed){
  return makeTex(512, 384, (ctx, w, h) => {
    const palettes = [
      ['#c9a86a','#7a5c2e','#3a2a14','#e8d5a0'],
      ['#4a5a7a','#2a3a5a','#1a2030','#8090b0'],
      ['#7a3a2a','#3a1a10','#1a0808','#c08060'],
      ['#2a5a3a','#1a3a20','#0a1a10','#60a070'],
      ['#6a3a5a','#3a1a30','#1a0a18','#a070a0']
    ];
    const pal = palettes[seed % palettes.length];
    const g = ctx.createRadialGradient(w/2, h/2, 10, w/2, h/2, w*0.9);
    g.addColorStop(0, pal[3]);
    g.addColorStop(0.4, pal[0]);
    g.addColorStop(0.8, pal[1]);
    g.addColorStop(1, pal[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Formas decorativas
    for (let i = 0; i < 12; i++){
      ctx.strokeStyle = `rgba(${Math.random()*80|0},${Math.random()*60|0},${Math.random()*40|0},0.5)`;
      ctx.lineWidth = 2 + Math.random()*4;
      ctx.beginPath();
      let x = Math.random()*w, y = Math.random()*h;
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++){
        x += (Math.random()-0.5)*160;
        y += (Math.random()-0.5)*160;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

function texCurtain(){
  return makeTex(512, 1024, (ctx, w, h) => {
    for (let x = 0; x < w; x += 24){
      const g = ctx.createLinearGradient(x, 0, x+24, 0);
      g.addColorStop(0, '#1a0202');
      g.addColorStop(0.35, '#6a1010');
      g.addColorStop(0.5, '#9a1818');
      g.addColorStop(0.65, '#6a1010');
      g.addColorStop(1, '#1a0202');
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, 24, h);
    }
    // Oscurecido arriba/abajo
    const topGrad = ctx.createLinearGradient(0, 0, 0, h*0.2);
    topGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
    topGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h*0.2);
    const botGrad = ctx.createLinearGradient(0, h*0.8, 0, h);
    botGrad.addColorStop(0, 'transparent');
    botGrad.addColorStop(1, 'rgba(0,0,0,0.6)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, h*0.8, w, h*0.2);
  });
}

/* ====================================================================
   HELPERS DE GEOMETRÍA
   ==================================================================== */
function M(o){ return new THREE.MeshStandardMaterial(o); }
function box(parent, w, h, d, mat, x, y, z){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cyl(parent, rt, rb, h, mat, x, y, z, seg){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function sph(parent, r, mat, x, y, z){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}

/* Hitbox con rotación — calcula el AABB real de una caja rotada */
function addObstacle(cx, cz, w, d, rot){
  rot = rot || 0;
  const cos = Math.abs(Math.cos(rot));
  const sin = Math.abs(Math.sin(rot));
  const hw = (w * cos + d * sin) / 2;
  const hd = (w * sin + d * cos) / 2;
  World.obstacles.push({ minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd });
}

/* ====================================================================
   MODELOS 3D DE MUEBLES (mucho más detallados)
   ==================================================================== */

// ── Escritorio con 3 cajones ──
function buildDesk(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x5a3a20, roughness: 0.75 });
  const woodDark = M({ color: 0x3a2410, roughness: 0.7 });
  const woodTop = M({ color: 0x6a4628, roughness: 0.6 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  const felt = M({ color: 0x2a1a10, roughness: 1 });

  // Tablero superior
  box(g, 2.2, 0.06, 1.1, woodTop, 0, 0.76, 0);
  box(g, 2.18, 0.02, 1.08, felt, 0, 0.795, 0);

  // Faldón frontal
  box(g, 2.2, 0.15, 0.04, wood, 0, 0.68, 0.5);
  // Lateral izquierdo (sólido)
  box(g, 0.04, 0.72, 1.0, wood, -1.08, 0.4, 0);
  // Patas traseras
  box(g, 0.06, 0.76, 0.06, woodDark, 1.04, 0.38, -0.44);
  box(g, 0.06, 0.76, 0.06, woodDark, 1.04, 0.38, 0.44);

  // Cajonera (3 cajones)
  const drawerUnit = box(g, 0.68, 0.72, 1.0, woodDark, -0.75, 0.38, 0);
  for (let i = 0; i < 3; i++){
    const drawerGroup = new THREE.Group();
    const dd = box(drawerGroup, 0.64, 0.19, 0.92, wood, 0, 0, 0);
    // Frente con bisel
    box(drawerGroup, 0.66, 0.2, 0.02, woodTop, 0, 0, 0.47);
    // Tirador
    const h = box(drawerGroup, 0.14, 0.03, 0.03, handle, 0, 0, 0.5);
    drawerGroup.position.set(-0.75, 0.62 - i*0.22, 0);
    drawerGroup.userData.isDrawer = true;
    drawerGroup.userData.drawerState = 0;
    drawerGroup.userData.drawerMaxZ = 0.44;
    g.add(drawerGroup);
    World.interactables.push({ mesh: drawerGroup, type:'drawer', data:{ desk:g, index:i } });
  }

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 2.2, 1.1, ry);
  return g;
}

// ── Silla de oficina ──
function buildChair(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.8 });
  const cushion = M({ color: 0x6a1818, roughness: 0.95 });
  const handle = M({ color: 0xc8a860, metalness: 0.85, roughness: 0.25 });

  // Asiento
  box(g, 0.52, 0.05, 0.52, wood, 0, 0.46, 0);
  box(g, 0.46, 0.09, 0.46, cushion, 0, 0.53, 0);

  // Respaldo con travesaños
  box(g, 0.52, 0.05, 0.06, wood, 0, 0.78, -0.24);
  box(g, 0.52, 0.05, 0.06, wood, 0, 1.02, -0.24);
  box(g, 0.04, 0.32, 0.04, wood, -0.22, 0.9, -0.24);
  box(g, 0.04, 0.32, 0.04, wood, 0.22, 0.9, -0.24);
  // Panel respaldo
  box(g, 0.44, 0.24, 0.03, cushion, 0, 0.9, -0.22);

  // Patas delanteras
  box(g, 0.05, 0.46, 0.05, wood, -0.22, 0.23, 0.2);
  box(g, 0.05, 0.46, 0.05, wood, 0.22, 0.23, 0.2);
  // Patas traseras
  box(g, 0.05, 0.46, 0.05, wood, -0.22, 0.23, -0.2);
  box(g, 0.05, 0.46, 0.05, wood, 0.22, 0.23, -0.2);
  // Travesaños
  box(g, 0.44, 0.03, 0.03, wood, 0, 0.15, -0.2);
  box(g, 0.44, 0.03, 0.03, wood, 0, 0.15, 0.2);

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 0.55, 0.55, ry);
  return g;
}

// ── Estantería con libros individuales ──
function buildBookshelf(scene, x, z, ry, W, H){
  W = W || 2.4; H = H || 2.8;
  const D = 0.4;
  const g = new THREE.Group();
  const wood = M({ color: 0x3a2410, roughness: 0.85 });
  const bookColors = ['#7a2a1a','#2a4a3a','#5a5a1a','#4a1a2a','#1a3a5a','#6a4a1a','#3a1a4a','#2a5a4a','#8a3010','#203050','#406020','#802040'];
  const bookMats = bookColors.map(c => M({ color: parseInt(c.slice(1), 16), roughness: 0.9 }));

  // Marco
  box(g, 0.12, H, D, wood, -W/2, H/2, 0);
  box(g, 0.12, H, D, wood, W/2, H/2, 0);
  box(g, W + 0.12, 0.1, D, wood, 0, 0.05, 0);
  box(g, W + 0.12, 0.1, D, wood, 0, H, 0);
  box(g, W + 0.12, 0.06, 0.02, wood, 0, H/2, -D/2 + 0.01); // fondo

  // 4 baldas
  const shelves = [];
  for (let i = 1; i <= 4; i++){
    const y = i * (H/4);
    if (i < 4) box(g, W - 0.12, 0.06, D - 0.04, wood, 0, y, 0);
    shelves.push(y);
  }

  // Libros en cada balda
  shelves.forEach((y, idx) => {
    const shelfY = idx === 0 ? 0.1 : shelves[idx-1];
    const shelfHeight = y - shelfY;
    let cx = -W/2 + 0.1;
    while (cx < W/2 - 0.15){
      const bw = 0.04 + Math.random()*0.05;
      const bh = shelfHeight * (0.7 + Math.random()*0.25);
      const bd = D * (0.7 + Math.random()*0.2);
      const mat = bookMats[Math.floor(Math.random()*bookMats.length)];
      const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
      book.position.set(cx + bw/2, shelfY + 0.03 + bh/2, 0);
      book.rotation.z = (Math.random()-0.5) * 0.05;
      book.castShadow = true;
      g.add(book);
      cx += bw + 0.005;
      if (Math.random() < 0.05) cx += 0.05;
    }
    // Objeto decorativo ocasional
    if (Math.random() < 0.3){
      const objColor = [0x8a6a3a, 0x5a3a5a, 0x3a5a3a][Math.floor(Math.random()*3)];
      const obj = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M({ color: objColor, roughness: 0.5 }));
      obj.position.set(W/2 - 0.15, shelfY + 0.1, 0);
      obj.castShadow = true;
      g.add(obj);
    }
  });

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, W + 0.2, D, ry);
  return g;
}

// ── Cama de matrimonio ──
function buildBed(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.85 });
  const woodDark = M({ color: 0x2a1810, roughness: 0.9 });
  const mattress = M({ color: 0xe8dcc8, roughness: 0.95 });
  const sheet = M({ color: 0xb8b8c8, roughness: 0.9 });
  const blanket = M({ color: 0x6a1a1a, roughness: 0.95 });
  const pillow = M({ color: 0xf8f0e0, roughness: 0.9 });

  // Base de madera
  box(g, 2.1, 0.22, 2.3, wood, 0, 0.21, 0);
  // Patas
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([px, pz]) => {
    box(g, 0.14, 0.1, 0.14, woodDark, px*0.98, 0.05, pz*1.08);
  });

  // Cabecero decorativo
  box(g, 2.1, 1.2, 0.14, wood, 0, 0.82, -1.15);
  // Panel del cabecero
  box(g, 1.9, 0.9, 0.04, woodDark, 0, 0.85, -1.07);
  // Detalle superior
  box(g, 2.2, 0.08, 0.2, woodDark, 0, 1.44, -1.15);
  // Pies de cama
  box(g, 2.1, 0.3, 0.1, wood, 0, 0.4, 1.13);

  // Colchón
  box(g, 2.0, 0.32, 2.15, mattress, 0, 0.48, 0);
  // Sábana
  box(g, 2.02, 0.04, 2.0, sheet, 0, 0.66, 0.05);
  // Manta doblada a los pies
  box(g, 2.02, 0.08, 1.1, blanket, 0, 0.72, 0.6);
  box(g, 2.02, 0.04, 0.15, sheet, 0, 0.74, 0.05); // pliegue

  // 2 almohadas
  box(g, 0.85, 0.18, 0.5, pillow, -0.5, 0.74, -0.75);
  box(g, 0.85, 0.18, 0.5, pillow, 0.5, 0.74, -0.75);
  // Fundas decorativas
  box(g, 0.6, 0.14, 0.35, blanket, -0.5, 0.86, -0.75);
  box(g, 0.6, 0.14, 0.35, blanket, 0.5, 0.86, -0.75);

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 2.2, 2.4, ry);
  return g;
}

// ── Mesilla con cajón ──
function buildNightstand(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.8 });
  const woodDark = M({ color: 0x2a1810, roughness: 0.85 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });

  // Base
  box(g, 0.58, 0.6, 0.55, wood, 0, 0.3, 0);
  // Tapa superior
  box(g, 0.62, 0.05, 0.6, woodDark, 0, 0.63, 0);
  // Faldón
  box(g, 0.58, 0.04, 0.55, woodDark, 0, 0.01, 0);

  // Cajón
  const drawerGroup = new THREE.Group();
  box(drawerGroup, 0.52, 0.22, 0.5, wood, 0, 0, 0);
  box(drawerGroup, 0.52, 0.23, 0.02, woodDark, 0, 0, 0.26);
  box(drawerGroup, 0.1, 0.025, 0.03, handle, 0, 0, 0.28);
  drawerGroup.position.set(0, 0.32, 0);
  drawerGroup.userData.isDrawer = true;
  drawerGroup.userData.drawerState = 0;
  drawerGroup.userData.drawerMaxZ = 0.38;
  g.add(drawerGroup);
  World.interactables.push({ mesh: drawerGroup, type:'drawer', data:{ desk:g, index:0 } });

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 0.65, 0.65, ry);
  return g;
}

// ── Armario alto con dos puertas ──
function buildWardrobe(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x3a2410, roughness: 0.85 });
  const woodFront = M({ color: 0x4a2f18, roughness: 0.8 });
  const woodDark = M({ color: 0x2a1810, roughness: 0.9 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  const mirror = M({ color: 0x2a3040, metalness: 0.9, roughness: 0.1 });

  // Cuerpo
  box(g, 1.6, 2.4, 0.7, wood, 0, 1.2, 0);
  // Tapa superior
  box(g, 1.7, 0.08, 0.78, woodDark, 0, 2.42, 0);
  // Base
  box(g, 1.7, 0.1, 0.78, woodDark, 0, 0.05, 0);
  // Fondo

  // 2 puertas
  [0, 1].forEach(i => {
    const doorGroup = new THREE.Group();
    const dw = 0.76;
    // Puerta con panel
    box(doorGroup, dw, 2.2, 0.05, woodFront, 0, 0, 0);
    // Panel decorativo
    box(doorGroup, dw - 0.16, 1.0, 0.02, woodDark, 0, 0.5, 0.03);
    box(doorGroup, dw - 0.16, 0.6, 0.02, woodDark, 0, -0.6, 0.03);
    // Tirador
    box(doorGroup, 0.04, 0.18, 0.05, handle, i === 0 ? dw/2 - 0.08 : -dw/2 + 0.08, 0, 0.05);
    doorGroup.position.set(i === 0 ? -0.4 : 0.4, 1.25, 0.36);
    doorGroup.userData.isCabinetDoor = true;
    doorGroup.userData.doorState = 0;
    doorGroup.userData.doorHinge = i === 0 ? 1 : -1;
    g.add(doorGroup);
    World.interactables.push({ mesh: doorGroup, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });

  // Espejo en la puerta derecha
  const mirrorPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), mirror);
  mirrorPlane.position.set(0.4, 1.25, 0.39);
  g.add(mirrorPlane);

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 1.7, 0.85, ry);
  return g;
}

// ── Archivador con dos puertas ──
function buildCabinet(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.8 });
  const woodDark = M({ color: 0x2a1810, roughness: 0.9 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });

  box(g, 1.0, 1.6, 0.5, wood, 0, 0.8, 0);
  box(g, 1.05, 0.06, 0.55, woodDark, 0, 1.63, 0);
  box(g, 1.05, 0.06, 0.55, woodDark, 0, 0.03, 0);

  [0, 1].forEach(i => {
    const doorGroup = new THREE.Group();
    box(doorGroup, 0.46, 1.5, 0.04, wood, 0, 0, 0);
    box(doorGroup, 0.36, 1.4, 0.02, woodDark, 0, 0, 0.025);
    box(doorGroup, 0.04, 0.14, 0.04, handle, i === 0 ? 0.19 : -0.19, 0, 0.05);
    doorGroup.position.set(i === 0 ? -0.25 : 0.25, 0.82, 0.26);
    doorGroup.userData.isCabinetDoor = true;
    doorGroup.userData.doorState = 0;
    doorGroup.userData.doorHinge = i === 0 ? 1 : -1;
    g.add(doorGroup);
    World.interactables.push({ mesh: doorGroup, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 1.1, 0.6, ry);
  return g;
}

// ── Lámpara de mesa ──
function buildTableLamp(scene, x, y, z){
  const g = new THREE.Group();
  const metal = M({ color: 0x2a2a30, metalness: 0.9, roughness: 0.3 });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 1.6,
    transparent: true, opacity: 0.92, side: THREE.DoubleSide
  });

  // Base
  cyl(g, 0.11, 0.13, 0.03, metal, 0, 0.015, 0, 24);
  cyl(g, 0.07, 0.1, 0.04, metal, 0, 0.05, 0, 24);
  // Fuste
  cyl(g, 0.012, 0.012, 0.32, metal, 0, 0.23, 0, 12);
  // Cuello del fuste
  cyl(g, 0.02, 0.02, 0.04, metal, 0, 0.4, 0, 12);
  // Pantalla
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.28, 24, 1, true), shadeMat);
  shade.position.y = 0.55;
  g.add(shade);
  // Difusor superior
  cyl(g, 0.18, 0.18, 0.01, shadeMat, 0, 0.69, 0, 24);
  // Luz
  const light = new THREE.PointLight(0xffd682, 1.2, 5, 1.6);
  light.position.y = 0.5;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  g.add(light);

  g.position.set(x, y, z);
  scene.add(g);
  return g;
}

// ── Lámpara de techo ──
function buildCeilingLamp(scene, x, z, intensity){
  intensity = intensity || 1.6;
  const g = new THREE.Group();
  const metal = M({ color: 0x1a1a1e, metalness: 0.85, roughness: 0.35 });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.95, side: THREE.DoubleSide
  });

  // Cuerda
  cyl(g, 0.015, 0.015, 0.4, metal, 0, -0.2, 0, 8);
  // Rosetón
  cyl(g, 0.08, 0.08, 0.03, metal, 0, 0, 0, 20);
  // Pantalla cónica
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.28, 24, 1, true), shadeMat);
  shade.rotation.x = Math.PI;
  shade.position.y = -0.55;
  g.add(shade);
  // Bombilla
  sph(g, 0.08, new THREE.MeshStandardMaterial({ color: 0xfff5d0, emissive: 0xfff5d0, emissiveIntensity: 3 }), 0, -0.6, 0);
  // Luz
  const light = new THREE.PointLight(0xffd682, intensity, 12, 1.4);
  light.position.y = -0.65;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 20;
  g.add(light);

  g.position.set(x, World.roomHeight, z);
  scene.add(g);
  return g;
}

// ── Planta ──
function buildPlant(scene, x, z){
  const g = new THREE.Group();
  const potMat = M({ color: 0x6a4a2a, roughness: 0.9 });
  const soil = M({ color: 0x1a0f08, roughness: 1 });
  const leafMats = [
    M({ color: 0x2a5a2a, roughness: 0.85, side: THREE.DoubleSide }),
    M({ color: 0x3a6a3a, roughness: 0.85, side: THREE.DoubleSide }),
    M({ color: 0x1a4a1a, roughness: 0.85, side: THREE.DoubleSide }),
    M({ color: 0x4a7a3a, roughness: 0.85, side: THREE.DoubleSide })
  ];

  // Maceta
  cyl(g, 0.28, 0.22, 0.4, potMat, 0, 0.2, 0, 24);
  cyl(g, 0.3, 0.3, 0.04, potMat, 0, 0.42, 0, 24);
  // Tierra
  cyl(g, 0.26, 0.26, 0.02, soil, 0, 0.41, 0, 24);

  // Tallos y hojas
  for (let i = 0; i < 16; i++){
    const ang = Math.random()*Math.PI*2;
    const len = 0.5 + Math.random()*0.6;
    const height = 0.4 + Math.random()*0.5;

    // Tallo
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6), M({ color: 0x2a4a1a, roughness: 0.9 }));
    stem.position.set(Math.cos(ang)*0.05, 0.42 + height, Math.sin(ang)*0.05);
    stem.rotation.z = (Math.random()-0.5) * 0.4;
    stem.rotation.x = (Math.random()-0.5) * 0.4;
    g.add(stem);

    // Hoja
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.14, len * 0.9), leafMats[i % 4]);
    leaf.position.set(Math.cos(ang)*0.15, 0.42 + height + len*0.3, Math.sin(ang)*0.15);
    leaf.rotation.y = ang;
    leaf.rotation.x = -0.4 + (Math.random()-0.5)*0.8;
    leaf.castShadow = true;
    g.add(leaf);
  }

  g.position.set(x, 0, z);
  scene.add(g);
  addObstacle(x, z, 0.6, 0.6, 0);
  return g;
}

// ── Cuadro ──
function buildPainting(scene, x, y, z, ry, w, h, seed){
  w = w || 1.6; h = h || 1.1;
  const g = new THREE.Group();
  const frame = M({ color: 0x4a3d22, roughness: 0.6, metalness: 0.2 });

  // Marco exterior
  box(g, w + 0.16, h + 0.16, 0.06, frame, 0, 0, 0);
  // Marco interior (bisel)
  box(g, w + 0.06, h + 0.06, 0.02, frame, 0, 0, 0.035);
  // Lienzo
  const c = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M({ map: texPainting(seed || 0), roughness: 0.7 }));
  c.position.z = 0.045;
  g.add(c);

  g.position.set(x, y, z);
  g.rotation.y = ry;
  scene.add(g);
  return g;
}

// ── Ventana con luz y vista nocturna ──
function buildWindow(scene, x, y, z, ry, w, h){
  w = w || 1.8; h = h || 1.5;
  const g = new THREE.Group();
  const frame = M({ color: 0x4a3d22, roughness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x1a2035, emissive: 0x2a3a6a, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.85, metalness: 0.2, roughness: 0.1
  });

  // Marco exterior
  box(g, w + 0.24, h + 0.24, 0.14, frame, 0, 0, 0);
  // Luna creciente
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), new THREE.MeshBasicMaterial({ color: 0xf0e8d8 }));
  moon.position.set(w*0.25, h*0.2, 0.08);
  g.add(moon);
  // Estrellas
  for (let i = 0; i < 15; i++){
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.008 + Math.random()*0.008, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 + Math.random()*0.5 }));
    star.position.set((Math.random()-0.5)*w, (Math.random()-0.5)*h, 0.07);
    g.add(star);
  }

  // Cristal
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass);
  pane.position.z = 0.06;
  g.add(pane);

  // Cruz central (marcos)
  box(g, 0.08, h, 0.06, frame, 0, 0, 0.09);
  box(g, w, 0.08, 0.06, frame, 0, 0, 0.09);
  // Marco divisorio verticales/horizontales
  box(g, 0.05, h, 0.05, frame, -w/3, 0, 0.09);
  box(g, 0.05, h, 0.05, frame, w/3, 0, 0.09);
  box(g, w, 0.05, 0.05, frame, 0, h/3, 0.09);
  box(g, w, 0.05, 0.05, frame, 0, -h/3, 0.09);

  // Alfeizar
  box(g, w + 0.35, 0.08, 0.25, frame, 0, -h/2 - 0.1, 0.12);

  // Luz cálida entrando desde fuera
  const light = new THREE.PointLight(0x8090ff, 0.6, 6, 1.8);
  light.position.set(0, 0, -0.5);
  g.add(light);

  g.position.set(x, y, z);
  g.rotation.y = ry;
  scene.add(g);
  return g;
}

// ── Puerta ──
function buildDoor(scene, x, z, ry, w, h){
  w = w || 1.0; h = h || 2.2;
  const g = new THREE.Group();
  const frame = M({ color: 0x2a1a08, roughness: 0.8 });
  const door = M({ color: 0x4a2f18, roughness: 0.75 });
  const doorDark = M({ color: 0x2a1810, roughness: 0.85 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.15 });

  // Marco
  box(g, w + 0.16, 0.1, 0.12, frame, 0, h + 0.05, 0);
  box(g, 0.1, h + 0.1, 0.12, frame, -(w/2 + 0.03), h/2, 0);
  box(g, 0.1, h + 0.1, 0.12, frame, (w/2 + 0.03), h/2, 0);

  // Puerta
  box(g, w, h, 0.06, door, 0, h/2, 0.03);
  // Paneles decorativos
  box(g, w - 0.2, h/2 - 0.15, 0.02, doorDark, 0, h*0.3, 0.07);
  box(g, w - 0.2, h/2 - 0.15, 0.02, doorDark, 0, h*0.75, 0.07);
  // Tirador
  cyl(g, 0.025, 0.025, 0.08, handle, w/2 - 0.15, h/2, 0.1, 12).rotation.z = Math.PI/2;
  // Cerradura
  box(g, 0.06, 0.1, 0.03, handle, w/2 - 0.15, h/2 - 0.15, 0.08);

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  return g;
}

// ── Alfombra ──
function buildRug(scene, x, z, w, d, rot, palette){
  palette = palette || ['#5a2818', 'rgba(212,160,23,0.4)'];
  const mat = M({ map: texCarpet(palette[0], palette[1]), roughness: 1 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 3.5, d || 2.4), mat);
  m.rotation.x = -Math.PI/2;
  m.rotation.z = rot || 0;
  m.position.set(x || 0, 0.008, z || 0);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

// ── Cortina de teatro ──
function buildCurtain(scene, x, y, z, ry, w, h){
  const tex = texCurtain();
  tex.repeat.set(w/2, 1);
  const mat = M({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  scene.add(m);
  return m;
}

// ── Banco de exterior ──
function buildBench(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x5a3a20, roughness: 0.85 });
  const metal = M({ color: 0x2a2a30, metalness: 0.85, roughness: 0.35 });

  // Tablones del asiento
  for (let i = 0; i < 3; i++){
    box(g, 1.8, 0.05, 0.15, wood, 0, 0.5, -0.15 + i*0.15);
  }
  // Tablones del respaldo
  for (let i = 0; i < 3; i++){
    box(g, 1.8, 0.15, 0.05, wood, 0, 0.7 + i*0.15, -0.28);
  }
  // Patas de metal
  [[-0.75, 0],[0.75, 0]].forEach(([px, pz]) => {
    box(g, 0.08, 0.5, 0.5, metal, px, 0.25, pz);
  });

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 1.9, 0.7, ry);
  return g;
}

// ── Farola ──
function buildLampPost(scene, x, z){
  const g = new THREE.Group();
  const metal = M({ color: 0x1a1a1e, metalness: 0.75, roughness: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.9
  });

  // Base
  cyl(g, 0.15, 0.2, 0.15, metal, 0, 0.075, 0, 12);
  // Poste
  cyl(g, 0.04, 0.06, 4, metal, 0, 2.075, 0, 12);
  // Brazo decorativo
  cyl(g, 0.03, 0.03, 0.15, metal, 0, 4.1, 0, 8);
  // Farol (caja con cristales)
  box(g, 0.24, 0.32, 0.24, metal, 0, 4.32, 0);
  box(g, 0.2, 0.28, 0.2, lightMat, 0, 4.32, 0);
  // Tapa
  cyl(g, 0.02, 0.15, 0.08, metal, 0, 4.5, 0, 12);
  // Luz
  const light = new THREE.PointLight(0xffd682, 2.5, 12, 1.6);
  light.position.y = 4.3;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  g.add(light);

  g.position.set(x, 0, z);
  scene.add(g);
  addObstacle(x, z, 0.4, 0.4, 0);
  return g;
}

// ── Árbol ──
function buildTree(scene, x, z, scale){
  scale = scale || 1;
  const g = new THREE.Group();
  const trunk = M({ color: 0x3a2410, roughness: 0.95 });
  const foliage1 = M({ color: 0x1a3a1a, roughness: 0.9 });
  const foliage2 = M({ color: 0x2a4a2a, roughness: 0.9 });
  const foliage3 = M({ color: 0x0f2a0f, roughness: 0.9 });

  // Tronco
  const t = cyl(g, 0.18*scale, 0.28*scale, 2.2*scale, trunk, 0, 1.1*scale, 0, 12);
  // Ramas
  for (let i = 0; i < 4; i++){
    const ang = (i / 4) * Math.PI * 2 + Math.random();
    const branch = cyl(g, 0.06*scale, 0.1*scale, 1.2*scale, trunk, Math.cos(ang)*0.3*scale, 1.8*scale, Math.sin(ang)*0.3*scale, 8);
    branch.rotation.z = -0.7 + Math.random()*0.2;
    branch.rotation.y = ang;
  }

  // Follaje (varias esferas)
  for (let i = 0; i < 7; i++){
    const s = (0.9 + Math.random()*0.7)*scale;
    const mats = [foliage1, foliage2, foliage3];
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), mats[Math.floor(Math.random()*3)]);
    m.position.set(
      (Math.random()-0.5)*1.4*scale,
      (2.6 + Math.random()*1.4)*scale,
      (Math.random()-0.5)*1.4*scale
    );
    m.castShadow = true;
    g.add(m);
  }

  g.position.set(x, 0, z);
  scene.add(g);
  addObstacle(x, z, 0.6*scale, 0.6*scale, 0);
  return g;
}

// ── Cajas de escenario (teatro) ──
function buildCrate(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2a10, roughness: 0.9 });
  const woodDark = M({ color: 0x2a1808, roughness: 0.95 });

  box(g, 0.8, 0.8, 0.8, wood, 0, 0.4, 0);
  // Tablas decorativas
  for (let i = 0; i < 4; i++){
    box(g, 0.82, 0.04, 0.04, woodDark, 0, 0.15 + i*0.2, 0.41);
    box(g, 0.82, 0.04, 0.04, woodDark, 0, 0.15 + i*0.2, -0.41);
  }
  // Marco lateral
  box(g, 0.04, 0.82, 0.82, woodDark, -0.41, 0.4, 0);
  box(g, 0.04, 0.82, 0.82, woodDark, 0.41, 0.4, 0);

  g.position.set(x, 0, z);
  g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 0.9, 0.9, ry);
  return g;
}

/* ====================================================================
   MODELOS 3D DE OBJETOS INVESTIGABLES
   ==================================================================== */
const OBJ = {
  // Taza con asa y líquido
  taza: () => {
    const g = new THREE.Group();
    const ceramic = M({ color: 0xf0e8d8, roughness: 0.35, metalness: 0.05 });
    const liquid = M({ color: 0x3a2010, roughness: 0.15, metalness: 0.1 });
    // Cuerpo
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.1, 24, 1, true), ceramic);
    body.position.y = 0.05; body.castShadow = true; g.add(body);
    // Fondo
    const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.006, 24), ceramic);
    bottom.position.y = 0.003; g.add(bottom);
    // Asa
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 10, 20, Math.PI * 1.4), ceramic);
    handle.position.set(0.065, 0.055, 0);
    handle.rotation.z = -Math.PI * 0.3;
    handle.castShadow = true;
    g.add(handle);
    // Líquido
    const liq = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), liquid);
    liq.rotation.x = -Math.PI/2;
    liq.position.y = 0.082;
    g.add(liq);
    return g;
  },

  // Vaso
  vaso: () => {
    const g = new THREE.Group();
    const glass = M({ color: 0xd8e0e8, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.75 });
    const liquid = M({ color: 0x8a4010, roughness: 0.3, metalness: 0.1 });
    // Cuerpo
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.042, 0.12, 20), glass);
    body.position.y = 0.06; body.castShadow = true; g.add(body);
    // Líquido
    const liq = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.038, 0.07, 20), liquid);
    liq.position.y = 0.035; g.add(liq);
    // Base gruesa
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.008, 20), glass);
    base.position.y = 0.004; g.add(base);
    return g;
  },

  // Copa de vino
  copa: () => {
    const g = new THREE.Group();
    const glass = M({ color: 0xe0e8f0, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.7 });
    const wine = M({ color: 0x4a0818, roughness: 0.2, transparent: true, opacity: 0.85 });
    // Cuenco
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.022, 0.13, 24), glass);
    bowl.position.y = 0.15; bowl.castShadow = true; g.add(bowl);
    // Vino
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.018, 0.07, 24), wine);
    w.position.y = 0.125; g.add(w);
    // Fuste
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 12), glass);
    stem.position.y = 0.05; g.add(stem);
    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.048, 0.008, 24), glass);
    base.position.y = 0.004; g.add(base);
    return g;
  },

  // Botella
  botella: () => {
    const g = new THREE.Group();
    const glass = M({ color: 0x2a3a1a, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.9 });
    const cork = M({ color: 0x8a6a3a, roughness: 0.9 });
    const label = M({ color: 0xf0e8d8, roughness: 0.85 });
    // Cuerpo
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 20), glass);
    body.position.y = 0.1; body.castShadow = true; g.add(body);
    // Hombro
    const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.04, 20), glass);
    shoulder.position.y = 0.22; g.add(shoulder);
    // Cuello
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.09, 16), glass);
    neck.position.y = 0.285; g.add(neck);
    // Etiqueta
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.08), label);
    lbl.position.set(0.051, 0.1, 0);
    lbl.rotation.y = Math.PI/2;
    g.add(lbl);
    // Corcho
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.035, 12), cork);
    c.position.y = 0.345; g.add(c);
    return g;
  },

  // Cuchillo de cocina
  cuchillo: () => {
    const g = new THREE.Group();
    const steel = M({ color: 0xd0d0d8, metalness: 0.9, roughness: 0.15 });
    const darkSteel = M({ color: 0xa0a0a8, metalness: 0.85, roughness: 0.2 });
    const wood = M({ color: 0x2a1810, roughness: 0.75 });
    const brass = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });

    // Hoja
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.004, 0.04), steel);
    blade.position.set(0.13, 0.006, 0); blade.castShadow = true; g.add(blade);
    // Punta
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), steel);
    tip.rotation.z = -Math.PI/2;
    tip.position.set(0.275, 0.006, 0);
    g.add(tip);
    // Filo superior (bisel)
    const bevel = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.002, 0.01), darkSteel);
    bevel.position.set(0.13, 0.009, 0);
    g.add(bevel);
    // Virola
    const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.016, 0.042), brass);
    bolster.position.set(-0.006, 0.008, 0);
    g.add(bolster);
    // Mango de madera
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.03), wood);
    handle.position.set(-0.055, 0.01, 0);
    g.add(handle);
    // Remaches
    [-0.035, -0.07].forEach(x => {
      const rivet = new THREE.Mesh(new THREE.SphereGeometry(0.004, 8, 6), brass);
      rivet.position.set(x, 0.02, 0);
      g.add(rivet);
    });
    return g;
  },

  // Guante de cuero
  guante: () => {
    const g = new THREE.Group();
    const leather = M({ color: 0x3a2010, roughness: 0.85 });
    const leatherDark = M({ color: 0x1a0a05, roughness: 0.9 });

    // Palma
    box(g, 0.09, 0.02, 0.11, leather, 0, 0.01, 0);
    // Muñeca
    box(g, 0.09, 0.022, 0.04, leatherDark, 0, 0.011, 0.07);

    // 4 dedos
    for (let i = 0; i < 4; i++){
      const finger = new THREE.Group();
      // Falange 1
      box(finger, 0.018, 0.014, 0.035, leather, 0, 0.008, -0.017);
      // Falange 2
      box(finger, 0.016, 0.012, 0.03, leather, 0, 0.008, -0.048);
      finger.position.set(-0.03 + i*0.02, 0.01, -0.055);
      finger.rotation.x = -0.15 + Math.random()*0.1;
      g.add(finger);
    }
    // Pulgar
    const thumb = new THREE.Group();
    box(thumb, 0.016, 0.014, 0.04, leather, 0, 0.008, -0.02);
    box(thumb, 0.014, 0.012, 0.028, leather, 0, 0.008, -0.05);
    thumb.position.set(0.055, 0.01, -0.02);
    thumb.rotation.y = -0.6;
    thumb.rotation.x = -0.3;
    g.add(thumb);
    return g;
  },

  // Pareja de guantes
  guantes: () => {
    const g = new THREE.Group();
    const one = OBJ.guante();
    const two = OBJ.guante();
    two.position.set(0.16, 0, 0.06);
    two.rotation.y = 0.5;
    g.add(one); g.add(two);
    return g;
  },

  // Pañuelo
  panuelo: () => {
    const g = new THREE.Group();
    const mat = M({ color: 0xf0e8d8, roughness: 0.95, side: THREE.DoubleSide });
    // Tela principal
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18, 8, 8), mat);
    cloth.rotation.x = -Math.PI/2;
    // Onda sutil
    const pos = cloth.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++){
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 8) * Math.cos(y * 8) * 0.005);
    }
    cloth.geometry.computeVertexNormals();
    cloth.castShadow = true;
    g.add(cloth);
    return g;
  },

  // Libro
  libro: () => {
    const g = new THREE.Group();
    const cover = M({ color: 0x5a1a1a, roughness: 0.7 });
    const pages = M({ color: 0xe8d8b8, roughness: 0.9 });
    const gold = M({ color: 0xc8a860, metalness: 0.85, roughness: 0.25 });
    // Tapa inferior
    box(g, 0.17, 0.008, 0.24, cover, 0, 0.004, 0);
    // Páginas
    box(g, 0.16, 0.028, 0.23, pages, 0.005, 0.022, 0);
    // Tapa superior
    box(g, 0.17, 0.008, 0.24, cover, 0, 0.04, 0);
    // Lomo
    box(g, 0.008, 0.04, 0.24, cover, -0.085, 0.02, 0);
    // Detalles dorados
    box(g, 0.14, 0.001, 0.2, gold, 0.005, 0.045, 0);
    return g;
  },

  // Carta / documento
  carta: () => {
    const g = new THREE.Group();
    const paper = M({ color: 0xf0e8d0, roughness: 0.92, side: THREE.DoubleSide });
    const text = M({ color: 0x3a2a1a, roughness: 0.85 });

    // Hoja con ligera curvatura
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.24, 8, 8), paper);
    sheet.rotation.x = -Math.PI/2;
    const pos = sheet.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++){
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 6) * 0.006 + Math.sin(y * 8) * 0.004);
    }
    sheet.geometry.computeVertexNormals();
    sheet.position.y = 0.005;
    g.add(sheet);

    // Líneas de texto
    for (let i = 0; i < 6; i++){
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.003), text);
      line.rotation.x = -Math.PI/2;
      line.position.set(-0.01, 0.012, -0.08 + i*0.03);
      g.add(line);
    }
    return g;
  },

  // Llave
  llave: () => {
    const g = new THREE.Group();
    const brass = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
    // Vástago
    cyl(g, 0.006, 0.006, 0.11, brass, 0.02, 0.006, 0, 12).rotation.z = Math.PI/2;
    // Cabeza circular
    const head = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 10, 20), brass);
    head.rotation.x = Math.PI/2;
    head.position.set(-0.055, 0.006, 0);
    g.add(head);
    // Dientes
    box(g, 0.008, 0.012, 0.018, brass, 0.06, 0.012, 0.008);
    box(g, 0.008, 0.012, 0.014, brass, 0.072, 0.012, 0.006);
    return g;
  },

  // Reloj de pulsera
  reloj: () => {
    const g = new THREE.Group();
    const gold = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
    const face = M({ color: 0xf0e8d0, roughness: 0.5 });
    const hands = M({ color: 0x1a1a1e, roughness: 0.7 });
    const strap = M({ color: 0x2a1810, roughness: 0.85 });

    // Caja
    cyl(g, 0.032, 0.032, 0.012, gold, 0, 0.006, 0, 24);
    // Esfera
    cyl(g, 0.028, 0.028, 0.014, face, 0, 0.007, 0, 24);
    // Agujas
    box(g, 0.003, 0.001, 0.02, hands, 0, 0.014, -0.005);
    box(g, 0.003, 0.001, 0.014, hands, 0.007, 0.014, 0.002).rotation.y = Math.PI/2;
    // Correa
    box(g, 0.024, 0.008, 0.09, strap, 0, 0.004, 0.06);
    box(g, 0.024, 0.008, 0.05, strap, 0, 0.004, -0.045);
    return g;
  },

  // Móvil
  movil: () => {
    const g = new THREE.Group();
    const body = M({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.5 });
    const screen = M({ color: 0x1a3050, roughness: 0.05, metalness: 0.3, emissive: 0x2a5080, emissiveIntensity: 0.5 });
    const glass = M({ color: 0x0a0a10, roughness: 0.05 });
    // Cuerpo
    box(g, 0.07, 0.008, 0.14, body, 0, 0.004, 0);
    // Pantalla
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.12), screen);
    s.rotation.x = -Math.PI/2;
    s.position.y = 0.009;
    g.add(s);
    // Cámara
    cyl(g, 0.005, 0.005, 0.002, glass, 0.02, 0.01, -0.06, 12);
    return g;
  },

  // Pistola
  pistola: () => {
    const g = new THREE.Group();
    const metal = M({ color: 0x2a2a30, metalness: 0.9, roughness: 0.3 });
    const metalDark = M({ color: 0x0a0a10, metalness: 0.85, roughness: 0.4 });
    const grip = M({ color: 0x2a1810, roughness: 0.8 });
    // Cañón / corredera
    box(g, 0.16, 0.028, 0.024, metal, 0.02, 0.04, 0);
    // Detalle superior
    box(g, 0.08, 0.004, 0.018, metalDark, 0, 0.056, 0);
    // Guardamonte
    const guard = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16, Math.PI * 1.2), metal);
    guard.position.set(-0.035, 0.02, 0);
    guard.rotation.z = Math.PI * 0.1;
    g.add(guard);
    // Empuñadura
    box(g, 0.04, 0.08, 0.024, grip, -0.062, 0.005, 0).rotation.z = -0.2;
    // Gatillo
    box(g, 0.008, 0.02, 0.008, metalDark, -0.02, 0.025, 0);
    return g;
  },

  // Sobre
  sobre: () => {
    const g = new THREE.Group();
    const paper = M({ color: 0xf0e8d0, roughness: 0.9, side: THREE.DoubleSide });
    const paperDark = M({ color: 0xd8d0b0, roughness: 0.9, side: THREE.DoubleSide });
    // Frente
    const front = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), paper);
    front.rotation.x = -Math.PI/2;
    front.position.y = 0.005;
    g.add(front);
    // Solapa triangular (líneas)
    const flapMat = paperDark;
    const flap1 = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.07), flapMat);
    flap1.rotation.x = -Math.PI/2;
    flap1.position.set(0, 0.006, -0.02);
    flap1.rotation.z = 0.15;
    g.add(flap1);
    return g;
  },

  // Frasco con líquido
  frasco: () => {
    const g = new THREE.Group();
    const glass = M({ color: 0xa0c0d0, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.65 });
    const cap = M({ color: 0x3a3a40, roughness: 0.6 });
    const label = M({ color: 0xf0e8d0, roughness: 0.85 });
    // Cuerpo
    cyl(g, 0.028, 0.032, 0.07, glass, 0, 0.035, 0, 16);
    // Cuello
    cyl(g, 0.022, 0.028, 0.02, glass, 0, 0.08, 0, 16);
    // Tapa
    cyl(g, 0.024, 0.024, 0.018, cap, 0, 0.1, 0, 16);
    // Etiqueta
    const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.04), label);
    lbl.position.set(0, 0.04, 0.032);
    g.add(lbl);
    return g;
  },

  // Caja fuerte
  caja: () => {
    const g = new THREE.Group();
    const metal = M({ color: 0x2a2a30, metalness: 0.8, roughness: 0.4 });
    const metalDark = M({ color: 0x1a1a1e, metalness: 0.75, roughness: 0.5 });
    const dial = M({ color: 0xc8a860, metalness: 0.95, roughness: 0.1 });
    // Cuerpo
    box(g, 0.28, 0.2, 0.22, metal, 0, 0.1, 0);
    // Puerta
    box(g, 0.24, 0.18, 0.012, metalDark, 0, 0.1, 0.11);
    // Marco de puerta
    box(g, 0.26, 0.19, 0.005, dial, 0, 0.1, 0.116);
    // Dial
    cyl(g, 0.022, 0.022, 0.01, dial, 0, 0.1, 0.125, 16).rotation.x = Math.PI/2;
    // Manilla
    box(g, 0.04, 0.008, 0.01, dial, 0.08, 0.1, 0.125);
    return g;
  },

  // Joyas (collar / anillo)
  joyas: () => {
    const g = new THREE.Group();
    const gold = M({ color: 0xc8a860, metalness: 0.95, roughness: 0.15 });
    const gem = M({ color: 0x4a90e2, metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.85, emissive: 0x1a3060, emissiveIntensity: 0.3 });

    // Anillo principal
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 10, 24), gold);
    ring.rotation.x = Math.PI/2;
    ring.position.y = 0.006;
    g.add(ring);
    // Piedra
    const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), gem);
    stone.position.set(0, 0.022, 0);
    g.add(stone);
    // Segundo anillo
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20), gold);
    ring2.rotation.x = Math.PI/2;
    ring2.position.set(0.04, 0.005, 0.02);
    g.add(ring2);
    return g;
  },

  // Flores
  flores: () => {
    const g = new THREE.Group();
    const green = M({ color: 0x2a4a1a, roughness: 0.9 });
    const red = M({ color: 0xc02020, roughness: 0.7, side: THREE.DoubleSide });
    const pink = M({ color: 0xd06080, roughness: 0.7, side: THREE.DoubleSide });

    // Tallo principal
    cyl(g, 0.004, 0.006, 0.24, green, 0, 0.12, 0, 8);
    // Hojas
    for (let i = 0; i < 4; i++){
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.08), green);
      leaf.position.set((Math.random()-0.5)*0.05, 0.05 + i*0.05, (Math.random()-0.5)*0.05);
      leaf.rotation.z = -0.5 + Math.random();
      leaf.rotation.y = Math.random() * Math.PI * 2;
      g.add(leaf);
    }
    // Pétalos (rosa)
    const petalsMat = [red, pink, red];
    for (let i = 0; i < 8; i++){
      const angle = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), petalsMat[i % 3]);
      petal.position.set(Math.cos(angle) * 0.018, 0.25, Math.sin(angle) * 0.018);
      petal.lookAt(0, 0.25, 0);
      g.add(petal);
    }
    // Centro
    sph(g, 0.012, M({ color: 0xf0d040, roughness: 0.7 }), 0, 0.255, 0);
    return g;
  },

  // Pendiente
  pendiente: () => {
    const g = new THREE.Group();
    const gold = M({ color: 0xc8a860, metalness: 0.95, roughness: 0.15 });
    const pearl = M({ color: 0xf0e8d8, roughness: 0.2, metalness: 0.4 });
    // Aro
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 20), gold);
    hoop.rotation.x = Math.PI/2;
    hoop.position.y = 0.02;
    g.add(hoop);
    // Perla colgante
    sph(g, 0.014, pearl, 0, 0.005, 0);
    return g;
  },

  // Bufanda
  bufanda: () => {
    const g = new THREE.Group();
    const silk = M({ color: 0x8a1818, roughness: 0.5, side: THREE.DoubleSide });
    // Tela con pliegues
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.35, 6, 12), silk);
    cloth.rotation.x = -Math.PI/2;
    const pos = cloth.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++){
      const x = pos.getX(i);
      pos.setZ(i, Math.sin(x * 40) * 0.008);
    }
    cloth.geometry.computeVertexNormals();
    cloth.position.y = 0.005;
    g.add(cloth);
    return g;
  }
};

function getObjectModel(obj){
  const id = (obj.id || '').toLowerCase();
  const name = (obj.name || '').toLowerCase();

  if (OBJ[id]) return OBJ[id];

  const keywords = [
    ['taza','taza'],['té','taza'],['te','taza'],['termo','taza'],
    ['vaso','vaso'],['whisky','vaso'],['brandy','vaso'],
    ['copa','copa'],['champán','copa'],['champan','copa'],
    ['botella','botella'],['licorera','botella'],
    ['cuchillo','cuchillo'],['tijeras','cuchillo'],
    ['guante','guante'],['guantes','guantes'],
    ['pañuelo','panuelo'],['panuelo','panuelo'],
    ['libro','libro'],['cuaderno','libro'],['catálogo','libro'],['catalogo','libro'],['testamento','libro'],
    ['carta','carta'],['nota','carta'],['programa','carta'],
    ['llave','llave'],['llavero','llave'],
    ['reloj','reloj'],
    ['móvil','movil'],['movil','movil'],
    ['pistola','pistola'],['arma','pistola'],
    ['sobre','sobre'],
    ['frasco','frasco'],['somnífero','frasco'],['somni','frasco'],['reactivo','frasco'],
    ['caja','caja'],['caja fuerte','caja'],
    ['joya','joyas'],['anillo','joyas'],['collar','joyas'],
    ['flor','flores'],['rosa','flores'],['ramo','flores'],
    ['bufanda','bufanda'],['pendiente','pendiente']
  ];
  for (const [kw, type] of keywords){
    if (name.includes(kw) && OBJ[type]) return OBJ[type];
  }
  // Fallback
  return () => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.1), M({ color: 0x8a6a3a, roughness: 0.7 }));
    m.position.y = 0.03; m.castShadow = true; g.add(m);
    return g;
  };
}

/* ====================================================================
   CADÁVER
   ==================================================================== */
const CORPSE_POSES = {
  supine: { armL: 1.2, armR: 1.2, legL: 0.1, legR: -0.1, torsoY: 0, headY: 0 },
  side: { armL: 1.4, armR: 0.8, legL: 0.5, legR: -0.1, torsoY: -0.4, headY: 0.2 },
  prone: { armL: 1.5, armR: -1.5, legL: 0.1, legR: -0.1, torsoY: 0, headY: 0.1 },
  curled: { armL: 2.2, armR: 2.2, legL: 1.4, legR: 1.4, torsoY: -0.5, headY: 0.3 },
  seated: { armL: 0.3, armR: 0.3, legL: 1.5, legR: -1.5, torsoY: 0, headY: 0 }
};

function buildCorpse(scene, poseKey, x, z, ry){
  poseKey = poseKey || 'supine';
  const pose = CORPSE_POSES[poseKey] || CORPSE_POSES.supine;
  const g = new THREE.Group();

  const skin = M({ color: 0xd8c0a8, roughness: 0.95 });
  const shirt = M({ color: 0x3a4a5a, roughness: 0.9 });
  const pants = M({ color: 0x2a2a30, roughness: 0.9 });
  const shoes = M({ color: 0x0a0a10, roughness: 0.85 });
  const blood = new THREE.MeshStandardMaterial({ color: 0x5a0a08, roughness: 0.5, transparent: true, opacity: 0.9 });
  const bloodDark = new THREE.MeshStandardMaterial({ color: 0x3a0605, roughness: 0.6, transparent: true, opacity: 0.85 });

  // Mancha de sangre grande
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), blood);
  pool.rotation.x = -Math.PI/2;
  pool.position.y = 0.008;
  pool.scale.set(1, 1.4, 1);
  g.add(pool);

  // Salpicaduras
  for (let i = 0; i < 12; i++){
    const r = 0.05 + Math.random()*0.2;
    const s = new THREE.Mesh(new THREE.CircleGeometry(r, 16), bloodDark);
    s.rotation.x = -Math.PI/2;
    s.position.set((Math.random()-0.5)*2.6, 0.01, (Math.random()-0.5)*3);
    s.scale.set(1, 0.6 + Math.random()*0.8, 1);
    g.add(s);
  }

  const yb = 0.14;

  // CABEZA con pelo
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), skin);
  head.position.set(0, yb, -0.68);
  head.scale.set(0.9, 1.0, 1.15);
  head.castShadow = true;
  head.rotation.y = pose.headY;
  g.add(head);
  // Pelo
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 24, 16, 0, Math.PI*2, 0, Math.PI*0.5),
    M({ color: 0x2a1810, roughness: 0.95 }));
  hair.position.set(0, yb + 0.01, -0.68);
  hair.scale.set(0.9, 1.0, 1.15);
  g.add(hair);

  // CUELLO
  box(g, 0.14, 0.1, 0.14, skin, 0, yb, -0.5);

  // TORSO con camisa
  box(g, 0.5, 0.26, 0.85, shirt, 0, yb, 0);
  // Detalle: botones / abertura
  box(g, 0.02, 0.03, 0.02, M({ color: 0xf0e8d0, roughness: 0.5 }), 0, yb + 0.05, -0.15);
  box(g, 0.02, 0.03, 0.02, M({ color: 0xf0e8d0, roughness: 0.5 }), 0, yb + 0.05, 0.0);
  box(g, 0.02, 0.03, 0.02, M({ color: 0xf0e8d0, roughness: 0.5 }), 0, yb + 0.05, 0.15);

  // CADERA con pantalón
  box(g, 0.46, 0.24, 0.24, pants, 0, yb, 0.55);

  // BRAZOS con mangas de camisa
  function buildArm(side, rotY){
    const grp = new THREE.Group();
    // Brazo superior
    box(grp, 0.13, 0.14, 0.42, shirt, 0, 0, -0.21);
    // Antebrazo
    box(grp, 0.12, 0.13, 0.4, shirt, 0, 0, -0.62);
    // Mano
    box(grp, 0.1, 0.11, 0.12, skin, 0, 0, -0.88);
    // Dedos (aproximados)
    box(grp, 0.09, 0.05, 0.06, skin, 0, -0.02, -0.96);
    grp.position.set(side * 0.36, yb, -0.24);
    grp.rotation.y = rotY;
    return grp;
  }
  g.add(buildArm(-1, pose.armL));
  g.add(buildArm(1, pose.armR));

  // PIERNAS
  function buildLeg(side, rotY){
    const grp = new THREE.Group();
    // Muslo
    box(grp, 0.16, 0.16, 0.5, pants, 0, 0, 0.25);
    // Rodilla
    box(grp, 0.14, 0.15, 0.1, pants, 0, 0, 0.55);
    // Pantorrilla
    box(grp, 0.13, 0.14, 0.45, pants, 0, 0, 0.82);
    // Zapato
    box(grp, 0.15, 0.1, 0.22, shoes, 0, -0.02, 1.15);
    grp.position.set(side * 0.14, yb, 0.65);
    grp.rotation.y = rotY;
    return grp;
  }
  g.add(buildLeg(-1, pose.legL));
  g.add(buildLeg(1, pose.legR));

  g.position.set(x, 0, z);
  g.rotation.y = ry + pose.torsoY;
  scene.add(g);
  return g;
}

/* ====================================================================
   BASE DE HABITACIÓN (paredes, suelo, techo, rodapié, cornisa)
   ==================================================================== */
function buildRoomBase(scene, config){
  const SIZE = config.size;
  const H = config.height;
  World.roomHalf = SIZE/2;
  World.roomHeight = H;
  World.bounds = { minX: -SIZE/2 + 0.45, maxX: SIZE/2 - 0.45, minZ: -SIZE/2 + 0.45, maxZ: SIZE/2 - 0.45 };
  const half = SIZE/2;

  // Suelo
  const floorTex = config.floorTex();
  floorTex.repeat.set(SIZE/2, SIZE/2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: floorTex, roughness: 0.85 }));
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Techo con textura
  const ceilTex = texCeiling();
  ceilTex.repeat.set(SIZE/3, SIZE/3);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: ceilTex, roughness: 1, color: 0xa0a0a0 }));
  ceil.rotation.x = Math.PI/2;
  ceil.position.y = H;
  ceil.receiveShadow = true;
  scene.add(ceil);

  // Paredes con papel pintado
  const wallTex = config.wallTex();
  wallTex.repeat.set(SIZE/2.5, H/2.5);
  const wallMat = M({ map: wallTex, roughness: 0.92 });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  [
    { pos: [0, H/2, -half], rot: 0 },
    { pos: [0, H/2, half], rot: Math.PI },
    { pos: [-half, H/2, 0], rot: Math.PI/2 },
    { pos: [half, H/2, 0], rot: -Math.PI/2 }
  ].forEach(w => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(...w.pos);
    m.rotation.y = w.rot;
    m.receiveShadow = true;
    scene.add(m);
  });

  // Rodapié (baseboard) en las 4 paredes
  const baseMat = M({ color: 0x3a2f1e, roughness: 0.8, metalness: 0.05 });
  const baseMoldMat = M({ color: 0x4a3d22, roughness: 0.7, metalness: 0.1 });
  const bh = 0.18, bt = 0.06;
  [
    { p: [0, bh/2, -half + bt/2], s: [SIZE, bh, bt], rot: 0 },
    { p: [0, bh/2, half - bt/2], s: [SIZE, bh, bt], rot: 0 },
    { p: [-half + bt/2, bh/2, 0], s: [bt, bh, SIZE], rot: 0 },
    { p: [half - bt/2, bh/2, 0], s: [bt, bh, SIZE], rot: 0 }
  ].forEach(({p, s}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...s), baseMat);
    m.position.set(...p);
    m.receiveShadow = true;
    scene.add(m);
  });

  // Moldura superior (cornisa)
  const ch = 0.12, ct = 0.08;
  [
    { p: [0, H - ch/2, -half + ct/2], s: [SIZE, ch, ct] },
    { p: [0, H - ch/2, half - ct/2], s: [SIZE, ch, ct] },
    { p: [-half + ct/2, H - ch/2, 0], s: [ct, ch, SIZE] },
    { p: [half - ct/2, H - ch/2, 0], s: [ct, ch, SIZE] }
  ].forEach(({p, s}) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(...s), baseMoldMat);
    m.position.set(...p);
    scene.add(m);
  });

  // Partículas de polvo flotantes
  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 300;
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount * 3; i += 3){
    positions[i] = (Math.random()-0.5) * SIZE;
    positions[i+1] = Math.random() * H;
    positions[i+2] = (Math.random()-0.5) * SIZE;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffd682, size: 0.02, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);
  World.dust = dust;

  // Luz ambiental cálida
  const ambient = new THREE.AmbientLight(0x606070, 0.55);
  scene.add(ambient);
  const hemi = new THREE.HemisphereLight(0x9090b0, 0x201008, 0.35);
  scene.add(hemi);
}

/* ====================================================================
   POSICIONES DE OBJETOS SEGÚN ESCENA
   ==================================================================== */
function objectPositionsFor(sceneType){
  switch(sceneType){
    case 'despacho': return [
      {x: -3.4, y: 0.80, z: -2.4, surface: 'escritorio'},
      {x: -2.9, y: 0.80, z: -2.7, surface: 'escritorio'},
      {x: -2.0, y: 0.80, z: -2.4, surface: 'escritorio'},
      {x: 5.4, y: 1.65, z: 1.2, surface: 'estantería'},
      {x: 5.4, y: 1.65, z: -1.8, surface: 'estantería'},
      {x: -4.5, y: 0.64, z: 3.5, surface: 'mesilla'}
    ];
    case 'dormitorio': return [
      {x: -4.5, y: 0.86, z: -3.8, surface: 'cama'},
      {x: -3.5, y: 0.86, z: -3.8, surface: 'cama'},
      {x: -5.5, y: 0.67, z: -4.3, surface: 'mesilla'},
      {x: -3.5, y: 0.67, z: -4.3, surface: 'mesilla'},
      {x: -1.2, y: 0.67, z: -4.3, surface: 'mesilla'},
      {x: 5.4, y: 1.5, z: -3.8, surface: 'armario'}
    ];
    case 'biblioteca': return [
      {x: -3.0, y: 1.8, z: -6.4, surface: 'estantería'},
      {x: 0, y: 1.8, z: -6.4, surface: 'estantería'},
      {x: 3.0, y: 1.8, z: -6.4, surface: 'estantería'},
      {x: 0, y: 0.82, z: 1.5, surface: 'mesa'},
      {x: -0.6, y: 0.82, z: 1.5, surface: 'mesa'},
      {x: 0.6, y: 0.82, z: 1.5, surface: 'mesa'}
    ];
    case 'exterior': return [
      {x: 3.0, y: 0.6, z: -3.0, surface: 'banco'},
      {x: 2.4, y: 0.6, z: -3.0, surface: 'banco'},
      {x: 3.6, y: 0.6, z: -3.0, surface: 'banco'},
      {x: 0, y: 0.05, z: 0, surface: 'suelo'},
      {x: 1, y: 0.05, z: 0.5, surface: 'suelo'}
    ];
    case 'teatro': return [
      {x: 2.0, y: 0.80, z: -1.5, surface: 'escritorio'},
      {x: 1.4, y: 0.80, z: -1.8, surface: 'escritorio'},
      {x: 2.6, y: 0.80, z: -1.5, surface: 'escritorio'},
      {x: -3.5, y: 0.05, z: 3.5, surface: 'suelo'},
      {x: 3.5, y: 0.05, z: 3.0, surface: 'suelo'}
    ];
    default: return [
      {x: 0, y: 0.8, z: -2}, {x: 1, y: 0.8, z: -2}, {x: -1, y: 0.8, z: -2},
      {x: 2, y: 0.8, z: -2}, {x: -2, y: 0.8, z: -2}, {x: 0, y: 0.05, z: 0}
    ];
  }
}

/* ====================================================================
   HABITACIONES
   ==================================================================== */
function roomDespacho(scene){
  buildRoomBase(scene, {
    size: 11, height: 3.0,
    floorTex: texParquet,
    wallTex: () => texWallpaper('#4a4030', 'rgba(0,0,0,0.1)', 6)
  });
  const half = 5.5;

  // Alfombra persa
  buildRug(scene, -0.5, 0.2, 3.5, 2.5, 0.1, ['#4a2010', 'rgba(212,160,23,0.45)']);

  // Cuadros en la pared trasera
  buildPainting(scene, 1.5, 1.9, -half + 0.06, 0, 1.6, 1.2, 0);
  buildPainting(scene, -0.3, 1.9, -half + 0.06, 0, 0.9, 0.9, 1);

  // Ventana en la pared izquierda
  buildWindow(scene, -half + 0.08, 1.85, -1.8, Math.PI/2, 2.0, 1.5);

  // Puerta en la pared derecha
  buildDoor(scene, half - 0.08, 2.5, -Math.PI/2, 1.0, 2.2);

  // Escritorio principal
  buildDesk(scene, -2.6, -2.4, Math.PI * 0.1);
  // Silla
  buildChair(scene, -2.6, -1.2, Math.PI);
  // Lámpara de mesa sobre el escritorio
  buildTableLamp(scene, -3.4, 0.79, -2.4);

  // Archivador
  buildCabinet(scene, half - 1.8, 3.5, Math.PI);

  // Dos estanterías
  buildBookshelf(scene, half - 0.25, 1.2, -Math.PI/2, 2.2, 2.6);
  buildBookshelf(scene, half - 0.25, -1.8, -Math.PI/2, 2.2, 2.6);

  // Plantas
  buildPlant(scene, -half + 1, -half + 1);
  buildPlant(scene, half - 1.2, half - 1.2);

  // Lámpara de techo
  buildCeilingLamp(scene, 0, 0, 1.8);

  return { corpsePos: { x: 0.8, z: 1.5, rot: Math.PI * 0.2 }, pose: 'supine', spawn: { x: 0, z: 4.2 } };
}

function roomDormitorio(scene){
  buildRoomBase(scene, {
    size: 11, height: 3.0,
    floorTex: texParquet,
    wallTex: () => texWallpaper('#3a3545', 'rgba(0,0,0,0.12)', 5)
  });
  const half = 5.5;

  buildRug(scene, 1.5, 1.5, 3.2, 2.4, 0, ['#3a1818', 'rgba(180,140,80,0.4)']);
  buildPainting(scene, -2.0, 1.9, -half + 0.06, 0, 1.4, 1.0, 2);
  buildWindow(scene, half - 0.08, 1.85, -1.8, -Math.PI/2, 2.0, 1.5);
  buildDoor(scene, -half + 0.08, 2.6, Math.PI/2, 1.0, 2.2);

  // Cama
  buildBed(scene, -half + 2.2, -half + 1.8, 0);

  // Mesillas a ambos lados
  buildNightstand(scene, -half + 0.85, -half + 1.8, 0);
  buildTableLamp(scene, -half + 0.85, 0.65, -half + 1.8);
  buildNightstand(scene, -half + 3.55, -half + 1.8, 0);

  // Armario
  buildWardrobe(scene, half - 0.7, -half + 1.8, -Math.PI/2);

  // Planta
  buildPlant(scene, half - 1.2, half - 1.2);

  buildCeilingLamp(scene, 0, 0, 1.6);

  return { corpsePos: { x: 1.5, z: 1.0, rot: Math.PI * 0.3 }, pose: 'side', spawn: { x: -1, z: 4.0 } };
}

function roomBiblioteca(scene){
  buildRoomBase(scene, {
    size: 13, height: 3.5,
    floorTex: texMarble,
    wallTex: () => texWallpaper('#2a2820', 'rgba(0,0,0,0.14)', 4)
  });
  const half = 6.5;

  // Alfombra grande central
  buildRug(scene, 0, 1.5, 4, 3, 0, ['#4a2020', 'rgba(180,140,80,0.5)']);

  // 3 cuadros grandes en la pared trasera
  buildPainting(scene, -3.5, 2.4, -half + 0.06, 0, 1.4, 1.0, 0);
  buildPainting(scene, 0, 2.6, -half + 0.06, 0, 2.0, 1.4, 3);
  buildPainting(scene, 3.5, 2.4, -half + 0.06, 0, 1.4, 1.0, 4);

  // 2 ventanas grandes
  buildWindow(scene, -half + 0.08, 2.0, -2.5, Math.PI/2, 2.0, 1.6);
  buildWindow(scene, -half + 0.08, 2.0, 2.5, Math.PI/2, 2.0, 1.6);

  // Puerta
  buildDoor(scene, half - 0.08, 2.5, -Math.PI/2, 1.1, 2.3);

  // 3 estanterías enormes en la pared trasera
  buildBookshelf(scene, -3.5, -half + 0.3, 0, 2.4, 3.0);
  buildBookshelf(scene, 0, -half + 0.3, 0, 2.4, 3.0);
  buildBookshelf(scene, 3.5, -half + 0.3, 0, 2.4, 3.0);

  // 2 estanterías laterales izquierdas
  buildBookshelf(scene, -half + 0.3, -1.8, Math.PI/2, 2.4, 3.0);
  buildBookshelf(scene, -half + 0.3, 1.8, Math.PI/2, 2.4, 3.0);

  // 2 estanterías laterales derechas
  buildBookshelf(scene, half - 0.3, -1.8, -Math.PI/2, 2.4, 3.0);
  buildBookshelf(scene, half - 0.3, 1.8, -Math.PI/2, 2.4, 3.0);

  // Mesa central
  buildDesk(scene, 0, 1.5, 0);
  buildChair(scene, 0, 2.7, Math.PI);
  buildChair(scene, 0, 0.3, 0);
  buildTableLamp(scene, -0.7, 0.79, 1.5);

  // Archivador
  buildCabinet(scene, -half + 1.5, half - 1.5, Math.PI);

  // Plantas
  buildPlant(scene, half - 1.5, half - 1.5);

  buildCeilingLamp(scene, -3, 0, 1.5);
  buildCeilingLamp(scene, 3, 0, 1.5);

  return { corpsePos: { x: 0.8, z: 0.5, rot: Math.PI * 0.5 }, pose: 'prone', spawn: { x: 4, z: 4.5 } };
}

function roomExterior(scene){
  const SIZE = 24;
  World.roomHalf = SIZE/2;
  World.roomHeight = 14;
  World.bounds = { minX: -SIZE/2 + 1, maxX: SIZE/2 - 1, minZ: -SIZE/2 + 1, maxZ: SIZE/2 - 1 };

  // Suelo hierba
  const gt = texGrass();
  gt.repeat.set(12, 12);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: gt, roughness: 1 }));
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Cielo nocturno
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(80, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x080818, side: THREE.BackSide, fog: false })
  );
  scene.add(sky);

  // Estrellas
  for (let i = 0; i < 200; i++){
    const star = new THREE.Mesh(
      new THREE.CircleGeometry(0.05 + Math.random()*0.1, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 + Math.random()*0.6, fog: false })
    );
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.4;
    const r = 70;
    star.position.set(
      Math.cos(theta) * Math.sin(phi + Math.PI/3) * r,
      Math.cos(phi) * r,
      Math.sin(theta) * Math.sin(phi + Math.PI/3) * r
    );
    star.lookAt(0, 0, 0);
    scene.add(star);
  }

  // Luna
  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.5, 32), new THREE.MeshBasicMaterial({ color: 0xf0e8d8, fog: false }));
  moon.position.set(-25, 30, -40);
  moon.lookAt(0, 1, 0);
  scene.add(moon);

  // Árboles alrededor
  [[-9,-9,1.4], [8,-10,1.2], [-10,7,1.1], [9,8,1.3], [0,-11,1.1], [-5, 10, 1.2], [11, -3, 1.1], [-11, 1, 1.2]].forEach(([x,z,s]) => {
    buildTree(scene, x, z, s);
  });

  // Banco
  buildBench(scene, 3, -3, -Math.PI/6);

  // Farolas
  buildLampPost(scene, -6, -2);
  buildLampPost(scene, 6, 4);
  buildLampPost(scene, -3, -8);
  buildLampPost(scene, 8, -6);

  // Luz ambiental
  const ambient = new THREE.AmbientLight(0x404060, 0.35);
  scene.add(ambient);
  const moonLight = new THREE.DirectionalLight(0x8090ff, 0.4);
  moonLight.position.set(-20, 25, -30);
  scene.add(moonLight);

  // Partículas de niebla / luciérnagas
  const fireflyGeo = new THREE.BufferGeometry();
  const fireflyCount = 150;
  const positions = new Float32Array(fireflyCount * 3);
  for (let i = 0; i < fireflyCount * 3; i += 3){
    positions[i] = (Math.random()-0.5) * SIZE * 0.9;
    positions[i+1] = 0.2 + Math.random() * 3;
    positions[i+2] = (Math.random()-0.5) * SIZE * 0.9;
  }
  fireflyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const fireflyMat = new THREE.PointsMaterial({
    color: 0xaaff66, size: 0.08, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const fireflies = new THREE.Points(fireflyGeo, fireflyMat);
  scene.add(fireflies);
  World.dust = fireflies;

  return { corpsePos: { x: 0, z: 0, rot: Math.PI * 0.1 }, pose: 'curled', spawn: { x: 3, z: 5 } };
}

function roomTeatro(scene){
  const SIZE = 14, H = 5;
  World.roomHalf = SIZE/2;
  World.roomHeight = H;
  World.bounds = { minX: -SIZE/2 + 0.6, maxX: SIZE/2 - 0.6, minZ: -SIZE/2 + 0.6, maxZ: SIZE/2 - 0.6 };
  const half = SIZE/2;

  // Suelo de tablas
  const wt = texParquet();
  wt.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: wt, roughness: 0.75 }));
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Techo alto
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ color: 0x0a0510, roughness: 1 }));
  ceil.rotation.x = Math.PI/2;
  ceil.position.y = H;
  scene.add(ceil);

  // Cortinas de fondo (pared trasera)
  buildCurtain(scene, 0, H/2, -half + 0.1, 0, SIZE, H);

  // Cortinas laterales
  buildCurtain(scene, -half + 0.1, H/2, 0, Math.PI/2, SIZE, H);
  buildCurtain(scene, half - 0.1, H/2, 0, -Math.PI/2, SIZE, H);

  // Cortinas frontales (entrada al escenario)
  buildCurtain(scene, -half + 2.5, H/2, half - 0.1, 0, 3, H);
  buildCurtain(scene, half - 2.5, H/2, half - 0.1, 0, 3, H);

  // Focos sobre el escenario
  const spot1 = new THREE.PointLight(0xffaa66, 2.5, 10, 1.5);
  spot1.position.set(-3, H - 1, 0);
  spot1.castShadow = true;
  spot1.shadow.mapSize.set(1024, 1024);
  scene.add(spot1);
  const spot2 = new THREE.PointLight(0xffaa66, 2.5, 10, 1.5);
  spot2.position.set(3, H - 1, 0);
  spot2.castShadow = true;
  spot2.shadow.mapSize.set(1024, 1024);
  scene.add(spot2);
  const spot3 = new THREE.PointLight(0xffaa66, 1.8, 8, 1.5);
  spot3.position.set(0, H - 1, 2);
  scene.add(spot3);

  // Foco cenital
  buildCeilingLamp(scene, 0, 0, 2.0);

  // Mesa de utilería
  buildDesk(scene, 2.5, -2.0, Math.PI * 0.15);
  buildChair(scene, 2.5, -0.8, Math.PI);
  buildTableLamp(scene, 1.9, 0.79, -2.0);

  // Cajas de utilería
  buildCrate(scene, -3.5, -3.0, 0.3);
  buildCrate(scene, -3.3, -2.2, -0.2);
  buildCrate(scene, 3.5, 3.5, 0.6);
  buildCrate(scene, 3.5, 3.5, 0.6); // apilar

  // Planta decorativa
  buildPlant(scene, -half + 1.2, half - 1.2);

  // Pequeño archivador
  buildCabinet(scene, half - 1.5, -3.5, -Math.PI/2);

  // Luz ambiental tenue
  const ambient = new THREE.AmbientLight(0x303040, 0.4);
  scene.add(ambient);

  // Partículas de polvo en el foco
  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 400;
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount * 3; i += 3){
    positions[i] = (Math.random()-0.5) * SIZE * 0.8;
    positions[i+1] = Math.random() * H * 0.9;
    positions[i+2] = (Math.random()-0.5) * SIZE * 0.8;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffd682, size: 0.03, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);
  World.dust = dust;

  return { corpsePos: { x: 0.5, z: 1.5, rot: Math.PI * -0.15 }, pose: 'supine', spawn: { x: 0, z: 4.5 } };
}

const ROOM_BUILDERS = {
  despacho: roomDespacho,
  dormitorio: roomDormitorio,
  biblioteca: roomBiblioteca,
  exterior: roomExterior,
  teatro: roomTeatro
};

/* ====================================================================
   SALA DE INTERROGATORIO
   ==================================================================== */
function buildInterrogationRoom(scene, suspect){
  const SIZE = 8, H = 3;
  World.roomHalf = SIZE/2; World.roomHeight = H;
  World.bounds = { minX: -SIZE/2 + 0.45, maxX: SIZE/2 - 0.45, minZ: -SIZE/2 + 0.45, maxZ: SIZE/2 - 0.45 };
  const half = SIZE/2;

  // Suelo de cemento
  const floorTex = texStone();
  floorTex.repeat.set(2, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ map: floorTex, roughness: 0.9, color: 0x707078 }));
  floor.rotation.x = -Math.PI/2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Techo
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ color: 0x2a2a30, roughness: 1 }));
  ceil.rotation.x = Math.PI/2;
  ceil.position.y = H;
  scene.add(ceil);

  // Paredes
  const wallTex = texStone();
  wallTex.repeat.set(2, 1.5);
  const wallMat = M({ map: wallTex, roughness: 0.9, color: 0x808088 });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  [
    { pos: [0, H/2, -half], rot: 0 },
    { pos: [0, H/2, half], rot: Math.PI },
    { pos: [-half, H/2, 0], rot: Math.PI/2 },
    { pos: [half, H/2, 0], rot: -Math.PI/2 }
  ].forEach(w => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(...w.pos); m.rotation.y = w.rot;
    m.receiveShadow = true;
    scene.add(m);
  });

  // Espejo unidireccional
  const mirror = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.5),
    M({ color: 0x1a2a3a, metalness: 0.95, roughness: 0.05, emissive: 0x0a1a2a, emissiveIntensity: 0.4 })
  );
  mirror.position.set(0, 1.8, -half + 0.03);
  scene.add(mirror);
  // Marco
  const frameMat = M({ color: 0x3a3a42, metalness: 0.7, roughness: 0.5 });
  const mfw = 2.6, mfh = 1.7;
  box(scene, mfw, 0.08, 0.1, frameMat, 0, 1.8 + mfh/2, -half + 0.05);
  box(scene, mfw, 0.08, 0.1, frameMat, 0, 1.8 - mfh/2, -half + 0.05);
  box(scene, 0.08, mfh, 0.1, frameMat, -mfw/2, 1.8, -half + 0.05);
  box(scene, 0.08, mfh, 0.1, frameMat, mfw/2, 1.8, -half + 0.05);

  // Mesa metálica central
  const metal = M({ color: 0x606068, metalness: 0.75, roughness: 0.4 });
  const metalDark = M({ color: 0x3a3a42, metalness: 0.7, roughness: 0.5 });
  const top = box(scene, 1.5, 0.06, 0.9, metal, 0, 0.75, 0);
  // Borde reforzado
  box(scene, 1.52, 0.03, 0.92, metalDark, 0, 0.72, 0);
  // Patas
  [[-0.65,-0.35],[0.65,-0.35],[-0.65,0.35],[0.65,0.35]].forEach(([px, pz]) => {
    cyl(scene, 0.03, 0.03, 0.72, metal, px, 0.36, pz, 12);
  });
  // Travesaños
  box(scene, 1.3, 0.04, 0.04, metal, 0, 0.1, -0.35);
  box(scene, 1.3, 0.04, 0.04, metal, 0, 0.1, 0.35);
  // Anilla para esposas
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 10, 20), metal);
  ring.rotation.x = Math.PI/2;
  ring.position.set(0, 0.79, 0.28);
  scene.add(ring);

  // 2 sillas metálicas
  [1, -1].forEach(side => {
    const chairG = new THREE.Group();
    box(chairG, 0.44, 0.05, 0.44, metal, 0, 0.46, 0);
    box(chairG, 0.44, 0.5, 0.05, metal, 0, 0.72, -0.2);
    box(chairG, 0.05, 0.42, 0.05, metal, -0.19, 0.24, 0.19);
    box(chairG, 0.05, 0.42, 0.05, metal, 0.19, 0.24, 0.19);
    box(chairG, 0.05, 0.42, 0.05, metal, -0.19, 0.24, -0.19);
    box(chairG, 0.05, 0.42, 0.05, metal, 0.19, 0.24, -0.19);
    box(chairG, 0.4, 0.03, 0.03, metal, 0, 0.15, -0.19);
    box(chairG, 0.4, 0.03, 0.03, metal, 0, 0.15, 0.19);
    chairG.position.set(0, 0, side * 0.95);
    scene.add(chairG);
    addObstacle(0, side * 0.95, 0.5, 0.5, 0);
  });

  // Lámpara colgante sobre la mesa
  const lampG = new THREE.Group();
  cyl(lampG, 0.02, 0.02, 0.6, metalDark, 0, 2.2, 0, 8);
  // Pantalla cónica
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.28, 24, 1, true), M({ color: 0x1a1a1e, roughness: 0.6, side: THREE.DoubleSide }));
  shade.rotation.x = Math.PI;
  shade.position.y = 1.75;
  lampG.add(shade);
  // Bulbo
  sph(lampG, 0.09, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xfff0c0, emissiveIntensity: 3 }), 0, 1.72, 0);
  // Foco potente
  const spot = new THREE.SpotLight(0xfff0c0, 3, 8, Math.PI/3.5, 0.6, 1.5);
  spot.position.set(0, 1.7, 0);
  spot.target.position.set(0, 0.75, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  lampG.add(spot);
  lampG.add(spot.target);
  scene.add(lampG);

  // Luz ambiental fría
  const ambient = new THREE.PointLight(0x8090b0, 0.5, 12, 1.5);
  ambient.position.set(0, 2.5, 0);
  scene.add(ambient);
  scene.add(new THREE.AmbientLight(0x303040, 0.4));

  // Sospechoso sentado al otro lado de la mesa
  const suspectG = buildSuspectModel(suspect);
  suspectG.position.set(0, 0, -0.85);
  scene.add(suspectG);

  // Carpeta sobre la mesa
  const folder = box(scene, 0.3, 0.02, 0.4, M({ color: 0x8a6838, roughness: 0.8 }), -0.4, 0.79, 0.1);
  // Lápiz
  cyl(scene, 0.005, 0.005, 0.14, M({ color: 0xf0e8d0, roughness: 0.7 }), 0.4, 0.79, -0.15, 8).rotation.z = Math.PI/2;

  return { spawn: { x: 0, z: 2.6 } };
}

function buildSuspectModel(suspect){
  const g = new THREE.Group();

  // Determinar colores según icono
  const isFemale = ['👩‍💻','👩','🧹','👩‍🍳','👩‍💼','💍','🌹','🎤','🎶','💔','🌷','💕','🎭','🎨','💎','🤸','🔮'].includes(suspect.icon);
  const skinTones = [0xd8a888, 0xc89878, 0xe8b898, 0xa87858, 0xb88868];
  const skin = M({ color: skinTones[Math.floor(Math.random()*skinTones.length)], roughness: 0.85 });
  const hairColor = isFemale ? [0x3a2010, 0x6a3a1a, 0x2a1a10, 0x8a4a2a][Math.floor(Math.random()*4)] : [0x1a1a1e, 0x3a2a1a, 0x5a5a5a][Math.floor(Math.random()*3)];
  const shirtColors = [0x2a3a5a, 0x5a2a3a, 0x3a5a2a, 0x5a4a2a, 0x4a4a4a, 0x6a2a2a, 0x2a4a5a];
  const shirt = M({ color: shirtColors[Math.floor(Math.random()*shirtColors.length)], roughness: 0.9 });
  const pants = M({ color: [0x1a1a1e, 0x2a2a30, 0x3a2010][Math.floor(Math.random()*3)], roughness: 0.9 });

  // Cabeza
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 16), skin);
  head.position.y = 1.32;
  head.scale.set(0.95, 1.1, 1);
  head.castShadow = true;
  g.add(head);

  // Pelo (casquete superior)
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 24, 16, 0, Math.PI*2, 0, Math.PI * (isFemale ? 0.7 : 0.5)),
    M({ color: hairColor, roughness: 0.95 })
  );
  hair.position.y = 1.34;
  hair.scale.set(0.98, 1.1, 1);
  g.add(hair);
  if (isFemale){
    // Melena larga
    const backHair = box(g, 0.24, 0.3, 0.08, M({ color: hairColor, roughness: 0.95 }), 0, 1.15, -0.13);
  }

  // Cuello
  box(g, 0.1, 0.08, 0.1, skin, 0, 1.19, 0);

  // Torso (camisa)
  box(g, 0.36, 0.42, 0.22, shirt, 0, 0.98, 0);

  // Cuello de camisa
  box(g, 0.14, 0.06, 0.04, M({ color: 0xf0e8d0, roughness: 0.8 }), 0, 1.16, 0.1);

  // Brazos apoyados sobre la mesa
  function buildArm(side){
    const grp = new THREE.Group();
    // Brazo superior
    box(grp, 0.09, 0.09, 0.32, shirt, 0, 0, -0.16);
    // Antebrazo
    box(grp, 0.08, 0.08, 0.28, skin, 0, 0, -0.44);
    // Mano
    box(grp, 0.07, 0.05, 0.1, skin, 0, -0.015, -0.62);
    grp.position.set(side * 0.24, 0.95, 0.15);
    grp.rotation.x = -1.1;
    grp.rotation.z = side * 0.15;
    return grp;
  }
  g.add(buildArm(-1));
  g.add(buildArm(1));

  // Piernas bajo la mesa
  box(g, 0.11, 0.42, 0.15, pants, -0.1, 0.55, 0.18);
  box(g, 0.11, 0.42, 0.15, pants, 0.1, 0.55, 0.18);
  // Muslos horizontales (sentado)
  box(g, 0.11, 0.14, 0.42, pants, -0.1, 0.73, 0.1);
  box(g, 0.11, 0.14, 0.42, pants, 0.1, 0.73, 0.1);

  return g;
}

/* ====================================================================
   HOTSPOT MARKER
   ==================================================================== */
function makeHotspotMarker(obj, examined){
  const g = new THREE.Group();
  const color = examined ? 0x4ade80 : 0xd4a017;
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.8,
    metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.95
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), mat);
  g.add(sphere);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.014, 10, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
  ring.rotation.x = Math.PI/2;
  g.add(ring);

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
  sprite.scale.set(1.2, 0.3, 1);
  sprite.position.y = 0.28;
  g.add(sprite);

  g.userData.objId = obj.id;
  g.userData.objData = obj;
  return g;
}

/* ====================================================================
   INIT MUNDO
   ==================================================================== */
function initWorld(c, g, mode){
  disposeWorld();
  World.caseData = c;
  World.obstacles = [];
  World.interactables = [];
  Player.keys = {};
  Player.vel.set(0, 0, 0);
  Player.bobPhase = 0;
  World.mode = mode || 'crime';
  World.dust = null;

  const host = document.getElementById('three-host');
  if (!host) return;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
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

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05050a, 0.035);
  World.scene = scene;

  const camera = new THREE.PerspectiveCamera(75, (host.clientWidth || 800) / (host.clientHeight || 600), 0.05, 200);
  camera.rotation.order = 'YXZ';
  World.camera = camera;

  if (World.mode === 'interrogation'){
    const room = buildInterrogationRoom(scene, World.currentSuspect);
    const sp = room.spawn;
    Player.pos.set(sp.x, Player.height, sp.z);
    Player.yaw = Math.atan2(-(0 - sp.x), -(-0.85 - sp.z));
    Player.pitch = -0.1;
  } else {
    const roomType = c.sceneType || 'despacho';
    const builder = ROOM_BUILDERS[roomType] || roomDespacho;
    const room = builder(scene);
    const pose = c.corpsePose || room.pose;
    buildCorpse(scene, pose, room.corpsePos.x, room.corpsePos.z, room.corpsePos.rot);
    const sp = room.spawn || { x: 0, z: 3 };
    Player.pos.set(sp.x, Player.height, sp.z);
    Player.yaw = Math.atan2(-(room.corpsePos.x - sp.x), -(room.corpsePos.z - sp.z));
    Player.pitch = -0.15;

    // Colocar objetos 3D
    const positions = objectPositionsFor(roomType);
    c.objects.forEach((obj, i) => {
      const pos = positions[i % positions.length];
      const modelFactory = getObjectModel(obj);
      const modelGroup = modelFactory();
      modelGroup.position.set(pos.x, pos.y, pos.z);
      modelGroup.rotation.y = Math.random() * Math.PI * 2;
      scene.add(modelGroup);

      // Hotspot marker
      const marker = makeHotspotMarker(obj, g.examined.includes(obj.id));
      marker.position.set(pos.x, pos.y + 0.3, pos.z);
      scene.add(marker);
      World.interactables.push({
        mesh: marker,
        type: 'object',
        objId: obj.id,
        data: obj,
        baseY: pos.y + 0.3,
        phase: Math.random() * Math.PI * 2
      });
    });
  }

  World.raycaster = new THREE.Raycaster();
  World.crosshairEl = document.querySelector('.crosshair');
  World.nearHintEl = document.querySelector('.near-hint');

  setupControls();

  // Intro de cámara
  const startY = Player.height + 1.8;
  const endY = Player.height;
  const tStart = performance.now();
  const dur = 1400;
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

  const onClick = () => {
    if (!Player.pointerLocked){
      canvas.requestPointerLock();
      return;
    }
    World.raycaster.setFromCamera({ x: 0, y: 0 }, World.camera);
    const meshes = World.interactables.map(it => it.mesh);
    const hits = World.raycaster.intersectObjects(meshes, true);
    if (hits.length > 0 && hits[0].distance < 4.5){
      let o = hits[0].object;
      while (o && !World.interactables.find(it => it.mesh === o) && o.parent) o = o.parent;
      const it = World.interactables.find(it => it.mesh === o);
      if (it && World.onInteract) World.onInteract(it);
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
    overlay.addEventListener('click', e => { e.stopPropagation(); canvas.requestPointerLock(); });
  }
  World.boundEvents = { onKeyDown, onKeyUp, onMouseMove, onPointerLockChange, onClick, onResize };
}

/* ====================================================================
   ANIMACIÓN
   ==================================================================== */
function animateWorld(){
  World.animId = requestAnimationFrame(animateWorld);
  const now = performance.now();
  const dt = Math.min(0.05, (now - World.lastTime) / 1000);
  World.lastTime = now;
  if (!World.camera || !World.scene || !World.renderer) return;

  const cam = World.camera;
  const running = Player.keys['ShiftLeft'] || Player.keys['ShiftRight'];
  const speed = running ? Player.runSpeed : Player.walkSpeed;
  const fwdX = -Math.sin(Player.yaw), fwdZ = -Math.cos(Player.yaw);
  const rightX = Math.cos(Player.yaw), rightZ = -Math.sin(Player.yaw);

  let wishX = 0, wishZ = 0;
  if (Player.keys['KeyW'] || Player.keys['ArrowUp']){ wishX += fwdX; wishZ += fwdZ; }
  if (Player.keys['KeyS'] || Player.keys['ArrowDown']){ wishX -= fwdX; wishZ -= fwdZ; }
  if (Player.keys['KeyA'] || Player.keys['ArrowLeft']){ wishX -= rightX; wishZ -= rightZ; }
  if (Player.keys['KeyD'] || Player.keys['ArrowRight']){ wishX += rightX; wishZ += rightZ; }
  const len = Math.hypot(wishX, wishZ);
  if (len > 0){ wishX = wishX/len*speed; wishZ = wishZ/len*speed; }

  const k = Math.min(1, dt * 14);
  Player.vel.x += (wishX - Player.vel.x) * k;
  Player.vel.z += (wishZ - Player.vel.z) * k;

  const r = Player.radius;
  let nx = Player.pos.x + Player.vel.x * dt;
  let nz = Player.pos.z + Player.vel.z * dt;

  const b = World.bounds;
  if (nx - r < b.minX){ nx = b.minX + r; Player.vel.x = 0; }
  if (nx + r > b.maxX){ nx = b.maxX - r; Player.vel.x = 0; }
  if (nz - r < b.minZ){ nz = b.minZ + r; Player.vel.z = 0; }
  if (nz + r > b.maxZ){ nz = b.maxZ - r; Player.vel.z = 0; }

  for (const o of World.obstacles){
    const ix = nx + r > o.minX && nx - r < o.maxX;
    const iz = nz + r > o.minZ && nz - r < o.maxZ;
    if (ix && iz){
      const prevX = Player.pos.x, prevZ = Player.pos.z;
      const prevInX = prevX + r > o.minX && prevX - r < o.maxX;
      const prevInZ = prevZ + r > o.minZ && prevZ - r < o.maxZ;
      if (!prevInX){ nx = prevX; Player.vel.x = 0; }
      else if (!prevInZ){ nz = prevZ; Player.vel.z = 0; }
      else { nx = prevX; nz = prevZ; Player.vel.x = 0; Player.vel.z = 0; }
    }
  }
  Player.pos.x = nx;
  Player.pos.z = nz;

  const moving = Math.hypot(Player.vel.x, Player.vel.z) > 0.3;
  Player.bobPhase += dt * (moving ? (running ? 12 : 8.5) : 2.5);
  const targetAmp = moving ? (running ? 0.055 : 0.032) : 0.005;
  Player.bobAmp += (targetAmp - Player.bobAmp) * Math.min(1, dt * 6);
  Player.pos.y = Player.height + Math.sin(Player.bobPhase) * Player.bobAmp;

  cam.position.copy(Player.pos);
  cam.rotation.y = Player.yaw;
  cam.rotation.x = Player.pitch;
  const targetRoll = (Player.keys['KeyD'] || Player.keys['ArrowRight']) ? -0.02 :
                     (Player.keys['KeyA'] || Player.keys['ArrowLeft']) ? 0.02 : 0;
  cam.rotation.z += (targetRoll - cam.rotation.z) * Math.min(1, dt * 8);

  // Actualizar interactuables
  World.interactables.forEach(it => {
    if (it.type === 'drawer'){
      const state = it.mesh.userData.drawerState;
      const maxZ = it.mesh.userData.drawerMaxZ || 0.4;
      const targetZ = state * maxZ;
      it.mesh.position.z += (targetZ - it.mesh.position.z) * Math.min(1, dt * 8);
    } else if (it.type === 'cabinetDoor'){
      const state = it.mesh.userData.doorState;
      const hinge = it.mesh.userData.doorHinge || 1;
      const targetRot = state * (Math.PI/2.2) * hinge;
      it.mesh.rotation.y += (targetRot - it.mesh.rotation.y) * Math.min(1, dt * 7);
    } else if (it.type === 'object' && it.baseY !== undefined){
      const t = now * 0.001;
      it.mesh.position.y = it.baseY + Math.sin(t * 2 + it.phase) * 0.06;
      it.mesh.rotation.y = t * 0.6;
    }
  });

  // Animar partículas
  if (World.dust){
    World.dust.rotation.y += dt * 0.02;
    const positions = World.dust.geometry.attributes.position;
    const arr = positions.array;
    for (let i = 0; i < arr.length; i += 3){
      arr[i+1] += Math.sin(now * 0.0005 + i) * 0.001;
    }
    positions.needsUpdate = true;
  }

  // Crosshair detection
  World.raycaster.setFromCamera({ x: 0, y: 0 }, World.camera);
  const meshes = World.interactables.map(it => it.mesh);
  const hits = World.raycaster.intersectObjects(meshes, true);
  if (World.crosshairEl){
    if (hits.length > 0 && hits[0].distance < 4.5){
      World.crosshairEl.classList.add('hot');
      if (World.nearHintEl){
        let o = hits[0].object;
        while (o && !World.interactables.find(it => it.mesh === o) && o.parent) o = o.parent;
        const it = World.interactables.find(it => it.mesh === o);
        if (it){
          if (it.type === 'object') World.nearHintEl.textContent = 'CLIC · ' + it.data.name;
          else if (it.type === 'drawer') World.nearHintEl.textContent = 'CLIC · ABRIR CAJÓN';
          else if (it.type === 'cabinetDoor') World.nearHintEl.textContent = 'CLIC · ABRIR PUERTA';
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
  World.interactables = []; World.obstacles = []; World.boundEvents = {}; World.dust = null;
}

/* ====================================================================
   RANGOS
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
  playerId:'', playerName:'', playerRole:'auto',
  isHost:false, peer:null, conn:null,
  game:null, localView:{type:'scene'},
  status:null, statusErr:false, rankUpTo:null
};

const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function genCode(){ const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=c[Math.floor(Math.random()*c.length)]; return s; }
function getPid(){ let v = localStorage.getItem('ec_pid'); if (!v){ v = 'p_' + Math.random().toString(36).slice(2,10); localStorage.setItem('ec_pid', v); } return v; }

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
        <div class="login-hint">Tu progreso se guarda en este dispositivo. Cada nombre crea un perfil distinto.</div>
      </div>
    </div>`;
  const inp = document.getElementById('inp-login');
  inp.focus();
  const doLogin = (name) => {
    name = (name || '').trim();
    if (!name){ alert('Escribe un nombre'); return; }
    Auth.login(name);
    state.playerName = name;
    state.playerId = getPid();
    state.view = 'menu';
    render();
  };
  document.getElementById('btn-login').onclick = () => doLogin(inp.value);
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(inp.value); });
  document.querySelectorAll('.login-user').forEach(el => { el.onclick = () => doLogin(el.dataset.name); });
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
            <div class="rank-progress-text">${next ? `${solvedTotal} / ${next.minSolved} → ${esc(next.name)} ${next.icon}` : 'RANGO MÁXIMO'}</div>
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
              <div class="num"><span>${c.num}</span><span class="diff" data-diff="${c.difficulty}">${c.difficulty}</span></div>
              <h3>${esc(c.title)}</h3>
              <div class="meta"><b>📍</b> ${esc(c.location)}<br><b>🕐</b> ${esc(c.time)}<br><b>☠️</b> ${esc(c.victim)}</div>
              <div class="btn-play">${solved?'REJUGAR':'ABRIR EXPEDIENTE'}</div>
            </div>`;
        }).join('')}
      </div>
    </div>`;

  $('#btn-logout').onclick = () => {
    if (!confirm('¿Cambiar de agente? Tu progreso queda guardado.')) return;
    Auth.logout(); state.view = 'menu'; render();
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
    'FÁCIL': ['Agentes, un caso sencillo para empezar. Confío en que lo cerréis rápido.','Nuevo caso. Nada complejo, pero no bajéis la guardia.'],
    'MEDIA': ['Este caso es más delicado. Hay varios sospechosos con motivos. No quiero errores.','Es más complejo de lo que parece. Escuchad, examinad, no os fiéis de nadie.'],
    'DIFÍCIL': ['Caso de máxima prioridad. El asesino es meticuloso. Si falláis, lo pagaréis caro.','Este es de los que aparecen en los periódicos. Necesito una resolución limpia.']
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
        <div class="actions"><button class="btn-primary" id="btn-create">➕ CREAR LOBBY</button></div>
        <div class="field" style="margin-top:22px;">
          <label>O únete con un código</label>
          <input id="inp-room" type="text" placeholder="AB12" maxlength="4"
                 style="text-transform:uppercase;letter-spacing:10px;font-family:'Special Elite',monospace;font-size:24px;text-align:center;">
        </div>
        <div class="actions"><button class="btn-secondary" id="btn-join">🔗 UNIRSE</button></div>
        <div class="hint">
          💡 <b>Sin servidor:</b> los dos navegadores se conectan directamente entre sí.
          <br>🕹️ <b>Controles:</b> <b>WASD</b> mover · <b>Ratón</b> mirar · <b>Shift</b> correr · <b>Clic</b> interactuar · <b>ESC</b> liberar cursor.
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
    players:{ [state.playerId]:{ name:state.playerName, role:state.playerRole, connected:true } },
    examined:[], asked:[], evidence:[], result:null
  };
}
function startHost(){
  const code = genCode();
  state.roomId = code; state.isHost = true;
  state.game = newGameState(state.caseId);
  const peerId = 'ecrim-' + code.toLowerCase();
  setStatus('Iniciando servidor P2P...');
  const peer = new Peer(peerId, { debug:1 });
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
  });
  peer.on('error', err => {
    if (err.type === 'unavailable-id'){ setStatus('Reintentando...', true); setTimeout(startHost, 500); }
    else setStatus('Error: ' + err.type, true);
  });
}
function startGuest(code){
  state.roomId = code; state.isHost = false;
  const peerId = 'ecrim-' + code.toLowerCase();
  setStatus('Conectando al lobby ' + code + '...');
  const peer = new Peer({ debug:1 });
  state.peer = peer;
  peer.on('open', () => {
    const conn = peer.connect(peerId, { reliable:true });
    state.conn = conn;
    const timeout = setTimeout(() => { if (!state.game) setStatus('No se pudo conectar.', true); }, 12000);
    conn.on('open', () => {
      clearTimeout(timeout);
      setStatus('Conectado. Esperando estado...');
      conn.send({ type:'hello', name:state.playerName, role:state.playerRole });
    });
    conn.on('data', data => {
      if (data.type === 'state'){ state.game = data.state; state.status = null; state.view = 'game'; render(); }
    });
    conn.on('close', () => setStatus('Desconectado del host.', true));
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
        const q = s.questions[parseInt(idx,10)];
        if (q && q.clue && !state.game.evidence.includes(q.clue)) state.game.evidence.push(q.clue);
      }
      break;
    }
    case 'accuse': {
      if (state.game.result) return;
      const beforeRank = getCurrentRank(Auth.countSolved());
      const correct = action.target === c.killer;
      state.game.result = { win:correct, killer:c.killer, accused:action.target, byPlayer };
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
      <div class="modal-actions"><button class="btn-ok" id="m-ok">ENTRAR →</button></div>
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
    app.innerHTML = `<div class="lobby"><div class="status">${state.status||'Conectando...'} ⏳</div></div>`;
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
              <span class="dot"></span> ${pid === state.playerId ? myRank.icon + ' ' : ''}${esc(p.name)} · ${esc(p.role)}
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
              <div class="lock-title" id="lock-title">CLIC PARA JUGAR</div>
              <div class="lock-keys" id="lock-keys">
                <span><b>W</b> <b>A</b> <b>S</b> <b>D</b> · moverte</span>
                <span><b>RATÓN</b> · mirar</span>
                <span><b>SHIFT</b> · correr</span>
                <span><b>CLIC</b> · examinar / abrir cajones</span>
                <span><b>ESC</b> · liberar el ratón</span>
              </div>
            </div>
          </div>
          <div class="crosshair">+</div>
          <div class="near-hint"></div>
          <div class="hud"><b>WASD</b> mover · <b>CLIC</b> interactuar · <b>SHIFT</b> correr</div>
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
      const sid = el.dataset.suspect;
      state.localView = { type:'suspect', id: sid };
      switchToInterrogation(c, sid);
      document.querySelectorAll('.suspect').forEach(x => x.classList.toggle('active', x === el));
    };
  });
  if (canAccuse) $('#btn-accuse').onclick = openAccusation;

  World.onInteract = (it) => {
    if (it.type === 'drawer'){
      it.mesh.userData.drawerState = it.mesh.userData.drawerState ? 0 : 1;
    } else if (it.type === 'cabinetDoor'){
      it.mesh.userData.doorState = it.mesh.userData.doorState ? 0 : 1;
    } else if (it.type === 'object'){
      if (!g.examined.includes(it.objId)) sendAction({ type:'examine', id: it.objId });
      state.localView = { type:'object', id: it.objId };
      renderSidePanel(c);
      if (document.pointerLockElement) try { document.exitPointerLock(); } catch(e){}
    }
  };

  setTimeout(() => initWorld(c, g, 'crime'), 60);
  renderSidePanel(c);

  if (g.result && state.view !== 'result'){
    setTimeout(() => { state.view = 'result'; render(); }, 350);
  }
}

function switchToInterrogation(c, suspectId){
  disposeWorld();
  const suspect = c.suspects.find(s => s.id === suspectId);
  if (!suspect) return;
  World.currentSuspect = suspect;

  const stage = document.querySelector('.stage');
  // Overlay banner
  const banner = document.createElement('div');
  banner.className = 'mode-banner';
  banner.textContent = 'SALA DE INTERROGATORIO';
  banner.style.cssText = 'position:absolute;top:12px;left:50%;transform:translateX(-50%);font-family:"Special Elite",monospace;font-size:11px;letter-spacing:4px;color:var(--red);padding:6px 18px;background:rgba(0,0,0,.85);border:1px solid var(--red);border-radius:14px;z-index:15;pointer-events:none;text-shadow:0 0 10px rgba(231,76,60,.6);';
  stage.appendChild(banner);

  const lockTitle = document.getElementById('lock-title');
  if (lockTitle) lockTitle.textContent = 'CLIC PARA ENTRAR AL INTERROGATORIO';

  // Botón volver
  const backBtn = document.createElement('button');
  backBtn.textContent = '← VOLVER A LA ESCENA';
  backBtn.style.cssText = 'position:absolute;top:14px;right:14px;z-index:40;background:rgba(0,0,0,.85);border:1px solid var(--border-gold);color:var(--gold);padding:8px 14px;border-radius:8px;font-family:"Special Elite",monospace;letter-spacing:2px;font-size:11px;cursor:pointer;';
  backBtn.onclick = () => {
    banner.remove(); backBtn.remove();
    World.currentSuspect = null;
    state.localView = { type:'scene' };
    disposeWorld();
    setTimeout(() => {
      initWorld(c, state.game, 'crime');
      const lt = document.getElementById('lock-title');
      if (lt) lt.textContent = 'CLIC PARA JUGAR';
      renderSidePanel(c);
      document.querySelectorAll('.suspect').forEach(x => x.classList.remove('active'));
    }, 60);
  };
  stage.appendChild(backBtn);

  setTimeout(() => {
    initWorld(c, state.game, 'interrogation');
    renderSidePanel(c);
  }, 60);
}

function renderSidePanel(c){
  const g = state.game;
  const panel = document.getElementById('side-panel');
  if (!panel) return;
  const view = state.localView;

  if (view.type === 'suspect'){
    const s = c.suspects.find(x => x.id === view.id);
    if (!s){ panel.classList.remove('show'); panel.innerHTML = ''; return; }
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
    if (!o){ panel.classList.remove('show'); panel.innerHTML = ''; return; }
    panel.classList.add('show');
    panel.innerHTML = `
      <div class="side-panel-inner">
        <div class="side-panel-header">
          <div>
            <div class="side-label">ANÁLISIS FORENSE</div>
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
      <p>${win ? esc(c.solution) : `La acusación contra ${esc(accused.name)} no se sostiene. El verdadero asesino era <b style="color:var(--red)">${esc(killer.name)}</b>.`}</p>
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
    state.view = 'game'; state.localView = {type:'scene'};
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
playCinematic().then(() => { render(); animateParallax(); });