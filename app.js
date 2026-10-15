/* ====================================================================
   AUTH con contraseña + sync entre dispositivos + borrar cuenta
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
  makeSalt(){ return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10); },
  exists(name){ return !!this.users[name]; },

  register(name, pwd){
    name = (name || '').trim();
    if (!name) return { ok:false, msg:'Escribe un nombre' };
    if (name.length < 3) return { ok:false, msg:'Mínimo 3 caracteres' };
    if (name.length > 20) return { ok:false, msg:'Máximo 20 caracteres' };
    if (!/^[\wáéíóúñÁÉÍÓÚÑüÜ\s.'-]+$/i.test(name)) return { ok:false, msg:'Nombre con caracteres no válidos' };
    if (this.exists(name)) return { ok:false, msg:'Ya existe un agente con ese nombre' };
    if (!pwd || pwd.length < 4) return { ok:false, msg:'La contraseña debe tener al menos 4 caracteres' };
    const salt = this.makeSalt();
    const users = this.users;
    users[name] = {
      name, salt, pwdHash: this.hash(pwd, salt),
      created: Date.now(), solved: [], char: 'alegando'
    };
    this.saveUsers(users);
    this.current = name;
    return { ok:true };
  },

  login(name, pwd){
    name = (name || '').trim();
    if (!name) return { ok:false, msg:'Escribe un nombre' };
    const u = this.users[name];
    if (!u) return { ok:false, msg:'No existe ese agente en este dispositivo. Usa "Sincronizar" con tu código.' };
    if (!pwd) return { ok:false, msg:'Escribe tu contraseña' };
    if (this.hash(pwd, u.salt) !== u.pwdHash) return { ok:false, msg:'Contraseña incorrecta' };
    this.current = name;
    return { ok:true };
  },

  deleteAccount(name, pwd){
    name = (name || '').trim();
    if (!name || !pwd) return { ok:false, msg:'Faltan datos' };
    const users = this.users;
    if (!users[name]) return { ok:false, msg:'No existe ese agente' };
    if (this.hash(pwd, users[name].salt) !== users[name].pwdHash) return { ok:false, msg:'Contraseña incorrecta' };
    delete users[name];
    this.saveUsers(users);
    if (this.current === name) this.current = null;
    return { ok:true };
  },

  logout(){ this.current = null; },
  getUser(){ const n = this.current; return n ? (this.users[n] || null) : null; },
  markSolved(id){
    const n = this.current; if (!n) return;
    const u = this.users; if (!u[n]) return;
    if (!u[n].solved.includes(id)){ u[n].solved.push(id); this.saveUsers(u); }
  },
  setChar(id){
    const n = this.current; if (!n) return;
    const u = this.users; if (!u[n]) return;
    u[n].char = id; this.saveUsers(u);
  },
  countSolved(){ const u = this.getUser(); return u ? u.solved.length : 0; },

  /* ---------- SYNC ---------- */
  // Exporta el usuario actual a un código portátil.
  // Formato: EC1.<base64url>.<checksum>  donde base64url lleva el JSON del usuario.
  exportCode(name){
    name = name || this.current;
    const u = this.users[name];
    if (!u) return null;
    const payload = {
      v: 1,
      n: u.name,
      s: u.salt,
      h: u.pwdHash,
      c: u.created,
      sv: u.solved || [],
      ch: u.char || 'alegando'
    };
    const json = JSON.stringify(payload);
    const b64 = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    // checksum simple para detectar códigos corruptos
    let sum = 0;
    for (let i = 0; i < b64.length; i++) sum = (sum * 31 + b64.charCodeAt(i)) >>> 0;
    const chk = sum.toString(36).slice(-4).padStart(4, '0');
    return 'EC1.' + b64 + '.' + chk;
  },

  // Importa un usuario desde un código. Devuelve {ok, msg, name}
  importCode(code){
    code = (code || '').trim();
    if (!code.startsWith('EC1.')) return { ok:false, msg:'Código no válido (debe empezar por EC1.)' };
    const parts = code.split('.');
    if (parts.length !== 3) return { ok:false, msg:'Formato de código incorrecto' };
    const [, b64, chk] = parts;
    let sum = 0;
    for (let i = 0; i < b64.length; i++) sum = (sum * 31 + b64.charCodeAt(i)) >>> 0;
    const expected = sum.toString(36).slice(-4).padStart(4, '0');
    if (expected !== chk) return { ok:false, msg:'Código corrupto (checksum no coincide)' };
    let json;
    try {
      const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4);
      json = decodeURIComponent(escape(atob(padded)));
    } catch(e){ return { ok:false, msg:'No se pudo decodificar el código' }; }
    let payload;
    try { payload = JSON.parse(json); } catch(e){ return { ok:false, msg:'Contenido del código inválido' }; }
    if (!payload.n || !payload.s || !payload.h) return { ok:false, msg:'Código incompleto' };
    const users = this.users;
    // Si ya existe, preferimos el que tenga más progreso
    const existing = users[payload.n];
    if (existing){
      const existingCount = (existing.solved || []).length;
      const newCount = (payload.sv || []).length;
      if (existingCount >= newCount && existing.pwdHash === payload.h){
        return { ok:false, msg:'Ese agente ya está en este dispositivo con el mismo progreso' };
      }
      if (existing.pwdHash !== payload.h){
        return { ok:false, msg:'Ya existe un agente con ese nombre y otra contraseña' };
      }
    }
    users[payload.n] = {
      name: payload.n,
      salt: payload.s,
      pwdHash: payload.h,
      created: payload.c || Date.now(),
      solved: payload.sv || [],
      char: payload.ch || 'alegando'
    };
    this.saveUsers(users);
    return { ok:true, msg:'Agente sincronizado', name: payload.n };
  }
};

/* ====================================================================
   PERSONAJES JUGABLES
   ==================================================================== */
const CHARACTERS = [
  { id:'alegando', name:'Alegando', icon:'🕵️', gender:'male',
    skin:0xd8a888, hair:0x2a1a10, shirt:0x2a3a5a, pants:0x1a1a1e,
    hat:false, glasses:false, tie:true },
  { id:'alech', name:'Alech', icon:'🕵️‍♀️', gender:'female',
    skin:0xe8b898, hair:0x8a4a2a, shirt:0x5a2a3a, pants:0x2a2a30,
    hat:false, glasses:true, tie:false },
  { id:'detective', name:'Detective', icon:'🎩', gender:'male',
    skin:0xc89878, hair:0x1a1a1e, shirt:0x3a3a3a, pants:0x2a2a30,
    hat:true, glasses:false, tie:true },
  { id:'forense', name:'Forense', icon:'🥼', gender:'female',
    skin:0xf0d0b0, hair:0x3a2010, shirt:0xf0f0f0, pants:0x2a2a30,
    hat:false, glasses:true, tie:false },
  { id:'informatico', name:'Informático', icon:'💻', gender:'male',
    skin:0xb88868, hair:0x3a2a1a, shirt:0x2a4a5a, pants:0x1a1a1e,
    hat:false, glasses:true, tie:false },
  { id:'veterana', name:'Veterana', icon:'🎖️', gender:'female',
    skin:0xc89878, hair:0x5a5a5a, shirt:0x2a3a5a, pants:0x2a2a30,
    hat:false, glasses:false, tie:false }
];
function getCharDef(id){ return CHARACTERS.find(c => c.id === id) || CHARACTERS[0]; }
function getMyCharDef(){ return getCharDef(state.myChar || 'alegando'); }

/* ====================================================================
   CINEMÁTICA + PARALLAX
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
   ESTADO MUNDO
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
  radius: 0.32, height: 1.65,
  walkSpeed: 2.8, runSpeed: 5.0,
  bobPhase: 0, bobAmp: 0,
  pointerLocked: false, keys:{}, moving:false
};

/* ====================================================================
   TEXTURAS
   ==================================================================== */
function texFromCanvas(c, rx, ry, aniso){
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso || 16;
  if (rx) t.repeat.set(rx, ry || rx);
  if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  return t;
}
function makeBump(canvas, strength){
  strength = strength || 1.5;
  const w = canvas.width, h = canvas.height;
  const src = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
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
  const t = new THREE.CanvasTexture(out);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const TEX = {
  parquet(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    const rows = 16, plankH = c.height/rows;
    const bases = ['#3a2614','#402b16','#472e18','#3d2815','#443018'];
    for (let r = 0; r < rows; r++){
      const y = r * plankH;
      x.fillStyle = bases[r % bases.length];
      x.fillRect(0, y, c.width, plankH);
      for (let i = 0; i < 22; i++){
        const vy = y + 3 + Math.random() * (plankH - 6);
        const g = x.createLinearGradient(0, 0, c.width, 0);
        g.addColorStop(0, 'rgba(20,10,4,0)');
        g.addColorStop(0.5, `rgba(20,10,4,${0.1 + Math.random()*0.2})`);
        g.addColorStop(1, 'rgba(20,10,4,0)');
        x.strokeStyle = g; x.lineWidth = 0.5 + Math.random() * 1.4;
        x.beginPath();
        for (let px = 0; px <= c.width; px += 12){
          const yy = vy + Math.sin(px*0.008 + i*1.7) * 1.3;
          px === 0 ? x.moveTo(px, yy) : x.lineTo(px, yy);
        }
        x.stroke();
      }
      x.strokeStyle = 'rgba(0,0,0,0.85)'; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y); x.stroke();
      const off = (r * 137) % 256;
      for (let px = -off; px < c.width + 256; px += 256){
        x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(px, y); x.lineTo(px, y + plankH); x.stroke();
      }
    }
    return texFromCanvas(c);
  },
  parquetDark(){
    // Para despacho y teatro — un parquet más oscuro y encerado
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#1a0e05'; x.fillRect(0, 0, c.width, c.height);
    const rows = 10, plankH = c.height/rows;
    for (let r = 0; r < rows; r++){
      const y = r * plankH;
      x.fillStyle = r % 2 ? '#2a1810' : '#241408';
      x.fillRect(0, y, c.width, plankH);
      for (let i = 0; i < 30; i++){
        x.strokeStyle = `rgba(0,0,0,${0.2+Math.random()*0.3})`;
        x.lineWidth = 0.5 + Math.random() * 1.2;
        x.beginPath();
        const vy = y + Math.random()*plankH;
        x.moveTo(0, vy);
        for (let px = 0; px <= c.width; px += 16){
          x.lineTo(px, vy + Math.sin(px*0.01 + i)*1.5);
        }
        x.stroke();
      }
      x.strokeStyle = 'rgba(0,0,0,0.95)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y); x.stroke();
      const off = (r * 89) % 320;
      for (let px = -off; px < c.width + 320; px += 320){
        x.beginPath(); x.moveTo(px, y); x.lineTo(px, y + plankH); x.stroke();
      }
    }
    // brillo de cera
    const sh = x.createLinearGradient(0, 0, 0, c.height);
    sh.addColorStop(0, 'rgba(255,200,120,0.05)');
    sh.addColorStop(1, 'rgba(0,0,0,0.3)');
    x.fillStyle = sh; x.fillRect(0, 0, c.width, c.height);
    return texFromCanvas(c);
  },
  marble(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#d8cfb6'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 30; i++){
      const cx = Math.random()*c.width, cy = Math.random()*c.height, r = 80 + Math.random()*200;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(180,170,150,0.3)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(cx-r, cy-r, r*2, r*2);
    }
    for (let v = 0; v < 25; v++){
      x.strokeStyle = `rgba(${60+Math.random()*40|0},${50+Math.random()*40|0},${30+Math.random()*40|0},${0.15 + Math.random()*0.3})`;
      x.lineWidth = 0.5 + Math.random()*2;
      let px = Math.random()*c.width, py = Math.random()*c.height;
      x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 30; s++){
        px += (Math.random()-0.5)*70; py += (Math.random()-0.5)*70;
        x.lineTo(px, py);
      }
      x.stroke();
    }
    x.strokeStyle = 'rgba(40,32,20,0.55)'; x.lineWidth = 3;
    for (let px = 0; px <= c.width; px += 256){ x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c.height); x.stroke(); }
    for (let py = 0; py <= c.height; py += 256){ x.beginPath(); x.moveTo(0, py); x.lineTo(c.width, py); x.stroke(); }
    return texFromCanvas(c);
  },
  marbleDark(){
    // Para biblioteca — mármol oscuro verde con vetas doradas
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#0f1a15'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 40; i++){
      const cx = Math.random()*c.width, cy = Math.random()*c.height, r = 60 + Math.random()*180;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(30,60,45,0.5)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(cx-r, cy-r, r*2, r*2);
    }
    for (let v = 0; v < 20; v++){
      x.strokeStyle = `rgba(${180+Math.random()*50|0},${140+Math.random()*40|0},${60+Math.random()*40|0},${0.15 + Math.random()*0.25})`;
      x.lineWidth = 0.8 + Math.random()*2;
      let px = Math.random()*c.width, py = Math.random()*c.height;
      x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 25; s++){
        px += (Math.random()-0.5)*80; py += (Math.random()-0.5)*80;
        x.lineTo(px, py);
      }
      x.stroke();
    }
    const tile = 256;
    x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 3;
    for (let px = 0; px <= c.width; px += tile){ x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c.height); x.stroke(); }
    for (let py = 0; py <= c.height; py += tile){ x.beginPath(); x.moveTo(0, py); x.lineTo(c.width, py); x.stroke(); }
    return texFromCanvas(c);
  },
  grass(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#1a3310'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 50; i++){
      const cx = Math.random()*c.width, cy = Math.random()*c.height, r = 40 + Math.random()*140;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${40+Math.random()*40|0},${70+Math.random()*50|0},${20+Math.random()*30|0},0.55)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI*2); x.fill();
    }
    for (let i = 0; i < 45000; i++){
      const px = Math.random()*c.width, py = Math.random()*c.height;
      const gr = 60 + Math.random()*100;
      x.strokeStyle = `rgba(${20+Math.random()*30|0},${gr|0},${10+Math.random()*40|0},${0.4+Math.random()*0.4})`;
      x.lineWidth = 0.5 + Math.random()*0.7;
      x.beginPath();
      x.moveTo(px, py); x.lineTo(px + (Math.random()-0.5)*2, py - 1 - Math.random()*2.5);
      x.stroke();
    }
    return texFromCanvas(c);
  },
  stone(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#222226'; x.fillRect(0, 0, c.width, c.height);
    const s = 128;
    for (let px = 0; px < c.width; px += s){
      for (let py = 0; py < c.height; py += s){
        const sh = 40 + Math.random()*36;
        x.fillStyle = `rgb(${sh|0},${sh|0},${(sh+6)|0})`;
        x.fillRect(px+3, py+3, s-6, s-6);
        for (let i = 0; i < 180; i++){
          x.fillStyle = `rgba(255,255,255,${Math.random()*0.05})`;
          x.fillRect(px + 3 + Math.random()*(s-6), py + 3 + Math.random()*(s-6), 1.5, 1.5);
        }
        for (let i = 0; i < 180; i++){
          x.fillStyle = `rgba(0,0,0,${Math.random()*0.09})`;
          x.fillRect(px + 3 + Math.random()*(s-6), py + 3 + Math.random()*(s-6), 1.5, 1.5);
        }
      }
    }
    x.strokeStyle = 'rgba(0,0,0,0.55)'; x.lineWidth = 3;
    for (let px = 0; px <= c.width; px += s){ x.beginPath(); x.moveTo(px,0); x.lineTo(px,c.height); x.stroke(); }
    for (let py = 0; py <= c.height; py += s){ x.beginPath(); x.moveTo(0,py); x.lineTo(c.width,py); x.stroke(); }
    return texFromCanvas(c);
  },
  carpet(palette){
    palette = palette || ['#5a2818', 'rgba(212,160,23,0.4)'];
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = palette[0]; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = palette[1]; x.lineWidth = 14;
    x.strokeRect(36, 36, c.width-72, c.height-72);
    x.lineWidth = 6; x.strokeRect(76, 76, c.width-152, c.height-152);
    x.lineWidth = 3;
    for (let i = 0; i < 8; i++){
      const sz = 60 + i*36;
      x.beginPath();
      x.moveTo(c.width/2, c.height/2 - sz);
      x.lineTo(c.width/2 + sz, c.height/2);
      x.lineTo(c.width/2, c.height/2 + sz);
      x.lineTo(c.width/2 - sz, c.height/2);
      x.closePath(); x.stroke();
    }
    x.fillStyle = palette[1];
    for (let px = 120; px < c.width - 80; px += 90)
      for (let py = 120; py < c.height - 80; py += 90){
        x.beginPath(); x.arc(px, py, 4, 0, Math.PI*2); x.fill();
      }
    for (let i = 0; i < 15000; i++){
      x.fillStyle = `rgba(0,0,0,${Math.random()*0.1})`;
      x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
    }
    return texFromCanvas(c);
  },
  wallpaper(base, accent, opts){
    opts = opts || {};
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, c.width, c.height);
    const g = x.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, 'rgba(255,255,255,0.03)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.08)');
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    if (opts.stripes !== false){
      x.fillStyle = accent || 'rgba(0,0,0,0.1)';
      for (let px = 0; px < c.width; px += 64) x.fillRect(px, 0, 4, c.height);
    }
    if (opts.damask){
      x.globalAlpha = 0.08;
      x.strokeStyle = opts.damaskColor || '#000';
      for (let px = 0; px < c.width; px += 128){
        for (let py = 0; py < c.height; py += 128){
          x.save(); x.translate(px + 64, py + 64); x.lineWidth = 1.5;
          for (let k = 0; k < 6; k++){
            x.beginPath();
            x.ellipse(0, 0, 22 + Math.sin(k)*6, 40 + Math.cos(k)*10, k*Math.PI/6, 0, Math.PI*2);
            x.stroke();
          }
          x.restore();
        }
      }
      x.globalAlpha = 1;
    }
    for (let i = 0; i < 10000; i++){
      x.fillStyle = `rgba(255,255,255,${Math.random()*0.025})`;
      x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
    }
    for (let i = 0; i < 5000; i++){
      x.fillStyle = `rgba(0,0,0,${Math.random()*0.04})`;
      x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
    }
    return texFromCanvas(c);
  },
  ceiling(){
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#e8e0d0'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 5000; i++){
      x.fillStyle = `rgba(0,0,0,${Math.random()*0.04})`;
      x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
    }
    x.strokeStyle = 'rgba(0,0,0,0.14)'; x.lineWidth = 2;
    for (let px = 0; px <= c.width; px += 128){ x.beginPath(); x.moveTo(px,0); x.lineTo(px,c.height); x.stroke(); }
    for (let py = 0; py <= c.height; py += 128){ x.beginPath(); x.moveTo(0,py); x.lineTo(c.width,py); x.stroke(); }
    return texFromCanvas(c);
  },
  painting(seed){
    const c = document.createElement('canvas'); c.width = 512; c.height = 384;
    const x = c.getContext('2d');
    const pals = [
      ['#c9a86a','#7a5c2e','#3a2a14','#e8d5a0'],
      ['#4a5a7a','#2a3a5a','#1a2030','#8090b0'],
      ['#7a3a2a','#3a1a10','#1a0808','#c08060'],
      ['#2a5a3a','#1a3a20','#0a1a10','#60a070'],
      ['#6a3a5a','#3a1a30','#1a0a18','#a070a0']
    ];
    const pal = pals[seed % pals.length];
    const g = x.createRadialGradient(c.width/2, c.height/2, 10, c.width/2, c.height/2, c.width*0.9);
    g.addColorStop(0, pal[3]); g.addColorStop(0.4, pal[0]);
    g.addColorStop(0.8, pal[1]); g.addColorStop(1, pal[2]);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 14; i++){
      x.strokeStyle = `rgba(${Math.random()*80|0},${Math.random()*60|0},${Math.random()*40|0},0.5)`;
      x.lineWidth = 2 + Math.random()*4;
      x.beginPath();
      let px = Math.random()*c.width, py = Math.random()*c.height;
      x.moveTo(px, py);
      for (let j = 0; j < 6; j++){ px += (Math.random()-0.5)*160; py += (Math.random()-0.5)*160; x.lineTo(px, py); }
      x.stroke();
    }
    const v = x.createLinearGradient(0, 0, 0, c.height);
    v.addColorStop(0, 'rgba(255,240,200,0.15)');
    v.addColorStop(0.5, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.25)');
    x.fillStyle = v; x.fillRect(0, 0, c.width, c.height);
    return texFromCanvas(c);
  },
  curtain(){
    const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
    const x = c.getContext('2d');
    for (let px = 0; px < c.width; px += 24){
      const g = x.createLinearGradient(px, 0, px+24, 0);
      g.addColorStop(0, '#1a0202'); g.addColorStop(0.35, '#6a1010');
      g.addColorStop(0.5, '#9a1818'); g.addColorStop(0.65, '#6a1010');
      g.addColorStop(1, '#1a0202');
      x.fillStyle = g; x.fillRect(px, 0, 24, c.height);
    }
    const topG = x.createLinearGradient(0, 0, 0, c.height*0.2);
    topG.addColorStop(0, 'rgba(0,0,0,0.75)'); topG.addColorStop(1, 'transparent');
    x.fillStyle = topG; x.fillRect(0, 0, c.width, c.height*0.2);
    const botG = x.createLinearGradient(0, c.height*0.8, 0, c.height);
    botG.addColorStop(0, 'transparent'); botG.addColorStop(1, 'rgba(0,0,0,0.7)');
    x.fillStyle = botG; x.fillRect(0, c.height*0.8, c.width, c.height*0.2);
    return texFromCanvas(c);
  }
};

