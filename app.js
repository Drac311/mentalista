/* ====================================================================
   AUTH (con contraseña + hash con salt)
   ==================================================================== */
const Auth = {
  get current(){ return localStorage.getItem('ec_current') || null; },
  set current(v){ v ? localStorage.setItem('ec_current', v) : localStorage.removeItem('ec_current'); },
  get users(){ try { return JSON.parse(localStorage.getItem('ec_users') || '{}'); } catch(e){ return {}; } },
  saveUsers(u){ localStorage.setItem('ec_users', JSON.stringify(u)); },
  list(){ return Object.keys(this.users); },

  hash(pwd, salt){
    let h1 = 0xdeadbeef >>> 0, h2 = 0x41c6ce57 >>> 0;
    const s = salt + '::' + pwd + '::' + salt;
    for (let i = 0; i < s.length; i++){
      const c = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761) >>> 0;
      h2 = Math.imul(h2 ^ c, 1597334677) >>> 0;
    }
    h1 = (Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)) >>> 0;
    h2 = (Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)) >>> 0;
    return h1.toString(36) + h2.toString(36);
  },
  makeSalt(){
    return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  },
  exists(name){ return !!this.users[name]; },

  register(name, pwd){
    name = (name || '').trim();
    if (!name) return { ok:false, msg:'Escribe un nombre' };
    if (name.length < 3) return { ok:false, msg:'Mínimo 3 caracteres en el nombre' };
    if (name.length > 20) return { ok:false, msg:'Máximo 20 caracteres' };
    if (!/^[\wáéíóúñÁÉÍÓÚÑüÜ\s.'-]+$/i.test(name)) return { ok:false, msg:'Nombre con caracteres no válidos' };
    if (this.exists(name)) return { ok:false, msg:'Ya existe un agente con ese nombre' };
    if (!pwd || pwd.length < 4) return { ok:false, msg:'La contraseña debe tener al menos 4 caracteres' };
    const salt = this.makeSalt();
    const users = this.users;
    users[name] = { name, salt, pwdHash: this.hash(pwd, salt), created: Date.now(), solved: [] };
    this.saveUsers(users);
    this.current = name;
    return { ok:true };
  },

  login(name, pwd){
    name = (name || '').trim();
    if (!name) return { ok:false, msg:'Escribe un nombre' };
    const u = this.users[name];
    if (!u) return { ok:false, msg:'No existe ningún agente con ese nombre' };
    if (!pwd) return { ok:false, msg:'Escribe tu contraseña' };
    if (this.hash(pwd, u.salt) !== u.pwdHash) return { ok:false, msg:'Contraseña incorrecta' };
    this.current = name;
    return { ok:true };
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
   MOTOR 3D — World / Player
   ==================================================================== */
const World = {
  renderer:null, scene:null, camera:null, canvas:null,
  bounds:{ minX:-5, maxX:5, minZ:-5, maxZ:5 },
  obstacles:[], interactables:[], dust:null,
  roomHalf:5, roomHeight:3,
  raycaster:null, animId:null, lastTime:0,
  caseData:null, mode:'crime', currentSuspect:null,
  onInteract:null, nearHintEl:null, crosshairEl:null,
  boundEvents:{}
};

const Player = {
  pos: new THREE.Vector3(0, 1.65, 3),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: Math.PI, pitch: -0.1,
  radius: 0.34, height: 1.65,
  walkSpeed: 2.8, runSpeed: 5.0,
  bobPhase: 0, bobAmp: 0,
  pointerLocked: false, keys:{}
};

/* ====================================================================
   TEXTURAS v2 (más resolución + bump maps)
   ==================================================================== */
function makeCanvas(w, h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}
function canvasToTex(c, repeat, aniso){
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso || 16;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}
function makeTex(w, h, drawFn){
  const c = makeCanvas(w, h);
  drawFn(c.getContext('2d'), w, h);
  return canvasToTex(c);
}
function makeBumpFromCanvas(canvas, strength){
  strength = strength || 1.4;
  const w = canvas.width, h = canvas.height;
  const sctx = canvas.getContext('2d');
  const src = sctx.getImageData(0, 0, w, h).data;
  const out = makeCanvas(w, h);
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);
  const g = new Float32Array(w*h);
  for (let i = 0; i < w*h; i++) g[i] = (src[i*4] + src[i*4+1] + src[i*4+2]) / 3;
  for (let y = 0; y < h; y++){
    for (let x = 0; x < w; x++){
      const xm = x === 0 ? w-1 : x-1, xp = x === w-1 ? 0 : x+1;
      const ym = y === 0 ? h-1 : y-1, yp = y === h-1 ? 0 : y+1;
      const dx = (g[y*w+xp] - g[y*w+xm]) * strength * 0.0039;
      const dy = (g[yp*w+x] - g[ym*w+x]) * strength * 0.0039;
      const i = (y*w+x)*4;
      img.data[i]   = Math.max(0, Math.min(255, (dx*0.5 + 0.5) * 255));
      img.data[i+1] = Math.max(0, Math.min(255, (dy*0.5 + 0.5) * 255));
      img.data[i+2] = 255;
      img.data[i+3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  return canvasToTex(out);
}

function texParquet(){
  const c = makeCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  const plankH = 56;
  const rows = c.height / plankH;
  const bases = ['#3a2614','#402b16','#472e18','#3d2815','#443018'];
  for (let row = 0; row < rows; row++){
    const y = row * plankH;
    const offset = (row * 137) % 256;
    ctx.fillStyle = bases[row % bases.length];
    ctx.fillRect(0, y, c.width, plankH);
    for (let i = 0; i < 26; i++){
      const vy = y + 3 + Math.random() * (plankH - 6);
      const grad = ctx.createLinearGradient(0, 0, c.width, 0);
      grad.addColorStop(0, 'rgba(20,10,4,0)');
      grad.addColorStop(0.15, `rgba(20,10,4,${0.15 + Math.random()*0.25})`);
      grad.addColorStop(0.85, `rgba(20,10,4,${0.15 + Math.random()*0.25})`);
      grad.addColorStop(1, 'rgba(20,10,4,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.6 + Math.random() * 1.6;
      ctx.beginPath();
      for (let x = 0; x <= c.width; x += 12){
        const yy = vy + Math.sin(x*0.008 + i*1.7) * 1.4 + Math.sin(x*0.02 + i*3.1) * 0.6;
        x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, y + plankH - 1); ctx.lineTo(c.width, y + plankH - 1); ctx.stroke();
    for (let x = -offset; x < c.width + 256; x += 256){
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + plankH); ctx.stroke();
    }
    const shine = ctx.createLinearGradient(0, y, 0, y + plankH);
    shine.addColorStop(0, 'rgba(255,220,160,0.06)');
    shine.addColorStop(0.5, 'rgba(255,220,160,0.01)');
    shine.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = shine; ctx.fillRect(0, y, c.width, plankH);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  t.userData = { bump: makeBumpFromCanvas(c, 2.2) };
  return t;
}

function texMarble(){
  const c = makeCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, c.width, c.height);
  base.addColorStop(0, '#e0d7c0'); base.addColorStop(0.5, '#d4cab0'); base.addColorStop(1, '#e8e0c8');
  ctx.fillStyle = base; ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 40; i++){
    const x = Math.random()*c.width, y = Math.random()*c.height, r = 60 + Math.random()*180;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tint = ['rgba(200,190,160,0.3)','rgba(180,170,150,0.25)','rgba(220,210,180,0.35)'][i%3];
    g.addColorStop(0, tint); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(x-r, y-r, r*2, r*2);
  }
  for (let v = 0; v < 22; v++){
    ctx.strokeStyle = `rgba(${60+Math.random()*40|0},${50+Math.random()*40|0},${30+Math.random()*40|0},${0.2 + Math.random()*0.35})`;
    ctx.lineWidth = 0.8 + Math.random()*2.4;
    let x = Math.random()*c.width, y = Math.random()*c.height;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let s = 0; s < 40; s++){
      x += (Math.random() - 0.5) * 60;
      y += (Math.random() - 0.5) * 60;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const tile = 256;
  ctx.strokeStyle = 'rgba(40,32,20,0.65)'; ctx.lineWidth = 3;
  for (let x = 0; x <= c.width; x += tile){ ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke(); }
  for (let y = 0; y <= c.height; y += tile){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,240,210,0.5)'; ctx.lineWidth = 1;
  for (let x = 0; x <= c.width; x += tile) for (let y = 0; y <= c.height; y += tile){
    ctx.strokeRect(x+2, y+2, tile-4, tile-4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  t.userData = { bump: makeBumpFromCanvas(c, 1.4) };
  return t;
}

function texGrass(){
  const c = makeCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1f3a12'; ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 60; i++){
    const x = Math.random()*c.width, y = Math.random()*c.height, r = 30 + Math.random()*120;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${40+Math.random()*40|0},${70+Math.random()*50|0},${20+Math.random()*30|0},0.6)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  }
  for (let i = 0; i < 60000; i++){
    const x = Math.random()*c.width, y = Math.random()*c.height;
    const green = 60 + Math.random()*110;
    ctx.strokeStyle = `rgba(${20 + Math.random()*30|0},${green|0},${10 + Math.random()*40|0},${0.4 + Math.random()*0.5})`;
    ctx.lineWidth = 0.5 + Math.random()*0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random()-0.5)*2, y - 1 - Math.random()*3);
    ctx.stroke();
  }
  for (let i = 0; i < 120; i++){
    const x = Math.random()*c.width, y = Math.random()*c.height;
    ctx.fillStyle = ['#f0d060','#f0a0c0','#e8e8e8','#a0d0f0'][Math.floor(Math.random()*4)];
    ctx.beginPath(); ctx.arc(x, y, 0.8 + Math.random()*1.4, 0, Math.PI*2); ctx.fill();
  }
  return canvasToTex(c);
}

function texWallpaper(base, stripe, stripeWidth, opts){
  opts = opts || {};
  stripeWidth = stripeWidth || 4;
  const c = makeCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, c.width, c.height);
  const grad = ctx.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, 'rgba(255,255,255,0.02)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.02)');
  grad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = stripe;
  for (let x = 0; x < c.width; x += 64) ctx.fillRect(x, 0, stripeWidth, c.height);
  if (opts.damask){
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = opts.damaskColor || '#000';
    for (let x = 0; x < c.width; x += 128){
      for (let y = 0; y < c.height; y += 128){
        ctx.save();
        ctx.translate(x + 64, y + 64);
        ctx.lineWidth = 1.5;
        for (let k = 0; k < 8; k++){
          ctx.beginPath();
          ctx.ellipse(0, 0, 22 + Math.sin(k)*6, 40 + Math.cos(k)*10, k*Math.PI/8, 0, Math.PI*2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 12000; i++){
    ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`;
    ctx.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
  }
  for (let i = 0; i < 6000; i++){
    ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.05})`;
    ctx.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
  }
  for (let i = 0; i < 12; i++){
    const x = Math.random()*c.width, y = Math.random()*c.height, r = 30 + Math.random()*80;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${20+Math.random()*20|0},${15+Math.random()*15|0},${10+Math.random()*10|0},${0.1+Math.random()*0.15})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  t.userData = { bump: makeBumpFromCanvas(c, 0.6) };
  return t;
}

function texStone(){
  const c = makeCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#242428'; ctx.fillRect(0, 0, c.width, c.height);
  const s = 128;
  for (let x = 0; x < c.width; x += s){
    for (let y = 0; y < c.height; y += s){
      const shade = 40 + Math.random()*36;
      ctx.fillStyle = `rgb(${shade|0},${shade|0},${(shade+6)|0})`;
      ctx.fillRect(x+3, y+3, s-6, s-6);
      for (let i = 0; i < 200; i++){
        ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.06})`;
        ctx.fillRect(x + 3 + Math.random()*(s-6), y + 3 + Math.random()*(s-6), 1.5, 1.5);
      }
      for (let i = 0; i < 200; i++){
        ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.1})`;
        ctx.fillRect(x + 3 + Math.random()*(s-6), y + 3 + Math.random()*(s-6), 1.5, 1.5);
      }
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3;
  for (let x = 0; x <= c.width; x += s){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,c.height); ctx.stroke(); }
  for (let y = 0; y <= c.height; y += s){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(c.width,y); ctx.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 16;
  t.userData = { bump: makeBumpFromCanvas(c, 2.8) };
  return t;
}

function texCarpet(base, accent){
  const c = makeCanvas(1024, 1024);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = accent; ctx.lineWidth = 14;
  ctx.strokeRect(36, 36, c.width-72, c.height-72);
  ctx.lineWidth = 6; ctx.strokeRect(76, 76, c.width-152, c.height-152);
  ctx.lineWidth = 3;
  for (let i = 0; i < 8; i++){
    const sz = 60 + i*36;
    ctx.beginPath();
    ctx.moveTo(c.width/2, c.height/2 - sz); ctx.lineTo(c.width/2 + sz, c.height/2);
    ctx.lineTo(c.width/2, c.height/2 + sz); ctx.lineTo(c.width/2 - sz, c.height/2);
    ctx.closePath(); ctx.stroke();
  }
  ctx.fillStyle = accent;
  for (let x = 120; x < c.width - 80; x += 90){
    for (let y = 120; y < c.height - 80; y += 90){
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
    }
  }
  for (let i = 0; i < 20000; i++){
    ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.12})`;
    ctx.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

function texCeiling(){
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 6000; i++){
    ctx.fillStyle = `rgba(0,0,0,${Math.random()*0.05})`;
    ctx.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
  for (let x = 0; x <= c.width; x += 128){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,c.height); ctx.stroke(); }
  for (let y = 0; y <= c.height; y += 128){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(c.width,y); ctx.stroke(); }
  return canvasToTex(c);
}

function texWoodDark(){
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3a2412'; ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 40; i++){
    ctx.strokeStyle = `rgba(20,8,2,${0.2 + Math.random()*0.4})`;
    ctx.lineWidth = 0.5 + Math.random()*1.5;
    ctx.beginPath();
    let y = Math.random()*c.height;
    ctx.moveTo(0, y);
    for (let x = 0; x <= c.width; x += 8){
      y += (Math.random() - 0.5) * 1.4;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.userData = { bump: makeBumpFromCanvas(c, 1.0) };
  return t;
}

function texPainting(seed){
  const c = makeCanvas(512, 384);
  const ctx = c.getContext('2d');
  const palettes = [
    ['#c9a86a','#7a5c2e','#3a2a14','#e8d5a0'],
    ['#4a5a7a','#2a3a5a','#1a2030','#8090b0'],
    ['#7a3a2a','#3a1a10','#1a0808','#c08060'],
    ['#2a5a3a','#1a3a20','#0a1a10','#60a070'],
    ['#6a3a5a','#3a1a30','#1a0a18','#a070a0']
  ];
  const pal = palettes[seed % palettes.length];
  const g = ctx.createRadialGradient(c.width/2, c.height/2, 10, c.width/2, c.height/2, c.width*0.9);
  g.addColorStop(0, pal[3]); g.addColorStop(0.4, pal[0]);
  g.addColorStop(0.8, pal[1]); g.addColorStop(1, pal[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 14; i++){
    ctx.strokeStyle = `rgba(${Math.random()*80|0},${Math.random()*60|0},${Math.random()*40|0},0.5)`;
    ctx.lineWidth = 2 + Math.random()*4;
    ctx.beginPath();
    let x = Math.random()*c.width, y = Math.random()*c.height;
    ctx.moveTo(x, y);
    for (let j = 0; j < 6; j++){ x += (Math.random()-0.5)*160; y += (Math.random()-0.5)*160; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  const v = ctx.createLinearGradient(0, 0, 0, c.height);
  v.addColorStop(0, 'rgba(255,240,200,0.15)');
  v.addColorStop(0.5, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, c.width, c.height);
  return canvasToTex(c);
}

function texCurtain(){
  const c = makeCanvas(512, 1024);
  const ctx = c.getContext('2d');
  for (let x = 0; x < c.width; x += 24){
    const g = ctx.createLinearGradient(x, 0, x+24, 0);
    g.addColorStop(0, '#1a0202'); g.addColorStop(0.35, '#6a1010');
    g.addColorStop(0.5, '#9a1818'); g.addColorStop(0.65, '#6a1010');
    g.addColorStop(1, '#1a0202');
    ctx.fillStyle = g; ctx.fillRect(x, 0, 24, c.height);
  }
  const topGrad = ctx.createLinearGradient(0, 0, 0, c.height*0.2);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.75)'); topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad; ctx.fillRect(0, 0, c.width, c.height*0.2);
  const botGrad = ctx.createLinearGradient(0, c.height*0.8, 0, c.height);
  botGrad.addColorStop(0, 'transparent'); botGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = botGrad; ctx.fillRect(0, c.height*0.8, c.width, c.height*0.2);
  return canvasToTex(c);
}

/* ====================================================================
   HELPERS
   ==================================================================== */
function M(o){ return new THREE.MeshStandardMaterial(o); }
function texMat(tex, opts){
  opts = opts || {};
  const mat = new THREE.MeshStandardMaterial(Object.assign({ map: tex }, opts));
  if (tex.userData && tex.userData.bump){
    mat.bumpMap = tex.userData.bump;
    mat.bumpScale = opts.bumpScale != null ? opts.bumpScale : 0.03;
  }
  return mat;
}
function box(parent, w, h, d, mat, x, y, z){
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
function cyl(parent, rt, rb, h, mat, x, y, z, seg){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
function sph(parent, r, mat, x, y, z){
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  parent.add(m); return m;
}
function addObstacle(cx, cz, w, d, rot){
  rot = rot || 0;
  const cos = Math.abs(Math.cos(rot));
  const sin = Math.abs(Math.sin(rot));
  const hw = (w * cos + d * sin) / 2;
  const hd = (w * sin + d * cos) / 2;
  World.obstacles.push({ minX: cx - hw, maxX: cx + hw, minZ: cz - hd, maxZ: cz + hd });
}

/* ====================================================================
   MUEBLES
   ==================================================================== */
function buildDesk(scene, x, z, ry){
  const g = new THREE.Group();
  const woodTex = texWoodDark();
  const woodTop = M({ color: 0x6a4628, roughness: 0.55, metalness: 0.05 });
  const woodDark = texMat(woodTex, { color: 0x6a4530, roughness: 0.7 });
  const wood = M({ color: 0x5a3a20, roughness: 0.7 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  const felt = M({ color: 0x1a1008, roughness: 1 });

  box(g, 2.2, 0.06, 1.1, woodTop, 0, 0.76, 0);
  box(g, 2.16, 0.008, 1.06, felt, 0, 0.795, 0);
  box(g, 2.2, 0.15, 0.04, wood, 0, 0.68, 0.5);
  box(g, 0.04, 0.72, 1.0, wood, -1.08, 0.4, 0);
  box(g, 0.06, 0.76, 0.06, woodDark, 1.04, 0.38, -0.44);
  box(g, 0.06, 0.76, 0.06, woodDark, 1.04, 0.38, 0.44);
  box(g, 0.68, 0.72, 1.0, woodDark, -0.75, 0.38, 0);

  for (let i = 0; i < 3; i++){
    const dg = new THREE.Group();
    box(dg, 0.64, 0.19, 0.92, wood, 0, 0, 0);
    box(dg, 0.66, 0.2, 0.02, woodTop, 0, 0, 0.47);
    box(dg, 0.14, 0.03, 0.03, handle, 0, 0, 0.5);
    dg.position.set(-0.75, 0.62 - i*0.22, 0);
    dg.userData.isDrawer = true;
    dg.userData.drawerState = 0;
    dg.userData.drawerMaxZ = 0.44;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'drawer', data:{ desk:g, index:i } });
  }

  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 2.2, 1.1, ry);
  return g;
}

function buildChair(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.8 });
  const cushion = M({ color: 0x6a1818, roughness: 0.95 });
  box(g, 0.52, 0.05, 0.52, wood, 0, 0.46, 0);
  box(g, 0.46, 0.09, 0.46, cushion, 0, 0.53, 0);
  box(g, 0.52, 0.05, 0.06, wood, 0, 0.78, -0.24);
  box(g, 0.52, 0.05, 0.06, wood, 0, 1.02, -0.24);
  box(g, 0.04, 0.32, 0.04, wood, -0.22, 0.9, -0.24);
  box(g, 0.04, 0.32, 0.04, wood, 0.22, 0.9, -0.24);
  box(g, 0.44, 0.24, 0.03, cushion, 0, 0.9, -0.22);
  box(g, 0.05, 0.46, 0.05, wood, -0.22, 0.23, 0.2);
  box(g, 0.05, 0.46, 0.05, wood, 0.22, 0.23, 0.2);
  box(g, 0.05, 0.46, 0.05, wood, -0.22, 0.23, -0.2);
  box(g, 0.05, 0.46, 0.05, wood, 0.22, 0.23, -0.2);
  box(g, 0.44, 0.03, 0.03, wood, 0, 0.15, -0.2);
  box(g, 0.44, 0.03, 0.03, wood, 0, 0.15, 0.2);
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 0.55, 0.55, ry);
  return g;
}

function buildBookshelf(scene, x, z, ry, W, H){
  W = W || 2.4; H = H || 2.8;
  const D = 0.42;
  const g = new THREE.Group();
  const woodTex = texWoodDark();
  const wood = texMat(woodTex, { color: 0x3a2410, roughness: 0.85 });
  const bookColors = ['#7a2a1a','#2a4a3a','#5a5a1a','#4a1a2a','#1a3a5a','#6a4a1a','#3a1a4a','#2a5a4a','#8a3010','#203050','#406020','#802040'];
  const bookMats = bookColors.map(c => M({ color: parseInt(c.slice(1), 16), roughness: 0.9 }));

  box(g, 0.12, H, D, wood, -W/2, H/2, 0);
  box(g, 0.12, H, D, wood, W/2, H/2, 0);
  box(g, W + 0.12, 0.12, D, wood, 0, 0.06, 0);
  box(g, W + 0.14, 0.1, D + 0.04, wood, 0, H + 0.02, 0);
  box(g, W, H, 0.03, wood, 0, H/2, -D/2 + 0.02);

  const shelves = [];
  for (let i = 1; i <= 4; i++){
    const y = i * (H/4);
    if (i < 4) box(g, W - 0.12, 0.06, D - 0.04, wood, 0, y, 0);
    shelves.push(y);
  }

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
    if (Math.random() < 0.3){
      const objColor = [0x8a6a3a, 0x5a3a5a, 0x3a5a3a][Math.floor(Math.random()*3)];
      sph(g, 0.05, M({ color: objColor, roughness: 0.5 }), W/2 - 0.15, shelfY + 0.1, 0);
    }
  });

  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, W + 0.2, D, ry);
  return g;
}

function buildBed(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.85 });
  const woodDark = M({ color: 0x2a1810, roughness: 0.9 });
  const mattress = M({ color: 0xe8dcc8, roughness: 0.95 });
  const sheet = M({ color: 0xb8b8c8, roughness: 0.9 });
  const blanket = M({ color: 0x6a1a1a, roughness: 0.95 });
  const pillow = M({ color: 0xf8f0e0, roughness: 0.9 });

  box(g, 2.1, 0.22, 2.3, wood, 0, 0.21, 0);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([px, pz]) => {
    box(g, 0.14, 0.1, 0.14, woodDark, px*0.98, 0.05, pz*1.08);
  });
  box(g, 2.1, 1.2, 0.14, wood, 0, 0.82, -1.15);
  box(g, 1.9, 0.9, 0.04, woodDark, 0, 0.85, -1.07);
  box(g, 2.2, 0.08, 0.2, woodDark, 0, 1.44, -1.15);
  box(g, 2.1, 0.3, 0.1, wood, 0, 0.4, 1.13);
  box(g, 2.0, 0.32, 2.15, mattress, 0, 0.48, 0);
  box(g, 2.02, 0.04, 2.0, sheet, 0, 0.66, 0.05);
  box(g, 2.02, 0.08, 1.1, blanket, 0, 0.72, 0.6);
  box(g, 2.02, 0.04, 0.15, sheet, 0, 0.74, 0.05);
  box(g, 0.85, 0.18, 0.5, pillow, -0.5, 0.74, -0.75);
  box(g, 0.85, 0.18, 0.5, pillow, 0.5, 0.74, -0.75);
  box(g, 0.6, 0.14, 0.35, blanket, -0.5, 0.86, -0.75);
  box(g, 0.6, 0.14, 0.35, blanket, 0.5, 0.86, -0.75);

  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 2.2, 2.4, ry);
  return g;
}

function buildNightstand(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.8 });
  const woodDark = M({ color: 0x2a1810, roughness: 0.85 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });

  box(g, 0.58, 0.6, 0.55, wood, 0, 0.3, 0);
  box(g, 0.62, 0.05, 0.6, woodDark, 0, 0.63, 0);
  box(g, 0.58, 0.04, 0.55, woodDark, 0, 0.01, 0);

  const dg = new THREE.Group();
  box(dg, 0.52, 0.22, 0.5, wood, 0, 0, 0);
  box(dg, 0.52, 0.23, 0.02, woodDark, 0, 0, 0.26);
  box(dg, 0.1, 0.025, 0.03, handle, 0, 0, 0.28);
  dg.position.set(0, 0.32, 0);
  dg.userData.isDrawer = true;
  dg.userData.drawerState = 0;
  dg.userData.drawerMaxZ = 0.38;
  g.add(dg);
  World.interactables.push({ mesh: dg, type:'drawer', data:{ desk:g, index:0 } });

  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 0.65, 0.65, ry);
  return g;
}

function buildWardrobe(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x3a2410, roughness: 0.85 });
  const woodFront = M({ color: 0x4a2f18, roughness: 0.8 });
  const woodDark = M({ color: 0x2a1810, roughness: 0.9 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  const mirror = M({ color: 0x2a3040, metalness: 0.9, roughness: 0.1 });

  box(g, 1.6, 2.4, 0.7, wood, 0, 1.2, 0);
  box(g, 1.7, 0.08, 0.78, woodDark, 0, 2.42, 0);
  box(g, 1.7, 0.1, 0.78, woodDark, 0, 0.05, 0);

  [0, 1].forEach(i => {
    const dg = new THREE.Group();
    const dw = 0.76;
    box(dg, dw, 2.2, 0.05, woodFront, 0, 0, 0);
    box(dg, dw - 0.16, 1.0, 0.02, woodDark, 0, 0.5, 0.03);
    box(dg, dw - 0.16, 0.6, 0.02, woodDark, 0, -0.6, 0.03);
    box(dg, 0.04, 0.18, 0.05, handle, i === 0 ? dw/2 - 0.08 : -dw/2 + 0.08, 0, 0.05);
    dg.position.set(i === 0 ? -0.4 : 0.4, 1.25, 0.36);
    dg.userData.isCabinetDoor = true;
    dg.userData.doorState = 0;
    dg.userData.doorHinge = i === 0 ? 1 : -1;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });

  const mirrorPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), mirror);
  mirrorPlane.position.set(0.4, 1.25, 0.39);
  g.add(mirrorPlane);

  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 1.7, 0.85, ry);
  return g;
}

function buildCabinet(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2f18, roughness: 0.8 });
  const woodDark = M({ color: 0x2a1810, roughness: 0.9 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });

  box(g, 1.0, 1.6, 0.5, wood, 0, 0.8, 0);
  box(g, 1.05, 0.06, 0.55, woodDark, 0, 1.63, 0);
  box(g, 1.05, 0.06, 0.55, woodDark, 0, 0.03, 0);

  [0, 1].forEach(i => {
    const dg = new THREE.Group();
    box(dg, 0.46, 1.5, 0.04, wood, 0, 0, 0);
    box(dg, 0.36, 1.4, 0.02, woodDark, 0, 0, 0.025);
    box(dg, 0.04, 0.14, 0.04, handle, i === 0 ? 0.19 : -0.19, 0, 0.05);
    dg.position.set(i === 0 ? -0.25 : 0.25, 0.82, 0.26);
    dg.userData.isCabinetDoor = true;
    dg.userData.doorState = 0;
    dg.userData.doorHinge = i === 0 ? 1 : -1;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });

  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 1.1, 0.6, ry);
  return g;
}

function buildTableLamp(scene, x, y, z){
  const g = new THREE.Group();
  const metal = M({ color: 0x2a2a30, metalness: 0.9, roughness: 0.3 });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 1.6,
    transparent: true, opacity: 0.92, side: THREE.DoubleSide
  });
  cyl(g, 0.11, 0.13, 0.03, metal, 0, 0.015, 0, 24);
  cyl(g, 0.07, 0.1, 0.04, metal, 0, 0.05, 0, 24);
  cyl(g, 0.012, 0.012, 0.32, metal, 0, 0.23, 0, 12);
  cyl(g, 0.02, 0.02, 0.04, metal, 0, 0.4, 0, 12);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 0.28, 24, 1, true), shadeMat);
  shade.position.y = 0.55; g.add(shade);
  cyl(g, 0.18, 0.18, 0.01, shadeMat, 0, 0.69, 0, 24);
  const light = new THREE.PointLight(0xffd682, 1.2, 5, 1.6);
  light.position.y = 0.5;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  g.add(light);
  g.position.set(x, y, z); scene.add(g);
  return g;
}

function buildCeilingLamp(scene, x, z, intensity){
  intensity = intensity || 1.6;
  const g = new THREE.Group();
  const metal = M({ color: 0x1a1a1e, metalness: 0.85, roughness: 0.35 });
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.95, side: THREE.DoubleSide
  });
  cyl(g, 0.015, 0.015, 0.4, metal, 0, -0.2, 0, 8);
  cyl(g, 0.08, 0.08, 0.03, metal, 0, 0, 0, 20);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.28, 24, 1, true), shadeMat);
  shade.rotation.x = Math.PI;
  shade.position.y = -0.55;
  g.add(shade);
  sph(g, 0.08, new THREE.MeshStandardMaterial({ color: 0xfff5d0, emissive: 0xfff5d0, emissiveIntensity: 3 }), 0, -0.6, 0);
  const light = new THREE.PointLight(0xffd682, intensity, 12, 1.4);
  light.position.y = -0.65;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  g.add(light);
  g.position.set(x, World.roomHeight, z);
  scene.add(g);
  return g;
}

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
  cyl(g, 0.28, 0.22, 0.4, potMat, 0, 0.2, 0, 24);
  cyl(g, 0.3, 0.3, 0.04, potMat, 0, 0.42, 0, 24);
  cyl(g, 0.26, 0.26, 0.02, soil, 0, 0.41, 0, 24);
  for (let i = 0; i < 16; i++){
    const ang = Math.random()*Math.PI*2;
    const len = 0.5 + Math.random()*0.6;
    const height = 0.4 + Math.random()*0.5;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6), M({ color: 0x2a4a1a, roughness: 0.9 }));
    stem.position.set(Math.cos(ang)*0.05, 0.42 + height, Math.sin(ang)*0.05);
    stem.rotation.z = (Math.random()-0.5) * 0.4;
    stem.rotation.x = (Math.random()-0.5) * 0.4;
    g.add(stem);
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

function buildPainting(scene, x, y, z, ry, w, h, seed){
  w = w || 1.6; h = h || 1.1;
  const g = new THREE.Group();
  const frame = M({ color: 0x4a3d22, roughness: 0.6, metalness: 0.2 });
  const frameInner = M({ color: 0x6a5a30, roughness: 0.5, metalness: 0.3 });
  box(g, w + 0.2, h + 0.2, 0.08, frame, 0, 0, 0);
  box(g, w + 0.1, h + 0.1, 0.04, frameInner, 0, 0, 0.035);
  const c = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M({ map: texPainting(seed || 0), roughness: 0.7 }));
  c.position.z = 0.06; g.add(c);
  g.position.set(x, y, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}

function buildWindow(scene, x, y, z, ry, w, h){
  w = w || 1.8; h = h || 1.5;
  const g = new THREE.Group();
  const frame = M({ color: 0x4a3d22, roughness: 0.7 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x1a2035, emissive: 0x2a3a6a, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.85, metalness: 0.2, roughness: 0.1
  });
  box(g, w + 0.24, h + 0.24, 0.14, frame, 0, 0, 0);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), new THREE.MeshBasicMaterial({ color: 0xf0e8d8 }));
  moon.position.set(w*0.25, h*0.2, 0.08); g.add(moon);
  for (let i = 0; i < 15; i++){
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.008 + Math.random()*0.008, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 + Math.random()*0.5 }));
    star.position.set((Math.random()-0.5)*w, (Math.random()-0.5)*h, 0.07);
    g.add(star);
  }
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glass);
  pane.position.z = 0.06; g.add(pane);
  box(g, 0.08, h, 0.06, frame, 0, 0, 0.09);
  box(g, w, 0.08, 0.06, frame, 0, 0, 0.09);
  box(g, w + 0.35, 0.08, 0.25, frame, 0, -h/2 - 0.1, 0.12);
  const light = new THREE.PointLight(0x8090ff, 0.7, 6, 1.8);
  light.position.set(0, 0, -0.5); g.add(light);
  g.position.set(x, y, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}

function buildDoor(scene, x, z, ry, w, h){
  w = w || 1.0; h = h || 2.2;
  const g = new THREE.Group();
  const frame = M({ color: 0x2a1a08, roughness: 0.8 });
  const door = M({ color: 0x4a2f18, roughness: 0.75 });
  const doorDark = M({ color: 0x2a1810, roughness: 0.85 });
  const handle = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.15 });
  box(g, w + 0.16, 0.1, 0.12, frame, 0, h + 0.05, 0);
  box(g, 0.1, h + 0.1, 0.12, frame, -(w/2 + 0.03), h/2, 0);
  box(g, 0.1, h + 0.1, 0.12, frame, (w/2 + 0.03), h/2, 0);
  box(g, w, h, 0.06, door, 0, h/2, 0.03);
  box(g, w - 0.2, h/2 - 0.15, 0.02, doorDark, 0, h*0.3, 0.07);
  box(g, w - 0.2, h/2 - 0.15, 0.02, doorDark, 0, h*0.75, 0.07);
  const h1 = cyl(g, 0.025, 0.025, 0.08, handle, w/2 - 0.15, h/2, 0.1, 12);
  h1.rotation.z = Math.PI/2;
  box(g, 0.06, 0.1, 0.03, handle, w/2 - 0.15, h/2 - 0.15, 0.08);
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  return g;
}

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

function buildCurtain(scene, x, y, z, ry, w, h){
  const tex = texCurtain();
  tex.repeat.set(w/2, 1);
  const mat = M({ map: tex, roughness: 0.9, side: THREE.DoubleSide });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z); m.rotation.y = ry;
  scene.add(m);
  return m;
}

function buildBench(scene, x, z, ry){
  const g = new THREE.Group();
  const wood = M({ color: 0x5a3a20, roughness: 0.85 });
  const metal = M({ color: 0x2a2a30, metalness: 0.85, roughness: 0.35 });
  for (let i = 0; i < 3; i++) box(g, 1.8, 0.05, 0.15, wood, 0, 0.5, -0.15 + i*0.15);
  for (let i = 0; i < 3; i++) box(g, 1.8, 0.15, 0.05, wood, 0, 0.7 + i*0.15, -0.28);
  [[-0.75, 0],[0.75, 0]].forEach(([px, pz]) => {
    box(g, 0.08, 0.5, 0.5, metal, px, 0.25, pz);
  });
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  addObstacle(x, z, 1.9, 0.7, ry);
  return g;
}

function buildLampPost(scene, x, z){
  const g = new THREE.Group();
  const metal = M({ color: 0x1a1a1e, metalness: 0.75, roughness: 0.5 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.9
  });
  cyl(g, 0.15, 0.2, 0.15, metal, 0, 0.075, 0, 12);
  cyl(g, 0.04, 0.06, 4, metal, 0, 2.075, 0, 12);
  cyl(g, 0.03, 0.03, 0.15, metal, 0, 4.1, 0, 8);
  box(g, 0.24, 0.32, 0.24, metal, 0, 4.32, 0);
  box(g, 0.2, 0.28, 0.2, lightMat, 0, 4.32, 0);
  cyl(g, 0.02, 0.15, 0.08, metal, 0, 4.5, 0, 12);
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

function buildTree(scene, x, z, scale){
  scale = scale || 1;
  const g = new THREE.Group();
  const trunk = M({ color: 0x3a2410, roughness: 0.95 });
  const foliage1 = M({ color: 0x1a3a1a, roughness: 0.9 });
  const foliage2 = M({ color: 0x2a4a2a, roughness: 0.9 });
  const foliage3 = M({ color: 0x0f2a0f, roughness: 0.9 });
  cyl(g, 0.18*scale, 0.28*scale, 2.2*scale, trunk, 0, 1.1*scale, 0, 12);
  for (let i = 0; i < 4; i++){
    const ang = (i / 4) * Math.PI * 2 + Math.random();
    const branch = cyl(g, 0.06*scale, 0.1*scale, 1.2*scale, trunk, Math.cos(ang)*0.3*scale, 1.8*scale, Math.sin(ang)*0.3*scale, 8);
    branch.rotation.z = -0.7 + Math.random()*0.2;
    branch.rotation.y = ang;
  }
  for (let i = 0; i < 7; i++){
    const s = (0.9 + Math.random()*0.7)*scale;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), [foliage1, foliage2, foliage3][Math.floor(Math.random()*3)]);
    m.position.set((Math.random()-0.5)*1.4*scale, (2.6 + Math.random()*1.4)*scale, (Math.random()-0.5)*1.4*scale);
    m.castShadow = true;
    g.add(m);
  }
  g.position.set(x, 0, z);
  scene.add(g);
  addObstacle(x, z, 0.6*scale, 0.6*scale, 0);
  return g;
}

function buildCrate(scene, x, z, ry, stackY){
  stackY = stackY || 0;
  const g = new THREE.Group();
  const wood = M({ color: 0x4a2a10, roughness: 0.9 });
  const woodDark = M({ color: 0x2a1808, roughness: 0.95 });
  box(g, 0.8, 0.8, 0.8, wood, 0, 0.4 + stackY, 0);
  for (let i = 0; i < 4; i++){
    box(g, 0.82, 0.04, 0.04, woodDark, 0, 0.15 + i*0.2 + stackY, 0.41);
    box(g, 0.82, 0.04, 0.04, woodDark, 0, 0.15 + i*0.2 + stackY, -0.41);
  }
  box(g, 0.04, 0.82, 0.82, woodDark, -0.41, 0.4 + stackY, 0);
  box(g, 0.04, 0.82, 0.82, woodDark, 0.41, 0.4 + stackY, 0);
  g.position.set(x, 0, z); g.rotation.y = ry;
  scene.add(g);
  if (stackY === 0) addObstacle(x, z, 0.9, 0.9, ry);
  return g;
}

function buildVase(scene, x, y, z){
  const g = new THREE.Group();
  const ceramic = M({ color: 0x8a6a4a, roughness: 0.4 });
  const curve = new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0), new THREE.Vector2(0.08, 0.02),
    new THREE.Vector2(0.12, 0.08), new THREE.Vector2(0.1, 0.16),
    new THREE.Vector2(0.06, 0.22), new THREE.Vector2(0.07, 0.26),
    new THREE.Vector2(0.09, 0.28)
  ], 16);
  const vase = new THREE.Mesh(curve, ceramic);
  vase.castShadow = true;
  g.add(vase);
  g.position.set(x, y, z);
  scene.add(g);
  return g;
}

/* ====================================================================
   OBJETOS INVESTIGABLES
   ==================================================================== */
const OBJ = {};

OBJ.taza = () => {
  const g = new THREE.Group();
  const ceramic = M({ color: 0xf0e8d8, roughness: 0.35, metalness: 0.05 });
  const liquid = M({ color: 0x3a2010, roughness: 0.15 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.1, 24, 1, true), ceramic);
  body.position.y = 0.05; body.castShadow = true; g.add(body);
  cyl(g, 0.048, 0.048, 0.006, ceramic, 0, 0.003, 0, 24);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 10, 20, Math.PI * 1.4), ceramic);
  handle.position.set(0.065, 0.055, 0);
  handle.rotation.z = -Math.PI * 0.3; handle.castShadow = true; g.add(handle);
  const liq = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), liquid);
  liq.rotation.x = -Math.PI/2; liq.position.y = 0.082; g.add(liq);
  return g;
};
OBJ.vaso = () => {
  const g = new THREE.Group();
  const glass = M({ color: 0xd8e0e8, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.75 });
  const liquid = M({ color: 0x8a4010, roughness: 0.3 });
  cyl(g, 0.045, 0.042, 0.12, glass, 0, 0.06, 0, 20);
  cyl(g, 0.041, 0.038, 0.07, liquid, 0, 0.035, 0, 20);
  cyl(g, 0.042, 0.042, 0.008, glass, 0, 0.004, 0, 20);
  return g;
};
OBJ.copa = () => {
  const g = new THREE.Group();
  const glass = M({ color: 0xe0e8f0, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.7 });
  const wine = M({ color: 0x4a0818, roughness: 0.2, transparent: true, opacity: 0.85 });
  cyl(g, 0.058, 0.022, 0.13, glass, 0, 0.15, 0, 24);
  cyl(g, 0.05, 0.018, 0.07, wine, 0, 0.125, 0, 24);
  cyl(g, 0.008, 0.008, 0.09, glass, 0, 0.05, 0, 12);
  cyl(g, 0.045, 0.048, 0.008, glass, 0, 0.004, 0, 24);
  return g;
};
OBJ.botella = () => {
  const g = new THREE.Group();
  const glass = M({ color: 0x2a3a1a, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.9 });
  const cork = M({ color: 0x8a6a3a, roughness: 0.9 });
  const label = M({ color: 0xf0e8d8, roughness: 0.85 });
  cyl(g, 0.05, 0.05, 0.2, glass, 0, 0.1, 0, 20);
  cyl(g, 0.03, 0.05, 0.04, glass, 0, 0.22, 0, 20);
  cyl(g, 0.022, 0.03, 0.09, glass, 0, 0.285, 0, 16);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.08), label);
  lbl.position.set(0.051, 0.1, 0); lbl.rotation.y = Math.PI/2; g.add(lbl);
  cyl(g, 0.024, 0.024, 0.035, cork, 0, 0.345, 0, 12);
  return g;
};
OBJ.frasco = () => {
  const g = new THREE.Group();
  const glass = M({ color: 0xa0c0d0, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.65 });
  const cap = M({ color: 0x3a3a40, roughness: 0.6 });
  const label = M({ color: 0xf0e8d0, roughness: 0.85 });
  cyl(g, 0.028, 0.032, 0.07, glass, 0, 0.035, 0, 16);
  cyl(g, 0.022, 0.028, 0.02, glass, 0, 0.08, 0, 16);
  cyl(g, 0.024, 0.024, 0.018, cap, 0, 0.1, 0, 16);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.04), label);
  lbl.position.set(0, 0.04, 0.032); g.add(lbl);
  return g;
};
OBJ.azucarero = () => {
  const g = new THREE.Group();
  const ceramic = M({ color: 0xf0e8d8, roughness: 0.3, metalness: 0.05 });
  const ceramicBlue = M({ color: 0x4a6a9a, roughness: 0.35 });
  const sugar = M({ color: 0xf8f0e0, roughness: 0.9 });
  cyl(g, 0.045, 0.045, 0.07, ceramic, 0, 0.035, 0, 20);
  cyl(g, 0.048, 0.048, 0.008, ceramicBlue, 0, 0.07, 0, 20);
  cyl(g, 0.04, 0.04, 0.015, sugar, 0, 0.07, 0, 20);
  cyl(g, 0.05, 0.045, 0.05, ceramic, 0, 0.12, 0, 20);
  cyl(g, 0.015, 0.015, 0.025, ceramicBlue, 0, 0.155, 0, 12);
  sph(g, 0.012, ceramicBlue, 0, 0.17, 0);
  return g;
};
OBJ.lata = () => {
  const g = new THREE.Group();
  const alu = M({ color: 0xc0c8d0, metalness: 0.9, roughness: 0.2 });
  const label = M({ color: 0x8a1a1a, roughness: 0.7 });
  cyl(g, 0.033, 0.033, 0.12, alu, 0, 0.06, 0, 20);
  cyl(g, 0.0335, 0.0335, 0.07, label, 0, 0.06, 0, 20);
  cyl(g, 0.033, 0.033, 0.002, alu, 0, 0.121, 0, 20);
  return g;
};
OBJ.tetera = () => {
  const g = new THREE.Group();
  const ceramic = M({ color: 0xe0d8c8, roughness: 0.4 });
  sph(g, 0.09, ceramic, 0, 0.08, 0);
  cyl(g, 0.05, 0.06, 0.04, ceramic, 0, 0.16, 0, 20);
  cyl(g, 0.03, 0.03, 0.015, ceramic, 0, 0.185, 0, 16);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.1, 10), ceramic);
  spout.position.set(0.1, 0.1, 0); spout.rotation.z = 0.7; g.add(spout);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16, Math.PI * 1.2), ceramic);
  h.position.set(-0.08, 0.1, 0); h.rotation.z = -Math.PI * 0.3; g.add(h);
  return g;
};
OBJ.bandeja = () => {
  const g = new THREE.Group();
  const metal = M({ color: 0xc8a860, metalness: 0.85, roughness: 0.3 });
  box(g, 0.35, 0.01, 0.24, metal, 0, 0.005, 0);
  box(g, 0.36, 0.03, 0.015, metal, 0, 0.015, 0.12);
  box(g, 0.36, 0.03, 0.015, metal, 0, 0.015, -0.12);
  box(g, 0.015, 0.03, 0.24, metal, 0.175, 0.015, 0);
  box(g, 0.015, 0.03, 0.24, metal, -0.175, 0.015, 0);
  return g;
};
OBJ.cuchillo = () => {
  const g = new THREE.Group();
  const steel = M({ color: 0xd0d0d8, metalness: 0.9, roughness: 0.15 });
  const darkSteel = M({ color: 0xa0a0a8, metalness: 0.85, roughness: 0.2 });
  const wood = M({ color: 0x2a1810, roughness: 0.75 });
  const brass = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  box(g, 0.26, 0.004, 0.04, steel, 0.13, 0.006, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), steel);
  tip.rotation.z = -Math.PI/2; tip.position.set(0.275, 0.006, 0); g.add(tip);
  box(g, 0.26, 0.002, 0.01, darkSteel, 0.13, 0.009, 0);
  box(g, 0.012, 0.016, 0.042, brass, -0.006, 0.008, 0);
  box(g, 0.09, 0.02, 0.03, wood, -0.055, 0.01, 0);
  [-0.035, -0.07].forEach(x => sph(g, 0.004, brass, x, 0.02, 0));
  return g;
};
OBJ.tijeras = () => {
  const g = new THREE.Group();
  const steel = M({ color: 0xc0c0c8, metalness: 0.9, roughness: 0.2 });
  const handleMat = M({ color: 0x2a1810, roughness: 0.8 });
  box(g, 0.14, 0.003, 0.014, steel, 0.07, 0.008, 0.01).rotation.y = 0.02;
  box(g, 0.14, 0.003, 0.014, steel, 0.07, 0.008, -0.01).rotation.y = -0.02;
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 8, 16), handleMat);
  ring1.rotation.x = Math.PI/2; ring1.position.set(-0.06, 0.008, 0.03); g.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 8, 16), handleMat);
  ring2.rotation.x = Math.PI/2; ring2.position.set(-0.06, 0.008, -0.03); g.add(ring2);
  return g;
};
OBJ.pistola = () => {
  const g = new THREE.Group();
  const metal = M({ color: 0x2a2a30, metalness: 0.9, roughness: 0.3 });
  const metalDark = M({ color: 0x0a0a10, metalness: 0.85, roughness: 0.4 });
  const grip = M({ color: 0x2a1810, roughness: 0.8 });
  box(g, 0.16, 0.028, 0.024, metal, 0.02, 0.04, 0);
  box(g, 0.08, 0.004, 0.018, metalDark, 0, 0.056, 0);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16, Math.PI * 1.2), metal);
  guard.position.set(-0.035, 0.02, 0); guard.rotation.z = Math.PI * 0.1; g.add(guard);
  const gr = box(g, 0.04, 0.08, 0.024, grip, -0.062, 0.005, 0); gr.rotation.z = -0.2;
  box(g, 0.008, 0.02, 0.008, metalDark, -0.02, 0.025, 0);
  return g;
};
OBJ.martillo = () => {
  const g = new THREE.Group();
  const wood = M({ color: 0x5a3a20, roughness: 0.85 });
  const steel = M({ color: 0x505058, metalness: 0.85, roughness: 0.35 });
  cyl(g, 0.012, 0.015, 0.2, wood, 0, 0.1, 0, 12);
  box(g, 0.09, 0.04, 0.04, steel, 0, 0.21, 0);
  box(g, 0.05, 0.045, 0.045, steel, 0, 0.21, 0);
  return g;
};
OBJ.destornillador = () => {
  const g = new THREE.Group();
  const steel = M({ color: 0xc0c0c8, metalness: 0.9, roughness: 0.2 });
  const handleMat = M({ color: 0x8a1a1a, roughness: 0.7 });
  cyl(g, 0.004, 0.004, 0.14, steel, 0, 0.07, 0, 8);
  box(g, 0.006, 0.008, 0.006, steel, 0, 0.14, 0);
  cyl(g, 0.018, 0.014, 0.06, handleMat, 0, 0.17, 0, 12);
  cyl(g, 0.018, 0.018, 0.003, handleMat, 0, 0.2, 0, 12);
  return g;
};
OBJ.alicates = () => {
  const g = new THREE.Group();
  const steel = M({ color: 0x909098, metalness: 0.9, roughness: 0.3 });
  const grip = M({ color: 0x2a2a30, roughness: 0.85 });
  box(g, 0.1, 0.008, 0.02, steel, 0.05, 0.008, 0.02).rotation.y = 0.05;
  box(g, 0.1, 0.008, 0.02, steel, 0.05, 0.008, -0.02).rotation.y = -0.05;
  box(g, 0.09, 0.012, 0.03, grip, -0.06, 0.008, 0.03);
  box(g, 0.09, 0.012, 0.03, grip, -0.06, 0.008, -0.03);
  sph(g, 0.012, steel, 0, 0.008, 0);
  return g;
};
OBJ.llaveInglesa = () => {
  const g = new THREE.Group();
  const steel = M({ color: 0x909098, metalness: 0.9, roughness: 0.35 });
  cyl(g, 0.014, 0.014, 0.22, steel, 0, 0.11, 0, 12);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.009, 8, 16, Math.PI * 1.6), steel);
  head.position.set(0, 0.23, 0); head.rotation.x = Math.PI/2; g.add(head);
  return g;
};
OBJ.cuchilla = () => {
  const g = new THREE.Group();
  const steel = M({ color: 0xd0d0d8, metalness: 0.9, roughness: 0.15 });
  box(g, 0.18, 0.003, 0.025, steel, 0.09, 0.005, 0);
  return g;
};
OBJ.carta = () => {
  const g = new THREE.Group();
  const paper = M({ color: 0xf0e8d0, roughness: 0.92, side: THREE.DoubleSide });
  const text = M({ color: 0x3a2a1a, roughness: 0.85 });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.24, 8, 8), paper);
  sheet.rotation.x = -Math.PI/2;
  const pos = sheet.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 6) * 0.006 + Math.sin(y * 8) * 0.004);
  }
  sheet.geometry.computeVertexNormals();
  sheet.position.y = 0.005;
  g.add(sheet);
  for (let i = 0; i < 6; i++){
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.003), text);
    line.rotation.x = -Math.PI/2;
    line.position.set(-0.01, 0.012, -0.08 + i*0.03);
    g.add(line);
  }
  return g;
};
OBJ.sobre = () => {
  const g = new THREE.Group();
  const paper = M({ color: 0xf0e8d0, roughness: 0.9, side: THREE.DoubleSide });
  const paperDark = M({ color: 0xd8d0b0, roughness: 0.9, side: THREE.DoubleSide });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), paper);
  front.rotation.x = -Math.PI/2; front.position.y = 0.005; g.add(front);
  const flap1 = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.07), paperDark);
  flap1.rotation.x = -Math.PI/2; flap1.position.set(0, 0.006, -0.02); flap1.rotation.z = 0.15; g.add(flap1);
  return g;
};
OBJ.libro = () => {
  const g = new THREE.Group();
  const cover = M({ color: 0x5a1a1a, roughness: 0.7 });
  const pages = M({ color: 0xe8d8b8, roughness: 0.9 });
  const gold = M({ color: 0xc8a860, metalness: 0.85, roughness: 0.25 });
  box(g, 0.17, 0.008, 0.24, cover, 0, 0.004, 0);
  box(g, 0.16, 0.028, 0.23, pages, 0.005, 0.022, 0);
  box(g, 0.17, 0.008, 0.24, cover, 0, 0.04, 0);
  box(g, 0.008, 0.04, 0.24, cover, -0.085, 0.02, 0);
  box(g, 0.14, 0.001, 0.2, gold, 0.005, 0.045, 0);
  return g;
};
OBJ.cuaderno = () => {
  const g = new THREE.Group();
  const cover = M({ color: 0x2a3a5a, roughness: 0.7 });
  const pages = M({ color: 0xe8d8b8, roughness: 0.9 });
  const spiral = M({ color: 0x909098, metalness: 0.8, roughness: 0.3 });
  box(g, 0.14, 0.006, 0.18, cover, 0, 0.003, 0);
  box(g, 0.13, 0.02, 0.17, pages, 0.005, 0.016, 0);
  box(g, 0.14, 0.006, 0.18, cover, 0, 0.029, 0);
  for (let i = 0; i < 8; i++){
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.006, 0.0015, 6, 12), spiral);
    ring.position.set(-0.06, 0.018, -0.07 + i*0.02);
    ring.rotation.y = Math.PI/2;
    g.add(ring);
  }
  return g;
};
OBJ.periodico = () => {
  const g = new THREE.Group();
  const paper = M({ color: 0xe8e0c8, roughness: 0.9 });
  const ink = M({ color: 0x1a1a1e, roughness: 0.85 });
  box(g, 0.28, 0.005, 0.4, paper, 0, 0.005, 0);
  box(g, 0.2, 0.001, 0.03, ink, 0, 0.008, -0.14);
  for (let i = 0; i < 8; i++){
    box(g, 0.2, 0.001, 0.002, ink, 0, 0.008, -0.08 + i*0.025);
  }
  box(g, 0.15, 0.001, 0.15, ink, -0.06, 0.008, 0.1);
  return g;
};
OBJ.revista = () => {
  const g = new THREE.Group();
  const cover = M({ color: 0x8a2a4a, roughness: 0.75 });
  box(g, 0.18, 0.008, 0.24, cover, 0, 0.004, 0);
  box(g, 0.17, 0.004, 0.23, M({ color: 0xe8e0d0, roughness: 0.85 }), 0, 0.014, 0);
  box(g, 0.18, 0.008, 0.24, cover, 0, 0.024, 0);
  return g;
};
OBJ.foto = () => {
  const g = new THREE.Group();
  const paper = M({ color: 0xf8f0e0, roughness: 0.85, side: THREE.DoubleSide });
  const image = M({ color: 0x6a5a4a, roughness: 0.9 });
  box(g, 0.1, 0.001, 0.13, paper, 0, 0.001, 0);
  box(g, 0.08, 0.0005, 0.1, image, 0, 0.002, -0.01);
  return g;
};
OBJ.carpeta = () => {
  const g = new THREE.Group();
  const cover = M({ color: 0xa88040, roughness: 0.85 });
  const pages = M({ color: 0xf0e8d0, roughness: 0.9 });
  box(g, 0.24, 0.008, 0.32, cover, 0, 0.004, 0);
  box(g, 0.22, 0.006, 0.3, pages, 0.005, 0.01, 0);
  box(g, 0.24, 0.008, 0.32, cover, 0, 0.017, 0);
  return g;
};
OBJ.certificado = () => {
  const g = new THREE.Group();
  const paper = M({ color: 0xf8f0d8, roughness: 0.9 });
  const gold = M({ color: 0xc8a860, metalness: 0.85, roughness: 0.3 });
  const seal = M({ color: 0x8a1818, roughness: 0.6 });
  box(g, 0.2, 0.005, 0.28, paper, 0, 0.005, 0);
  box(g, 0.16, 0.001, 0.002, gold, 0, 0.008, 0);
  cyl(g, 0.02, 0.02, 0.003, seal, 0.06, 0.008, 0.09, 20);
  return g;
};
OBJ.ticket = () => {
  const g = new THREE.Group();
  const paper = M({ color: 0xf0e8d0, roughness: 0.9, side: THREE.DoubleSide });
  box(g, 0.08, 0.0005, 0.05, paper, 0, 0.001, 0);
  return g;
};
OBJ.panuelo = () => {
  const g = new THREE.Group();
  const mat = M({ color: 0xf0e8d8, roughness: 0.95, side: THREE.DoubleSide });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18, 8, 8), mat);
  cloth.rotation.x = -Math.PI/2;
  const pos = cloth.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x * 8) * Math.cos(y * 8) * 0.005);
  }
  cloth.geometry.computeVertexNormals();
  cloth.castShadow = true;
  g.add(cloth);
  return g;
};
OBJ.guante = () => {
  const g = new THREE.Group();
  const leather = M({ color: 0x3a2010, roughness: 0.85 });
  const leatherDark = M({ color: 0x1a0a05, roughness: 0.9 });
  box(g, 0.09, 0.02, 0.11, leather, 0, 0.01, 0);
  box(g, 0.09, 0.022, 0.04, leatherDark, 0, 0.011, 0.07);
  for (let i = 0; i < 4; i++){
    const finger = new THREE.Group();
    box(finger, 0.018, 0.014, 0.035, leather, 0, 0.008, -0.017);
    box(finger, 0.016, 0.012, 0.03, leather, 0, 0.008, -0.048);
    finger.position.set(-0.03 + i*0.02, 0.01, -0.055);
    finger.rotation.x = -0.15;
    g.add(finger);
  }
  const thumb = new THREE.Group();
  box(thumb, 0.016, 0.014, 0.04, leather, 0, 0.008, -0.02);
  box(thumb, 0.014, 0.012, 0.028, leather, 0, 0.008, -0.05);
  thumb.position.set(0.055, 0.01, -0.02);
  thumb.rotation.y = -0.6; thumb.rotation.x = -0.3;
  g.add(thumb);
  return g;
};
OBJ.guantes = () => {
  const g = new THREE.Group();
  const one = OBJ.guante();
  const two = OBJ.guante();
  two.position.set(0.16, 0, 0.06); two.rotation.y = 0.5;
  g.add(one); g.add(two);
  return g;
};
OBJ.llave = () => {
  const g = new THREE.Group();
  const brass = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  const shaft = cyl(g, 0.006, 0.006, 0.11, brass, 0.02, 0.006, 0, 12);
  shaft.rotation.z = Math.PI/2;
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 10, 20), brass);
  head.rotation.x = Math.PI/2; head.position.set(-0.055, 0.006, 0); g.add(head);
  box(g, 0.008, 0.012, 0.018, brass, 0.06, 0.012, 0.008);
  box(g, 0.008, 0.012, 0.014, brass, 0.072, 0.012, 0.006);
  return g;
};
OBJ.llavero = () => {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 16), M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 }));
  ring.rotation.x = Math.PI/2; ring.position.y = 0.006; g.add(ring);
  const k1 = OBJ.llave(); k1.position.set(0.03, 0, 0.02); g.add(k1);
  const k2 = OBJ.llave(); k2.position.set(0.03, 0, -0.02); k2.rotation.y = 0.3; g.add(k2);
  return g;
};
OBJ.reloj = () => {
  const g = new THREE.Group();
  const gold = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  const face = M({ color: 0xf0e8d0, roughness: 0.5 });
  const hands = M({ color: 0x1a1a1e, roughness: 0.7 });
  const strap = M({ color: 0x2a1810, roughness: 0.85 });
  cyl(g, 0.032, 0.032, 0.012, gold, 0, 0.006, 0, 24);
  cyl(g, 0.028, 0.028, 0.014, face, 0, 0.007, 0, 24);
  box(g, 0.003, 0.001, 0.02, hands, 0, 0.014, -0.005);
  box(g, 0.003, 0.001, 0.014, hands, 0.007, 0.014, 0.002);
  box(g, 0.024, 0.008, 0.09, strap, 0, 0.004, 0.06);
  box(g, 0.024, 0.008, 0.05, strap, 0, 0.004, -0.045);
  return g;
};
OBJ.relojPared = () => {
  const g = new THREE.Group();
  const gold = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  const face = M({ color: 0xf0e8d0, roughness: 0.5 });
  const hands = M({ color: 0x1a1a1e, roughness: 0.7 });
  cyl(g, 0.12, 0.12, 0.04, gold, 0, 0.02, 0, 24);
  cyl(g, 0.11, 0.11, 0.045, face, 0, 0.02, 0, 24);
  for (let i = 0; i < 12; i++){
    const a = (i/12) * Math.PI * 2;
    sph(g, 0.004, gold, Math.cos(a)*0.09, 0.023, Math.sin(a)*0.09);
  }
  box(g, 0.005, 0.005, 0.07, hands, 0, 0.024, -0.035);
  box(g, 0.005, 0.005, 0.05, hands, 0.025, 0.024, 0.008);
  return g;
};
OBJ.movil = () => {
  const g = new THREE.Group();
  const body = M({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.5 });
  const screen = M({ color: 0x1a3050, roughness: 0.05, metalness: 0.3, emissive: 0x2a5080, emissiveIntensity: 0.5 });
  const glass = M({ color: 0x0a0a10, roughness: 0.05 });
  box(g, 0.07, 0.008, 0.14, body, 0, 0.004, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.12), screen);
  s.rotation.x = -Math.PI/2; s.position.y = 0.009; g.add(s);
  cyl(g, 0.005, 0.005, 0.002, glass, 0.02, 0.01, -0.06, 12);
  return g;
};
OBJ.cartera = () => {
  const g = new THREE.Group();
  const leather = M({ color: 0x3a2010, roughness: 0.85 });
  const leatherDark = M({ color: 0x1a0a05, roughness: 0.9 });
  const card = M({ color: 0xf0e8d0, roughness: 0.85 });
  box(g, 0.12, 0.02, 0.09, leather, 0, 0.01, 0);
  box(g, 0.12, 0.005, 0.09, leatherDark, 0, 0.022, 0);
  box(g, 0.1, 0.001, 0.06, card, 0, 0.024, 0.02);
  box(g, 0.1, 0.001, 0.06, M({ color: 0x8a1818, roughness: 0.85 }), 0, 0.025, 0.02);
  box(g, 0.12, 0.001, 0.02, leather, 0, 0.026, -0.02);
  return g;
};
OBJ.monedero = () => {
  const g = new THREE.Group();
  const leather = M({ color: 0x5a3a5a, roughness: 0.85 });
  const metal = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  box(g, 0.08, 0.025, 0.07, leather, 0, 0.0125, 0);
  sph(g, 0.008, metal, 0, 0.027, 0.02);
  return g;
};
OBJ.monedas = () => {
  const g = new THREE.Group();
  const gold = M({ color: 0xc8a860, metalness: 0.95, roughness: 0.15 });
  const silver = M({ color: 0xc0c0c8, metalness: 0.9, roughness: 0.2 });
  [[0, 0, 0, gold], [0.03, 0, 0.005, silver], [-0.02, 0.005, 0.02, gold], [0.02, 0.005, 0.03, silver]].forEach(([x, y, z, mat]) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 16), mat);
    c.position.set(x, y + 0.002, z); c.castShadow = true; g.add(c);
  });
  return g;
};
OBJ.billetes = () => {
  const g = new THREE.Group();
  const bill = M({ color: 0x6a8a6a, roughness: 0.75, side: THREE.DoubleSide });
  const bill2 = M({ color: 0x8a6a8a, roughness: 0.75, side: THREE.DoubleSide });
  box(g, 0.14, 0.001, 0.07, bill, 0, 0.001, 0);
  box(g, 0.14, 0.001, 0.07, bill2, 0.01, 0.003, 0.005);
  box(g, 0.14, 0.001, 0.07, bill, -0.005, 0.005, -0.003);
  return g;
};
OBJ.gafas = () => {
  const g = new THREE.Group();
  const frame = M({ color: 0x1a1a1e, metalness: 0.3, roughness: 0.4 });
  const lens1 = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.03, 20), frame);
  lens1.rotation.x = -Math.PI/2;
  lens1.position.set(-0.035, 0.005, 0); g.add(lens1);
  const lens2 = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.03, 20), frame);
  lens2.rotation.x = -Math.PI/2;
  lens2.position.set(0.035, 0.005, 0); g.add(lens2);
  box(g, 0.02, 0.004, 0.006, frame, 0, 0.005, 0);
  box(g, 0.06, 0.003, 0.008, frame, -0.065, 0.005, 0.005).rotation.z = -0.3;
  box(g, 0.06, 0.003, 0.008, frame, 0.065, 0.005, 0.005).rotation.z = 0.3;
  return g;
};
OBJ.sombrero = () => {
  const g = new THREE.Group();
  const felt = M({ color: 0x2a2a30, roughness: 0.9 });
  const band = M({ color: 0x5a1a1a, roughness: 0.85 });
  cyl(g, 0.11, 0.11, 0.008, felt, 0, 0.004, 0, 32);
  cyl(g, 0.06, 0.07, 0.09, felt, 0, 0.05, 0, 24);
  cyl(g, 0.062, 0.062, 0.015, band, 0, 0.015, 0, 24);
  return g;
};
OBJ.gorra = () => {
  const g = new THREE.Group();
  const fabric = M({ color: 0x2a3a5a, roughness: 0.9 });
  const visor = M({ color: 0x1a1a20, roughness: 0.85 });
  sph(g, 0.075, fabric, 0, 0.065, 0).scale.set(1, 0.7, 1);
  const v = box(g, 0.14, 0.008, 0.09, visor, 0, 0.045, 0.09);
  v.rotation.x = -0.15;
  return g;
};
OBJ.zapato = () => {
  const g = new THREE.Group();
  const leather = M({ color: 0x1a1010, roughness: 0.65 });
  const sole = M({ color: 0x0a0a0a, roughness: 0.9 });
  box(g, 0.12, 0.02, 0.3, sole, 0, 0.01, 0);
  box(g, 0.1, 0.05, 0.2, leather, 0, 0.045, 0.02);
  box(g, 0.09, 0.08, 0.1, leather, 0, 0.08, -0.08);
  box(g, 0.08, 0.05, 0.06, leather, 0, 0.04, -0.12);
  return g;
};
OBJ.pendiente = () => {
  const g = new THREE.Group();
  const gold = M({ color: 0xc8a860, metalness: 0.95, roughness: 0.15 });
  const pearl = M({ color: 0xf0e8d8, roughness: 0.2, metalness: 0.4 });
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 20), gold);
  hoop.rotation.x = Math.PI/2; hoop.position.y = 0.02; g.add(hoop);
  sph(g, 0.014, pearl, 0, 0.005, 0);
  return g;
};
OBJ.joyas = () => {
  const g = new THREE.Group();
  const gold = M({ color: 0xc8a860, metalness: 0.95, roughness: 0.15 });
  const gem = M({ color: 0x4a90e2, metalness: 0.3, roughness: 0.05, transparent: true, opacity: 0.85, emissive: 0x1a3060, emissiveIntensity: 0.3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 10, 24), gold);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.006; g.add(ring);
  const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), gem);
  stone.position.set(0, 0.022, 0); g.add(stone);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 20), gold);
  ring2.rotation.x = Math.PI/2;
  ring2.position.set(0.04, 0.005, 0.02); g.add(ring2);
  return g;
};
OBJ.pulsera = () => {
  const g = new THREE.Group();
  const gold = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.005, 10, 30), gold);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.005; g.add(ring);
  for (let i = 0; i < 4; i++){
    const a = (i / 4) * Math.PI * 2;
    sph(g, 0.006, gold, Math.cos(a) * 0.04, 0.005, Math.sin(a) * 0.04);
  }
  return g;
};
OBJ.cadena = () => {
  const g = new THREE.Group();
  const gold = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.25 });
  for (let i = 0; i < 20; i++){
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0018, 6, 10), gold);
    link.rotation.y = Math.PI/2;
    link.rotation.x = (i % 2) * Math.PI/2;
    link.position.set(0, 0.005, -0.08 + i*0.008);
    g.add(link);
  }
  return g;
};
OBJ.medalla = () => {
  const g = new THREE.Group();
  const gold = M({ color: 0xc8a860, metalness: 0.95, roughness: 0.15 });
  const band = M({ color: 0x8a1818, roughness: 0.85 });
  box(g, 0.04, 0.001, 0.06, band, 0, 0.001, -0.03);
  cyl(g, 0.025, 0.025, 0.004, gold, 0, 0.004, 0, 24);
  sph(g, 0.012, gold, 0, 0.008, 0);
  return g;
};
OBJ.huella = () => {
  const g = new THREE.Group();
  const dark = M({ color: 0x2a1a10, roughness: 0.8 });
  for (let i = 0; i < 5; i++){
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.012 + i*0.006, 0.014 + i*0.006, 24, 1, -Math.PI/2, Math.PI * 1.3), dark);
    arc.rotation.x = -Math.PI/2;
    arc.position.y = 0.002 + i*0.0003;
    g.add(arc);
  }
  return g;
};
OBJ.casquillo = () => {
  const g = new THREE.Group();
  const brass = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.25 });
  const primer = M({ color: 0x4a3a2a, roughness: 0.7 });
  cyl(g, 0.006, 0.006, 0.022, brass, 0, 0.011, 0, 14);
  cyl(g, 0.004, 0.004, 0.002, primer, 0, 0.001, 0, 14);
  cyl(g, 0.0065, 0.0065, 0.002, brass, 0, 0.021, 0, 14);
  return g;
};
OBJ.bala = () => {
  const g = new THREE.Group();
  const lead = M({ color: 0x8a7a6a, metalness: 0.6, roughness: 0.5 });
  const copper = M({ color: 0xb08050, metalness: 0.85, roughness: 0.3 });
  cyl(g, 0.005, 0.005, 0.018, copper, 0, 0.009, 0, 12);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.012, 12), lead);
  tip.position.y = 0.024; g.add(tip);
  return g;
};
OBJ.mancha = () => {
  const g = new THREE.Group();
  const blood = M({ color: 0x5a0a08, roughness: 0.5, transparent: true, opacity: 0.9 });
  const circle = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), blood);
  circle.rotation.x = -Math.PI/2;
  circle.position.y = 0.002;
  circle.scale.set(1.2, 0.8, 1);
  g.add(circle);
  for (let i = 0; i < 5; i++){
    const drop = new THREE.Mesh(new THREE.CircleGeometry(0.01 + Math.random()*0.015, 12), blood);
    drop.rotation.x = -Math.PI/2;
    const a = Math.random() * Math.PI * 2;
    const r = 0.1 + Math.random()*0.08;
    drop.position.set(Math.cos(a)*r, 0.002, Math.sin(a)*r);
    g.add(drop);
  }
  return g;
};
OBJ.polvo = () => {
  const g = new THREE.Group();
  const dust = M({ color: 0xf0e8d0, roughness: 0.95, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 40; i++){
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.003 + Math.random()*0.003, 6, 5), dust);
    p.position.set((Math.random()-0.5)*0.1, 0.002 + Math.random()*0.005, (Math.random()-0.5)*0.1);
    g.add(p);
  }
  return g;
};
OBJ.flores = () => {
  const g = new THREE.Group();
  const green = M({ color: 0x2a4a1a, roughness: 0.9 });
  const red = M({ color: 0xc02020, roughness: 0.7, side: THREE.DoubleSide });
  const pink = M({ color: 0xd06080, roughness: 0.7, side: THREE.DoubleSide });
  cyl(g, 0.004, 0.006, 0.24, green, 0, 0.12, 0, 8);
  for (let i = 0; i < 4; i++){
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.08), green);
    leaf.position.set((Math.random()-0.5)*0.05, 0.05 + i*0.05, (Math.random()-0.5)*0.05);
    leaf.rotation.z = -0.5 + Math.random();
    leaf.rotation.y = Math.random() * Math.PI * 2;
    g.add(leaf);
  }
  const petalsMat = [red, pink, red];
  for (let i = 0; i < 8; i++){
    const angle = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), petalsMat[i % 3]);
    petal.position.set(Math.cos(angle) * 0.018, 0.25, Math.sin(angle) * 0.018);
    petal.lookAt(0, 0.25, 0);
    g.add(petal);
  }
  sph(g, 0.012, M({ color: 0xf0d040, roughness: 0.7 }), 0, 0.255, 0);
  return g;
};
OBJ.vela = () => {
  const g = new THREE.Group();
  const wax = M({ color: 0xe8e0c0, roughness: 0.85 });
  const wick = M({ color: 0x1a1a1e, roughness: 0.9 });
  const holder = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.25 });
  cyl(g, 0.03, 0.035, 0.015, holder, 0, 0.008, 0, 20);
  cyl(g, 0.018, 0.018, 0.14, wax, 0, 0.09, 0, 20);
  box(g, 0.002, 0.012, 0.002, wick, 0, 0.165, 0);
  return g;
};
OBJ.cerillas = () => {
  const g = new THREE.Group();
  const wood = M({ color: 0xe0c090, roughness: 0.9 });
  const head = M({ color: 0x8a1818, roughness: 0.7 });
  for (let i = 0; i < 8; i++){
    const m = cyl(g, 0.0015, 0.0015, 0.05, wood, -0.008 + i*0.002, 0.025, (Math.random()-0.5)*0.005, 6);
    m.rotation.z = (Math.random()-0.5) * 0.2;
    sph(g, 0.003, head, -0.008 + i*0.002, 0.05, 0);
  }
  return g;
};
OBJ.cenicero = () => {
  const g = new THREE.Group();
  const glass = M({ color: 0x2a2a30, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.85 });
  const ash = M({ color: 0x8a8070, roughness: 1 });
  cyl(g, 0.055, 0.06, 0.02, glass, 0, 0.01, 0, 24);
  cyl(g, 0.045, 0.045, 0.003, ash, 0, 0.019, 0, 20);
  const colilla = box(g, 0.008, 0.008, 0.03, M({ color: 0xf0e8d0, roughness: 0.9 }), 0.02, 0.023, 0);
  colilla.rotation.y = 0.5;
  return g;
};
OBJ.cuerda = () => {
  const g = new THREE.Group();
  const rope = M({ color: 0x8a6a3a, roughness: 0.95 });
  const curve = new THREE.TorusKnotGeometry(0.06, 0.01, 64, 8, 2, 3);
  const knot = new THREE.Mesh(curve, rope);
  knot.position.y = 0.02; knot.scale.set(1, 0.4, 1);
  knot.castShadow = true;
  g.add(knot);
  return g;
};
OBJ.baston = () => {
  const g = new THREE.Group();
  const wood = M({ color: 0x3a2010, roughness: 0.85 });
  const brass = M({ color: 0xc8a860, metalness: 0.9, roughness: 0.2 });
  cyl(g, 0.014, 0.02, 0.85, wood, 0, 0.425, 0, 12);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 10, 20, Math.PI), brass);
  handle.position.set(0, 0.85, 0); handle.rotation.x = Math.PI/2; g.add(handle);
  return g;
};
OBJ.paraguas = () => {
  const g = new THREE.Group();
  const fabric = M({ color: 0x2a2a30, roughness: 0.8 });
  const metal = M({ color: 0x1a1a1e, metalness: 0.7, roughness: 0.4 });
  const handle = M({ color: 0x5a3a20, roughness: 0.85 });
  cyl(g, 0.02, 0.02, 0.75, fabric, 0, 0.375, 0, 16);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.2, 16, 1, true), fabric);
  canopy.position.y = 0.85; g.add(canopy);
  cyl(g, 0.008, 0.008, 0.15, metal, 0, 0.9, 0, 8);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 8, 16, Math.PI), handle);
  h.position.y = 0.02; h.rotation.x = Math.PI/2; g.add(h);
  return g;
};
OBJ.marco = () => {
  const g = new THREE.Group();
  const frame = M({ color: 0x4a3d22, roughness: 0.6, metalness: 0.2 });
  const image = M({ color: 0x6a5a4a, roughness: 0.85 });
  box(g, 0.14, 0.02, 0.18, frame, 0, 0.01, 0);
  const img = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.13), image);
  img.rotation.x = -Math.PI/2; img.position.y = 0.022; g.add(img);
  return g;
};
OBJ.camara = () => {
  const g = new THREE.Group();
  const body = M({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.5 });
  const lens = M({ color: 0x0a0a10, metalness: 0.7, roughness: 0.2 });
  const lensGlass = M({ color: 0x2a4a5a, roughness: 0.05, metalness: 0.5, emissive: 0x0a1a2a });
  box(g, 0.12, 0.08, 0.05, body, 0, 0.04, 0);
  cyl(g, 0.025, 0.03, 0.05, lens, 0, 0.04, 0.05, 20).rotation.x = Math.PI/2;
  cyl(g, 0.02, 0.02, 0.003, lensGlass, 0, 0.04, 0.076, 16).rotation.x = Math.PI/2;
  box(g, 0.02, 0.015, 0.02, body, -0.04, 0.087, 0);
  box(g, 0.03, 0.008, 0.03, body, 0.04, 0.087, 0);
  return g;
};
OBJ.grabadora = () => {
  const g = new THREE.Group();
  const body = M({ color: 0x2a2a30, roughness: 0.6, metalness: 0.3 });
  const screen = M({ color: 0x1a3050, emissive: 0x2a5080, emissiveIntensity: 0.4, roughness: 0.3 });
  box(g, 0.1, 0.025, 0.06, body, 0, 0.0125, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.015), screen);
  s.rotation.x = -Math.PI/2; s.position.y = 0.026; s.position.z = -0.01; g.add(s);
  box(g, 0.015, 0.003, 0.015, body, -0.035, 0.027, 0.015);
  box(g, 0.015, 0.003, 0.015, body, 0.035, 0.027, 0.015);
  return g;
};
OBJ.usb = () => {
  const g = new THREE.Group();
  const body = M({ color: 0x2a2a30, roughness: 0.5 });
  const metal = M({ color: 0xc0c0c8, metalness: 0.9, roughness: 0.2 });
  box(g, 0.018, 0.008, 0.04, body, 0, 0.004, 0);
  box(g, 0.012, 0.005, 0.012, metal, 0, 0.004, -0.026);
  return g;
};
OBJ.dvd = () => {
  const g = new THREE.Group();
  const disc = M({ color: 0xc0c8d0, metalness: 0.6, roughness: 0.1 });
  const label = M({ color: 0x4a2a5a, roughness: 0.5 });
  cyl(g, 0.06, 0.06, 0.0015, disc, 0, 0.001, 0, 40);
  cyl(g, 0.045, 0.045, 0.002, label, 0, 0.0018, 0, 40);
  cyl(g, 0.008, 0.008, 0.001, disc, 0, 0.001, 0, 20);
  return g;
};

function getObjectModel(obj){
  const id = (obj.id || '').toLowerCase();
  const name = (obj.name || '').toLowerCase();
  if (OBJ[id]) return OBJ[id];
  const map = [
    ['taza','taza'],['té','taza'],['te ','taza'],['termo','taza'],
    ['azucarero','azucarero'],['azúcar','azucarero'],
    ['vaso','vaso'],['whisky','vaso'],['brandy','vaso'],['licor','vaso'],
    ['copa','copa'],['champán','copa'],['champan','copa'],
    ['botella','botella'],['licorera','botella'],
    ['frasco','frasco'],['bote','frasco'],['somnífero','frasco'],['somni','frasco'],
    ['muestra','frasco'],['reactivo','frasco'],['vial','frasco'],
    ['lata','lata'],['refresco','lata'],
    ['tetera','tetera'],['hervidor','tetera'],
    ['bandeja','bandeja'],
    ['cuchillo','cuchillo'],['tijeras','tijeras'],['podar','tijeras'],
    ['pistola','pistola'],['revólver','pistola'],['arma','pistola'],
    ['martillo','martillo'],['destornillador','destornillador'],
    ['alicates','alicates'],['llave inglesa','llaveInglesa'],['herramienta','llaveInglesa'],
    ['cuchilla','cuchilla'],['navaja','cuchilla'],
    ['carta','carta'],['nota','carta'],['programa','carta'],['mensaje','carta'],
    ['sobre','sobre'],['envoltorio','sobre'],
    ['libro','libro'],['cuaderno','cuaderno'],['diario','libro'],['testamento','libro'],
    ['manuscrito','libro'],['catálogo','libro'],['catalogo','libro'],['bitácora','libro'],['libro de cuentas','libro'],
    ['periódico','periodico'],['periodico','periodico'],['revista','revista'],
    ['carpeta','carpeta'],
    ['certificado','certificado'],['diploma','certificado'],['licencia','certificado'],
    ['foto','foto'],['fotografía','foto'],
    ['ticket','ticket'],['entrada','ticket'],
    ['pañuelo','panuelo'],['panuelo','panuelo'],
    ['guante','guantes'],['guantes','guantes'],
    ['llave','llave'],['llavero','llavero'],
    ['reloj de pared','relojPared'],['reloj','reloj'],
    ['móvil','movil'],['movil','movil'],['teléfono','movil'],['telefono','movil'],
    ['cartera','cartera'],['monedero','monedero'],
    ['moneda','monedas'],['dinero','billetes'],['billete','billetes'],
    ['gafas','gafas'],['anteojos','gafas'],
    ['sombrero','sombrero'],['gorra','gorra'],
    ['zapato','zapato'],['zapatilla','zapato'],
    ['pendiente','pendiente'],
    ['joya','joyas'],['joyas','joyas'],['anillo','joyas'],['collar','joyas'],['zafiro','joyas'],
    ['pulsera','pulsera'],['cadena','cadena'],['medalla','medalla'],
    ['huella','huella'],
    ['casquillo','casquillo'],['vaina','casquillo'],
    ['bala','bala'],['proyectil','bala'],
    ['mancha','mancha'],['sangre','mancha'],
    ['polvo','polvo'],['talco','polvo'],
    ['flor','flores'],['rosa','flores'],['ramo','flores'],
    ['vela','vela'],['cirio','vela'],
    ['cerilla','cerillas'],['cerillas','cerillas'],
    ['cenicero','cenicero'],
    ['cuerda','cuerda'],['soga','cuerda'],['cabo','cuerda'],
    ['bastón','baston'],['baston','baston'],
    ['paraguas','paraguas'],
    ['marco','marco'],
    ['cámara','camara'],['camara','camara'],
    ['grabadora','grabadora'],
    ['usb','usb'],['pendrive','usb'],['memoria','usb'],
    ['dvd','dvd'],['cd','dvd'],['disco','dvd']
  ];
  for (const [kw, type] of map){
    if (name.includes(kw) && OBJ[type]) return OBJ[type];
  }
  const icon = obj.icon || '';
  if (['🍷','🥃','🥂','🍾','🥤','🍵','☕'].includes(icon)) return OBJ.vaso;
  if (['🔪','🗡️','⚔️'].includes(icon)) return OBJ.cuchillo;
  if (['🔫'].includes(icon)) return OBJ.pistola;
  if (['🔑','🗝️'].includes(icon)) return OBJ.llave;
  if (['📱','📲'].includes(icon)) return OBJ.movil;
  if (['📖','📚','📓','📔','📕'].includes(icon)) return OBJ.libro;
  if (['📝','✉️','📜','📄','💌'].includes(icon)) return OBJ.carta;
  if (['💎','💍'].includes(icon)) return OBJ.joyas;
  if (['🧤'].includes(icon)) return OBJ.guantes;
  if (['🧣'].includes(icon)) return OBJ.panuelo;
  if (['🔧','🔨','🛠️'].includes(icon)) return OBJ.llaveInglesa;
  if (['💊','🧪','💉'].includes(icon)) return OBJ.frasco;
  if (['🩸'].includes(icon)) return OBJ.mancha;
  if (['🔦','💡','🕯️'].includes(icon)) return OBJ.vela;
  if (['🎩','👒','🧢'].includes(icon)) return OBJ.sombrero;
  if (['👞','👟','👠'].includes(icon)) return OBJ.zapato;
  if (['🕰️','⌚','⏰'].includes(icon)) return OBJ.reloj;
  if (['📷','📸','🎥'].includes(icon)) return OBJ.camara;
  return () => {
    const g = new THREE.Group();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.08), M({ color: 0x8a6a3a, roughness: 0.7 }));
    m.position.y = 0.025; m.castShadow = true; g.add(m);
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.008, 0.085), M({ color: 0xa8884a, roughness: 0.6 }));
    top.position.y = 0.054; g.add(top);
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

  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), blood);
  pool.rotation.x = -Math.PI/2; pool.position.y = 0.008;
  pool.scale.set(1, 1.4, 1); g.add(pool);
  for (let i = 0; i < 12; i++){
    const r = 0.05 + Math.random()*0.2;
    const s = new THREE.Mesh(new THREE.CircleGeometry(r, 16), bloodDark);
    s.rotation.x = -Math.PI/2;
    s.position.set((Math.random()-0.5)*2.6, 0.01, (Math.random()-0.5)*3);
    s.scale.set(1, 0.6 + Math.random()*0.8, 1);
    g.add(s);
  }

  const yb = 0.14;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), skin);
  head.position.set(0, yb, -0.68);
  head.scale.set(0.9, 1.0, 1.15);
  head.castShadow = true;
  head.rotation.y = pose.headY;
  g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 24, 16, 0, Math.PI*2, 0, Math.PI*0.5),
    M({ color: 0x2a1810, roughness: 0.95 }));
  hair.position.set(0, yb + 0.01, -0.68);
  hair.scale.set(0.9, 1.0, 1.15);
  g.add(hair);

  box(g, 0.14, 0.1, 0.14, skin, 0, yb, -0.5);
  box(g, 0.5, 0.26, 0.85, shirt, 0, yb, 0);
  box(g, 0.02, 0.03, 0.02, M({ color: 0xf0e8d0, roughness: 0.5 }), 0, yb + 0.05, -0.15);
  box(g, 0.02, 0.03, 0.02, M({ color: 0xf0e8d0, roughness: 0.5 }), 0, yb + 0.05, 0.0);
  box(g, 0.02, 0.03, 0.02, M({ color: 0xf0e8d0, roughness: 0.5 }), 0, yb + 0.05, 0.15);
  box(g, 0.46, 0.24, 0.24, pants, 0, yb, 0.55);

  function buildArm(side, rotY){
    const grp = new THREE.Group();
    box(grp, 0.13, 0.14, 0.42, shirt, 0, 0, -0.21);
    box(grp, 0.12, 0.13, 0.4, shirt, 0, 0, -0.62);
    box(grp, 0.1, 0.11, 0.12, skin, 0, 0, -0.88);
    box(grp, 0.09, 0.05, 0.06, skin, 0, -0.02, -0.96);
    grp.position.set(side * 0.36, yb, -0.24);
    grp.rotation.y = rotY;
    return grp;
  }
  g.add(buildArm(-1, pose.armL));
  g.add(buildArm(1, pose.armR));

  function buildLeg(side, rotY){
    const grp = new THREE.Group();
    box(grp, 0.16, 0.16, 0.5, pants, 0, 0, 0.25);
    box(grp, 0.14, 0.15, 0.1, pants, 0, 0, 0.55);
    box(grp, 0.13, 0.14, 0.45, pants, 0, 0, 0.82);
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
   BASE HABITACIÓN (v2 con wainscoting, vigas, columnas)
   ==================================================================== */
function buildRoomBase(scene, config){
  const SIZE = config.size, H = config.height;
  World.roomHalf = SIZE/2;
  World.roomHeight = H;
  World.bounds = { minX: -SIZE/2 + 0.45, maxX: SIZE/2 - 0.45, minZ: -SIZE/2 + 0.45, maxZ: SIZE/2 - 0.45 };
  const half = SIZE/2;

  // FLOOR
  const floorTex = config.floorTex();
  floorTex.repeat.set(SIZE/2, SIZE/2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), texMat(floorTex, { roughness: 0.85, bumpScale: 0.04 }));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

  // CEILING
  const ceilTex = texCeiling();
  ceilTex.repeat.set(SIZE/3, SIZE/3);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), texMat(ceilTex, { roughness: 1, color: 0xa8a8a8 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; ceil.receiveShadow = true; scene.add(ceil);

  // CEILING BEAMS
  if (config.beams){
    const beamMat = M({ color: 0x2a1808, roughness: 0.85 });
    const n = config.beams;
    for (let i = 1; i < n; i++){
      const z = -half + (SIZE / n) * i;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(SIZE - 0.2, 0.16, 0.22), beamMat);
      beam.position.set(0, H - 0.08, z);
      beam.castShadow = true;
      scene.add(beam);
    }
  }

  // WALLS
  const wallTex = config.wallTex();
  wallTex.repeat.set(SIZE/2.5, H/2.5);
  const wallMat = texMat(wallTex, { roughness: 0.92, bumpScale: 0.03 });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  [
    { pos: [0, H/2, -half], rot: 0 },
    { pos: [0, H/2, half], rot: Math.PI },
    { pos: [-half, H/2, 0], rot: Math.PI/2 },
    { pos: [half, H/2, 0], rot: -Math.PI/2 }
  ].forEach(w => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(...w.pos); m.rotation.y = w.rot;
    m.receiveShadow = true; scene.add(m);
  });

  // WAINSCOTING
  if (config.wainscot){
    const wainMat = config.wainscotMat || M({ color: 0x2a1d10, roughness: 0.65 });
    const railMat = M({ color: 0x3a2a14, roughness: 0.55 });
    const woodDark = M({ color: 0x1a120a, roughness: 0.8 });
    const wainH = config.wainscotH || 1.05;
    const panelH = wainH - 0.06;

    // Baseboard
    const bbH = 0.14, bbT = 0.05;
    [[0, -half + bbT/2, SIZE, bbT], [0, half - bbT/2, SIZE, bbT],
     [-half + bbT/2, 0, bbT, SIZE], [half - bbT/2, 0, bbT, SIZE]].forEach(([x, z, w, d]) => {
      const gb = new THREE.Mesh(new THREE.BoxGeometry(w, bbH, d), woodDark);
      gb.position.set(x, bbH/2, z);
      gb.castShadow = true;
      scene.add(gb);
    });

    // Panels + rail + stiles por lado
    for (let side = 0; side < 4; side++){
      const horiz = side < 2;
      const cx = side === 3 ? half - 0.03 : side === 2 ? -half + 0.03 : 0;
      const cz = side === 0 ? -half + 0.03 : side === 1 ? half - 0.03 : 0;
      const rotY = horiz ? 0 : Math.PI/2;

      const panel = new THREE.Mesh(new THREE.BoxGeometry(SIZE - 0.12, panelH, 0.06), wainMat);
      if (horiz){ panel.position.set(0, panelH/2, cz); }
      else { panel.position.set(cx, panelH/2, 0); panel.rotation.y = rotY; }
      panel.receiveShadow = true; panel.castShadow = true;
      scene.add(panel);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(SIZE, 0.06, 0.1), railMat);
      if (horiz){ rail.position.set(0, panelH + 0.03, cz); }
      else { rail.position.set(cx, panelH + 0.03, 0); rail.rotation.y = rotY; }
      scene.add(rail);

      const stileCount = Math.max(3, Math.floor(SIZE / 1.2));
      for (let i = 0; i <= stileCount; i++){
        const t = i / stileCount;
        const along = (t - 0.5) * (SIZE - 0.24);
        const stile = new THREE.Mesh(new THREE.BoxGeometry(0.05, panelH + 0.02, 0.09), woodDark);
        if (horiz){ stile.position.set(along, panelH/2 + 0.01, cz + 0.015); }
        else { stile.position.set(cx + 0.015, panelH/2 + 0.01, along); stile.rotation.y = rotY; }
        stile.castShadow = true;
        scene.add(stile);
      }
    }
  } else {
    // Zócalo simple si no hay wainscot
    const baseMat = M({ color: 0x3a2f1e, roughness: 0.8 });
    const bh = 0.18, bt = 0.06;
    [
      [0, bh/2, -half + bt/2, SIZE, bh, bt],
      [0, bh/2, half - bt/2, SIZE, bh, bt],
      [-half + bt/2, bh/2, 0, bt, bh, SIZE],
      [half - bt/2, bh/2, 0, bt, bh, SIZE]
    ].forEach(([x, y, z, w, h, d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), baseMat);
      m.position.set(x, y, z); m.receiveShadow = true; scene.add(m);
    });
  }

  // Cornisa
  const cornMat = M({ color: 0x2a2010, roughness: 0.6 });
  const cH = 0.14, cT = 0.09;
  [
    [0, H - cH/2, -half + cT/2, SIZE, cH, cT],
    [0, H - cH/2, half - cT/2, SIZE, cH, cT],
    [-half + cT/2, H - cH/2, 0, cT, cH, SIZE],
    [half - cT/2, H - cH/2, 0, cT, cH, SIZE]
  ].forEach(([x, y, z, w, h, d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cornMat);
    m.position.set(x, y, z); m.castShadow = true;
    scene.add(m);
  });

  // Columnas
  if (config.columns){
    const colMat = M({ color: 0xb8a888, roughness: 0.75 });
    const colBaseMat = M({ color: 0x3a2a14, roughness: 0.7 });
    config.columns.forEach(([cx, cz]) => {
      const g = new THREE.Group();
      cyl(g, 0.24, 0.28, 0.14, colBaseMat, 0, 0.07, 0, 12);
      cyl(g, 0.2, 0.22, H - 0.5, colMat, 0, H/2, 0, 16);
      cyl(g, 0.26, 0.22, 0.12, colBaseMat, 0, H - 0.22, 0, 12);
      cyl(g, 0.28, 0.24, 0.1, colBaseMat, 0, H - 0.05, 0, 12);
      g.position.set(cx, 0, cz);
      scene.add(g);
      addObstacle(cx, cz, 0.55, 0.55, 0);
    });
  }

  // DUST
  const dustGeo = new THREE.BufferGeometry();
  const dustCount = 340;
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount * 3; i += 3){
    positions[i] = (Math.random()-0.5) * SIZE;
    positions[i+1] = Math.random() * H;
    positions[i+2] = (Math.random()-0.5) * SIZE;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xffd682, size: 0.022, transparent: true, opacity: 0.35,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);
  World.dust = dust;

  scene.add(new THREE.AmbientLight(0x606070, 0.55));
  scene.add(new THREE.HemisphereLight(0x9090b0, 0x201008, 0.35));
}

/* ====================================================================
   POSICIONES DE OBJETOS
   ==================================================================== */
function objectPositionsFor(sceneType){
  switch(sceneType){
    case 'despacho': return [
      {x: -3.40, y: 0.80, z: -2.48},
      {x: -2.90, y: 0.80, z: -2.20},
      {x: -2.30, y: 0.80, z: -2.55},
      {x: -1.75, y: 0.80, z: -2.30},
      {x:  5.25, y: 1.00, z:  1.80},
      {x:  5.25, y: 1.65, z:  0.60},
      {x:  5.25, y: 0.85, z: -1.80},
      {x:  3.70, y: 1.66, z:  3.50}
    ];
    case 'dormitorio': return [
      {x: -4.50, y: 0.87, z: -3.90},
      {x: -3.60, y: 0.87, z: -3.90},
      {x: -5.20, y: 0.66, z: -4.30},
      {x: -3.60, y: 0.66, z: -4.30},
      {x: -1.80, y: 0.66, z: -4.30},
      {x:  4.80, y: 1.80, z: -3.50},
      {x:  5.40, y: 1.30, z: -3.50},
      {x:  1.50, y: 0.10, z:  3.50}
    ];
    case 'biblioteca': return [
      {x: -3.50, y: 2.10, z: -6.20},
      {x: -3.50, y: 1.45, z: -6.20},
      {x:  0.00, y: 2.10, z: -6.20},
      {x:  0.00, y: 1.45, z: -6.20},
      {x:  3.50, y: 2.10, z: -6.20},
      {x: -0.70, y: 0.80, z:  1.50},
      {x:  0.30, y: 0.80, z:  1.50},
      {x:  0.80, y: 0.80, z:  1.30}
    ];
    case 'exterior': return [
      {x: 3.00, y: 0.61, z: -3.00},
      {x: 2.30, y: 0.61, z: -3.00},
      {x: 3.70, y: 0.61, z: -3.00},
      {x: 0.00, y: 0.05, z:  0.00},
      {x: 1.20, y: 0.05, z:  0.80},
      {x:-0.80, y: 0.05, z:  1.50},
      {x: 2.20, y: 0.05, z:  2.30},
      {x:-1.80, y: 0.05, z: -2.40}
    ];
    case 'teatro': return [
      {x: 2.30, y: 0.80, z: -1.80},
      {x: 1.80, y: 0.80, z: -2.10},
      {x: 2.80, y: 0.80, z: -2.10},
      {x:-3.30, y: 0.85, z: -3.10},
      {x:-3.50, y: 0.85, z:  3.30},
      {x: 3.20, y: 0.05, z:  3.20},
      {x: 3.80, y: 0.05, z:  3.50},
      {x:-4.50, y: 0.05, z:  1.00}
    ];
    default: return [
      {x: 0, y: 0.8, z: -2}, {x: 1, y: 0.8, z: -2}, {x: -1, y: 0.8, z: -2},
      {x: 2, y: 0.8, z: -2}, {x: -2, y: 0.8, z: -2}, {x: 0, y: 0.05, z: 0},
      {x: 1, y: 0.05, z: 1}, {x: -1, y: 0.05, z: 1}
    ];
  }
}

/* ====================================================================
   HABITACIONES
   ==================================================================== */
function roomDespacho(scene, ov){
  ov = ov || {};
  buildRoomBase(scene, Object.assign({
    size: 11, height: 3.0, floorTex: texParquet,
    wallTex: () => texWallpaper('#4a4030', 'rgba(0,0,0,0.1)', 6, { damask: true, damaskColor: '#221a0c' }),
    wainscot: true, wainscotH: 1.1,
    wainscotMat: M({ color: 0x3a2a14, roughness: 0.7 }),
    beams: 4,
    columns: [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]]
  }, ov));
  const half = 5.5;
  buildRug(scene, -0.5, 0.2, 3.5, 2.5, 0.1, ['#4a2010', 'rgba(212,160,23,0.45)']);
  buildPainting(scene, 1.5, 1.9, -half + 0.06, 0, 1.6, 1.2, 0);
  buildPainting(scene, -0.3, 1.9, -half + 0.06, 0, 0.9, 0.9, 1);
  buildWindow(scene, -half + 0.08, 1.85, -1.8, Math.PI/2, 2.0, 1.5);
  buildDoor(scene, half - 0.08, 2.5, -Math.PI/2, 1.0, 2.2);
  buildDesk(scene, -2.6, -2.4, Math.PI * 0.1);
  buildChair(scene, -2.6, -1.2, Math.PI);
  buildTableLamp(scene, -3.4, 0.79, -2.4);
  buildCabinet(scene, half - 1.8, 3.5, Math.PI);
  buildBookshelf(scene, half - 0.25, 1.2, -Math.PI/2, 2.2, 2.6);
  buildBookshelf(scene, half - 0.25, -1.8, -Math.PI/2, 2.2, 2.6);
  buildPlant(scene, -half + 1, -half + 1);
  buildPlant(scene, half - 1.2, half - 1.2);
  buildVase(scene, half - 1.85, 1.66, 3.5);
  buildCeilingLamp(scene, 0, 0, 1.8);
  buildCeilingLamp(scene, 3, -3, 1.4);
  return { corpsePos: { x: 0.8, z: 1.5, rot: Math.PI * 0.2 }, pose: 'supine', spawn: { x: 0, z: 4.2 } };
}

function roomDormitorio(scene, ov){
  ov = ov || {};
  buildRoomBase(scene, Object.assign({
    size: 11, height: 3.0, floorTex: texParquet,
    wallTex: () => texWallpaper('#3a3545', 'rgba(0,0,0,0.12)', 5, { damask: true }),
    wainscot: true, wainscotH: 0.9,
    wainscotMat: M({ color: 0x2a1d28, roughness: 0.7 })
  }, ov));
  const half = 5.5;
  buildRug(scene, 1.5, 1.5, 3.2, 2.4, 0, ['#3a1818', 'rgba(180,140,80,0.4)']);
  buildPainting(scene, -2.0, 1.9, -half + 0.06, 0, 1.4, 1.0, 2);
  buildWindow(scene, half - 0.08, 1.85, -1.8, -Math.PI/2, 2.0, 1.5);
  buildDoor(scene, -half + 0.08, 2.6, Math.PI/2, 1.0, 2.2);
  buildBed(scene, -half + 2.2, -half + 1.8, 0);
  buildNightstand(scene, -half + 0.85, -half + 1.8, 0);
  buildTableLamp(scene, -half + 0.85, 0.65, -half + 1.8);
  buildNightstand(scene, -half + 3.55, -half + 1.8, 0);
  buildTableLamp(scene, -half + 3.55, 0.65, -half + 1.8);
  buildWardrobe(scene, half - 0.7, -half + 1.8, -Math.PI/2);
  buildPlant(scene, half - 1.2, half - 1.2);
  buildVase(scene, -half + 0.85, 0.66, -half + 1.8);
  buildCeilingLamp(scene, 0, 0, 1.6);
  return { corpsePos: { x: 1.5, z: 1.0, rot: Math.PI * 0.3 }, pose: 'side', spawn: { x: -1, z: 4.0 } };
}

function roomBiblioteca(scene, ov){
  ov = ov || {};
  buildRoomBase(scene, Object.assign({
    size: 13, height: 3.5, floorTex: texMarble,
    wallTex: () => texWallpaper('#2a2820', 'rgba(0,0,0,0.14)', 4),
    wainscot: true, wainscotH: 1.2,
    wainscotMat: M({ color: 0x3a2a18, roughness: 0.6 }),
    beams: 5,
    columns: [[-4, -4], [4, -4], [-4, 4], [4, 4]]
  }, ov));
  const half = 6.5;
  buildRug(scene, 0, 1.5, 4, 3, 0, ['#4a2020', 'rgba(180,140,80,0.5)']);
  buildPainting(scene, -3.5, 2.4, -half + 0.06, 0, 1.4, 1.0, 0);
  buildPainting(scene, 0, 2.6, -half + 0.06, 0, 2.0, 1.4, 3);
  buildPainting(scene, 3.5, 2.4, -half + 0.06, 0, 1.4, 1.0, 4);
  buildWindow(scene, -half + 0.08, 2.0, -2.5, Math.PI/2, 2.0, 1.6);
  buildWindow(scene, -half + 0.08, 2.0, 2.5, Math.PI/2, 2.0, 1.6);
  buildDoor(scene, half - 0.08, 2.5, -Math.PI/2, 1.1, 2.3);
  buildBookshelf(scene, -3.5, -half + 0.3, 0, 2.4, 3.0);
  buildBookshelf(scene, 0, -half + 0.3, 0, 2.4, 3.0);
  buildBookshelf(scene, 3.5, -half + 0.3, 0, 2.4, 3.0);
  buildBookshelf(scene, -half + 0.3, -1.8, Math.PI/2, 2.4, 3.0);
  buildBookshelf(scene, -half + 0.3, 1.8, Math.PI/2, 2.4, 3.0);
  buildBookshelf(scene, half - 0.3, -1.8, -Math.PI/2, 2.4, 3.0);
  buildBookshelf(scene, half - 0.3, 1.8, -Math.PI/2, 2.4, 3.0);
  buildDesk(scene, 0, 1.5, 0);
  buildChair(scene, 0, 2.7, Math.PI);
  buildChair(scene, 0, 0.3, 0);
  buildTableLamp(scene, -0.7, 0.79, 1.5);
  buildCabinet(scene, -half + 1.5, half - 1.5, Math.PI);
  buildPlant(scene, half - 1.5, half - 1.5);
  buildVase(scene, -half + 1.5, 1.66, half - 1.5);
  buildCeilingLamp(scene, -3, 0, 1.5);
  buildCeilingLamp(scene, 3, 0, 1.5);
  return { corpsePos: { x: 0.8, z: 0.5, rot: Math.PI * 0.5 }, pose: 'prone', spawn: { x: 4, z: 4.5 } };
}

function roomExterior(scene, ov){
  ov = ov || {};
  const SIZE = ov.size || 24;
  World.roomHalf = SIZE/2;
  World.roomHeight = 14;
  World.bounds = { minX: -SIZE/2 + 1, maxX: SIZE/2 - 1, minZ: -SIZE/2 + 1, maxZ: SIZE/2 - 1 };

  const gt = texGrass();
  gt.repeat.set(12, 12);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), texMat(gt, { roughness: 1 }));
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);

  const sky = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x080818, side: THREE.BackSide, fog: false }));
  scene.add(sky);

  for (let i = 0; i < 220; i++){
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.05 + Math.random()*0.1, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 + Math.random()*0.6, fog: false }));
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.4;
    const r = 70;
    star.position.set(Math.cos(theta) * Math.sin(phi + Math.PI/3) * r, Math.cos(phi) * r, Math.sin(theta) * Math.sin(phi + Math.PI/3) * r);
    star.lookAt(0, 0, 0);
    scene.add(star);
  }

  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.5, 32),
    new THREE.MeshBasicMaterial({ color: 0xf0e8d8, fog: false }));
  moon.position.set(-25, 30, -40);
  moon.lookAt(0, 1, 0); scene.add(moon);

  [[-9,-9,1.4], [8,-10,1.2], [-10,7,1.1], [9,8,1.3], [0,-11,1.1], [-5, 10, 1.2], [11, -3, 1.1], [-11, 1, 1.2]].forEach(([x,z,s]) => {
    buildTree(scene, x, z, s);
  });

  buildBench(scene, 3, -3, -Math.PI/6);
  buildLampPost(scene, -6, -2);
  buildLampPost(scene, 6, 4);
  buildLampPost(scene, -3, -8);
  buildLampPost(scene, 8, -6);

  scene.add(new THREE.AmbientLight(0x404060, 0.35));
  const moonLight = new THREE.DirectionalLight(0x8090ff, 0.5);
  moonLight.position.set(-20, 25, -30);
  scene.add(moonLight);

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

function roomTeatro(scene, ov){
  ov = ov || {};
  const SIZE = ov.size || 14, H = ov.height || 5;
  World.roomHalf = SIZE/2;
  World.roomHeight = H;
  World.bounds = { minX: -SIZE/2 + 0.6, maxX: SIZE/2 - 0.6, minZ: -SIZE/2 + 0.6, maxZ: SIZE/2 - 0.6 };
  const half = SIZE/2;

  const wt = texParquet();
  wt.repeat.set(3, 3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), texMat(wt, { roughness: 0.75 }));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ color: 0x0a0510, roughness: 1 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; scene.add(ceil);

  buildCurtain(scene, 0, H/2, -half + 0.1, 0, SIZE, H);
  buildCurtain(scene, -half + 0.1, H/2, 0, Math.PI/2, SIZE, H);
  buildCurtain(scene, half - 0.1, H/2, 0, -Math.PI/2, SIZE, H);
  buildCurtain(scene, -half + 2.5, H/2, half - 0.1, 0, 3, H);
  buildCurtain(scene, half - 2.5, H/2, half - 0.1, 0, 3, H);

  const spot1 = new THREE.PointLight(0xffaa66, 2.5, 10, 1.5);
  spot1.position.set(-3, H - 1, 0);
  spot1.castShadow = true; spot1.shadow.mapSize.set(1024, 1024);
  scene.add(spot1);
  const spot2 = new THREE.PointLight(0xffaa66, 2.5, 10, 1.5);
  spot2.position.set(3, H - 1, 0);
  spot2.castShadow = true; spot2.shadow.mapSize.set(1024, 1024);
  scene.add(spot2);
  const spot3 = new THREE.PointLight(0xffaa66, 1.8, 8, 1.5);
  spot3.position.set(0, H - 1, 2);
  scene.add(spot3);

  buildCeilingLamp(scene, 0, 0, 2.0);
  buildDesk(scene, 2.5, -2.0, Math.PI * 0.15);
  buildChair(scene, 2.5, -0.8, Math.PI);
  buildTableLamp(scene, 1.9, 0.79, -2.0);
  buildCrate(scene, -3.5, -3.0, 0.3, 0);
  buildCrate(scene, -3.3, -2.2, -0.2, 0);
  buildCrate(scene, 3.5, 3.5, 0.6, 0);
  buildCrate(scene, 3.5, 3.5, 0.6, 0.8);
  buildPlant(scene, -half + 1.2, half - 1.2);
  buildCabinet(scene, half - 1.5, -3.5, -Math.PI/2);
  buildVase(scene, 2.5, 1.66, -3.5);
  scene.add(new THREE.AmbientLight(0x303040, 0.4));

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

  const floorTex = texStone();
  floorTex.repeat.set(2, 2);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), texMat(floorTex, { roughness: 0.9, color: 0x707078, bumpScale: 0.05 }));
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), M({ color: 0x2a2a30, roughness: 1 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; scene.add(ceil);

  const wallTex = texStone();
  wallTex.repeat.set(2, 1.5);
  const wallMat = texMat(wallTex, { roughness: 0.9, color: 0x808088, bumpScale: 0.05 });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  [
    { pos: [0, H/2, -half], rot: 0 },
    { pos: [0, H/2, half], rot: Math.PI },
    { pos: [-half, H/2, 0], rot: Math.PI/2 },
    { pos: [half, H/2, 0], rot: -Math.PI/2 }
  ].forEach(w => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(...w.pos); m.rotation.y = w.rot;
    m.receiveShadow = true; scene.add(m);
  });

  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5),
    M({ color: 0x1a2a3a, metalness: 0.95, roughness: 0.05, emissive: 0x0a1a2a, emissiveIntensity: 0.4 }));
  mirror.position.set(0, 1.8, -half + 0.03);
  scene.add(mirror);
  const frameMat = M({ color: 0x3a3a42, metalness: 0.7, roughness: 0.5 });
  const mfw = 2.6, mfh = 1.7;
  box(scene, mfw, 0.08, 0.1, frameMat, 0, 1.8 + mfh/2, -half + 0.05);
  box(scene, mfw, 0.08, 0.1, frameMat, 0, 1.8 - mfh/2, -half + 0.05);
  box(scene, 0.08, mfh, 0.1, frameMat, -mfw/2, 1.8, -half + 0.05);
  box(scene, 0.08, mfh, 0.1, frameMat, mfw/2, 1.8, -half + 0.05);

  const metal = M({ color: 0x606068, metalness: 0.75, roughness: 0.4 });
  const metalDark = M({ color: 0x3a3a42, metalness: 0.7, roughness: 0.5 });
  box(scene, 1.5, 0.06, 0.9, metal, 0, 0.75, 0);
  box(scene, 1.52, 0.03, 0.92, metalDark, 0, 0.72, 0);
  [[-0.65,-0.35],[0.65,-0.35],[-0.65,0.35],[0.65,0.35]].forEach(([px, pz]) => {
    cyl(scene, 0.03, 0.03, 0.72, metal, px, 0.36, pz, 12);
  });
  box(scene, 1.3, 0.04, 0.04, metal, 0, 0.1, -0.35);
  box(scene, 1.3, 0.04, 0.04, metal, 0, 0.1, 0.35);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.008, 10, 20), metal);
  ring.rotation.x = Math.PI/2;
  ring.position.set(0, 0.79, 0.28);
  scene.add(ring);

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

  const lampG = new THREE.Group();
  cyl(lampG, 0.02, 0.02, 0.6, metalDark, 0, 2.2, 0, 8);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.28, 24, 1, true),
    M({ color: 0x1a1a1e, roughness: 0.6, side: THREE.DoubleSide }));
  shade.rotation.x = Math.PI; shade.position.y = 1.75; lampG.add(shade);
  sph(lampG, 0.09, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xfff0c0, emissiveIntensity: 3 }), 0, 1.72, 0);
  const spot = new THREE.SpotLight(0xfff0c0, 3, 8, Math.PI/3.5, 0.6, 1.5);
  spot.position.set(0, 1.7, 0);
  spot.target.position.set(0, 0.75, 0);
  spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024);
  lampG.add(spot); lampG.add(spot.target);
  scene.add(lampG);

  const ambient = new THREE.PointLight(0x8090b0, 0.5, 12, 1.5);
  ambient.position.set(0, 2.5, 0);
  scene.add(ambient);
  scene.add(new THREE.AmbientLight(0x303040, 0.4));

  const suspectG = buildSuspectModel(suspect);
  suspectG.position.set(0, 0, -0.85);
  scene.add(suspectG);

  box(scene, 0.3, 0.02, 0.4, M({ color: 0x8a6838, roughness: 0.8 }), -0.4, 0.79, 0.1);
  cyl(scene, 0.005, 0.005, 0.14, M({ color: 0xf0e8d0, roughness: 0.7 }), 0.4, 0.79, -0.15, 8).rotation.z = Math.PI/2;

  return { spawn: { x: 0, z: 2.6 } };
}

function buildSuspectModel(suspect){
  const g = new THREE.Group();
  const isFemale = ['👩‍💻','👩','🧹','👩‍🍳','👩‍💼','💍','🌹','🎤','🎶','💔','🌷','💕','🎭','🎨','💎','🤸','🔮'].includes(suspect.icon);
  const skinTones = [0xd8a888, 0xc89878, 0xe8b898, 0xa87858, 0xb88868];
  const skin = M({ color: skinTones[Math.floor(Math.random()*skinTones.length)], roughness: 0.85 });
  const hairColor = isFemale ? [0x3a2010, 0x6a3a1a, 0x2a1a10, 0x8a4a2a][Math.floor(Math.random()*4)] : [0x1a1a1e, 0x3a2a1a, 0x5a5a5a][Math.floor(Math.random()*3)];
  const shirtColors = [0x2a3a5a, 0x5a2a3a, 0x3a5a2a, 0x5a4a2a, 0x4a4a4a, 0x6a2a2a, 0x2a4a5a];
  const shirt = M({ color: shirtColors[Math.floor(Math.random()*shirtColors.length)], roughness: 0.9 });
  const pants = M({ color: [0x1a1a1e, 0x2a2a30, 0x3a2010][Math.floor(Math.random()*3)], roughness: 0.9 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 16), skin);
  head.position.y = 1.32; head.scale.set(0.95, 1.1, 1);
  head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 24, 16, 0, Math.PI*2, 0, Math.PI * (isFemale ? 0.7 : 0.5)),
    M({ color: hairColor, roughness: 0.95 })
  );
  hair.position.y = 1.34; hair.scale.set(0.98, 1.1, 1); g.add(hair);
  if (isFemale) box(g, 0.24, 0.3, 0.08, M({ color: hairColor, roughness: 0.95 }), 0, 1.15, -0.13);
  box(g, 0.1, 0.08, 0.1, skin, 0, 1.19, 0);
  box(g, 0.36, 0.42, 0.22, shirt, 0, 0.98, 0);
  box(g, 0.14, 0.06, 0.04, M({ color: 0xf0e8d0, roughness: 0.8 }), 0, 1.16, 0.1);
  function buildArm(side){
    const grp = new THREE.Group();
    box(grp, 0.09, 0.09, 0.32, shirt, 0, 0, -0.16);
    box(grp, 0.08, 0.08, 0.28, skin, 0, 0, -0.44);
    box(grp, 0.07, 0.05, 0.1, skin, 0, -0.015, -0.62);
    grp.position.set(side * 0.24, 0.95, 0.15);
    grp.rotation.x = -1.1; grp.rotation.z = side * 0.15;
    return grp;
  }
  g.add(buildArm(-1)); g.add(buildArm(1));
  box(g, 0.11, 0.42, 0.15, pants, -0.1, 0.55, 0.18);
  box(g, 0.11, 0.42, 0.15, pants, 0.1, 0.55, 0.18);
  box(g, 0.11, 0.14, 0.42, pants, -0.1, 0.73, 0.1);
  box(g, 0.11, 0.14, 0.42, pants, 0.1, 0.73, 0.1);
  return g;
}

/* ====================================================================
   HOTSPOT
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
  ctx.lineWidth = 3; ctx.strokeRect(2, 2, 252, 60);
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
    const room = builder(scene, c.sceneConfig || {});
    const pose = c.corpsePose || room.pose;
    buildCorpse(scene, pose, room.corpsePos.x, room.corpsePos.z, room.corpsePos.rot);
    const sp = room.spawn || { x: 0, z: 3 };
    Player.pos.set(sp.x, Player.height, sp.z);
    Player.yaw = Math.atan2(-(room.corpsePos.x - sp.x), -(room.corpsePos.z - sp.z));
    Player.pitch = -0.15;

    const positions = objectPositionsFor(roomType);
    c.objects.forEach((obj, i) => {
      const pos = positions[i % positions.length];
      const modelFactory = getObjectModel(obj);
      const modelGroup = modelFactory();
      modelGroup.position.set(pos.x, pos.y, pos.z);
      modelGroup.rotation.y = Math.random() * Math.PI * 2;
      scene.add(modelGroup);

      const marker = makeHotspotMarker(obj, g.examined.includes(obj.id));
      marker.position.set(pos.x, pos.y + 0.3, pos.z);
      scene.add(marker);
      World.interactables.push({
        mesh: marker, type: 'object', objId: obj.id, data: obj,
        baseY: pos.y + 0.3, phase: Math.random() * Math.PI * 2
      });
    });
  }

  World.raycaster = new THREE.Raycaster();
  World.crosshairEl = document.querySelector('.crosshair');
  World.nearHintEl = document.querySelector('.near-hint');
  setupControls();

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
    if (['KeyW','KeyA','KeyS','KeyD','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
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
    if (!Player.pointerLocked){ canvas.requestPointerLock(); return; }
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
  if (overlay) overlay.addEventListener('click', e => { e.stopPropagation(); canvas.requestPointerLock(); });
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
    const overlapX = nx + r > o.minX && nx - r < o.maxX;
    const overlapZ = nz + r > o.minZ && nz - r < o.maxZ;
    if (overlapX && overlapZ){
      const pLeft = (nx + r) - o.minX;
      const pRight = o.maxX - (nx - r);
      const pUp = (nz + r) - o.minZ;
      const pDown = o.maxZ - (nz - r);
      const minX = Math.min(pLeft, pRight);
      const minZ = Math.min(pUp, pDown);
      if (minX < minZ){
        if (pLeft < pRight) nx = o.minX - r;
        else nx = o.maxX + r;
        Player.vel.x = 0;
      } else {
        if (pUp < pDown) nz = o.minZ - r;
        else nz = o.maxZ + r;
        Player.vel.z = 0;
      }
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

  if (World.dust){
    World.dust.rotation.y += dt * 0.02;
    const positions = World.dust.geometry.attributes.position;
    const arr = positions.array;
    for (let i = 0; i < arr.length; i += 3) arr[i+1] += Math.sin(now * 0.0005 + i) * 0.001;
    positions.needsUpdate = true;
  }

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
          if (m.bumpMap) m.bumpMap.dispose();
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
  view:'menu', filter:'TODOS', roomId:'', caseId:'',
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
   LOGIN (con contraseña + tabs)
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

        <div class="login-tabs">
          <button type="button" class="login-tab active" data-tab="login">ENTRAR</button>
          <button type="button" class="login-tab" data-tab="register">REGISTRARSE</button>
        </div>

        <div class="login-error" id="login-error"></div>

        ${users.length > 0 ? `
          <div class="login-users-label">Agentes en este dispositivo</div>
          <div class="login-users">
            ${users.map(u => `<div class="login-user" data-name="${esc(u)}">${esc(u)}</div>`).join('')}
          </div>` : ''}

        <form class="login-form active" id="form-login" autocomplete="off">
          <label>Nombre de agente</label>
          <input id="inp-login-name" type="text" placeholder="Escribe tu nombre..." maxlength="20" autocomplete="off">
          <label>Contraseña</label>
          <div class="pwd-wrap">
            <input id="inp-login-pwd" type="password" placeholder="••••••••" autocomplete="off">
            <button type="button" class="pwd-toggle" data-target="inp-login-pwd">👁</button>
          </div>
          <button type="submit" class="btn-primary">ENTRAR</button>
        </form>

        <form class="login-form" id="form-register" autocomplete="off">
          <label>Nombre de agente</label>
          <input id="inp-reg-name" type="text" placeholder="Mínimo 3 caracteres" maxlength="20" autocomplete="off">
          <label>Contraseña</label>
          <div class="pwd-wrap">
            <input id="inp-reg-pwd" type="password" placeholder="Mínimo 4 caracteres" autocomplete="off">
            <button type="button" class="pwd-toggle" data-target="inp-reg-pwd">👁</button>
          </div>
          <label>Repite la contraseña</label>
          <div class="pwd-wrap">
            <input id="inp-reg-pwd2" type="password" placeholder="••••••••" autocomplete="off">
            <button type="button" class="pwd-toggle" data-target="inp-reg-pwd2">👁</button>
          </div>
          <button type="submit" class="btn-primary">CREAR CUENTA</button>
        </form>

        <div class="login-hint">
          Tu progreso se guarda <b>en este dispositivo</b>.<br>
          Cada nombre + contraseña crea un perfil distinto.
        </div>
      </div>
    </div>`;

  const errBox = document.getElementById('login-error');
  const setErr = msg => {
    errBox.textContent = msg || '';
    if (msg){
      errBox.style.animation = 'none';
      void errBox.offsetWidth;
      errBox.style.animation = 'shake .35s cubic-bezier(.36,.07,.19,.97)';
    }
  };
  const clearErr = () => setErr('');

  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.onclick = () => {
      document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
      const target = tab.dataset.tab === 'login' ? '#form-login' : '#form-register';
      document.querySelector(target).classList.add('active');
      clearErr();
      const firstInput = document.querySelector(target + ' input');
      if (firstInput) firstInput.focus();
    };
  });

  document.querySelectorAll('.pwd-toggle').forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      const inp = document.getElementById(btn.dataset.target);
      if (!inp) return;
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    };
  });

  document.querySelectorAll('.login-user').forEach(el => {
    el.onclick = () => {
      document.querySelector('.login-tab[data-tab="login"]').click();
      const inp = document.getElementById('inp-login-name');
      inp.value = el.dataset.name;
      document.getElementById('inp-login-pwd').focus();
    };
  });

  document.getElementById('form-login').addEventListener('submit', e => {
    e.preventDefault();
    clearErr();
    const name = document.getElementById('inp-login-name').value;
    const pwd = document.getElementById('inp-login-pwd').value;
    const r = Auth.login(name, pwd);
    if (!r.ok){ setErr(r.msg); return; }
    state.playerName = Auth.current;
    state.playerId = getPid();
    state.view = 'menu';
    render();
  });

  document.getElementById('form-register').addEventListener('submit', e => {
    e.preventDefault();
    clearErr();
    const name = document.getElementById('inp-reg-name').value;
    const pwd = document.getElementById('inp-reg-pwd').value;
    const pwd2 = document.getElementById('inp-reg-pwd2').value;
    if (pwd !== pwd2){ setErr('Las contraseñas no coinciden'); return; }
    const r = Auth.register(name, pwd);
    if (!r.ok){ setErr(r.msg); return; }
    state.playerName = Auth.current;
    state.playerId = getPid();
    state.view = 'menu';
    render();
  });

  const first = document.getElementById('inp-login-name');
  if (first) first.focus();
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
  $('#btn-logout').onclick = () => { if (!confirm('¿Cambiar de agente?')) return; Auth.logout(); state.view = 'menu'; render(); };
  document.querySelectorAll('.filter-btn').forEach(b => { b.onclick = () => { state.filter = b.dataset.diff; renderMenu(); }; });
  document.querySelectorAll('.case-card').forEach(card => {
    card.addEventListener('click', () => { state.caseId = card.dataset.case; state.view = 'briefing'; render(); });
  });
}

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
  $('#btn-back').onclick = back; $('#btn-back2').onclick = back;
  $('#btn-accept').onclick = () => { state.view = 'lobby'; render(); };
}

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
    state.playerName = Auth.current; state.playerRole = $('#inp-role').value; state.playerId = getPid();
    startHost();
  };
  $('#btn-join').onclick = () => {
    const code = $('#inp-room').value.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(code)) return alert('Código de 4 caracteres');
    state.playerName = Auth.current; state.playerRole = $('#inp-role').value; state.playerId = getPid();
    startGuest(code);
  };
}

