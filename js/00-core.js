/* ====================================================================
   00-CORE — Auth, personajes, estado global, helpers, dispatcher
   ==================================================================== */

/* ---------- AUTH + GUARDADO (v2) ----------
   - Los datos viven en este dispositivo (localStorage).
   - Se pueden llevar a otro dispositivo con: código, enlace, archivo o conexión directa (10-multiplayer).
   - Al importar SIEMPRE se fusiona (nunca se pierde progreso): unión de casos resueltos,
     la apariencia más reciente gana, y se hace copia de seguridad antes de cambiar nada.            */
function _crc32(str){
  let c, crc = 0xFFFFFFFF;
  for (let i = 0; i < str.length; i++){
    c = (crc ^ str.charCodeAt(i)) & 0xFF;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xEDB88320 : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ((crc ^ 0xFFFFFFFF) >>> 0).toString(36).padStart(6, '0');
}
function _b64e(str){ return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function _b64d(b64){ const p = b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4); return decodeURIComponent(escape(atob(p))); }
const _LOOK_KEYS = [['body','body'],['build'],['height'],['skin'],['eyes'],['hair','hair'],['hairColor'],['facial','facial'],
  ['top','top'],['topColor'],['topColor2'],['bottom','bottom'],['bottomColor'],['shoes','shoes'],['shoeColor'],
  ['hat','hat'],['hatColor'],['glasses','glasses'],['neck','neck'],['neckColor'],['extra','extra']];
function lookToArr(look){
  const L = normalizeLook(look);
  return _LOOK_KEYS.map(([k, list]) => list ? Math.max(0, LOOK_DEFS[list].findIndex(o => o[0] === L[k])) : L[k]);
}
function arrToLook(arr){
  if (!Array.isArray(arr)) return null;
  const o = { v: 1 };
  _LOOK_KEYS.forEach(([k, list], i) => { o[k] = list ? (LOOK_DEFS[list][arr[i]] || LOOK_DEFS[list][0])[0] : arr[i]; });
  return normalizeLook(o);
}

const Auth = {
  get current(){ return localStorage.getItem('ec_current') || null; },
  set current(v){ v ? localStorage.setItem('ec_current', v) : localStorage.removeItem('ec_current'); },
  get users(){
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem('ec_users') || '{}') || {}; } catch(e){ raw = {}; }
    for (const n in raw) raw[n] = this.norm(raw[n]);
    return raw;
  },
  /* Completa/migra un registro de usuario (datos antiguos incluidos) */
  norm(u){
    u = u || {};
    u.solved = Array.isArray(u.solved) ? u.solved.slice() : [];
    u.created = u.created || Date.now();
    u.solvedAt = u.solvedAt && typeof u.solvedAt === 'object' ? u.solvedAt : {};
    u.solved.forEach(id => { if (!u.solvedAt[id]) u.solvedAt[id] = u.created; });
    u.char = u.char || 'alegando';
    u.look = u.look || null;
    u.lookAt = u.lookAt || 0;
    u.pwdAt = u.pwdAt || u.created;
    u.updated = u.updated || u.created;
    return u;
  },
  saveUsers(u){
    try { localStorage.setItem('ec_users', JSON.stringify(u)); return true; }
    catch(e){ console.warn('No se pudo guardar (almacenamiento lleno o bloqueado)', e); return false; }
  },
  _save(name, u){ const all = this.users; u.updated = Date.now(); all[name] = u; return this.saveUsers(all); },
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
    const now = Date.now();
    const u = this.norm({ name, salt, pwdHash: this.hash(pwd, salt), created: now, pwdAt: now, solved: [], char: 'alegando' });
    if (!this._save(name, u)) return { ok:false, msg:'No se pudo guardar en este navegador' };
    this.current = name;
    return { ok:true };
  },
  login(name, pwd){
    name = (name || '').trim();
    if (!name) return { ok:false, msg:'Escribe un nombre' };
    const u = this.users[name];
    if (!u) return { ok:false, msg:'No existe ese agente en este dispositivo. Usa "Sincronizar".' };
    if (!pwd) return { ok:false, msg:'Escribe tu contraseña' };
    if (this.hash(pwd, u.salt) !== u.pwdHash) return { ok:false, msg:'Contraseña incorrecta' };
    this.current = name;
    return { ok:true };
  },
  changePassword(oldPwd, newPwd){
    const n = this.current, u = this.getUser();
    if (!u) return { ok:false, msg:'No hay sesión' };
    if (this.hash(oldPwd || '', u.salt) !== u.pwdHash) return { ok:false, msg:'La contraseña actual no es correcta' };
    if (!newPwd || newPwd.length < 4) return { ok:false, msg:'La nueva contraseña debe tener al menos 4 caracteres' };
    this.backup(n, 'antes de cambiar contraseña');
    u.salt = this.makeSalt(); u.pwdHash = this.hash(newPwd, u.salt); u.pwdAt = Date.now();
    this._save(n, u);
    return { ok:true, msg:'Contraseña cambiada. Al sincronizar, los otros dispositivos la adoptarán.' };
  },
  deleteAccount(name, pwd){
    name = (name || '').trim();
    if (!name || !pwd) return { ok:false, msg:'Faltan datos' };
    const users = this.users;
    if (!users[name]) return { ok:false, msg:'No existe ese agente' };
    if (this.hash(pwd, users[name].salt) !== users[name].pwdHash) return { ok:false, msg:'Contraseña incorrecta' };
    delete users[name];
    this.saveUsers(users);
    this.clearBackups(name);
    if (this.current === name) this.current = null;
    return { ok:true };
  },
  logout(){ this.current = null; },
  getUser(){ const n = this.current; return n ? (this.users[n] || null) : null; },
  markSolved(id){
    const n = this.current; if (!n) return;
    const u = this.users[n]; if (!u) return;
    if (!u.solved.includes(id)){ u.solved.push(id); u.solvedAt[id] = Date.now(); this._save(n, u); }
  },
  countSolved(){ const u = this.getUser(); return u ? u.solved.length : 0; },

  /* ----- apariencia ----- */
  setChar(id){
    const n = this.current; if (!n) return;
    const u = this.users[n]; if (!u) return;
    u.char = id; u.look = normalizeLook(getCharDef(id).look); u.lookAt = Date.now();
    this._save(n, u);
  },
  setLook(look){
    const n = this.current; if (!n) return false;
    const u = this.users[n]; if (!u) return false;
    u.look = normalizeLook(look); u.lookAt = Date.now();
    return this._save(n, u);
  },
  getLook(){
    const u = this.getUser();
    if (u && u.look) return normalizeLook(u.look);
    return normalizeLook(getCharDef((u && u.char) || 'alegando').look);
  },

  /* ----- copias de seguridad (últimas 6 por agente) ----- */
  backups(name){
    let all = [];
    try { all = JSON.parse(localStorage.getItem('ec_backups') || '[]') || []; } catch(e){ all = []; }
    return name ? all.filter(b => b.name === name) : all;
  },
  backup(name, reason){
    const u = this.users[name]; if (!u) return;
    let all = this.backups();
    all.push({ t: Date.now(), reason: reason || 'manual', name, user: u });
    const mine = all.filter(b => b.name === name);
    if (mine.length > 6){ const drop = new Set(mine.slice(0, mine.length - 6)); all = all.filter(b => !drop.has(b)); }
    try { localStorage.setItem('ec_backups', JSON.stringify(all)); } catch(e){}
  },
  clearBackups(name){
    try { localStorage.setItem('ec_backups', JSON.stringify(this.backups().filter(b => b.name !== name))); } catch(e){}
  },
  restoreBackup(t){
    const b = this.backups().find(x => x.t === t);
    if (!b) return { ok:false, msg:'Copia no encontrada' };
    this.backup(b.name, 'antes de restaurar');
    const all = this.users; all[b.name] = this.norm(b.user); this.saveUsers(all);
    return { ok:true, msg:'Copia restaurada' };
  },

  /* ----- fusión de dos registros del mismo agente ----- */
  merge(local, remote){
    const a = this.norm(JSON.parse(JSON.stringify(local))), b = this.norm(JSON.parse(JSON.stringify(remote)));
    const out = a, ch = { cases: 0, look: false, pwd: false };
    b.solved.forEach(id => { if (!out.solved.includes(id)){ out.solved.push(id); ch.cases++; } });
    for (const id in b.solvedAt) out.solvedAt[id] = Math.min(out.solvedAt[id] || Infinity, b.solvedAt[id]);
    if ((b.lookAt || 0) > (a.lookAt || 0)){ out.look = b.look; out.lookAt = b.lookAt; out.char = b.char; ch.look = true; }
    if (b.pwdHash !== a.pwdHash && b.pwdAt > a.pwdAt){ out.pwdHash = b.pwdHash; out.salt = b.salt; out.pwdAt = b.pwdAt; ch.pwd = true; }
    out.created = Math.min(a.created, b.created);
    return { user: out, changes: ch };
  },

  /* ----- códigos de transferencia ----- */
  exportCode(name){
    name = name || this.current;
    const u = this.users[name];
    if (!u) return null;
    const arr = [2, u.name, u.salt, u.pwdHash, u.created, u.updated, u.pwdAt,
      u.solved.map(id => [id, u.solvedAt[id] || u.created]), u.char, u.lookAt || 0, u.look ? lookToArr(u.look) : 0];
    const b64 = _b64e(JSON.stringify(arr));
    return 'EC2.' + b64 + '.' + _crc32(b64);
  },
  /* Devuelve {ok, user} con el registro ya normalizado (sin guardar) */
  parseCode(code){
    code = (code || '').trim().replace(/\s+/g, '');
    if (code.indexOf('#sync=') >= 0) code = code.split('#sync=')[1];
    if (/^EC1\./.test(code)) return this._parseV1(code);
    if (!/^EC2\./.test(code)) return { ok:false, msg:'Código no válido (debe empezar por EC2.)' };
    const parts = code.split('.');
    if (parts.length !== 3) return { ok:false, msg:'Formato incorrecto' };
    if (_crc32(parts[1]) !== parts[2]) return { ok:false, msg:'Código corrupto o incompleto: cópialo entero' };
    let arr;
    try { arr = JSON.parse(_b64d(parts[1])); } catch(e){ return { ok:false, msg:'No se pudo decodificar' }; }
    if (!Array.isArray(arr) || arr[0] !== 2 || !arr[1] || !arr[2] || !arr[3]) return { ok:false, msg:'Código incompleto' };
    const solved = [], solvedAt = {};
    (arr[7] || []).forEach(p => { solved.push(p[0]); solvedAt[p[0]] = p[1]; });
    const u = this.norm({ name: arr[1], salt: arr[2], pwdHash: arr[3], created: arr[4], updated: arr[5], pwdAt: arr[6],
      solved, solvedAt, char: arr[8], lookAt: arr[9], look: arr[10] ? arrToLook(arr[10]) : null });
    return { ok:true, user: u };
  },
  _parseV1(code){
    const parts = code.split('.');
    if (parts.length !== 3) return { ok:false, msg:'Formato incorrecto' };
    const [, b64, chk] = parts;
    let sum = 0;
    for (let i = 0; i < b64.length; i++) sum = (sum * 31 + b64.charCodeAt(i)) >>> 0;
    if (sum.toString(36).slice(-4).padStart(4, '0') !== chk) return { ok:false, msg:'Código corrupto' };
    let p;
    try { p = JSON.parse(_b64d(b64)); } catch(e){ return { ok:false, msg:'No se pudo decodificar' }; }
    if (!p.n || !p.s || !p.h) return { ok:false, msg:'Código incompleto' };
    return { ok:true, user: this.norm({ name: p.n, salt: p.s, pwdHash: p.h, created: p.c, solved: p.sv || [], char: p.ch || 'alegando' }) };
  },
  /* Importa (fusiona) un registro recibido por cualquier vía */
  importUser(remote, pwd){
    const name = remote.name;
    const users = this.users, existing = users[name];
    if (existing){
      let unify = false;
      if (existing.pwdHash !== remote.pwdHash && remote.pwdAt <= existing.pwdAt){
        // mismo nombre creado por separado: se puede fusionar si el usuario demuestra que conoce la contraseña de ambos
        if (pwd && this.hash(pwd, existing.salt) === existing.pwdHash && this.hash(pwd, remote.salt) === remote.pwdHash) unify = true;
        else return { ok:false, needPassword:true, name, msg:'Ya existe un agente "' + name + '" en este dispositivo creado por separado. Escribe su contraseña para fusionarlos.' };
      }
      this.backup(name, 'antes de sincronizar');
      if (unify) remote = Object.assign({}, remote, { salt: existing.salt, pwdHash: existing.pwdHash, pwdAt: existing.pwdAt });
      const m = this.merge(existing, remote);
      if (unify){ m.user.pwdAt = Date.now(); m.changes.unified = true; }   // el otro dispositivo adoptará estas credenciales en la próxima sincronización
      if (!this.saveUsers(Object.assign(users, { [name]: m.user }))) return { ok:false, msg:'No se pudo guardar en este navegador' };
      const parts = [];
      if (m.changes.cases) parts.push('+' + m.changes.cases + ' caso' + (m.changes.cases > 1 ? 's' : '') + ' resuelto' + (m.changes.cases > 1 ? 's' : ''));
      if (m.changes.look) parts.push('apariencia actualizada');
      if (m.changes.pwd) parts.push('contraseña actualizada');
      return { ok:true, name, merged:true, changed: parts.length > 0, msg: parts.length ? 'Sincronizado: ' + parts.join(', ') : 'Ya estaba al día' };
    }
    users[name] = remote;
    if (!this.saveUsers(users)) return { ok:false, msg:'No se pudo guardar en este navegador' };
    return { ok:true, name, merged:false, changed:true, msg:'Agente "' + name + '" añadido a este dispositivo' };
  },
  importCode(code, pwd){
    const r = this.parseCode(code);
    if (!r.ok) return r;
    return this.importUser(r.user, pwd);
  },
  exportLink(name){
    const c = this.exportCode(name); if (!c) return null;
    return location.href.split('#')[0] + '#sync=' + c;
  },
  exportFile(name){
    name = name || this.current;
    const code = this.exportCode(name); if (!code) return null;
    return { filename: 'agente-' + name.replace(/[^\wáéíóúñ-]+/gi, '_') + '.ecsave',
      text: JSON.stringify({ app: 'the-criminalist', v: 2, agent: name, exportedAt: new Date().toISOString(), code }, null, 2) };
  },
  importFileText(text, pwd){
    let code = String(text || '').trim();
    try { const j = JSON.parse(code); if (j && j.code) code = j.code; } catch(e){}
    return this.importCode(code, pwd);
  }
};