/* ====================================================================
   MATERIALES COMPARTIDOS
   ==================================================================== */
const MAT = {
  wood:      new THREE.MeshStandardMaterial({ color:0x5a3a20, roughness:0.8 }),
  woodDark:  new THREE.MeshStandardMaterial({ color:0x2a1810, roughness:0.9 }),
  woodLight: new THREE.MeshStandardMaterial({ color:0x6a4628, roughness:0.7 }),
  mahogany:  new THREE.MeshStandardMaterial({ color:0x3a1208, roughness:0.75 }),
  brass:     new THREE.MeshStandardMaterial({ color:0xc8a860, metalness:0.9, roughness:0.2 }),
  steel:     new THREE.MeshStandardMaterial({ color:0xc0c0c8, metalness:0.9, roughness:0.2 }),
  steelDark: new THREE.MeshStandardMaterial({ color:0x909098, metalness:0.9, roughness:0.3 }),
  black:     new THREE.MeshStandardMaterial({ color:0x0a0a10, roughness:0.8 }),
  glass:     new THREE.MeshStandardMaterial({ color:0xe0e8f0, roughness:0.08, metalness:0.15, transparent:true, opacity:0.72 }),
  paper:     new THREE.MeshStandardMaterial({ color:0xf0e8d0, roughness:0.9, side:THREE.DoubleSide }),
  paperDark: new THREE.MeshStandardMaterial({ color:0xd8d0b0, roughness:0.9, side:THREE.DoubleSide }),
  fabricRed: new THREE.MeshStandardMaterial({ color:0x6a1818, roughness:0.95 }),
  fabricBlue:new THREE.MeshStandardMaterial({ color:0x2a3a5a, roughness:0.95 }),
  fabricGreen:new THREE.MeshStandardMaterial({ color:0x1a3a20, roughness:0.95 }),
  leather:   new THREE.MeshStandardMaterial({ color:0x3a2010, roughness:0.85 }),
  leatherGreen:new THREE.MeshStandardMaterial({ color:0x1a2a1a, roughness:0.85 }),
  ceramic:   new THREE.MeshStandardMaterial({ color:0xf0e8d8, roughness:0.35 }),
  gold:      new THREE.MeshStandardMaterial({ color:0xc8a860, metalness:0.95, roughness:0.15 }),
  silver:    new THREE.MeshStandardMaterial({ color:0xc0c0c8, metalness:0.9, roughness:0.2 }),
  stone:     new THREE.MeshStandardMaterial({ color:0x4a4a52, roughness:0.9 })
};

/* ====================================================================
   HELPERS
   ==================================================================== */
function mesh(parent, geo, mat, x, y, z){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(parent, w, h, d, mat, x, y, z){ return mesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
function cyl(parent, rt, rb, h, mat, x, y, z, seg){ return mesh(parent, new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat, x, y, z); }
function sph(parent, r, mat, x, y, z){ return mesh(parent, new THREE.SphereGeometry(r, 20, 14), mat, x, y, z); }

/* ====================================================================
   ROOM placement
   ==================================================================== */
const Room = {
  size: 11, height: 3, half: 5.5,
  obstacles: [], spawnZones: [], doors: [], windows: [],
  init(size, height){
    this.size = size; this.height = height; this.half = size/2;
    this.obstacles = []; this.spawnZones = []; this.doors = []; this.windows = [];
  },
  fits(x, z, w, d, rot, pad){
    pad = pad == null ? 0.14 : pad;
    const cos = Math.abs(Math.cos(rot || 0));
    const sin = Math.abs(Math.sin(rot || 0));
    const hw = (w * cos + d * sin) / 2 + pad;
    const hd = (w * sin + d * cos) / 2 + pad;
    if (x - hw < -this.half + 0.08 || x + hw > this.half - 0.08) return false;
    if (z - hd < -this.half + 0.08 || z + hd > this.half - 0.08) return false;
    for (const o of this.obstacles){
      if (x + hw > o.minX && x - hw < o.maxX && z + hd > o.minZ && z - hd < o.maxZ) return false;
    }
    for (const zs of this.spawnZones){
      if (x + hw > zs.minX && x - hw < zs.maxX && z + hd > zs.minZ && z - hd < zs.maxZ) return false;
    }
    return true;
  },
  register(x, z, w, d, rot){
    const cos = Math.abs(Math.cos(rot || 0));
    const sin = Math.abs(Math.sin(rot || 0));
    const hw = (w * cos + d * sin) / 2;
    const hd = (w * sin + d * cos) / 2;
    const o = { minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd };
    this.obstacles.push(o);
    World.obstacles.push(o);
    return o;
  },
  addDoor(wall, pos, w){
    w = w || 1.1;
    this.doors.push({ wall, pos, w });
    this.spawnZones.push(this.wallSlotRect(wall, pos, w));
  },
  addWindow(wall, pos, w, h){
    this.windows.push({ wall, pos, w: w || 1.8, h: h || 1.5 });
  },
  wallSlotRect(wall, pos, w){
    const h = this.half, t = 0.6;
    if (wall === 'N') return { minX: pos - w/2, maxX: pos + w/2, minZ: -h, maxZ: -h + t };
    if (wall === 'S') return { minX: pos - w/2, maxX: pos + w/2, minZ: h - t, maxZ: h };
    if (wall === 'W') return { minX: -h, maxX: -h + t, minZ: pos - w/2, maxZ: pos + w/2 };
    if (wall === 'E') return { minX: h - t, maxX: h, minZ: pos - w/2, maxZ: pos + w/2 };
  },
  place(model, opts){
    opts = opts || {};
    const w = opts.w || 1, d = opts.d || 1;
    const rot = opts.rot || 0;
    const candidates = opts.at ? [opts.at] : (opts.try || []);
    for (const [x, z, r] of candidates){
      const rr = r != null ? r : rot;
      if (!this.fits(x, z, w, d, rr, opts.pad)) continue;
      model(x, z, rr);
      if (opts.walkable !== true) this.register(x, z, w, d, rr);
      return { x, z, rot: rr };
    }
    return null;
  },
  anchor(wall, offset, distFromWall, height){
    const h = this.half;
    const dist = distFromWall == null ? 0.05 : distFromWall;
    switch (wall){
      case 'N': return { x: offset, z: -h + dist, rot: 0, y: height || 0 };
      case 'S': return { x: offset, z:  h - dist, rot: Math.PI, y: height || 0 };
      case 'W': return { x: -h + dist, z: offset, rot: Math.PI/2, y: height || 0 };
      case 'E': return { x:  h - dist, z: offset, rot: -Math.PI/2, y: height || 0 };
    }
  }
};

/* ====================================================================
   BASE HABITACIÓN — parametrizada para diferenciar MUCHO las salas
   ==================================================================== */
function buildRoomBase(scene, cfg){
  const SIZE = cfg.size, H = cfg.height, half = SIZE/2;
  World.roomHalf = half;
  World.roomHeight = H;
  World.bounds = { minX: -half + 0.45, maxX: half - 0.45, minZ: -half + 0.45, maxZ: half - 0.45 };

  /* SUELO */
  const floorTex = cfg.floorTex();
  floorTex.repeat.set(SIZE / 2, SIZE / 2);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex, roughness: cfg.floorRough != null ? cfg.floorRough : 0.85,
    color: cfg.floorTint || 0xffffff,
    bumpMap: makeBump(floorTex.image, 2), bumpScale: 0.04
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

  /* TECHO */
  const ceilTex = TEX.ceiling();
  ceilTex.repeat.set(SIZE / 3, SIZE / 3);
  const ceilMat = new THREE.MeshStandardMaterial({
    map: ceilTex, roughness: 0.95, color: cfg.ceilTint || 0xaaaaaa
  });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), ceilMat);
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; ceil.receiveShadow = true; scene.add(ceil);

  /* VIGAS */
  if (cfg.beams && cfg.beams > 0){
    const beamMat = new THREE.MeshStandardMaterial({ color: cfg.beamColor || 0x2a1808, roughness: 0.85 });
    for (let i = 1; i < cfg.beams; i++){
      const z = -half + (SIZE / cfg.beams) * i;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(SIZE - 0.2, 0.18, 0.24), beamMat);
      beam.position.set(0, H - 0.09, z);
      beam.castShadow = true; scene.add(beam);
    }
  }

  /* CASETONES */
  if (cfg.coffered){
    const cofMat = new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.7 });
    const gridN = Math.floor(SIZE / 1.5);
    for (let i = 1; i < gridN; i++){
      const z = -half + (SIZE / gridN) * i;
      const beam = new THREE.Mesh(new THREE.BoxGeometry(SIZE - 0.2, 0.14, 0.14), cofMat);
      beam.position.set(0, H - 0.07, z); scene.add(beam);
      const beam2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, SIZE - 0.2), cofMat);
      beam2.position.set(z, H - 0.07, 0); scene.add(beam2);
    }
  }

  /* PAREDES */
  const wallTex = cfg.wallTex();
  wallTex.repeat.set(SIZE / 2.5, H / 2.5);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex, roughness: 0.92, color: cfg.wallTint || 0xffffff,
    bumpMap: makeBump(wallTex.image, 1), bumpScale: 0.02
  });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  [
    [0, H/2, -half, 0], [0, H/2, half, Math.PI],
    [-half, H/2, 0, Math.PI/2], [half, H/2, 0, -Math.PI/2]
  ].forEach(([x, y, z, ry]) => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(x, y, z); m.rotation.y = ry;
    m.receiveShadow = true; scene.add(m);
  });

  /* ZÓCALO */
  const baseMat = new THREE.MeshStandardMaterial({ color: cfg.baseColor || 0x2a1d10, roughness: 0.75 });
  const bbH = cfg.baseH || 0.18, bbT = 0.06;
  [
    [0, bbH/2, -half + bbT/2, SIZE, bbH, bbT],
    [0, bbH/2,  half - bbT/2, SIZE, bbH, bbT],
    [-half + bbT/2, bbH/2, 0, bbT, bbH, SIZE],
    [ half - bbT/2, bbH/2, 0, bbT, bbH, SIZE]
  ].forEach(([x, y, z, w, h, d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), baseMat);
    m.position.set(x, y, z); m.receiveShadow = true; scene.add(m);
  });

  /* CORNISA */
  if (cfg.cornice !== false){
    const cornMat = new THREE.MeshStandardMaterial({ color: cfg.corniceColor || 0x2a2010, roughness: 0.6 });
    const cH = 0.14, cT = 0.09;
    [
      [0, H - cH/2, -half + cT/2, SIZE, cH, cT],
      [0, H - cH/2,  half - cT/2, SIZE, cH, cT],
      [-half + cT/2, H - cH/2, 0, cT, cH, SIZE],
      [ half - cT/2, H - cH/2, 0, cT, cH, SIZE]
    ].forEach(([x, y, z, w, h, d]) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cornMat);
      m.position.set(x, y, z); m.castShadow = true; scene.add(m);
    });
  }

  /* WAINSCOTING */
  if (cfg.wainscot){
    const wainH = cfg.wainscotH || 1.0;
    const panelH = wainH - 0.06;
    const wainMat = cfg.wainscotMat || new THREE.MeshStandardMaterial({ color: 0x2a1d10, roughness: 0.7 });
    const railMat = cfg.wainscotRailMat || new THREE.MeshStandardMaterial({ color: 0x3a2a14, roughness: 0.6 });
    const stileMat = cfg.wainscotStileMat || new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.8 });

    ['N','S','E','W'].forEach(wall => {
      const horiz = wall === 'N' || wall === 'S';
      const zOff = wall === 'N' ? -half + 0.035 : wall === 'S' ? half - 0.035 : 0;
      const xOff = wall === 'W' ? -half + 0.035 : wall === 'E' ? half - 0.035 : 0;
      const ry = horiz ? 0 : Math.PI/2;
      const px = horiz ? 0 : xOff;
      const pz = horiz ? zOff : 0;

      const panel = new THREE.Mesh(new THREE.BoxGeometry(SIZE - 0.12, panelH, 0.06), wainMat);
      panel.position.set(px, panelH/2, pz); panel.rotation.y = ry;
      panel.castShadow = true; scene.add(panel);

      const rail = new THREE.Mesh(new THREE.BoxGeometry(SIZE, 0.06, 0.1), railMat);
      rail.position.set(px, panelH + 0.03, pz); rail.rotation.y = ry;
      scene.add(rail);

      const stileCount = Math.max(3, Math.floor(SIZE / 1.4));
      for (let i = 0; i <= stileCount; i++){
        const t = i / stileCount;
        const along = (t - 0.5) * (SIZE - 0.24);
        const stile = new THREE.Mesh(new THREE.BoxGeometry(0.06, panelH, 0.09), stileMat);
        if (horiz) stile.position.set(along, panelH/2, pz + 0.02);
        else stile.position.set(px + 0.02, panelH/2, along);
        stile.rotation.y = ry;
        stile.castShadow = true; scene.add(stile);
      }
    });
  }

  /* ELEMENTOS ARQUITECTÓNICOS OPCIONALES */
  // Columnas
  if (cfg.columns){
    const colMat = new THREE.MeshStandardMaterial({ color: cfg.colColor || 0xb8a888, roughness: 0.75 });
    const capMat = new THREE.MeshStandardMaterial({ color: cfg.colCapColor || 0x3a2a14, roughness: 0.7 });
    cfg.columns.forEach(([cx, cz]) => {
      const g = new THREE.Group();
      cyl(g, 0.24, 0.28, 0.14, capMat, 0, 0.07, 0, 12);
      cyl(g, 0.2, 0.22, H - 0.5, colMat, 0, H/2, 0, 16);
      cyl(g, 0.26, 0.22, 0.12, capMat, 0, H - 0.22, 0, 12);
      cyl(g, 0.28, 0.24, 0.1, capMat, 0, H - 0.05, 0, 12);
      g.position.set(cx, 0, cz); scene.add(g);
      Room.register(cx, cz, 0.55, 0.55, 0);
    });
  }

  /* POLVO */
  const dustGeo = new THREE.BufferGeometry();
  const N = 300;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i += 3){
    pos[i] = (Math.random()-0.5) * SIZE;
    pos[i+1] = Math.random() * H;
    pos[i+2] = (Math.random()-0.5) * SIZE;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: cfg.dustColor || 0xffd682, size: 0.022, transparent: true, opacity: 0.32,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(dust); World.dust = dust;

  /* LUCES BASE */
  scene.add(new THREE.AmbientLight(cfg.ambientColor || 0x606070, cfg.ambientIntensity != null ? cfg.ambientIntensity : 0.55));
  scene.add(new THREE.HemisphereLight(cfg.hemiSky || 0x9090b0, cfg.hemiGround || 0x201008, 0.35));

  return { size: SIZE, height: H, half };
}

/* ====================================================================
   MUEBLES
   ==================================================================== */