function setStatus(msg, isErr){ state.status = msg; state.statusErr = !!isErr; render(); }
function newGameState(caseId){
  return { caseId,
    players:{ [state.playerId]:{ name:state.playerName, role:state.playerRole, connected:true } },
    examined:[], asked:[], evidence:[], result:null };
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

function renderGame(){
  const g = state.game;
  if (!g){ app.innerHTML = `<div class="lobby"><div class="status">${state.status||'Conectando...'} ⏳</div></div>`; return; }
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
  const banner = document.createElement('div');
  banner.className = 'mode-banner';
  banner.textContent = 'SALA DE INTERROGATORIO';
  banner.style.cssText = 'position:absolute;top:12px;left:50%;transform:translateX(-50%);font-family:"Special Elite",monospace;font-size:11px;letter-spacing:4px;color:var(--red);padding:6px 18px;background:rgba(0,0,0,.85);border:1px solid var(--red);border-radius:14px;z-index:15;pointer-events:none;text-shadow:0 0 10px rgba(231,76,60,.6);';
  stage.appendChild(banner);
  const lockTitle = document.getElementById('lock-title');
  if (lockTitle) lockTitle.textContent = 'CLIC PARA ENTRAR AL INTERROGATORIO';
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
      btn.onclick = () => { const key = btn.dataset.q; if (!g.asked.includes(key)) sendAction({ type:'ask', key }); };
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
  } else { panel.classList.remove('show'); panel.innerHTML = ''; return; }
  const closeBtn = panel.querySelector('#btn-side-close');
  if (closeBtn) closeBtn.onclick = () => { panel.classList.remove('show'); panel.innerHTML = ''; };
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

playCinematic().then(() => { render(); animateParallax(); });