/* ---------- PERSONAJES JUGABLES (aspectos base; editables) ---------- */
const CHARACTERS = [
  { id:'alegando', name:'Alegando', icon:'🕵️', gender:'male',
    look:{ v:1, body:'masc', build:1, height:3, skin:0xd8a888, hair:'short', hairColor:0x2a1a10, top:'suit', topColor:0x2a3a5a, neck:'tie', neckColor:0x8a1818, bottom:'trousers', bottomColor:0x1a1a1e, shoes:'oxford' } },
  { id:'alech', name:'Alech', icon:'🕵️‍♀️', gender:'female',
    look:{ v:1, body:'fem', build:0, height:2, skin:0xe8b898, hair:'long', hairColor:0x8a4a2a, top:'blouse', topColor:0x5a2a3a, bottom:'skirt', bottomColor:0x2a2a30, shoes:'heels', shoeColor:0x1a1a1e, glasses:'round' } },
  { id:'detective', name:'Detective', icon:'🎩', gender:'male',
    look:{ v:1, body:'masc', build:2, height:3, skin:0xc89878, hair:'short', hairColor:0x1a1a1e, top:'trench', topColor:0x6a5a46, topColor2:0x3a2a1a, neck:'tie', neckColor:0x8a1818, bottom:'trousers', bottomColor:0x2a2a30, shoes:'oxford', hat:'fedora', hatColor:0x2a2a30 } },
  { id:'forense', name:'Forense', icon:'🥼', gender:'female',
    look:{ v:1, body:'fem', build:1, height:2, skin:0xf0d0b0, hair:'bun', hairColor:0x3a2010, top:'labcoat', topColor:0xf0f0ec, bottom:'trousers', bottomColor:0x2a2a30, shoes:'flats', glasses:'square' } },
  { id:'informatico', name:'Informático', icon:'💻', gender:'male',
    look:{ v:1, body:'masc', build:0, height:2, skin:0xb88868, hair:'curly', hairColor:0x3a2a1a, top:'hoodie', topColor:0x2a4a5a, bottom:'jeans', bottomColor:0x2a3a5a, shoes:'sneakers', shoeColor:0xe8e8e8, glasses:'square' } },
  { id:'veterana', name:'Veterana', icon:'🎖️', gender:'female',
    look:{ v:1, body:'fem', build:1, height:2, skin:0xc89878, hair:'bob', hairColor:0x8a8a8a, top:'suit', topColor:0x2a3a5a, bottom:'trousers', bottomColor:0x2a2a30, shoes:'oxford', extra:'badge' } }
];
function getCharDef(id){ return CHARACTERS.find(c => c.id === id) || CHARACTERS[0]; }
/* Definición completa que se envía al otro jugador: base + apariencia personalizada actual */
function getMyCharDef(){
  const d = getCharDef(state.myChar || 'alegando');
  return { id: d.id, name: d.name, icon: d.icon, gender: d.gender, look: Auth.getLook() };
}

/* ---------- ESTADO GLOBAL ---------- */
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

function genCode(){
  const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s=''; for(let i=0;i<4;i++) s += c[(Math.random()*c.length)|0];
  return s;
}
function getPid(){
  let v = localStorage.getItem('ec_pid');
  if (!v){ v = 'p_' + Math.random().toString(36).slice(2,10); localStorage.setItem('ec_pid', v); }
  return v;
}

/* ---------- RENDER DISPATCHER ---------- */
function render(force){
  if (state.view !== 'customize' && typeof disposeCustomizer === 'function') disposeCustomizer();
  if (!Auth.current) return renderLogin();
  if (state.view === 'customize') return renderCustomize();
  if (state.view === 'menu') return renderMenu();
  if (state.view === 'briefing') return renderBriefing();
  if (state.view === 'lobby') return renderLobby();
  if (state.view === 'result') return renderResult();
  return renderGame(force);
}