function makeDesk(){
  const g = new THREE.Group();
  box(g, 2.2, 0.06, 1.1, MAT.woodLight, 0, 0.76, 0);
  box(g, 2.16, 0.008, 1.06, new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 1 }), 0, 0.795, 0);
  box(g, 2.2, 0.15, 0.04, MAT.wood, 0, 0.68, 0.5);
  box(g, 0.04, 0.72, 1.0, MAT.wood, -1.08, 0.4, 0);
  box(g, 0.06, 0.76, 0.06, MAT.woodDark, 1.04, 0.38, -0.44);
  box(g, 0.06, 0.76, 0.06, MAT.woodDark, 1.04, 0.38, 0.44);
  box(g, 0.68, 0.72, 1.0, MAT.woodDark, -0.75, 0.38, 0);
  for (let i = 0; i < 3; i++){
    const dg = new THREE.Group();
    box(dg, 0.64, 0.19, 0.92, MAT.wood, 0, 0, 0);
    box(dg, 0.66, 0.2, 0.02, MAT.woodLight, 0, 0, 0.47);
    box(dg, 0.14, 0.03, 0.03, MAT.brass, 0, 0, 0.5);
    dg.position.set(-0.75, 0.62 - i*0.22, 0);
    dg.userData.isDrawer = true;
    dg.userData.drawerState = 0;
    dg.userData.drawerMaxZ = 0.44;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'drawer', data:{ desk:g, index:i } });
  }
  return { group: g, w: 2.3, d: 1.2 };
}
function makeChair(){
  const g = new THREE.Group();
  box(g, 0.52, 0.05, 0.52, MAT.wood, 0, 0.46, 0);
  box(g, 0.46, 0.09, 0.46, MAT.fabricRed, 0, 0.53, 0);
  box(g, 0.52, 0.05, 0.06, MAT.wood, 0, 0.78, -0.24);
  box(g, 0.52, 0.05, 0.06, MAT.wood, 0, 1.02, -0.24);
  box(g, 0.04, 0.32, 0.04, MAT.wood, -0.22, 0.9, -0.24);
  box(g, 0.04, 0.32, 0.04, MAT.wood, 0.22, 0.9, -0.24);
  box(g, 0.44, 0.24, 0.03, MAT.fabricRed, 0, 0.9, -0.22);
  [[-0.22,0.2],[0.22,0.2],[-0.22,-0.2],[0.22,-0.2]].forEach(([x,z]) => {
    box(g, 0.05, 0.46, 0.05, MAT.wood, x, 0.23, z);
  });
  box(g, 0.44, 0.03, 0.03, MAT.wood, 0, 0.15, -0.2);
  box(g, 0.44, 0.03, 0.03, MAT.wood, 0, 0.15, 0.2);
  return { group: g, w: 0.58, d: 0.58 };
}
function makeArmchair(){
  const g = new THREE.Group();
  box(g, 0.95, 0.14, 0.85, MAT.leatherGreen, 0, 0.45, 0);
  box(g, 0.85, 0.08, 0.7, MAT.leatherGreen, 0, 0.53, 0);
  box(g, 0.95, 0.85, 0.14, MAT.leatherGreen, 0, 0.8, -0.35);
  box(g, 0.14, 0.4, 0.85, MAT.leatherGreen, -0.4, 0.65, 0);
  box(g, 0.14, 0.4, 0.85, MAT.leatherGreen, 0.4, 0.65, 0);
  [[-0.4,0.35],[0.4,0.35],[-0.4,-0.35],[0.4,-0.35]].forEach(([px, pz]) => {
    cyl(g, 0.05, 0.06, 0.4, MAT.woodDark, px, 0.2, pz, 12);
  });
  return { group: g, w: 1.0, d: 0.9 };
}
function makeBookshelf(W, H){
  W = W || 2.4; H = H || 2.8;
  const D = 0.42;
  const g = new THREE.Group();
  box(g, 0.12, H, D, MAT.mahogany, -W/2, H/2, 0);
  box(g, 0.12, H, D, MAT.mahogany, W/2, H/2, 0);
  box(g, W + 0.12, 0.12, D, MAT.mahogany, 0, 0.06, 0);
  box(g, W + 0.14, 0.1, D + 0.04, MAT.mahogany, 0, H + 0.02, 0);
  box(g, W, H, 0.03, MAT.mahogany, 0, H/2, -D/2 + 0.02);
  const bookCols = [0x7a2a1a,0x2a4a3a,0x5a5a1a,0x4a1a2a,0x1a3a5a,0x6a4a1a,0x3a1a4a,0x2a5a4a,0x8a3010,0x203050,0x406020,0x802040];
  const bookMats = bookCols.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
  const shelfYs = [];
  for (let i = 1; i <= 5; i++){
    const y = i * (H/5);
    if (i < 5) box(g, W - 0.12, 0.06, D - 0.04, MAT.mahogany, 0, y, 0);
    shelfYs.push(y);
  }
  shelfYs.forEach((y, idx) => {
    const shelfY = idx === 0 ? 0.1 : shelfYs[idx-1];
    const sh = y - shelfY;
    let cx = -W/2 + 0.1;
    while (cx < W/2 - 0.15){
      const bw = 0.04 + Math.random()*0.05;
      const bh = sh * (0.7 + Math.random()*0.25);
      const bd = D * (0.7 + Math.random()*0.2);
      const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bookMats[(Math.random()*bookMats.length)|0]);
      book.position.set(cx + bw/2, shelfY + 0.03 + bh/2, 0);
      book.rotation.z = (Math.random()-0.5)*0.05;
      book.castShadow = true; g.add(book);
      cx += bw + 0.005;
      if (Math.random() < 0.05) cx += 0.05;
    }
  });
  return { group: g, w: W + 0.2, d: D + 0.1 };
}
function makeBed(){
  const g = new THREE.Group();
  const mattress = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.95 });
  const sheet = new THREE.MeshStandardMaterial({ color: 0x8a7a9a, roughness: 0.9 });
  const blanket = new THREE.MeshStandardMaterial({ color: 0x2a1a4a, roughness: 0.95 });
  const pillow = new THREE.MeshStandardMaterial({ color: 0xf8f0e0, roughness: 0.9 });
  box(g, 2.1, 0.22, 2.3, MAT.mahogany, 0, 0.21, 0);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([px, pz]) => {
    box(g, 0.14, 0.1, 0.14, MAT.mahogany, px*0.98, 0.05, pz*1.08);
  });
  box(g, 2.1, 1.4, 0.14, MAT.mahogany, 0, 0.9, -1.15);
  box(g, 1.9, 1.1, 0.04, MAT.woodDark, 0, 0.9, -1.07);
  box(g, 2.2, 0.1, 0.22, MAT.mahogany, 0, 1.65, -1.15);
  box(g, 2.1, 0.3, 0.1, MAT.mahogany, 0, 0.4, 1.13);
  box(g, 2.0, 0.32, 2.15, mattress, 0, 0.48, 0);
  box(g, 2.02, 0.04, 2.0, sheet, 0, 0.66, 0.05);
  box(g, 2.02, 0.08, 1.1, blanket, 0, 0.72, 0.6);
  box(g, 0.85, 0.18, 0.5, pillow, -0.5, 0.74, -0.75);
  box(g, 0.85, 0.18, 0.5, pillow, 0.5, 0.74, -0.75);
  // Dosel con 4 postes
  [[-1.05, -1.2], [1.05, -1.2], [-1.05, 1.2], [1.05, 1.2]].forEach(([x, z]) => {
    cyl(g, 0.04, 0.05, 2.2, MAT.mahogany, x, 1.1, z, 12);
  });
  box(g, 2.3, 0.12, 2.6, MAT.fabricRed, 0, 2.15, 0);
  box(g, 2.3, 0.08, 0.15, MAT.fabricRed, 0, 2.08, -1.25);
  return { group: g, w: 2.2, d: 2.5 };
}
function makeNightstand(){
  const g = new THREE.Group();
  box(g, 0.58, 0.6, 0.55, MAT.mahogany, 0, 0.3, 0);
  box(g, 0.62, 0.05, 0.6, MAT.woodDark, 0, 0.63, 0);
  box(g, 0.58, 0.04, 0.55, MAT.woodDark, 0, 0.01, 0);
  const dg = new THREE.Group();
  box(dg, 0.52, 0.22, 0.5, MAT.mahogany, 0, 0, 0);
  box(dg, 0.52, 0.23, 0.02, MAT.woodDark, 0, 0, 0.26);
  box(dg, 0.1, 0.025, 0.03, MAT.brass, 0, 0, 0.28);
  dg.position.set(0, 0.32, 0);
  dg.userData.isDrawer = true;
  dg.userData.drawerState = 0;
  dg.userData.drawerMaxZ = 0.38;
  g.add(dg);
  World.interactables.push({ mesh: dg, type:'drawer', data:{ desk:g, index:0 } });
  return { group: g, w: 0.65, d: 0.65 };
}
function makeWardrobe(){
  const g = new THREE.Group();
  box(g, 1.6, 2.4, 0.7, MAT.mahogany, 0, 1.2, 0);
  box(g, 1.7, 0.08, 0.78, MAT.woodDark, 0, 2.42, 0);
  box(g, 1.7, 0.1, 0.78, MAT.woodDark, 0, 0.05, 0);
  const mirror = new THREE.MeshStandardMaterial({ color: 0x2a3040, metalness: 0.9, roughness: 0.1 });
  [0, 1].forEach(i => {
    const dg = new THREE.Group();
    const dw = 0.76;
    box(dg, dw, 2.2, 0.05, MAT.wood, 0, 0, 0);
    box(dg, dw - 0.16, 1.0, 0.02, MAT.woodDark, 0, 0.5, 0.03);
    box(dg, dw - 0.16, 0.6, 0.02, MAT.woodDark, 0, -0.6, 0.03);
    box(dg, 0.04, 0.18, 0.05, MAT.brass, i === 0 ? dw/2 - 0.08 : -dw/2 + 0.08, 0, 0.05);
    dg.position.set(i === 0 ? -0.4 : 0.4, 1.25, 0.36);
    dg.userData.isCabinetDoor = true;
    dg.userData.doorState = 0;
    dg.userData.doorHinge = i === 0 ? 1 : -1;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), mirror);
  mp.position.set(0.4, 1.25, 0.39); g.add(mp);
  return { group: g, w: 1.75, d: 0.85 };
}
function makeCabinet(){
  const g = new THREE.Group();
  box(g, 1.0, 1.6, 0.5, MAT.wood, 0, 0.8, 0);
  box(g, 1.05, 0.06, 0.55, MAT.woodDark, 0, 1.63, 0);
  box(g, 1.05, 0.06, 0.55, MAT.woodDark, 0, 0.03, 0);
  [0, 1].forEach(i => {
    const dg = new THREE.Group();
    box(dg, 0.46, 1.5, 0.04, MAT.wood, 0, 0, 0);
    box(dg, 0.36, 1.4, 0.02, MAT.woodDark, 0, 0, 0.025);
    box(dg, 0.04, 0.14, 0.04, MAT.brass, i === 0 ? 0.19 : -0.19, 0, 0.05);
    dg.position.set(i === 0 ? -0.25 : 0.25, 0.82, 0.26);
    dg.userData.isCabinetDoor = true;
    dg.userData.doorState = 0;
    dg.userData.doorHinge = i === 0 ? 1 : -1;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });
  return { group: g, w: 1.1, d: 0.6 };
}
function makeTableLamp(){
  const g = new THREE.Group();
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a1a, emissive: 0x2a5a2a, emissiveIntensity: 0.5,
    transparent: true, opacity: 0.9, side: THREE.DoubleSide
  });
  cyl(g, 0.11, 0.13, 0.03, MAT.brass, 0, 0.015, 0, 24);
  cyl(g, 0.07, 0.1, 0.04, MAT.brass, 0, 0.05, 0, 24);
  cyl(g, 0.012, 0.012, 0.32, MAT.brass, 0, 0.23, 0, 12);
  cyl(g, 0.02, 0.02, 0.04, MAT.brass, 0, 0.4, 0, 12);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.14, 24, 1, true), shadeMat);
  shade.position.y = 0.52; g.add(shade);
  sph(g, 0.04, new THREE.MeshStandardMaterial({ color: 0xfff5d0, emissive: 0xffe090, emissiveIntensity: 2 }), 0, 0.5, 0);
  const light = new THREE.PointLight(0x90c070, 1.3, 4.5, 1.6);
  light.position.y = 0.5;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  g.add(light);
  return { group: g, w: 0.3, d: 0.3 };
}
function makeCeilingLamp(intensity, color){
  intensity = intensity || 1.6;
  color = color || 0xffd682;
  const g = new THREE.Group();
  const shadeMat = new THREE.MeshStandardMaterial({
    color: color, emissive: color, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.95, side: THREE.DoubleSide
  });
  cyl(g, 0.015, 0.015, 0.4, MAT.black, 0, -0.2, 0, 8);
  cyl(g, 0.08, 0.08, 0.03, MAT.black, 0, 0, 0, 20);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.28, 24, 1, true), shadeMat);
  shade.rotation.x = Math.PI; shade.position.y = -0.55; g.add(shade);
  sph(g, 0.08, new THREE.MeshStandardMaterial({ color: 0xfff5d0, emissive: 0xfff5d0, emissiveIntensity: 3 }), 0, -0.6, 0);
  const light = new THREE.PointLight(color, intensity, 12, 1.4);
  light.position.y = -0.65;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  g.add(light);
  return g;
}
function makePlant(){
  const g = new THREE.Group();
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.85, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x3a6a3a, roughness: 0.85, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.85, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.85, side: THREE.DoubleSide })
  ];
  cyl(g, 0.28, 0.22, 0.4, new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 }), 0, 0.2, 0, 24);
  cyl(g, 0.3, 0.3, 0.04, new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 }), 0, 0.42, 0, 24);
  cyl(g, 0.26, 0.26, 0.02, new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 1 }), 0, 0.41, 0, 24);
  for (let i = 0; i < 16; i++){
    const ang = Math.random()*Math.PI*2;
    const len = 0.5 + Math.random()*0.6;
    const h = 0.4 + Math.random()*0.5;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6),
      new THREE.MeshStandardMaterial({ color: 0x2a4a1a, roughness: 0.9 }));
    stem.position.set(Math.cos(ang)*0.05, 0.42 + h, Math.sin(ang)*0.05);
    stem.rotation.z = (Math.random()-0.5)*0.4;
    stem.rotation.x = (Math.random()-0.5)*0.4;
    g.add(stem);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.14, len*0.9), leafMats[i%4]);
    leaf.position.set(Math.cos(ang)*0.15, 0.42 + h + len*0.3, Math.sin(ang)*0.15);
    leaf.rotation.y = ang;
    leaf.rotation.x = -0.4 + (Math.random()-0.5)*0.8;
    leaf.castShadow = true; g.add(leaf);
  }
  return { group: g, w: 0.6, d: 0.6 };
}
function makePainting(w, h, seed){
  w = w || 1.6; h = h || 1.1;
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x8a6a20, metalness: 0.6, roughness: 0.35 });
  const frameInner = new THREE.MeshStandardMaterial({ color: 0x6a5a30, roughness: 0.5, metalness: 0.3 });
  box(g, w + 0.22, h + 0.22, 0.1, frame, 0, 0, 0);
  box(g, w + 0.1, h + 0.1, 0.04, frameInner, 0, 0, 0.04);
  const c = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: TEX.painting(seed || 0), roughness: 0.7 }));
  c.position.z = 0.06; g.add(c);
  return g;
}
function makeWindow(w, h){
  w = w || 1.8; h = h || 1.5;
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x4a3d22, roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2035, emissive: 0x2a3a6a, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.85, metalness: 0.2, roughness: 0.1
  });
  box(g, w + 0.24, h + 0.24, 0.14, frame, 0, 0, 0);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), new THREE.MeshBasicMaterial({ color: 0xf0e8d8 }));
  moon.position.set(w*0.25, h*0.2, 0.08); g.add(moon);
  for (let i = 0; i < 15; i++){
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.008 + Math.random()*0.008, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 + Math.random()*0.5 }));
    star.position.set((Math.random()-0.5)*w, (Math.random()-0.5)*h, 0.07); g.add(star);
  }
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
  pane.position.z = 0.06; g.add(pane);
  box(g, 0.08, h, 0.06, frame, 0, 0, 0.09);
  box(g, w, 0.08, 0.06, frame, 0, 0, 0.09);
  box(g, w + 0.35, 0.08, 0.25, frame, 0, -h/2 - 0.1, 0.12);
  const light = new THREE.PointLight(0x8090ff, 0.7, 6, 1.8);
  light.position.set(0, 0, -0.5); g.add(light);
  return g;
}
function makeDoor(w, h){
  w = w || 1.0; h = h || 2.2;
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.8 });
  box(g, w + 0.16, 0.1, 0.12, frame, 0, h + 0.05, 0);
  box(g, 0.1, h + 0.1, 0.12, frame, -(w/2 + 0.03), h/2, 0);
  box(g, 0.1, h + 0.1, 0.12, frame, (w/2 + 0.03), h/2, 0);
  box(g, w, h, 0.06, MAT.mahogany, 0, h/2, 0.03);
  box(g, w - 0.2, h/2 - 0.15, 0.02, MAT.woodDark, 0, h*0.3, 0.07);
  box(g, w - 0.2, h/2 - 0.15, 0.02, MAT.woodDark, 0, h*0.75, 0.07);
  const h1 = cyl(g, 0.025, 0.025, 0.08, MAT.brass, w/2 - 0.15, h/2, 0.1, 12);
  h1.rotation.z = Math.PI/2;
  box(g, 0.06, 0.1, 0.03, MAT.brass, w/2 - 0.15, h/2 - 0.15, 0.08);
  return g;
}
function makeRug(w, d, palette){
  const mat = new THREE.MeshStandardMaterial({ map: TEX.carpet(palette), roughness: 1 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 3.5, d || 2.4), mat);
  m.rotation.x = -Math.PI/2;
  m.receiveShadow = true;
  return m;
}
function makeBench(){
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) box(g, 1.8, 0.05, 0.15, MAT.wood, 0, 0.5, -0.15 + i*0.15);
  for (let i = 0; i < 3; i++) box(g, 1.8, 0.15, 0.05, MAT.wood, 0, 0.7 + i*0.15, -0.28);
  [[-0.75,0],[0.75,0]].forEach(([px, pz]) => {
    box(g, 0.08, 0.5, 0.5, MAT.steelDark, px, 0.25, pz);
  });
  return { group: g, w: 1.9, d: 0.7 };
}
function makeLampPost(){
  const g = new THREE.Group();
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.9
  });
  cyl(g, 0.15, 0.2, 0.15, MAT.black, 0, 0.075, 0, 12);
  cyl(g, 0.04, 0.06, 4, MAT.black, 0, 2.075, 0, 12);
  cyl(g, 0.03, 0.03, 0.15, MAT.black, 0, 4.1, 0, 8);
  box(g, 0.24, 0.32, 0.24, MAT.black, 0, 4.32, 0);
  box(g, 0.2, 0.28, 0.2, lightMat, 0, 4.32, 0);
  cyl(g, 0.02, 0.15, 0.08, MAT.black, 0, 4.5, 0, 12);
  const light = new THREE.PointLight(0xffd682, 2.5, 12, 1.6);
  light.position.y = 4.3;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024); g.add(light);
  return { group: g, w: 0.4, d: 0.4 };
}
function makeTree(scale){
  scale = scale || 1;
  const g = new THREE.Group();
  const trunk = new THREE.MeshStandardMaterial({ color: 0x3a2410, roughness: 0.95 });
  const fol1 = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.9 });
  const fol2 = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.9 });
  const fol3 = new THREE.MeshStandardMaterial({ color: 0x0f2a0f, roughness: 0.9 });
  cyl(g, 0.18*scale, 0.28*scale, 2.2*scale, trunk, 0, 1.1*scale, 0, 12);
  for (let i = 0; i < 4; i++){
    const ang = (i / 4) * Math.PI * 2 + Math.random();
    const branch = cyl(g, 0.06*scale, 0.1*scale, 1.2*scale, trunk, Math.cos(ang)*0.3*scale, 1.8*scale, Math.sin(ang)*0.3*scale, 8);
    branch.rotation.z = -0.7 + Math.random()*0.2;
    branch.rotation.y = ang;
  }
  for (let i = 0; i < 7; i++){
    const s = (0.9 + Math.random()*0.7)*scale;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), [fol1, fol2, fol3][(Math.random()*3)|0]);
    m.position.set((Math.random()-0.5)*1.4*scale, (2.6 + Math.random()*1.4)*scale, (Math.random()-0.5)*1.4*scale);
    m.castShadow = true; g.add(m);
  }
  return { group: g, w: 0.6*scale, d: 0.6*scale };
}
function makeCrate(stackY){
  stackY = stackY || 0;
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.9 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 0.95 });
  box(g, 0.8, 0.8, 0.8, wood, 0, 0.4 + stackY, 0);
  for (let i = 0; i < 4; i++){
    box(g, 0.82, 0.04, 0.04, woodDark, 0, 0.15 + i*0.2 + stackY, 0.41);
    box(g, 0.82, 0.04, 0.04, woodDark, 0, 0.15 + i*0.2 + stackY, -0.41);
  }
  box(g, 0.04, 0.82, 0.82, woodDark, -0.41, 0.4 + stackY, 0);
  box(g, 0.04, 0.82, 0.82, woodDark, 0.41, 0.4 + stackY, 0);
  return { group: g, w: 0.9, d: 0.9 };
}
function makeVase(){
  const g = new THREE.Group();
  const curve = new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0), new THREE.Vector2(0.08, 0.02),
    new THREE.Vector2(0.12, 0.08), new THREE.Vector2(0.1, 0.16),
    new THREE.Vector2(0.06, 0.22), new THREE.Vector2(0.07, 0.26),
    new THREE.Vector2(0.09, 0.28)
  ], 16);
  const vase = new THREE.Mesh(curve, new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.4 }));
  vase.castShadow = true; g.add(vase);
  return { group: g, w: 0.25, d: 0.25 };
}
function makeFireplace(){
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 });
  const stone2 = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9 });
  box(g, 2.0, 2.2, 0.8, stone, 0, 1.1, 0);
  box(g, 1.2, 1.2, 0.6, MAT.black, 0, 0.6, 0.3);
  box(g, 1.0, 0.02, 0.5, new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 }), 0, 0.02, 0.35);
  box(g, 2.2, 0.15, 0.9, stone2, 0, 2.28, 0);
  box(g, 0.6, 0.1, 0.5, stone2, -0.9, 0.1, 0.3);
  box(g, 0.6, 0.1, 0.5, stone2, 0.9, 0.1, 0.3);
  // Fuego
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xff7020, emissive: 0xff5000, emissiveIntensity: 3, transparent: true, opacity: 0.85 }));
  fire.position.set(0, 0.3, 0.4); g.add(fire);
  const fire2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd050, emissive: 0xffb020, emissiveIntensity: 3 }));
  fire2.position.set(0, 0.28, 0.42); g.add(fire2);
  const fireLight = new THREE.PointLight(0xff7020, 2.5, 5, 1.8);
  fireLight.position.set(0, 0.6, 0.5); g.add(fireLight);
  return { group: g, w: 2.2, d: 0.9 };
}
function makeChandelier(){
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a6a20, metalness: 0.9, roughness: 0.3 });
  const flameMat = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffe090, emissiveIntensity: 3 });
  cyl(g, 0.02, 0.02, 0.8, metal, 0, 0.4, 0, 8);
  cyl(g, 0.25, 0.3, 0.08, metal, 0, 0, 0, 24);
  // Brazos
  const arms = 6;
  for (let i = 0; i < arms; i++){
    const a = (i / arms) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.015, 8, 20, Math.PI * 0.7), metal);
    arm.position.set(Math.cos(a) * 0.4, -0.15, Math.sin(a) * 0.4);
    arm.rotation.y = -a;
    arm.rotation.z = Math.PI * 0.15;
    g.add(arm);
    sph(g, 0.06, flameMat, Math.cos(a) * 0.55, -0.28, Math.sin(a) * 0.55);
  }
  // Cadena
  cyl(g, 0.008, 0.008, 1.2, metal, 0, 1.4, 0, 6);
  const light = new THREE.PointLight(0xffd682, 2.2, 12, 1.4);
  light.position.set(0, -0.2, 0);
  light.castShadow = true; light.shadow.mapSize.set(1024, 1024);
  g.add(light);
  return g;
}
function makeGlobeStand(){
  const g = new THREE.Group();
  const base = MAT.mahogany;
  const metal = MAT.brass;
  cyl(g, 0.12, 0.16, 0.05, base, 0, 0.025, 0, 20);
  cyl(g, 0.03, 0.03, 0.9, base, 0, 0.5, 0, 12);
  cyl(g, 0.02, 0.02, 0.06, metal, 0, 0.98, 0, 12);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.7 }));
  globe.position.y = 1.2; g.add(globe);
  const equator = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.006, 8, 30), metal);
  equator.rotation.x = Math.PI/2; equator.position.y = 1.2; g.add(equator);
  return { group: g, w: 0.4, d: 0.4 };
}
function makeVanityMirror(){
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x8a6a20, metalness: 0.8, roughness: 0.4 });
  const mirror = new THREE.MeshStandardMaterial({ color: 0x2a3040, metalness: 0.95, roughness: 0.05 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffe090, emissiveIntensity: 2.5 });
  box(g, 1.0, 1.4, 0.08, frame, 0, 1.4, 0);
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.25), mirror);
  mp.position.set(0, 1.4, 0.05); g.add(mp);
  // Bombillas alrededor
  for (let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    sph(g, 0.04, bulbMat, Math.cos(a) * 0.56, 1.4 + Math.sin(a) * 0.78, 0.07);
  }
  const light = new THREE.PointLight(0xffe090, 1.5, 4, 1.5);
  light.position.set(0, 1.4, 0.3); g.add(light);
  return { group: g, w: 1.15, d: 0.2 };
}
function makePond(){
  const g = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.8, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a1a2a, roughness: 0.05, metalness: 0.8 }));
  water.rotation.x = -Math.PI/2; water.position.y = 0.02; g.add(water);
  const edge = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.0, 48),
    new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 }));
  edge.rotation.x = -Math.PI/2; edge.position.y = 0.03; g.add(edge);
  for (let i = 0; i < 12; i++){
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.5;
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.9 }));
    lily.rotation.x = -Math.PI/2;
    lily.position.set(Math.cos(a)*r, 0.025, Math.sin(a)*r);
    g.add(lily);
  }
  return { group: g, w: 3.6, d: 3.6 };
}

/* ====================================================================
   MODELO DE PERSONAJE JUGABLE
   ==================================================================== */
function buildCharacterModel(charDef){
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: charDef.skin, roughness: 0.85 });
  const hairMat = new THREE.MeshStandardMaterial({ color: charDef.hair, roughness: 0.9 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: charDef.shirt, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: charDef.pants, roughness: 0.9 });
  const shoesMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.85 });
  box(g, 0.13, 0.6, 0.14, pantsMat, -0.1, 0.6, 0);
  box(g, 0.13, 0.6, 0.14, pantsMat, 0.1, 0.6, 0);
  box(g, 0.14, 0.1, 0.22, shoesMat, -0.1, 0.05, 0.03);
  box(g, 0.14, 0.1, 0.22, shoesMat, 0.1, 0.05, 0.03);
  box(g, 0.38, 0.5, 0.22, shirtMat, 0, 1.15, 0);
  if (charDef.tie){
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.012),
      new THREE.MeshStandardMaterial({ color: 0x8a1818, roughness: 0.75 }));
    tie.position.set(0, 1.15, 0.115); g.add(tie);
  }
  [[-0.235, 1.4], [0.235, 1.4]].forEach(([x, y]) => {
    box(g, 0.09, 0.34, 0.11, shirtMat, x, y - 0.17, 0);
    box(g, 0.075, 0.28, 0.095, skin, x, y - 0.46, 0);
  });
  cyl(g, 0.045, 0.05, 0.08, skin, 0, 1.43, 0, 12);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), skin);
  head.position.y = 1.58; head.scale.set(0.95, 1.05, 1);
  head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.135, 20, 16, 0, Math.PI*2, 0, Math.PI*(charDef.gender === 'female' ? 0.78 : 0.55)), hairMat);
  hair.position.y = 1.6; hair.scale.set(0.98, 1.05, 1); g.add(hair);
  if (charDef.gender === 'female'){
    const bh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.08), hairMat);
    bh.position.set(0, 1.36, -0.1); g.add(bh);
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.5 });
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), eyeMat);
  eL.position.set(-0.045, 1.59, 0.115); g.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), eyeMat);
  eR.position.set(0.045, 1.59, 0.115); g.add(eR);
  if (charDef.glasses){
    const fm = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.3, roughness: 0.4 });
    const lL = new THREE.Mesh(new THREE.RingGeometry(0.024, 0.032, 16), fm);
    lL.position.set(-0.045, 1.59, 0.128); g.add(lL);
    const lR = new THREE.Mesh(new THREE.RingGeometry(0.024, 0.032, 16), fm);
    lR.position.set(0.045, 1.59, 0.128); g.add(lR);
    box(g, 0.025, 0.005, 0.008, fm, 0, 1.59, 0.13);
  }
  if (charDef.hat){
    const hm = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.85 });
    const bm = new THREE.MeshStandardMaterial({ color: 0x5a1a1a, roughness: 0.85 });
    cyl(g, 0.18, 0.18, 0.012, hm, 0, 1.71, 0, 24);
    cyl(g, 0.11, 0.12, 0.1, hm, 0, 1.765, 0, 20);
    cyl(g, 0.115, 0.115, 0.018, bm, 0, 1.728, 0, 20);
  }
  return g;
}

/* ====================================================================
   JUGADORES REMOTOS
   ==================================================================== */
const RemotePlayers = {
  players: {},
  add(peerId, charDef){
    if (this.players[peerId]) this.remove(peerId);
    const group = buildCharacterModel(charDef);
    group.position.set(0, -10, 0);
    group.visible = false;
    this.players[peerId] = {
      group, charDef,
      pos: new THREE.Vector3(0,0,0),
      targetPos: new THREE.Vector3(0,0,0),
      yaw: 0, targetYaw: 0,
      moving: false, bobPhase: 0,
      hasPos: false
    };
    if (World.scene) World.scene.add(group);
  },
  remove(peerId){
    const p = this.players[peerId];
    if (!p) return;
    if (p.group.parent) p.group.parent.remove(p.group);
    delete this.players[peerId];
  },
  update(peerId, x, z, yaw, moving){
    const p = this.players[peerId];
    if (!p) return;
    p.targetPos.set(x, 0, z);
    p.targetYaw = yaw;
    p.moving = moving;
    if (!p.hasPos){
      p.pos.copy(p.targetPos); p.yaw = yaw; p.hasPos = true;
      p.group.visible = true;
      p.group.position.set(x, 0, z);
      p.group.rotation.y = yaw;
    }
  },
  attachToScene(scene){
    for (const id in this.players){
      const g = this.players[id].group;
      if (g.parent !== scene) scene.add(g);
    }
  },
  detachAll(){
    for (const id in this.players){
      const g = this.players[id].group;
      if (g.parent) g.parent.remove(g);
    }
  },
  tick(dt){
    for (const id in this.players){
      const p = this.players[id];
      if (!p.hasPos) continue;
      p.pos.x += (p.targetPos.x - p.pos.x) * Math.min(1, dt * 12);
      p.pos.z += (p.targetPos.z - p.pos.z) * Math.min(1, dt * 12);
      let dyaw = p.targetYaw - p.yaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      p.yaw += dyaw * Math.min(1, dt * 12);
      let y = 0;
      if (p.moving){ p.bobPhase += dt * 10; y = Math.abs(Math.sin(p.bobPhase)) * 0.03; }
      else p.bobPhase *= 0.9;
      p.group.position.set(p.pos.x, y, p.pos.z);
      p.group.rotation.y = p.yaw;
    }
  },
  clear(){
    for (const id in this.players) this.remove(id);
    this.players = {};
  }
};

/* ====================================================================
   OBJETOS INVESTIGABLES
   ==================================================================== */
const OBJ = {};
OBJ.taza = () => { const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.1, 24, 1, true), MAT.ceramic);
  body.position.y = 0.05; body.castShadow = true; g.add(body);
  cyl(g, 0.048, 0.048, 0.006, MAT.ceramic, 0, 0.003, 0, 24);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 10, 20, Math.PI*1.4), MAT.ceramic);
  h.position.set(0.065, 0.055, 0); h.rotation.z = -Math.PI*0.3; g.add(h);
  const liq = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.15 }));
  liq.rotation.x = -Math.PI/2; liq.position.y = 0.082; g.add(liq);
  return g; };
OBJ.vaso = () => { const g = new THREE.Group();
  cyl(g, 0.045, 0.042, 0.12, MAT.glass, 0, 0.06, 0, 20);
  cyl(g, 0.041, 0.038, 0.07, new THREE.MeshStandardMaterial({ color: 0x8a4010, roughness: 0.3 }), 0, 0.035, 0, 20);
  cyl(g, 0.042, 0.042, 0.008, MAT.glass, 0, 0.004, 0, 20);
  return g; };
OBJ.copa = () => { const g = new THREE.Group();
  cyl(g, 0.058, 0.022, 0.13, MAT.glass, 0, 0.15, 0, 24);
  cyl(g, 0.05, 0.018, 0.07, new THREE.MeshStandardMaterial({ color: 0x4a0818, roughness: 0.2, transparent: true, opacity: 0.85 }), 0, 0.125, 0, 24);
  cyl(g, 0.008, 0.008, 0.09, MAT.glass, 0, 0.05, 0, 12);
  cyl(g, 0.045, 0.048, 0.008, MAT.glass, 0, 0.004, 0, 24);
  return g; };
OBJ.botella = () => { const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: 0x2a3a1a, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.9 });
  cyl(g, 0.05, 0.05, 0.2, glass, 0, 0.1, 0, 20);
  cyl(g, 0.03, 0.05, 0.04, glass, 0, 0.22, 0, 20);
  cyl(g, 0.022, 0.03, 0.09, glass, 0, 0.285, 0, 16);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.08), MAT.paper);
  lbl.position.set(0.051, 0.1, 0); lbl.rotation.y = Math.PI/2; g.add(lbl);
  cyl(g, 0.024, 0.024, 0.035, new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 }), 0, 0.345, 0, 12);
  return g; };
OBJ.frasco = () => { const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: 0xa0c0d0, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.65 });
  cyl(g, 0.028, 0.032, 0.07, glass, 0, 0.035, 0, 16);
  cyl(g, 0.022, 0.028, 0.02, glass, 0, 0.08, 0, 16);
  cyl(g, 0.024, 0.024, 0.018, MAT.steelDark, 0, 0.1, 0, 16);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.04), MAT.paper);
  lbl.position.set(0, 0.04, 0.032); g.add(lbl);
  return g; };
OBJ.azucarero = () => { const g = new THREE.Group();
  const cer = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.3 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x4a6a9a, roughness: 0.35 });
  cyl(g, 0.045, 0.045, 0.07, cer, 0, 0.035, 0, 20);
  cyl(g, 0.048, 0.048, 0.008, blue, 0, 0.07, 0, 20);
  cyl(g, 0.05, 0.045, 0.05, cer, 0, 0.12, 0, 20);
  cyl(g, 0.015, 0.015, 0.025, blue, 0, 0.155, 0, 12);
  sph(g, 0.012, blue, 0, 0.17, 0);
  return g; };
OBJ.lata = () => { const g = new THREE.Group();
  cyl(g, 0.033, 0.033, 0.12, MAT.silver, 0, 0.06, 0, 20);
  cyl(g, 0.0335, 0.0335, 0.07, new THREE.MeshStandardMaterial({ color: 0x8a1a1a, roughness: 0.7 }), 0, 0.06, 0, 20);
  cyl(g, 0.033, 0.033, 0.002, MAT.silver, 0, 0.121, 0, 20);
  return g; };
OBJ.tetera = () => { const g = new THREE.Group();
  const cer = new THREE.MeshStandardMaterial({ color: 0xe0d8c8, roughness: 0.4 });
  sph(g, 0.09, cer, 0, 0.08, 0);
  cyl(g, 0.05, 0.06, 0.04, cer, 0, 0.16, 0, 20);
  cyl(g, 0.03, 0.03, 0.015, cer, 0, 0.185, 0, 16);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.1, 10), cer);
  spout.position.set(0.1, 0.1, 0); spout.rotation.z = 0.7; g.add(spout);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16, Math.PI*1.2), cer);
  h.position.set(-0.08, 0.1, 0); h.rotation.z = -Math.PI*0.3; g.add(h);
  return g; };
OBJ.bandeja = () => { const g = new THREE.Group();
  box(g, 0.35, 0.01, 0.24, MAT.brass, 0, 0.005, 0);
  box(g, 0.36, 0.03, 0.015, MAT.brass, 0, 0.015, 0.12);
  box(g, 0.36, 0.03, 0.015, MAT.brass, 0, 0.015, -0.12);
  box(g, 0.015, 0.03, 0.24, MAT.brass, 0.175, 0.015, 0);
  box(g, 0.015, 0.03, 0.24, MAT.brass, -0.175, 0.015, 0);
  return g; };
OBJ.cuchillo = () => { const g = new THREE.Group();
  box(g, 0.26, 0.004, 0.04, MAT.steel, 0.13, 0.006, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), MAT.steel);
  tip.rotation.z = -Math.PI/2; tip.position.set(0.275, 0.006, 0); g.add(tip);
  box(g, 0.012, 0.016, 0.042, MAT.brass, -0.006, 0.008, 0);
  box(g, 0.09, 0.02, 0.03, MAT.woodDark, -0.055, 0.01, 0);
  return g; };
OBJ.tijeras = () => { const g = new THREE.Group();
  box(g, 0.14, 0.003, 0.014, MAT.steel, 0.07, 0.008, 0.01).rotation.y = 0.02;
  box(g, 0.14, 0.003, 0.014, MAT.steel, 0.07, 0.008, -0.01).rotation.y = -0.02;
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 8, 16), MAT.woodDark);
  r1.rotation.x = Math.PI/2; r1.position.set(-0.06, 0.008, 0.03); g.add(r1);
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 8, 16), MAT.woodDark);
  r2.rotation.x = Math.PI/2; r2.position.set(-0.06, 0.008, -0.03); g.add(r2);
  return g; };
OBJ.pistola = () => { const g = new THREE.Group();
  box(g, 0.16, 0.028, 0.024, MAT.black, 0.02, 0.04, 0);
  box(g, 0.08, 0.004, 0.018, MAT.black, 0, 0.056, 0);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16, Math.PI*1.2), MAT.black);
  guard.position.set(-0.035, 0.02, 0); guard.rotation.z = Math.PI*0.1; g.add(guard);
  box(g, 0.04, 0.08, 0.024, MAT.leather, -0.062, 0.005, 0).rotation.z = -0.2;
  return g; };
OBJ.martillo = () => { const g = new THREE.Group();
  cyl(g, 0.012, 0.015, 0.2, MAT.wood, 0, 0.1, 0, 12);
  box(g, 0.09, 0.04, 0.04, MAT.steelDark, 0, 0.21, 0);
  box(g, 0.05, 0.045, 0.045, MAT.steelDark, 0, 0.21, 0);
  return g; };
OBJ.destornillador = () => { const g = new THREE.Group();
  cyl(g, 0.004, 0.004, 0.14, MAT.steel, 0, 0.07, 0, 8);
  box(g, 0.006, 0.008, 0.006, MAT.steel, 0, 0.14, 0);
  cyl(g, 0.018, 0.014, 0.06, new THREE.MeshStandardMaterial({ color: 0x8a1a1a, roughness: 0.7 }), 0, 0.17, 0, 12);
  return g; };
OBJ.alicates = () => { const g = new THREE.Group();
  box(g, 0.1, 0.008, 0.02, MAT.steelDark, 0.05, 0.008, 0.02).rotation.y = 0.05;
  box(g, 0.1, 0.008, 0.02, MAT.steelDark, 0.05, 0.008, -0.02).rotation.y = -0.05;
  box(g, 0.09, 0.012, 0.03, MAT.black, -0.06, 0.008, 0.03);
  box(g, 0.09, 0.012, 0.03, MAT.black, -0.06, 0.008, -0.03);
  sph(g, 0.012, MAT.steelDark, 0, 0.008, 0);
  return g; };
OBJ.llaveInglesa = () => { const g = new THREE.Group();
  cyl(g, 0.014, 0.014, 0.22, MAT.steelDark, 0, 0.11, 0, 12);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.009, 8, 16, Math.PI*1.6), MAT.steelDark);
  head.position.set(0, 0.23, 0); head.rotation.x = Math.PI/2; g.add(head);
  return g; };
OBJ.cuchilla = () => { const g = new THREE.Group();
  box(g, 0.18, 0.003, 0.025, MAT.steel, 0.09, 0.005, 0);
  return g; };
OBJ.carta = () => { const g = new THREE.Group();
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.24, 8, 8), MAT.paper);
  sheet.rotation.x = -Math.PI/2;
  const pos = sheet.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x*6)*0.006 + Math.sin(y*8)*0.004);
  }
  sheet.geometry.computeVertexNormals();
  sheet.position.y = 0.005; g.add(sheet);
  for (let i = 0; i < 6; i++){
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.003), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.85 }));
    line.rotation.x = -Math.PI/2;
    line.position.set(-0.01, 0.012, -0.08 + i*0.03);
    g.add(line);
  }
  return g; };
OBJ.sobre = () => { const g = new THREE.Group();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), MAT.paper);
  front.rotation.x = -Math.PI/2; front.position.y = 0.005; g.add(front);
  const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.07), MAT.paperDark);
  flap.rotation.x = -Math.PI/2; flap.position.set(0, 0.006, -0.02); flap.rotation.z = 0.15; g.add(flap);
  return g; };
OBJ.libro = () => { const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0x5a1a1a, roughness: 0.7 });
  box(g, 0.17, 0.008, 0.24, cover, 0, 0.004, 0);
  box(g, 0.16, 0.028, 0.23, MAT.paperDark, 0.005, 0.022, 0);
  box(g, 0.17, 0.008, 0.24, cover, 0, 0.04, 0);
  box(g, 0.008, 0.04, 0.24, cover, -0.085, 0.02, 0);
  return g; };
OBJ.cuaderno = () => { const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.7 });
  box(g, 0.14, 0.006, 0.18, cover, 0, 0.003, 0);
  box(g, 0.13, 0.02, 0.17, MAT.paperDark, 0.005, 0.016, 0);
  box(g, 0.14, 0.006, 0.18, cover, 0, 0.029, 0);
  return g; };
OBJ.periodico = () => { const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.9 });
  const ink = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.85 });
  box(g, 0.28, 0.005, 0.4, paper, 0, 0.005, 0);
  box(g, 0.2, 0.001, 0.03, ink, 0, 0.008, -0.14);
  for (let i = 0; i < 8; i++) box(g, 0.2, 0.001, 0.002, ink, 0, 0.008, -0.08 + i*0.025);
  return g; };
OBJ.revista = () => { const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0x8a2a4a, roughness: 0.75 });
  box(g, 0.18, 0.008, 0.24, cover, 0, 0.004, 0);
  box(g, 0.17, 0.004, 0.23, MAT.paperDark, 0, 0.014, 0);
  box(g, 0.18, 0.008, 0.24, cover, 0, 0.024, 0);
  return g; };
OBJ.foto = () => { const g = new THREE.Group();
  box(g, 0.1, 0.001, 0.13, MAT.paper, 0, 0.001, 0);
  box(g, 0.08, 0.0005, 0.1, new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9 }), 0, 0.002, -0.01);
  return g; };
OBJ.carpeta = () => { const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0xa88040, roughness: 0.85 });
  box(g, 0.24, 0.008, 0.32, cover, 0, 0.004, 0);
  box(g, 0.22, 0.006, 0.3, MAT.paper, 0.005, 0.01, 0);
  box(g, 0.24, 0.008, 0.32, cover, 0, 0.017, 0);
  return g; };
OBJ.certificado = () => { const g = new THREE.Group();
  box(g, 0.2, 0.005, 0.28, MAT.paper, 0, 0.005, 0);
  box(g, 0.16, 0.001, 0.002, MAT.gold, 0, 0.008, 0);
  cyl(g, 0.02, 0.02, 0.003, new THREE.MeshStandardMaterial({ color: 0x8a1818, roughness: 0.6 }), 0.06, 0.008, 0.09, 20);
  return g; };
OBJ.ticket = () => { const g = new THREE.Group();
  box(g, 0.08, 0.0005, 0.05, MAT.paper, 0, 0.001, 0);
  return g; };
OBJ.panuelo = () => { const g = new THREE.Group();
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18, 8, 8), MAT.paper);
  cloth.rotation.x = -Math.PI/2;
  const pos = cloth.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x*8)*Math.cos(y*8)*0.005);
  }
  cloth.geometry.computeVertexNormals();
  cloth.castShadow = true; g.add(cloth);
  return g; };
OBJ.guante = () => { const g = new THREE.Group();
  box(g, 0.09, 0.02, 0.11, MAT.leather, 0, 0.01, 0);
  box(g, 0.09, 0.022, 0.04, MAT.woodDark, 0, 0.011, 0.07);
  for (let i = 0; i < 4; i++){
    const fg = new THREE.Group();
    box(fg, 0.018, 0.014, 0.035, MAT.leather, 0, 0.008, -0.017);
    box(fg, 0.016, 0.012, 0.03, MAT.leather, 0, 0.008, -0.048);
    fg.position.set(-0.03 + i*0.02, 0.01, -0.055);
    fg.rotation.x = -0.15;
    g.add(fg);
  }
  return g; };
OBJ.guantes = () => { const g = new THREE.Group();
  const a = OBJ.guante(); const b = OBJ.guante();
  b.position.set(0.16, 0, 0.06); b.rotation.y = 0.5;
  g.add(a); g.add(b);
  return g; };
OBJ.llave = () => { const g = new THREE.Group();
  const shaft = cyl(g, 0.006, 0.006, 0.11, MAT.brass, 0.02, 0.006, 0, 12);
  shaft.rotation.z = Math.PI/2;
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 10, 20), MAT.brass);
  head.rotation.x = Math.PI/2; head.position.set(-0.055, 0.006, 0); g.add(head);
  box(g, 0.008, 0.012, 0.018, MAT.brass, 0.06, 0.012, 0.008);
  return g; };
OBJ.llavero = () => { const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 16), MAT.brass);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.006; g.add(ring);
  const k1 = OBJ.llave(); k1.position.set(0.03, 0, 0.02); g.add(k1);
  const k2 = OBJ.llave(); k2.position.set(0.03, 0, -0.02); k2.rotation.y = 0.3; g.add(k2);
  return g; };
OBJ.reloj = () => { const g = new THREE.Group();
  cyl(g, 0.032, 0.032, 0.012, MAT.gold, 0, 0.006, 0, 24);
  cyl(g, 0.028, 0.028, 0.014, MAT.ceramic, 0, 0.007, 0, 24);
  box(g, 0.003, 0.001, 0.02, MAT.black, 0, 0.014, -0.005);
  box(g, 0.024, 0.008, 0.09, MAT.leather, 0, 0.004, 0.06);
  return g; };
OBJ.relojPared = () => { const g = new THREE.Group();
  cyl(g, 0.12, 0.12, 0.04, MAT.gold, 0, 0.02, 0, 24);
  cyl(g, 0.11, 0.11, 0.045, MAT.ceramic, 0, 0.02, 0, 24);
  for (let i = 0; i < 12; i++){
    const a = (i/12)*Math.PI*2;
    sph(g, 0.004, MAT.gold, Math.cos(a)*0.09, 0.023, Math.sin(a)*0.09);
  }
  box(g, 0.005, 0.005, 0.07, MAT.black, 0, 0.024, -0.035);
  return g; };
OBJ.movil = () => { const g = new THREE.Group();
  box(g, 0.07, 0.008, 0.14, new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.5 }), 0, 0.004, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x1a3050, emissive: 0x2a5080, emissiveIntensity: 0.5 }));
  s.rotation.x = -Math.PI/2; s.position.y = 0.009; g.add(s);
  return g; };
OBJ.cartera = () => { const g = new THREE.Group();
  box(g, 0.12, 0.02, 0.09, MAT.leather, 0, 0.01, 0);
  box(g, 0.12, 0.005, 0.09, MAT.woodDark, 0, 0.022, 0);
  box(g, 0.1, 0.001, 0.06, MAT.paper, 0, 0.024, 0.02);
  return g; };
OBJ.monedero = () => { const g = new THREE.Group();
  box(g, 0.08, 0.025, 0.07, new THREE.MeshStandardMaterial({ color: 0x5a3a5a, roughness: 0.85 }), 0, 0.0125, 0);
  sph(g, 0.008, MAT.brass, 0, 0.027, 0.02);
  return g; };
OBJ.monedas = () => { const g = new THREE.Group();
  [[0,0,0,MAT.gold],[0.03,0,0.005,MAT.silver],[-0.02,0.005,0.02,MAT.gold],[0.02,0.005,0.03,MAT.silver]].forEach(([x,y,z,m]) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 16), m);
    c.position.set(x, y + 0.002, z); c.castShadow = true; g.add(c);
  });
  return g; };
OBJ.billetes = () => { const g = new THREE.Group();
  box(g, 0.14, 0.001, 0.07, new THREE.MeshStandardMaterial({ color: 0x6a8a6a, roughness: 0.75, side: THREE.DoubleSide }), 0, 0.001, 0);
  box(g, 0.14, 0.001, 0.07, new THREE.MeshStandardMaterial({ color: 0x8a6a8a, roughness: 0.75, side: THREE.DoubleSide }), 0.01, 0.003, 0.005);
  return g; };
OBJ.gafas = () => { const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.3, roughness: 0.4 });
  const l1 = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.03, 20), frame);
  l1.rotation.x = -Math.PI/2; l1.position.set(-0.035, 0.005, 0); g.add(l1);
  const l2 = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.03, 20), frame);
  l2.rotation.x = -Math.PI/2; l2.position.set(0.035, 0.005, 0); g.add(l2);
  return g; };
OBJ.sombrero = () => { const g = new THREE.Group();
  cyl(g, 0.11, 0.11, 0.008, MAT.black, 0, 0.004, 0, 32);
  cyl(g, 0.06, 0.07, 0.09, MAT.black, 0, 0.05, 0, 24);
  cyl(g, 0.062, 0.062, 0.015, MAT.fabricRed, 0, 0.015, 0, 24);
  return g; };
OBJ.gorra = () => { const g = new THREE.Group();
  sph(g, 0.075, MAT.fabricBlue, 0, 0.065, 0).scale.set(1, 0.7, 1);
  const v = box(g, 0.14, 0.008, 0.09, MAT.black, 0, 0.045, 0.09);
  v.rotation.x = -0.15;
  return g; };
OBJ.zapato = () => { const g = new THREE.Group();
  box(g, 0.12, 0.02, 0.3, MAT.black, 0, 0.01, 0);
  box(g, 0.1, 0.05, 0.2, new THREE.MeshStandardMaterial({ color: 0x1a1010, roughness: 0.65 }), 0, 0.045, 0.02);
  return g; };
OBJ.pendiente = () => { const g = new THREE.Group();
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 20), MAT.gold);
  hoop.rotation.x = Math.PI/2; hoop.position.y = 0.02; g.add(hoop);
  sph(g, 0.014, MAT.ceramic, 0, 0.005, 0);
  return g; };
OBJ.joyas = () => { const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 10, 24), MAT.gold);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.006; g.add(ring);
  const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0),
    new THREE.MeshStandardMaterial({ color: 0x4a90e2, roughness: 0.05, emissive: 0x1a3060, emissiveIntensity: 0.3 }));
  stone.position.set(0, 0.022, 0); g.add(stone);
  return g; };
OBJ.pulsera = () => { const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.005, 10, 30), MAT.gold);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.005; g.add(ring);
  return g; };
OBJ.cadena = () => { const g = new THREE.Group();
  for (let i = 0; i < 20; i++){
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0018, 6, 10), MAT.gold);
    link.rotation.y = Math.PI/2;
    link.rotation.x = (i % 2)*Math.PI/2;
    link.position.set(0, 0.005, -0.08 + i*0.008);
    g.add(link);
  }
  return g; };
OBJ.medalla = () => { const g = new THREE.Group();
  box(g, 0.04, 0.001, 0.06, MAT.fabricRed, 0, 0.001, -0.03);
  cyl(g, 0.025, 0.025, 0.004, MAT.gold, 0, 0.004, 0, 24);
  sph(g, 0.012, MAT.gold, 0, 0.008, 0);
  return g; };
OBJ.huella = () => { const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.8 });
  for (let i = 0; i < 5; i++){
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.012 + i*0.006, 0.014 + i*0.006, 24, 1, -Math.PI/2, Math.PI*1.3), dark);
    arc.rotation.x = -Math.PI/2;
    arc.position.y = 0.002 + i*0.0003;
    g.add(arc);
  }
  return g; };
OBJ.casquillo = () => { const g = new THREE.Group();
  cyl(g, 0.006, 0.006, 0.022, MAT.brass, 0, 0.011, 0, 14);
  cyl(g, 0.004, 0.004, 0.002, MAT.woodDark, 0, 0.001, 0, 14);
  cyl(g, 0.0065, 0.0065, 0.002, MAT.brass, 0, 0.021, 0, 14);
  return g; };
OBJ.bala = () => { const g = new THREE.Group();
  cyl(g, 0.005, 0.005, 0.018, new THREE.MeshStandardMaterial({ color: 0xb08050, metalness: 0.85, roughness: 0.3 }), 0, 0.009, 0, 12);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.012, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a7a6a, metalness: 0.6, roughness: 0.5 }));
  tip.position.y = 0.024; g.add(tip);
  return g; };
OBJ.mancha = () => { const g = new THREE.Group();
  const blood = new THREE.MeshStandardMaterial({ color: 0x5a0a08, roughness: 0.5, transparent: true, opacity: 0.9 });
  const circle = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), blood);
  circle.rotation.x = -Math.PI/2; circle.position.y = 0.002;
  circle.scale.set(1.2, 0.8, 1); g.add(circle);
  for (let i = 0; i < 5; i++){
    const drop = new THREE.Mesh(new THREE.CircleGeometry(0.01 + Math.random()*0.015, 12), blood);
    drop.rotation.x = -Math.PI/2;
    const a = Math.random()*Math.PI*2, r = 0.1 + Math.random()*0.08;
    drop.position.set(Math.cos(a)*r, 0.002, Math.sin(a)*r);
    g.add(drop);
  }
  return g; };
OBJ.polvo = () => { const g = new THREE.Group();
  const dust = new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.95, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 40; i++){
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.003 + Math.random()*0.003, 6, 5), dust);
    p.position.set((Math.random()-0.5)*0.1, 0.002 + Math.random()*0.005, (Math.random()-0.5)*0.1);
    g.add(p);
  }
  return g; };
OBJ.flores = () => { const g = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: 0x2a4a1a, roughness: 0.9 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc02020, roughness: 0.7, side: THREE.DoubleSide });
  const pink = new THREE.MeshStandardMaterial({ color: 0xd06080, roughness: 0.7, side: THREE.DoubleSide });
  cyl(g, 0.004, 0.006, 0.24, green, 0, 0.12, 0, 8);
  for (let i = 0; i < 4; i++){
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.08), green);
    leaf.position.set((Math.random()-0.5)*0.05, 0.05 + i*0.05, (Math.random()-0.5)*0.05);
    leaf.rotation.z = -0.5 + Math.random();
    leaf.rotation.y = Math.random()*Math.PI*2;
    g.add(leaf);
  }
  const pms = [red, pink, red];
  for (let i = 0; i < 8; i++){
    const angle = (i/8)*Math.PI*2;
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), pms[i%3]);
    petal.position.set(Math.cos(angle)*0.018, 0.25, Math.sin(angle)*0.018);
    petal.lookAt(0, 0.25, 0); g.add(petal);
  }
  sph(g, 0.012, new THREE.MeshStandardMaterial({ color: 0xf0d040, roughness: 0.7 }), 0, 0.255, 0);
  return g; };
OBJ.vela = () => { const g = new THREE.Group();
  cyl(g, 0.03, 0.035, 0.015, MAT.brass, 0, 0.008, 0, 20);
  cyl(g, 0.018, 0.018, 0.14, new THREE.MeshStandardMaterial({ color: 0xe8e0c0, roughness: 0.85 }), 0, 0.09, 0, 20);
  box(g, 0.002, 0.012, 0.002, MAT.black, 0, 0.165, 0);
  const fireMat = new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0xff8020, emissiveIntensity: 3 });
  sph(g, 0.015, fireMat, 0, 0.175, 0);
  const light = new THREE.PointLight(0xffb040, 0.6, 2, 1.5);
  light.position.y = 0.18; g.add(light);
  return g; };
OBJ.cerillas = () => { const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xe0c090, roughness: 0.9 });
  const head = new THREE.MeshStandardMaterial({ color: 0x8a1818, roughness: 0.7 });
  for (let i = 0; i < 8; i++){
    const m = cyl(g, 0.0015, 0.0015, 0.05, wood, -0.008 + i*0.002, 0.025, (Math.random()-0.5)*0.005, 6);
    m.rotation.z = (Math.random()-0.5)*0.2;
    sph(g, 0.003, head, -0.008 + i*0.002, 0.05, 0);
  }
  return g; };
OBJ.cenicero = () => { const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.85 });
  cyl(g, 0.055, 0.06, 0.02, glass, 0, 0.01, 0, 24);
  cyl(g, 0.045, 0.045, 0.003, new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1 }), 0, 0.019, 0, 20);
  return g; };
OBJ.cuerda = () => { const g = new THREE.Group();
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.06, 0.01, 64, 8, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.95 }));
  knot.position.y = 0.02; knot.scale.set(1, 0.4, 1);
  knot.castShadow = true; g.add(knot);
  return g; };
OBJ.baston = () => { const g = new THREE.Group();
  cyl(g, 0.014, 0.02, 0.85, MAT.wood, 0, 0.425, 0, 12);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 10, 20, Math.PI), MAT.brass);
  handle.position.set(0, 0.85, 0); handle.rotation.x = Math.PI/2; g.add(handle);
  return g; };
OBJ.paraguas = () => { const g = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.8 });
  cyl(g, 0.02, 0.02, 0.75, fabric, 0, 0.375, 0, 16);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.2, 16, 1, true), fabric);
  canopy.position.y = 0.85; g.add(canopy);
  cyl(g, 0.008, 0.008, 0.15, MAT.black, 0, 0.9, 0, 8);
  return g; };
OBJ.marco = () => { const g = new THREE.Group();
  box(g, 0.14, 0.02, 0.18, new THREE.MeshStandardMaterial({ color: 0x4a3d22, roughness: 0.6 }), 0, 0.01, 0);
  const img = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.13), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.85 }));
  img.rotation.x = -Math.PI/2; img.position.y = 0.022; g.add(img);
  return g; };
OBJ.camara = () => { const g = new THREE.Group();
  box(g, 0.12, 0.08, 0.05, MAT.black, 0, 0.04, 0);
  cyl(g, 0.025, 0.03, 0.05, MAT.steelDark, 0, 0.04, 0.05, 20).rotation.x = Math.PI/2;
  return g; };
OBJ.grabadora = () => { const g = new THREE.Group();
  box(g, 0.1, 0.025, 0.06, new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6 }), 0, 0.0125, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x1a3050, emissive: 0x2a5080, emissiveIntensity: 0.4 }));
  s.rotation.x = -Math.PI/2; s.position.y = 0.026; s.position.z = -0.01; g.add(s);
  return g; };
OBJ.usb = () => { const g = new THREE.Group();
  box(g, 0.018, 0.008, 0.04, MAT.black, 0, 0.004, 0);
  box(g, 0.012, 0.005, 0.012, MAT.silver, 0, 0.004, -0.026);
  return g; };
OBJ.dvd = () => { const g = new THREE.Group();
  cyl(g, 0.06, 0.06, 0.0015, MAT.silver, 0, 0.001, 0, 40);
  cyl(g, 0.045, 0.045, 0.002, new THREE.MeshStandardMaterial({ color: 0x4a2a5a, roughness: 0.5 }), 0, 0.0018, 0, 40);
  return g; };

function getObjectModel(obj){
  const id = (obj.id || '').toLowerCase();
  const name = (obj.name || '').toLowerCase();
  if (OBJ[id]) return OBJ[id];
  const map = [
    ['taza','taza'],['té','taza'],['termo','taza'],
    ['azucarero','azucarero'],['azúcar','azucarero'],
    ['vaso','vaso'],['whisky','vaso'],['brandy','vaso'],['licor','vaso'],
    ['copa','copa'],['champán','copa'],
    ['botella','botella'],['licorera','botella'],
    ['frasco','frasco'],['somnífero','frasco'],['reactivo','frasco'],['vial','frasco'],
    ['lata','lata'],['refresco','lata'],
    ['tetera','tetera'],['bandeja','bandeja'],
    ['cuchillo','cuchillo'],['tijeras','tijeras'],['podar','tijeras'],
    ['pistola','pistola'],['revólver','pistola'],['arma','pistola'],
    ['martillo','martillo'],['destornillador','destornillador'],
    ['alicates','alicates'],['llave inglesa','llaveInglesa'],
    ['cuchilla','cuchilla'],['navaja','cuchilla'],
    ['carta','carta'],['nota','carta'],['mensaje','carta'],
    ['sobre','sobre'],
    ['libro','libro'],['cuaderno','cuaderno'],['testamento','libro'],['bitácora','libro'],
    ['periódico','periodico'],['revista','revista'],
    ['carpeta','carpeta'],
    ['certificado','certificado'],['diploma','certificado'],
    ['foto','foto'],['ticket','ticket'],['entrada','ticket'],
    ['pañuelo','panuelo'],['guante','guantes'],['guantes','guantes'],
    ['llave','llave'],['llavero','llavero'],
    ['reloj de pared','relojPared'],['reloj','reloj'],
    ['móvil','movil'],['teléfono','movil'],
    ['cartera','cartera'],['monedero','monedero'],
    ['moneda','monedas'],['dinero','billetes'],['billete','billetes'],
    ['gafas','gafas'],['anteojos','gafas'],
    ['sombrero','sombrero'],['gorra','gorra'],
    ['zapato','zapato'],
    ['pendiente','pendiente'],
    ['joya','joyas'],['anillo','joyas'],['collar','joyas'],
    ['pulsera','pulsera'],['cadena','cadena'],['medalla','medalla'],
    ['huella','huella'],
    ['casquillo','casquillo'],['vaina','casquillo'],
    ['bala','bala'],['mancha','mancha'],['sangre','mancha'],
    ['polvo','polvo'],['flor','flores'],['rosa','flores'],
    ['vela','vela'],['cerilla','cerillas'],['cenicero','cenicero'],
    ['cuerda','cuerda'],['soga','cuerda'],['cabo','cuerda'],
    ['bastón','baston'],['paraguas','paraguas'],['marco','marco'],
    ['cámara','camara'],['grabadora','grabadora'],['usb','usb'],['dvd','dvd']
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
    box(g, 0.08, 0.05, 0.08, MAT.wood, 0, 0.025, 0);
    box(g, 0.085, 0.008, 0.085, MAT.brass, 0, 0.054, 0);
    return g;
  };
}

/* ====================================================================
   CADÁVER
   ==================================================================== */
const CORPSE_POSES = {
  supine: { armL: 1.2, armR: 1.2, legL: 0.1, legR: -0.1, torsoY: 0, headY: 0 },
  side:   { armL: 1.4, armR: 0.8, legL: 0.5, legR: -0.1, torsoY: -0.4, headY: 0.2 },
  prone:  { armL: 1.5, armR: -1.5, legL: 0.1, legR: -0.1, torsoY: 0, headY: 0.1 },
  curled: { armL: 2.2, armR: 2.2, legL: 1.4, legR: 1.4, torsoY: -0.5, headY: 0.3 },
  seated: { armL: 0.3, armR: 0.3, legL: 1.5, legR: -1.5, torsoY: 0, headY: 0 }
};
function buildCorpse(scene, poseKey, x, z, ry){
  poseKey = poseKey || 'supine';
  const pose = CORPSE_POSES[poseKey] || CORPSE_POSES.supine;
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xd8c0a8, roughness: 0.95 });
  const shirt = MAT.fabricBlue;
  const pants = MAT.black;
  const shoes = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.85 });
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
    s.scale.set(1, 0.6 + Math.random()*0.8, 1); g.add(s);
  }
  const yb = 0.14;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), skin);
  head.position.set(0, yb, -0.68);
  head.scale.set(0.9, 1.0, 1.15); head.castShadow = true;
  head.rotation.y = pose.headY; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 24, 16, 0, Math.PI*2, 0, Math.PI*0.5),
    new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.95 }));
  hair.position.set(0, yb + 0.01, -0.68); hair.scale.set(0.9, 1.0, 1.15); g.add(hair);
  box(g, 0.14, 0.1, 0.14, skin, 0, yb, -0.5);
  box(g, 0.5, 0.26, 0.85, shirt, 0, yb, 0);
  box(g, 0.46, 0.24, 0.24, pants, 0, yb, 0.55);
  function buildArm(side, rotY){
    const grp = new THREE.Group();
    box(grp, 0.13, 0.14, 0.42, shirt, 0, 0, -0.21);
    box(grp, 0.12, 0.13, 0.4, shirt, 0, 0, -0.62);
    box(grp, 0.1, 0.11, 0.12, skin, 0, 0, -0.88);
    grp.position.set(side * 0.36, yb, -0.24);
    grp.rotation.y = rotY;
    return grp;
  }
  g.add(buildArm(-1, pose.armL));
  g.add(buildArm(1, pose.armR));
  function buildLeg(side, rotY){
    const grp = new THREE.Group();
    box(grp, 0.16, 0.16, 0.5, pants, 0, 0, 0.25);
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
  Room.register(x, z, 1.6, 2.6, ry);
  return g;
}

/* ====================================================================
   LAYOUTS — CADA UNO ES RADICALMENTE DISTINTO
   ==================================================================== */

/* ---------- DESPACHO (detective clásico, chimenea, sillón de cuero) ---------- */
function layoutDespacho(scene, ov){
  const size = ov.size || 12, H = ov.height || 3.2;
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.parquet,
    wallTex: () => TEX.wallpaper('#2a1d10', 'rgba(0,0,0,0.18)', { damask: true, damaskColor: '#1a0e04' }),
    wallTint: 0x9a8060,
    wainscot: true, wainscotH: 1.1,
    wainscotMat: new THREE.MeshStandardMaterial({ color: 0x4a2410, roughness: 0.7 }),
    wainscotRailMat: new THREE.MeshStandardMaterial({ color: 0x5a2c14, roughness: 0.6 }),
    beams: ov.beams != null ? ov.beams : 5,
    beamColor: 0x1a0a04,
    corniceColor: 0x1a0804,
    baseColor: 0x1a0a04,
    dustColor: 0xffb060,
    ambientColor: 0x3a2a20,
    ambientIntensity: 0.5
  });
  const h = size/2;

  // Puerta E, ventana grande O (con lluvia)
  Room.addDoor('E', 2.8, 1.1);
  Room.addWindow('W', -1.2, 2.6, 1.8);
  const doorPos = Room.anchor('E', 2.8, 0.1, 0);
  const d = makeDoor(1.0, 2.2); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  const winPos = Room.anchor('W', -1.2, 0.1, 1.9);
  const w = makeWindow(2.6, 1.8); w.position.set(winPos.x, winPos.y, winPos.z); w.rotation.y = winPos.rot; scene.add(w);

  // Alfombra persa GRANDE en el centro
  const rug = makeRug(4.5, 3.5, ['#4a1010', 'rgba(212,160,23,0.5)']);
  rug.position.set(-1, 0.006, 1.2); scene.add(rug);

  // Chimenea en la pared S — elemento clave
  const fp = makeFireplace();
  const fA = Room.anchor('S', -2.5, 0.4, 0);
  fp.group.position.set(fA.x, 0, fA.z);
  fp.group.rotation.y = fA.rot;
  scene.add(fp.group);
  Room.register(fA.x, fA.z, fp.w, fp.d, fA.rot);

  // Escritorio de nogal, en pared N
  Room.place(
    (x, z, r) => {
      const dk = makeDesk(); dk.group.position.set(x, 0, z); dk.group.rotation.y = r; scene.add(dk.group);
      const lamp = makeTableLamp();
      lamp.group.position.set(x - 0.7*Math.cos(r), 0.79, z - 0.7*Math.sin(r));
      scene.add(lamp.group);
      const cx = x + Math.sin(r) * 1.2, cz = z - Math.cos(r) * 1.2;
      if (Room.fits(cx, cz, 0.6, 0.6, r, 0.1)){
        const ch = makeChair();
        ch.group.position.set(cx, 0, cz); ch.group.rotation.y = r + Math.PI;
        scene.add(ch.group); Room.register(cx, cz, 0.6, 0.6, r);
      }
    },
    { w: 2.3, d: 1.2, try: [[-2.5, -h + 1.2, 0], [2.5, -h + 1.2, 0]] }
  );

  // Sillón de cuero frente a la chimenea
  Room.place(
    (x, z, r) => { const a = makeArmchair(); a.group.position.set(x, 0, z); a.group.rotation.y = r; scene.add(a.group); },
    { w: 1.05, d: 0.95, try: [[-2.5, 0.8, 0], [-2.5, 2.5, 0], [0, 2.5, -Math.PI/2]] }
  );

  // Estanterías en pared E (junto a la puerta)
  [['E', -2.5], ['E', -5.5]].forEach(([wall, off]) => {
    const a = Room.anchor(wall, off, 0.25, 0);
    const bs = makeBookshelf(2.2, 2.8);
    if (Room.fits(a.x, a.z, bs.w, bs.d, a.rot, 0.1)){
      bs.group.position.set(a.x, 0, a.z); bs.group.rotation.y = a.rot;
      scene.add(bs.group); Room.register(a.x, a.z, bs.w, bs.d, a.rot);
    }
  });

  // Cuadros en pared N
  [1.5, -0.3].forEach((off, i) => {
    const s = i === 0 ? [1.6, 1.2, 0] : [0.9, 0.9, 1];
    const a = Room.anchor('N', off, 0.1, 2.0);
    const p = makePainting(s[0], s[1], s[2]);
    p.position.set(a.x, a.y, a.z); p.rotation.y = a.rot; scene.add(p);
  });

  // Reloj de pared + reloj sobre la chimenea
  const rp = OBJ.relojPared();
  const rpA = Room.anchor('N', 3.5, 0.1, 2.2);
  rp.position.set(rpA.x, rpA.y, rpA.z); rp.rotation.y = rpA.rot; scene.add(rp);

  // Plantas
  [[-h + 0.9, -h + 0.9], [h - 0.9, h - 0.9]].forEach(([x, z]) => {
    const p = makePlant();
    if (Room.fits(x, z, p.w, p.d, 0, 0.05)){
      p.group.position.set(x, 0, z); scene.add(p.group); Room.register(x, z, p.w, p.d, 0);
    }
  });

  // Lámpara de techo verde banquero
  const lamp1 = makeCeilingLamp(1.6, 0x90b070);
  lamp1.position.set(-1, H, 1.2); scene.add(lamp1);
  const lamp2 = makeCeilingLamp(1.2, 0xa07040);
  lamp2.position.set(3, H, -1); scene.add(lamp2);

  return {
    corpsePos: { x: 0.5, z: 2.5, rot: Math.PI * 0.3 },
    pose: 'supine',
    spawn: { x: 4, z: -h + 1.5 },
    objectSlots: [
      { x: -3.5, y: 0.80, z: -h + 1.2 }, { x: -2.9, y: 0.80, z: -h + 1.2 },
      { x: -2.2, y: 0.80, z: -h + 1.2 }, { x: -1.5, y: 0.80, z: -h + 1.2 },
      { x: h - 1.5, y: 2.3, z: -2.5 }, { x: h - 1.5, y: 1.7, z: -2.5 },
      { x: h - 1.5, y: 1.1, z: -2.5 }, { x: -2.5, y: 2.4, z: h - 0.8 }
    ]
  };
}

/* ---------- DORMITORIO (lujoso, dosel, tonos azul-violeta) ---------- */
function layoutDormitorio(scene, ov){
  const size = ov.size || 11, H = ov.height || 3.0;
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.parquet,
    wallTex: () => TEX.wallpaper('#3a3050', 'rgba(0,0,0,0.10)', { damask: true, damaskColor: '#1a1428' }),
    wainscot: true, wainscotH: 0.9,
    wainscotMat: new THREE.MeshStandardMaterial({ color: 0x2a2040, roughness: 0.7 }),
    wainscotRailMat: new THREE.MeshStandardMaterial({ color: 0x4a3a5a, roughness: 0.6 }),
    corniceColor: 0x4a3a5a,
    baseColor: 0x3a2a50,
    dustColor: 0xd0a0ff,
    ambientColor: 0x404060,
    ambientIntensity: 0.5
  });
  const h = size/2;

  Room.addDoor('W', 2.6, 1.0);
  Room.addWindow('E', -1.8, 2.2, 1.6);
  const doorPos = Room.anchor('W', 2.6, 0.1, 0);
  const d = makeDoor(1.0, 2.2); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  const winPos = Room.anchor('E', -1.8, 0.1, 1.9);
  const w = makeWindow(2.2, 1.6); w.position.set(winPos.x, winPos.y, winPos.z); w.rotation.y = winPos.rot; scene.add(w);
  // Cortina sobre la ventana
  const curtMat = new THREE.MeshStandardMaterial({ map: TEX.curtain(), roughness: 0.85, side: THREE.DoubleSide });
  const curt = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.2), curtMat);
  curt.position.set(h - 0.2, 1.9, -1.8); curt.rotation.y = -Math.PI/2; scene.add(curt);

  // Alfombra suave
  const rug = makeRug(4, 3, ['#2a1a3a', 'rgba(180,140,220,0.4)']);
  rug.position.set(0, 0.006, 1); scene.add(rug);

  // Cama con dosel — DOMINANTE
  const bed = Room.place(
    (x, z, r) => { const m = makeBed(); m.group.position.set(x, 0, z); m.group.rotation.y = r; scene.add(m.group); },
    { w: 2.3, d: 2.6, try: [[-h + 1.8, -h + 1.5, 0], [h - 1.8, -h + 1.5, Math.PI/2]] }
  );

  // Dos mesillas con velas
  if (bed){
    [[-1.6, 0], [1.6, 0]].forEach(([dx]) => {
      const nx = bed.x + dx, nz = bed.z;
      const ns = makeNightstand();
      if (Room.fits(nx, nz, 0.65, 0.65, 0, 0.05)){
        ns.group.position.set(nx, 0, nz); scene.add(ns.group);
        Room.register(nx, nz, 0.65, 0.65, 0);
        const v = OBJ.vela(); v.position.set(nx, 0.65, nz); scene.add(v);
        const v2 = OBJ.vela(); v2.position.set(nx + 0.15, 0.65, nz + 0.1); scene.add(v2);
      }
    });
  }

  // Armario ropero con espejo
  Room.place(
    (x, z, r) => { const m = makeWardrobe(); m.group.position.set(x, 0, z); m.group.rotation.y = r; scene.add(m.group); },
    { w: 1.8, d: 0.9, try: [[h - 0.6, -h + 1.8, -Math.PI/2], [h - 0.6, h - 1.8, -Math.PI/2]] }
  );

  // Tocador con espejo de bombillas
  const vm = makeVanityMirror();
  const vmAnchor = Room.anchor('N', 1.5, 0.1, 0);
  vm.group.position.set(vmAnchor.x, 0, vmAnchor.z);
  vm.group.rotation.y = vmAnchor.rot;
  scene.add(vm.group);
  // Mesa del tocador
  const vt = makeNightstand();
  vt.group.position.set(vmAnchor.x, 0, vmAnchor.z + 0.3);
  scene.add(vt.group);
  Room.register(vmAnchor.x, vmAnchor.z + 0.3, 0.65, 0.65, 0);

  // Cuadro romántico en pared S
  const pt = makePainting(1.4, 1.0, 2);
  const ptA = Room.anchor('S', 1.5, 0.1, 2.0);
  pt.position.set(ptA.x, ptA.y, ptA.z); pt.rotation.y = ptA.rot; scene.add(pt);

  // Planta en esquina
  const p2 = makePlant();
  p2.group.position.set(h - 0.9, 0, h - 0.9); scene.add(p2.group);
  Room.register(h - 0.9, h - 0.9, 0.6, 0.6, 0);

  // Candil (chandelier) en el centro
  const ch = makeChandelier();
  ch.position.set(0, H - 0.2, 0); scene.add(ch);
  // Luz de ambiente cálida
  const warmth = new THREE.PointLight(0xffa0c0, 0.6, 8, 1.8);
  warmth.position.set(0, 2, 0); scene.add(warmth);

  return {
    corpsePos: { x: 1.5, z: 1.2, rot: Math.PI * 0.3 },
    pose: 'side',
    spawn: { x: -2, z: 4.0 },
    objectSlots: [
      { x: -h + 2.4, y: 0.87, z: -h + 1.5 }, { x: -h + 3.7, y: 0.87, z: -h + 1.5 },
      { x: -h + 0.9, y: 0.66, z: -h + 1.5 }, { x: -h + 4.5, y: 0.66, z: -h + 1.5 },
      { x: h - 1.7, y: 1.9, z: -h + 1.8 }, { x: h - 1.7, y: 1.3, z: -h + 1.8 },
      { x: 1.5, y: 1.6, z: h - 0.4 }, { x: h - 0.9, y: 0.1, z: h - 0.9 }
    ]
  };
}

/* ---------- BIBLIOTECA (gótica, mármol oscuro, columnas, casetones) ---------- */
function layoutBiblioteca(scene, ov){
  const size = ov.size || 14, H = ov.height || 4.0;
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.marbleDark,
    wallTex: () => TEX.wallpaper('#1a2a20', 'rgba(0,0,0,0.20)', { damask: true, damaskColor: '#0a1810' }),
    wallTint: 0x709080,
    wainscot: true, wainscotH: 1.3,
    wainscotMat: new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.6 }),
    wainscotRailMat: new THREE.MeshStandardMaterial({ color: 0x4a3a18, roughness: 0.5, metalness: 0.2 }),
    coffered: true,                       // TECHO CON CASETONES
    columns: [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]], // COLUMNAS
    colColor: 0x8a7a58, colCapColor: 0x4a3a18,
    corniceColor: 0x4a3a18,
    baseColor: 0x2a1a08,
    baseH: 0.22,
    dustColor: 0x80d0a0,
    ambientColor: 0x204030,
    ambientIntensity: 0.35
  });
  const h = size/2;

  Room.addDoor('E', 3.0, 1.2);
  Room.addWindow('W', -3.0, 2.2, 2.0);
  Room.addWindow('W', 3.0, 2.2, 2.0);
  const doorPos = Room.anchor('E', 3.0, 0.1, 0);
  const d = makeDoor(1.1, 2.4); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  [-3, 3].forEach(off => {
    const a = Room.anchor('W', off, 0.1, 2.1);
    const w = makeWindow(2.2, 2.0);
    w.position.set(a.x, a.y, a.z); w.rotation.y = a.rot; scene.add(w);
  });

  // Alfombra oriental mediana
  const rug = makeRug(3.5, 5, ['#2a1010', 'rgba(200,160,60,0.6)']);
  rug.position.set(0, 0.006, 0); scene.add(rug);

  // Estanterías de suelo a techo en pared N (3 grandes)
  [-4, 0, 4].forEach(off => {
    const a = Room.anchor('N', off, 0.3, 0);
    const bs = makeBookshelf(3.4, 3.6);
    if (Room.fits(a.x, a.z, bs.w, bs.d, a.rot, 0.1)){
      bs.group.position.set(a.x, 0, a.z); bs.group.rotation.y = a.rot;
      scene.add(bs.group); Room.register(a.x, a.z, bs.w, bs.d, a.rot);
    }
  });
  // Estanterías laterales
  [-2.5, 2.5].forEach(off => {
    ['W', 'E'].forEach(wall => {
      const a = Room.anchor(wall, off, 0.3, 0);
      const bs = makeBookshelf(3.0, 3.6);
      if (Room.fits(a.x, a.z, bs.w, bs.d, a.rot, 0.1)){
        bs.group.position.set(a.x, 0, a.z); bs.group.rotation.y = a.rot;
        scene.add(bs.group); Room.register(a.x, a.z, bs.w, bs.d, a.rot);
      }
    });
  });

  // Mesa central larga con lámparas verdes
  Room.place(
    (x, z, r) => {
      const dk = makeDesk(); dk.group.position.set(x, 0, z); dk.group.rotation.y = r; scene.add(dk.group);
      const lamp = makeTableLamp();
      lamp.group.position.set(x - 0.6, 0.79, z - 0.3);
      scene.add(lamp.group);
      const lamp2 = makeTableLamp();
      lamp2.group.position.set(x + 0.6, 0.79, z + 0.3);
      scene.add(lamp2.group);
    },
    { w: 2.3, d: 1.2, try: [[0, 0.5, 0]] }
  );

  // Sillas alrededor de la mesa
  [[0, -1.4, Math.PI], [0, 1.4, 0], [-1.8, 0.5, Math.PI/2], [1.8, 0.5, -Math.PI/2]].forEach(([dx, dz, r]) => {
    const cx = dx, cz = 0.5 + dz;
    if (Room.fits(cx, cz, 0.6, 0.6, r, 0.05)){
      const ch = makeChair();
      ch.group.position.set(cx, 0, cz); ch.group.rotation.y = r;
      scene.add(ch.group); Room.register(cx, cz, 0.6, 0.6, r);
    }
  });

  // Globos terráqueos decorativos
  [[-4, -h + 0.9], [4, -h + 0.9]].forEach(([x, z]) => {
    const gs = makeGlobeStand();
    if (Room.fits(x, z, gs.w, gs.d, 0, 0.05)){
      gs.group.position.set(x, 0, z); scene.add(gs.group); Room.register(x, z, gs.w, gs.d, 0);
    }
  });

  // Cuadros grandes en pared S
  [-4, 0, 4].forEach((off, i) => {
    const s = i === 1 ? [2.2, 1.6, 3] : [1.4, 1.0, i];
    const a = Room.anchor('S', off, 0.1, i === 1 ? 2.8 : 2.5);
    const p = makePainting(s[0], s[1], s[2]);
    p.position.set(a.x, a.y, a.z); p.rotation.y = a.rot; scene.add(p);
  });

  // Candil grande en el centro
  const ch = makeChandelier();
  ch.position.set(0, H - 0.3, 0); scene.add(ch);
  // Luces adicionales en esquinas
  const lampA = makeCeilingLamp(1.3, 0xffc060);
  lampA.position.set(-4, H - 0.1, -4); scene.add(lampA);
  const lampB = makeCeilingLamp(1.3, 0xffc060);
  lampB.position.set(4, H - 0.1, 4); scene.add(lampB);

  return {
    corpsePos: { x: 0.8, z: 2.5, rot: Math.PI * 0.5 },
    pose: 'prone',
    spawn: { x: 4, z: 5.5 },
    objectSlots: [
      { x: -4, y: 2.4, z: -h + 0.6 }, { x: -4, y: 1.7, z: -h + 0.6 },
      { x: 0, y: 2.4, z: -h + 0.6 }, { x: 0, y: 1.7, z: -h + 0.6 },
      { x: 4, y: 2.4, z: -h + 0.6 }, { x: -0.8, y: 0.80, z: 0.2 },
      { x: 0.4, y: 0.80, z: 0.8 }, { x: 0.9, y: 0.80, z: 0.2 }
    ]
  };
}

/* ---------- EXTERIOR (jardín nocturno) ---------- */
function layoutExterior(scene, ov){
  const SIZE = ov.size || 26;
  const half = SIZE/2;
  World.roomHalf = half;
  World.roomHeight = 14;
  World.bounds = { minX: -half + 1, maxX: half - 1, minZ: -half + 1, maxZ: half - 1 };
  Room.init(SIZE, 14);
  const gt = TEX.grass(); gt.repeat.set(13, 13);
  const groundMat = new THREE.MeshStandardMaterial({ map: gt, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), groundMat);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x080818, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  for (let i = 0; i < 240; i++){
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.05 + Math.random()*0.1, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 + Math.random()*0.6, fog: false }));
    const theta = Math.random()*Math.PI*2, phi = Math.random()*Math.PI*0.4, r = 80;
    star.position.set(Math.cos(theta)*Math.sin(phi + Math.PI/3)*r, Math.cos(phi)*r, Math.sin(theta)*Math.sin(phi + Math.PI/3)*r);
    star.lookAt(0, 0, 0); scene.add(star);
  }
  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.8, 32),
    new THREE.MeshBasicMaterial({ color: 0xf0e8d8, fog: false }));
  moon.position.set(-28, 32, -42); moon.lookAt(0, 1, 0); scene.add(moon);

  // Estanque central
  const pond = makePond();
  pond.group.position.set(2, 0, 2); scene.add(pond.group);
  Room.register(2, 2, pond.w, pond.d, 0);

  // Árboles alrededor
  [[-10,-10,1.4],[9,-11,1.2],[-11,8,1.1],[10,9,1.3],[0,-12,1.1],[-6,11,1.2],[12,-4,1.1],[-12,1,1.2]].forEach(([x,z,s]) => {
    const t = makeTree(s);
    if (Room.fits(x, z, t.w, t.d, 0, 0)){
      t.group.position.set(x, 0, z); scene.add(t.group); Room.register(x, z, t.w, t.d, 0);
    }
  });

  // Banco junto al estanque
  Room.place(
    (x, z, r) => { const b = makeBench(); b.group.position.set(x, 0, z); b.group.rotation.y = r; scene.add(b.group); },
    { w: 1.9, d: 0.7, try: [[2, -1, 0], [-1, 2, Math.PI/2]] }
  );

  // Farolas
  [[-7,-2],[7,5],[-3,-9],[9,-7]].forEach(([x,z]) => {
    const lp = makeLampPost();
    lp.group.position.set(x, 0, z); scene.add(lp.group);
    Room.register(x, z, lp.w, lp.d, 0);
  });

  scene.add(new THREE.AmbientLight(0x404060, 0.35));
  const ml = new THREE.DirectionalLight(0x8090ff, 0.5); ml.position.set(-20, 25, -30); scene.add(ml);
  const ffGeo = new THREE.BufferGeometry();
  const ffCount = 180;
  const ffPos = new Float32Array(ffCount*3);
  for (let i = 0; i < ffCount*3; i += 3){
    ffPos[i] = (Math.random()-0.5)*SIZE*0.9;
    ffPos[i+1] = 0.2 + Math.random()*3;
    ffPos[i+2] = (Math.random()-0.5)*SIZE*0.9;
  }
  ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
  const ff = new THREE.Points(ffGeo, new THREE.PointsMaterial({
    color: 0xaaff66, size: 0.08, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(ff); World.dust = ff;
  return {
    corpsePos: { x: 0, z: 0, rot: Math.PI * 0.1 },
    pose: 'curled',
    spawn: { x: -3, z: 5 },
    objectSlots: [
      { x: 3.00, y: 0.61, z: -3.00 }, { x: 2.30, y: 0.61, z: -3.00 },
      { x: 3.70, y: 0.61, z: -3.00 }, { x: 0.00, y: 0.05, z: 0.00 },
      { x: 1.20, y: 0.05, z: 0.80 }, { x: -0.80, y: 0.05, z: 1.50 },
      { x: 2.20, y: 0.05, z: 2.30 }, { x: -1.80, y: 0.05, z: -2.40 }
    ]
  };
}

/* ---------- TEATRO (escenario, bambalinas, camerino con espejos) ---------- */
function layoutTeatro(scene, ov){
  const SIZE = ov.size || 16, H = ov.height || 6;
  Room.init(SIZE, H);
  const half = SIZE/2;
  World.roomHalf = half; World.roomHeight = H;
  World.bounds = { minX: -half + 0.6, maxX: half - 0.6, minZ: -half + 0.6, maxZ: half - 0.6 };

  // Suelo de parquet oscuro encerado
  const wt = TEX.parquetDark(); wt.repeat.set(4, 4);
  const floorMat = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.55 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

  // Techo oscuro
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshStandardMaterial({ color: 0x0a0204, roughness: 1 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; scene.add(ceil);

  // Escenario al fondo (N)
  const stage = new THREE.Group();
  box(stage, SIZE - 1.5, 0.4, 3.5, MAT.mahogany, 0, 0.2, -half + 2);
  box(stage, SIZE - 1.5, 0.04, 3.5, new THREE.MeshStandardMaterial({ color: 0x6a1010, roughness: 0.7 }), 0, 0.42, -half + 2);
  scene.add(stage);
  Room.register(0, -half + 2, SIZE - 1.5, 3.5, 0);
  // Escalones
  box(stage, 1.5, 0.2, 0.7, MAT.wood, -3, 0.1, -half + 3.8);
  box(stage, 1.5, 0.2, 0.7, MAT.wood, 3, 0.1, -half + 3.8);

  // Cortinas rojas alrededor
  const curtMat = new THREE.MeshStandardMaterial({ map: TEX.curtain(), roughness: 0.9, side: THREE.DoubleSide });
  curtMat.map.repeat.set(SIZE/2, 1);
  [['N',0],['W',0],['E',0]].forEach(([wall]) => {
    const horiz = wall === 'N';
    const cx = wall === 'W' ? -half + 0.15 : wall === 'E' ? half - 0.15 : 0;
    const cz = wall === 'N' ? -half + 0.15 : 0;
    const c = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, H), curtMat);
    c.position.set(cx, H/2, cz);
    c.rotation.y = horiz ? 0 : (wall === 'W' ? Math.PI/2 : -Math.PI/2);
    scene.add(c);
  });

  // Bambalinas (faldones rojos desde el techo)
  for (let i = 0; i < 5; i++){
    const z = -half + 1.5 + i * 2.5;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(SIZE - 1, 0.8), curtMat);
    b.position.set(0, H - 0.8, z); scene.add(b);
  }

  // Espejos de camerino (pared S) con bombillas
  [-3, 3].forEach(off => {
    const vm = makeVanityMirror();
    const a = Room.anchor('S', off, 0.1, 0);
    vm.group.position.set(a.x, 0, a.z); vm.group.rotation.y = a.rot; scene.add(vm.group);
  });

  // Focos del escenario
  [[-4, -half + 2], [4, -half + 2], [0, -half + 1]].forEach(([x, z], i) => {
    const spot = new THREE.SpotLight(i === 2 ? 0xffd080 : 0xffaa66, 3, 12, Math.PI/4, 0.6, 1.5);
    spot.position.set(x, H - 0.5, z);
    spot.target.position.set(x, 0, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024);
    scene.add(spot); scene.add(spot.target);
    // Cono de luz visible
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2, H - 1, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffeecc, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
    cone.position.set(x, H/2 - 0.25, (z + 0)/2); cone.rotation.x = Math.PI/2;
    scene.add(cone);
  });

  // Candil central
  const ch = makeChandelier();
  ch.position.set(0, H - 0.4, 2); scene.add(ch);
  scene.add(new THREE.AmbientLight(0x301818, 0.5));

  // Cajas de utilería
  [[-half + 2, 1, 0.3, 0], [-half + 2, 2, -0.2, 0], [half - 2, 4, 0.6, 0], [half - 2, 4, 0.6, 0.85]].forEach(([x, z, r, sy]) => {
    const c = makeCrate(sy);
    if (sy > 0 || Room.fits(x, z, c.w, c.d, r, 0.05)){
      c.group.position.set(x, 0, z); c.group.rotation.y = r; scene.add(c.group);
      if (sy === 0) Room.register(x, z, c.w, c.d, r);
    }
  });

  // Armario de vestuario
  Room.place(
    (x, z, r) => { const m = makeCabinet(); m.group.position.set(x, 0, z); m.group.rotation.y = r; scene.add(m.group); },
    { w: 1.1, d: 0.6, try: [[half - 1.5, -half + 2.5, -Math.PI/2]] }
  );

  // Planta
  const p = makePlant();
  p.group.position.set(-half + 1.5, 0, half - 1.5); scene.add(p.group);
  Room.register(-half + 1.5, half - 1.5, 0.6, 0.6, 0);

  return {
    corpsePos: { x: 0, z: -half + 2, rot: Math.PI },
    pose: 'supine',
    spawn: { x: 0, z: half - 2 },
    objectSlots: [
      { x: -3.5, y: 0.45, z: -half + 2 }, { x: -2.4, y: 0.45, z: -half + 2 },
      { x: 2.4, y: 0.45, z: -half + 2 }, { x: 3.5, y: 0.45, z: -half + 2 },
      { x: -half + 2.5, y: 0.9, z: 1 }, { x: -half + 2.5, y: 0.9, z: 2 },
      { x: half - 2.5, y: 0.9, z: 4 }, { x: half - 1.5, y: 1.6, z: -half + 2.5 }
    ]
  };
}

const LAYOUTS = {
  despacho: layoutDespacho,
  dormitorio: layoutDormitorio,
  biblioteca: layoutBiblioteca,
  exterior: layoutExterior,
  teatro: layoutTeatro
};

/* ====================================================================
   SALA DE INTERROGATORIO
   ==================================================================== */
function buildInterrogationRoom(scene, suspect){
  const SIZE = 8, H = 3;
  Room.init(SIZE, H);
  const half = SIZE/2;
  World.roomHalf = half; World.roomHeight = H;
  World.bounds = { minX: -half + 0.45, maxX: half - 0.45, minZ: -half + 0.45, maxZ: half - 0.45 };
  const floorTex = TEX.stone(); floorTex.repeat.set(2, 2);
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, color: 0x707078 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 1 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; scene.add(ceil);
  const wallTex = TEX.stone(); wallTex.repeat.set(2, 1.5);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, color: 0x808088 });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  [[0, H/2, -half, 0], [0, H/2, half, Math.PI], [-half, H/2, 0, Math.PI/2], [half, H/2, 0, -Math.PI/2]].forEach(([x, y, z, ry]) => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m);
  });
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.95, roughness: 0.05, emissive: 0x0a1a2a, emissiveIntensity: 0.4 }));
  mirror.position.set(0, 1.8, -half + 0.03); scene.add(mirror);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a3a42, metalness: 0.7, roughness: 0.5 });
  box(scene, 2.6, 0.08, 0.1, frameMat, 0, 1.8 + 0.85, -half + 0.05);
  box(scene, 2.6, 0.08, 0.1, frameMat, 0, 1.8 - 0.85, -half + 0.05);
  box(scene, 0.08, 1.7, 0.1, frameMat, -1.3, 1.8, -half + 0.05);
  box(scene, 0.08, 1.7, 0.1, frameMat, 1.3, 1.8, -half + 0.05);
  const metal = MAT.steelDark;
  box(scene, 1.5, 0.06, 0.9, metal, 0, 0.75, 0);
  box(scene, 1.52, 0.03, 0.92, MAT.black, 0, 0.72, 0);
  [[-0.65,-0.35],[0.65,-0.35],[-0.65,0.35],[0.65,0.35]].forEach(([px, pz]) => {
    cyl(scene, 0.03, 0.03, 0.72, metal, px, 0.36, pz, 12);
  });
  Room.register(0, 0, 1.6, 1.0, 0);
  [1, -1].forEach(side => {
    const cg = new THREE.Group();
    box(cg, 0.44, 0.05, 0.44, metal, 0, 0.46, 0);
    box(cg, 0.44, 0.5, 0.05, metal, 0, 0.72, -0.2);
    [[-0.19,0.19],[0.19,0.19],[-0.19,-0.19],[0.19,-0.19]].forEach(([px, pz]) => {
      box(cg, 0.05, 0.42, 0.05, metal, px, 0.24, pz);
    });
    cg.position.set(0, 0, side * 0.95); scene.add(cg);
    Room.register(0, side * 0.95, 0.5, 0.5, 0);
  });
  const lampG = new THREE.Group();
  cyl(lampG, 0.02, 0.02, 0.6, MAT.black, 0, 2.2, 0, 8);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.28, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.6, side: THREE.DoubleSide }));
  shade.rotation.x = Math.PI; shade.position.y = 1.75; lampG.add(shade);
  sph(lampG, 0.09, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xfff0c0, emissiveIntensity: 3 }), 0, 1.72, 0);
  const spot = new THREE.SpotLight(0xfff0c0, 3, 8, Math.PI/3.5, 0.6, 1.5);
  spot.position.set(0, 1.7, 0);
  spot.target.position.set(0, 0.75, 0);
  spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024);
  lampG.add(spot); lampG.add(spot.target);
  scene.add(lampG);
  const amb = new THREE.PointLight(0x8090b0, 0.5, 12, 1.5);
  amb.position.set(0, 2.5, 0); scene.add(amb);
  scene.add(new THREE.AmbientLight(0x303040, 0.4));
  const suspectG = buildSuspectModel(suspect);
  suspectG.position.set(0, 0, -0.85); scene.add(suspectG);
  return { spawn: { x: 0, z: 2.6 } };
}
function buildSuspectModel(suspect){
  const g = new THREE.Group();
  const isFemale = ['👩‍💻','👩','🧹','👩‍🍳','👩‍💼','💍','🌹','🎤','🎶','💔','🌷','💕','🎭','🎨','💎','🤸','🔮'].includes(suspect.icon);
  const skinTones = [0xd8a888, 0xc89878, 0xe8b898, 0xa87858, 0xb88868];
  const skin = new THREE.MeshStandardMaterial({ color: skinTones[(Math.random()*skinTones.length)|0], roughness: 0.85 });
  const hairColor = isFemale ? [0x3a2010, 0x6a3a1a, 0x2a1a10, 0x8a4a2a][(Math.random()*4)|0] : [0x1a1a1e, 0x3a2a1a, 0x5a5a5a][(Math.random()*3)|0];
  const shirtColors = [0x2a3a5a, 0x5a2a3a, 0x3a5a2a, 0x5a4a2a, 0x4a4a4a, 0x6a2a2a, 0x2a4a5a];
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColors[(Math.random()*shirtColors.length)|0], roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: [0x1a1a1e, 0x2a2a30, 0x3a2010][(Math.random()*3)|0], roughness: 0.9 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 16), skin);
  head.position.y = 1.32; head.scale.set(0.95, 1.1, 1); head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16, 0, Math.PI*2, 0, Math.PI*(isFemale ? 0.7 : 0.5)),
    new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95 }));
  hair.position.y = 1.34; hair.scale.set(0.98, 1.1, 1); g.add(hair);
  if (isFemale) box(g, 0.24, 0.3, 0.08, new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95 }), 0, 1.15, -0.13);
  box(g, 0.1, 0.08, 0.1, skin, 0, 1.19, 0);
  box(g, 0.36, 0.42, 0.22, shirt, 0, 0.98, 0);
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
   HOTSPOT + INIT
   ==================================================================== */
function makeHotspotMarker(obj, examined){
  const g = new THREE.Group();
  const color = examined ? 0x4ade80 : 0xd4a017;
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.8,
    metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.95
  });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), mat));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.014, 10, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
  ring.rotation.x = Math.PI/2;
  g.add(ring);
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  const cx = cv.getContext('2d');
  cx.fillStyle = 'rgba(0,0,0,0.85)'; cx.fillRect(0, 0, 256, 64);
  cx.strokeStyle = examined ? '#4ade80' : '#d4a017'; cx.lineWidth = 3;
  cx.strokeRect(2, 2, 252, 60);
  cx.fillStyle = examined ? '#4ade80' : '#d4a017';
  cx.font = 'bold 22px "Special Elite", monospace';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  let t = obj.name + (examined ? ' ✓' : '');
  if (t.length > 18) t = t.slice(0, 17) + '…';
  cx.fillText(t, 128, 32);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: true }));
  sprite.scale.set(1.2, 0.3, 1);
  sprite.position.y = 0.28;
  g.add(sprite);
  g.userData.objId = obj.id;
  g.userData.objData = obj;
  return g;
}

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

  let roomInfo;
  if (World.mode === 'interrogation'){
    roomInfo = buildInterrogationRoom(scene, World.currentSuspect);
    const sp = roomInfo.spawn;
    Player.pos.set(sp.x, Player.height, sp.z);
    Player.yaw = Math.atan2(-(0 - sp.x), -(-0.85 - sp.z));
    Player.pitch = -0.1;
  } else {
    const roomType = c.sceneType || 'despacho';
    const builder = LAYOUTS[roomType] || layoutDespacho;
    roomInfo = builder(scene, c.sceneConfig || {});
    buildCorpse(scene, c.corpsePose || roomInfo.pose, roomInfo.corpsePos.x, roomInfo.corpsePos.z, roomInfo.corpsePos.rot);
    const sp = roomInfo.spawn || { x: 0, z: 3 };
    Player.pos.set(sp.x, Player.height, sp.z);
    Player.yaw = Math.atan2(-(roomInfo.corpsePos.x - sp.x), -(roomInfo.corpsePos.z - sp.z));
    Player.pitch = -0.15;
    const slots = roomInfo.objectSlots || [];
    c.objects.forEach((obj, i) => {
      const slot = slots[i % Math.max(1, slots.length)];
      if (!slot) return;
      const factory = getObjectModel(obj);
      const mg = factory();
      mg.position.set(slot.x, slot.y, slot.z);
      mg.rotation.y = Math.random() * Math.PI * 2;
      scene.add(mg);
      const marker = makeHotspotMarker(obj, g.examined.includes(obj.id));
      marker.position.set(slot.x, slot.y + 0.28, slot.z);
      scene.add(marker);
      World.interactables.push({
        mesh: marker, type: 'object', objId: obj.id, data: obj,
        baseY: slot.y + 0.28, phase: Math.random() * Math.PI * 2
      });
    });
  }

  RemotePlayers.attachToScene(scene);
  World.raycaster = new THREE.Raycaster();
  World.crosshairEl = document.querySelector('.crosshair');
  World.nearHintEl = document.querySelector('.near-hint');
  setupControls();

  const startY = Player.height + 1.8, endY = Player.height;
  const tStart = performance.now(), dur = 1400;
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
let _posTimer = 0;
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
  let wx = 0, wz = 0;
  if (Player.keys['KeyW'] || Player.keys['ArrowUp']){ wx += fwdX; wz += fwdZ; }
  if (Player.keys['KeyS'] || Player.keys['ArrowDown']){ wx -= fwdX; wz -= fwdZ; }
  if (Player.keys['KeyA'] || Player.keys['ArrowLeft']){ wx -= rightX; wz -= rightZ; }
  if (Player.keys['KeyD'] || Player.keys['ArrowRight']){ wx += rightX; wz += rightZ; }
  const len = Math.hypot(wx, wz);
  if (len > 0){ wx = wx/len*speed; wz = wz/len*speed; }
  const k = Math.min(1, dt * 14);
  Player.vel.x += (wx - Player.vel.x) * k;
  Player.vel.z += (wz - Player.vel.z) * k;
  const r = Player.radius;
  let nx = Player.pos.x + Player.vel.x * dt;
  let nz = Player.pos.z + Player.vel.z * dt;
  const b = World.bounds;
  if (nx - r < b.minX){ nx = b.minX + r; Player.vel.x = 0; }
  if (nx + r > b.maxX){ nx = b.maxX - r; Player.vel.x = 0; }
  if (nz - r < b.minZ){ nz = b.minZ + r; Player.vel.z = 0; }
  if (nz + r > b.maxZ){ nz = b.maxZ - r; Player.vel.z = 0; }
  for (const o of World.obstacles){
    const oX = nx + r > o.minX && nx - r < o.maxX;
    const oZ = nz + r > o.minZ && nz - r < o.maxZ;
    if (oX && oZ){
      const pL = (nx + r) - o.minX, pR = o.maxX - (nx - r);
      const pU = (nz + r) - o.minZ, pD = o.maxZ - (nz - r);
      const mX = Math.min(pL, pR), mZ = Math.min(pU, pD);
      if (mX < mZ){ if (pL < pR) nx = o.minX - r; else nx = o.maxX + r; Player.vel.x = 0; }
      else { if (pU < pD) nz = o.minZ - r; else nz = o.maxZ + r; Player.vel.z = 0; }
    }
  }
  Player.pos.x = nx;
  Player.pos.z = nz;
  const moving = Math.hypot(Player.vel.x, Player.vel.z) > 0.3;
  Player.moving = moving;
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

  _posTimer += dt;
  if (_posTimer > 0.05 && state.conn && state.conn.open){
    _posTimer = 0;
    try { state.conn.send({ type: 'pos', x: Player.pos.x, z: Player.pos.z, yaw: Player.yaw, moving }); } catch(e){}
  }
  RemotePlayers.tick(dt);

  World.interactables.forEach(it => {
    if (it.type === 'drawer'){
      const st = it.mesh.userData.drawerState;
      const maxZ = it.mesh.userData.drawerMaxZ || 0.4;
      it.mesh.position.z += (st * maxZ - it.mesh.position.z) * Math.min(1, dt * 8);
    } else if (it.type === 'cabinetDoor'){
      const st = it.mesh.userData.doorState;
      const hinge = it.mesh.userData.doorHinge || 1;
      const targetRot = st * (Math.PI/2.2) * hinge;
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
  RemotePlayers.detachAll();
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
  Room.obstacles = []; Room.spawnZones = [];
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

/* ====================================================================
   ESTADO
   ==================================================================== */
const state = {
  view:'menu', filter:'TODOS', roomId:'', caseId:'',
  playerId:'', playerName:'', playerRole:'auto', myChar:'alegando',
  isHost:false, peer:null, conn:null,
  game:null, localView:{type:'scene'},
  status:null, statusErr:false, rankUpTo:null
};
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function genCode(){ const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s=''; for(let i=0;i<4;i++) s+=c[(Math.random()*c.length)|0]; return s; }
function getPid(){ let v = localStorage.getItem('ec_pid'); if (!v){ v = 'p_' + Math.random().toString(36).slice(2,10); localStorage.setItem('ec_pid', v); } return v; }

function render(force){
  if (!Auth.current) return renderLogin();
  if (state.view === 'menu') return renderMenu();
  if (state.view === 'briefing') return renderBriefing();
  if (state.view === 'lobby') return renderLobby();
  if (state.view === 'result') return renderResult();
  return renderGame(force);
}

/* ====================================================================
   LOGIN con sync + borrar cuenta
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
          <button type="button" class="login-tab" data-tab="sync">SINCRONIZAR</button>
          <button type="button" class="login-tab" data-tab="delete">BORRAR</button>
        </div>
        <div class="login-error" id="login-error"></div>
        ${users.length > 0 ? `
          <div class="login-users-label">Agentes en este dispositivo</div>
          <div class="login-users">
            ${users.map(u => `<div class="login-user" data-name="${esc(u)}">${esc(u)}</div>`).join('')}
          </div>` : ''}

        <!-- LOGIN -->
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

        <!-- REGISTRO -->
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

        <!-- SYNC -->
        <div class="login-form" id="form-sync">
          <div class="sync-info">
            <div class="sync-title">📡 Sincronizar entre dispositivos</div>
            <p>Usa tu <b>código de agente</b> para llevar tu progreso a otro dispositivo.</p>
          </div>
          <label>Tu código (para copiarlo y llevarlo a otro dispositivo)</label>
          <div class="sync-box">
            <div class="sync-code" id="sync-output">— inicia sesión para verlo —</div>
            <button type="button" class="sync-copy-btn" id="sync-copy">📋 COPIAR</button>
          </div>
          <label style="margin-top:22px">Pegar código recibido (para importar aquí)</label>
          <input id="inp-import-code" type="text" placeholder="EC1.xxxxxxxx.xxxx" style="font-family:monospace;font-size:12px">
          <button type="button" class="btn-secondary" id="btn-import">📥 IMPORTAR AGENTE</button>
        </div>

        <!-- DELETE -->
        <div class="login-form" id="form-delete">
          <div class="sync-info" style="border-left-color:var(--red)">
            <div class="sync-title" style="color:var(--red)">⚠️ Borrar cuenta</div>
            <p>Se eliminará el agente <b>y todo su progreso</b> de este dispositivo. Esta acción <b>no se puede deshacer</b>.</p>
          </div>
          <label>Nombre de agente a borrar</label>
          <input id="inp-del-name" type="text" placeholder="Escribe el nombre exacto" maxlength="20" autocomplete="off">
          <label>Contraseña</label>
          <div class="pwd-wrap">
            <input id="inp-del-pwd" type="password" placeholder="Contraseña del agente" autocomplete="off">
            <button type="button" class="pwd-toggle" data-target="inp-del-pwd">👁</button>
          </div>
          <button type="button" class="btn-primary" id="btn-delete" style="background:linear-gradient(145deg,#a01818,#6a0808);color:#fff">🗑️ BORRAR DEFINITIVAMENTE</button>
        </div>

        <div class="login-hint">
          Tu progreso se guarda <b>en este dispositivo</b>.<br>
          Usa <b>SINCRONIZAR</b> para llevar tu agente a otro dispositivo con un código.
        </div>
      </div>
    </div>`;

  const errBox = document.getElementById('login-error');
  const setErr = msg => {
    errBox.textContent = msg || '';
    if (msg){ errBox.style.animation = 'none'; void errBox.offsetWidth;
      errBox.style.animation = 'shake .35s cubic-bezier(.36,.07,.19,.97)'; }
  };
  const setOk = msg => {
    errBox.textContent = msg || '';
    errBox.style.background = 'rgba(74,222,128,.12)';
    errBox.style.borderColor = 'rgba(74,222,128,.4)';
    errBox.style.color = '#4ade80';
    setTimeout(() => {
      errBox.style.background = ''; errBox.style.borderColor = ''; errBox.style.color = '';
    }, 2500);
  };
  const clearErr = () => setErr('');

  const showTab = name => {
    document.querySelectorAll('.login-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    document.querySelectorAll('.login-form').forEach(f => f.classList.remove('active'));
    document.getElementById('form-' + name).classList.add('active');
    clearErr();
    if (name === 'sync' && Auth.current){
      const code = Auth.exportCode();
      document.getElementById('sync-output').textContent = code || '—';
    }
  };
  document.querySelectorAll('.login-tab').forEach(tab => {
    tab.onclick = () => showTab(tab.dataset.tab);
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
      showTab('login');
      document.getElementById('inp-login-name').value = el.dataset.name;
      document.getElementById('inp-login-pwd').focus();
    };
  });

  /* LOGIN */
  document.getElementById('form-login').addEventListener('submit', e => {
    e.preventDefault(); clearErr();
    const name = document.getElementById('inp-login-name').value;
    const pwd = document.getElementById('inp-login-pwd').value;
    const r = Auth.login(name, pwd);
    if (!r.ok){ setErr(r.msg); return; }
    state.playerName = Auth.current; state.playerId = getPid();
    const u = Auth.getUser();
    state.myChar = (u && u.char) || 'alegando';
    state.view = 'menu'; render();
  });

  /* REGISTER */
  document.getElementById('form-register').addEventListener('submit', e => {
    e.preventDefault(); clearErr();
    const name = document.getElementById('inp-reg-name').value;
    const pwd = document.getElementById('inp-reg-pwd').value;
    const pwd2 = document.getElementById('inp-reg-pwd2').value;
    if (pwd !== pwd2){ setErr('Las contraseñas no coinciden'); return; }
    const r = Auth.register(name, pwd);
    if (!r.ok){ setErr(r.msg); return; }
    state.playerName = Auth.current; state.playerId = getPid();
    state.myChar = 'alegando';
    state.view = 'menu'; render();
  });

  /* SYNC — copiar */
  const copyBtn = document.getElementById('sync-copy');
  if (copyBtn) copyBtn.onclick = () => {
    const code = document.getElementById('sync-output').textContent;
    if (!code || code.startsWith('—')){ setErr('Inicia sesión para ver tu código'); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    setOk('Código copiado al portapapeles');
  };

  /* SYNC — importar */
  const impBtn = document.getElementById('btn-import');
  if (impBtn) impBtn.onclick = () => {
    clearErr();
    const code = document.getElementById('inp-import-code').value;
    if (!code){ setErr('Pega un código primero'); return; }
    const r = Auth.importCode(code);
    if (!r.ok){ setErr(r.msg); return; }
    setOk(r.msg + ': ' + r.name + ' ✓');
    setTimeout(() => { renderLogin(); }, 1200);
  };

  /* DELETE */
  const delBtn = document.getElementById('btn-delete');
  if (delBtn) delBtn.onclick = () => {
    clearErr();
    const name = document.getElementById('inp-del-name').value;
    const pwd = document.getElementById('inp-del-pwd').value;
    if (!confirm('¿Borrar definitivamente el agente "' + name + '" y todo su progreso?')) return;
    const r = Auth.deleteAccount(name, pwd);
    if (!r.ok){ setErr(r.msg); return; }
    setOk('Cuenta eliminada');
    setTimeout(() => { renderLogin(); }, 900);
  };

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
  const msgs = {
    'FÁCIL': ['Agentes, un caso sencillo para empezar. Confío en que lo cerréis rápido.','Nuevo caso. Nada complejo, pero no bajéis la guardia.'],
    'MEDIA': ['Este caso es más delicado. Hay varios sospechosos con motivos. No quiero errores.','Es más complejo de lo que parece. Escuchad, examinad, no os fiéis de nadie.'],
    'DIFÍCIL': ['Caso de máxima prioridad. El asesino es meticuloso. Si falláis, lo pagaréis caro.','Este es de los que aparecen en los periódicos. Necesito una resolución limpia.']
  };
  const pool = msgs[c.difficulty] || msgs.MEDIA;
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
          <label>Tu personaje</label>
          <div class="char-grid" id="char-grid">
            ${CHARACTERS.map(ch => `
              <div class="char-option ${state.myChar === ch.id ? 'selected' : ''}" data-char="${ch.id}">
                <div class="char-icon">${ch.icon}</div>
                <div class="char-name">${esc(ch.name)}</div>
              </div>`).join('')}
          </div>
        </div>
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
          💡 <b>Sin servidor:</b> los dos navegadores se conectan directamente entre sí.<br>
          👥 <b>Multijugador:</b> verás el personaje del otro jugador en tiempo real.<br>
          🕹️ <b>Controles:</b> <b>WASD</b> mover · <b>Ratón</b> mirar · <b>Shift</b> correr · <b>Clic</b> interactuar.
        </div>
      </div>
    </div>`;
  $('#btn-back').onclick = () => { state.view='briefing'; state.status=null; render(); };
  document.querySelectorAll('.char-option').forEach(el => {
    el.onclick = () => {
      state.myChar = el.dataset.char;
      Auth.setChar(state.myChar);
      document.querySelectorAll('.char-option').forEach(x => x.classList.toggle('selected', x === el));
    };
  });
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
  return {
    caseId,
    resetCounter: 0,
    players: { [state.playerId]: { name: state.playerName, role: state.playerRole, charDef: getMyCharDef(), connected: true } },
    examined: [], asked: [], evidence: [], result: null
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
  peer.on('open', () => { state.view='game'; render(true); showShareModal(code); });
  peer.on('connection', conn => {
    if (state.conn && state.conn.open){ try { conn.close(); } catch(e){} return; }
    state.conn = conn;
    conn.on('open', () => {
      state.game.players[conn.peer] = { name:'Agente 2', role:'auto', charDef: CHARACTERS[0], connected:true };
      broadcastState(); render();
    });
    conn.on('data', data => {
      if (data.type === 'pos'){ RemotePlayers.update(conn.peer, data.x, data.z, data.yaw, data.moving); return; }
      handleGuestMessage(conn, data);
    });
    conn.on('close', () => {
      if (state.game.players[conn.peer]) state.game.players[conn.peer].connected = false;
      RemotePlayers.remove(conn.peer);
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
      conn.send({ type:'hello', name: state.playerName, role: state.playerRole, charDef: getMyCharDef() });
    });
    conn.on('data', data => {
      if (data.type === 'state'){
        const prevReset = state.game ? (state.game.resetCounter || 0) : -1;
        state.game = data.state;
        const newReset = data.state.resetCounter || 0;
        if (prevReset !== newReset && World.renderer){ disposeWorld(); }
        let hostId = null;
        for (const pid in state.game.players){ if (pid !== state.playerId){ hostId = pid; break; } }
        if (hostId){
          const hostInfo = state.game.players[hostId];
          if (!RemotePlayers.players.host){
            RemotePlayers.add('host', hostInfo.charDef || CHARACTERS[0]);
            if (World.scene) RemotePlayers.attachToScene(World.scene);
          }
        }
        state.status = null; state.view = 'game'; render();
      } else if (data.type === 'pos'){
        RemotePlayers.update('host', data.x, data.z, data.yaw, data.moving);
      }
    });
    conn.on('close', () => { setStatus('Desconectado del host.', true); RemotePlayers.remove('host'); });
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
    state.game.players[conn.peer] = {
      name: data.name || 'Agente 2',
      role: data.role || 'auto',
      charDef: data.charDef || CHARACTERS[0],
      connected: true
    };
    RemotePlayers.add(conn.peer, data.charDef || CHARACTERS[0]);
    if (World.scene) RemotePlayers.attachToScene(World.scene);
    broadcastState(); render();
    return;
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
      state.game.resetCounter = (state.game.resetCounter || 0) + 1;
      disposeWorld();
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

function renderGame(force){
  const g = state.game;
  if (!g){ app.innerHTML = `<div class="lobby"><div class="status">${state.status||'Conectando...'} ⏳</div></div>`; return; }
  const c = CASES.find(x => x.id === g.caseId);
  if (!c) return;
  if (!force && World.renderer && World.caseData && World.caseData.id === g.caseId && World.mode === 'crime'){
    updateGameDynamic(g, c);
    return;
  }
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
    disposeWorld(); RemotePlayers.clear();
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
    if (it.type === 'drawer') it.mesh.userData.drawerState = it.mesh.userData.drawerState ? 0 : 1;
    else if (it.type === 'cabinetDoor') it.mesh.userData.doorState = it.mesh.userData.doorState ? 0 : 1;
    else if (it.type === 'object'){
      if (!g.examined.includes(it.objId)) sendAction({ type:'examine', id: it.objId });
      state.localView = { type:'object', id: it.objId };
      renderSidePanel(c);
      if (document.pointerLockElement) try { document.exitPointerLock(); } catch(e){}
    }
  };
  setTimeout(() => initWorld(c, g, 'crime'), 60);
  renderSidePanel(c);
  if (g.result && state.view !== 'result'){
    setTimeout(() => { state.view = 'result'; render(true); }, 350);
  }
}

function updateGameDynamic(g, c){
  const found = g.evidence.length;
  const totalClues = getTotalClues(c);
  const pct = totalClues ? Math.round(found/totalClues*100) : 0;
  const canAccuse = found >= 2 && !g.result;
  const myRank = getCurrentRank(Auth.countSolved());
  const pw = document.querySelector('.progress-wrap');
  if (pw) pw.innerHTML = `<span>${found}/${totalClues}</span><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
  const pr = document.querySelector('.panel-right');
  if (pr){
    pr.innerHTML = `
      <h2>📎 Evidencias (${found})</h2>
      ${g.evidence.length === 0
        ? '<div class="empty">Aún no hay pistas.<br>Investigad la escena.</div>'
        : g.evidence.map(e => `<div class="evidence-item">${esc(e)}</div>`).join('')}
      <button class="accuse-btn" id="btn-accuse" ${canAccuse?'':'disabled'}>
        ${g.result ? 'CASO CERRADO' : (canAccuse ? '⚖️ ACUSAR' : 'REUNID 2 PISTAS')}
      </button>`;
    if (canAccuse) document.getElementById('btn-accuse').onclick = openAccusation;
  }
  const tb = document.querySelector('.topbar .left');
  if (tb){
    tb.innerHTML = `
      <div class="room-badge">SALA ${esc(state.roomId)} ${state.isHost?'👑':'👤'}</div>
      ${Object.entries(g.players || {}).map(([pid, p]) => `
        <div class="player-pill ${p.connected ? '' : 'off'} ${pid === state.playerId ? 'me' : ''}">
          <span class="dot"></span> ${pid === state.playerId ? myRank.icon + ' ' : ''}${esc(p.name)} · ${esc(p.role)}
        </div>`).join('')}`;
  }
  if (g.result && state.view !== 'result'){
    setTimeout(() => { state.view = 'result'; render(true); }, 350);
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
  const lt = document.getElementById('lock-title');
  if (lt) lt.textContent = 'CLIC PARA ENTRAR AL INTERROGATORIO';
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
      const l = document.getElementById('lock-title');
      if (l) l.textContent = 'CLIC PARA JUGAR';
      renderSidePanel(c);
      document.querySelectorAll('.suspect').forEach(x => x.classList.remove('active'));
    }, 60);
  };
  stage.appendChild(backBtn);
  setTimeout(() => { initWorld(c, state.game, 'interrogation'); renderSidePanel(c); }, 60);
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
    render(true);
  };
  $('#r-home').onclick = () => {
    RemotePlayers.clear();
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