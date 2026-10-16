/* ====================================================================
   00-CORE — Auth, personajes, estado global, helpers, dispatcher
   ==================================================================== */

/* ---------- AUTH ---------- */
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
    users[name] = { name, salt, pwdHash: this.hash(pwd, salt), created: Date.now(), solved: [], char: 'alegando' };
    this.saveUsers(users);
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
  exportCode(name){
    name = name || this.current;
    const u = this.users[name];
    if (!u) return null;
    const payload = { v: 1, n: u.name, s: u.salt, h: u.pwdHash, c: u.created, sv: u.solved || [], ch: u.char || 'alegando' };
    const json = JSON.stringify(payload);
    const b64 = btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    let sum = 0;
    for (let i = 0; i < b64.length; i++) sum = (sum * 31 + b64.charCodeAt(i)) >>> 0;
    const chk = sum.toString(36).slice(-4).padStart(4, '0');
    return 'EC1.' + b64 + '.' + chk;
  },
  importCode(code){
    code = (code || '').trim();
    if (!code.startsWith('EC1.')) return { ok:false, msg:'Código no válido (debe empezar por EC1.)' };
    const parts = code.split('.');
    if (parts.length !== 3) return { ok:false, msg:'Formato incorrecto' };
    const [, b64, chk] = parts;
    let sum = 0;
    for (let i = 0; i < b64.length; i++) sum = (sum * 31 + b64.charCodeAt(i)) >>> 0;
    const expected = sum.toString(36).slice(-4).padStart(4, '0');
    if (expected !== chk) return { ok:false, msg:'Código corrupto' };
    let json;
    try {
      const padded = b64.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64.length + 3) % 4);
      json = decodeURIComponent(escape(atob(padded)));
    } catch(e){ return { ok:false, msg:'No se pudo decodificar' }; }
    let payload;
    try { payload = JSON.parse(json); } catch(e){ return { ok:false, msg:'Contenido inválido' }; }
    if (!payload.n || !payload.s || !payload.h) return { ok:false, msg:'Código incompleto' };
    const users = this.users;
    const existing = users[payload.n];
    if (existing){
      const ec = (existing.solved || []).length, nc = (payload.sv || []).length;
      if (ec >= nc && existing.pwdHash === payload.h) return { ok:false, msg:'Ya está sincronizado' };
      if (existing.pwdHash !== payload.h) return { ok:false, msg:'Ya existe un agente con ese nombre y otra contraseña' };
    }
    users[payload.n] = { name: payload.n, salt: payload.s, pwdHash: payload.h,
      created: payload.c || Date.now(), solved: payload.sv || [], char: payload.ch || 'alegando' };
    this.saveUsers(users);
    return { ok:true, msg:'Agente sincronizado', name: payload.n };
  }
};

/* ---------- PERSONAJES JUGABLES ---------- */
const CHARACTERS = [
  { id:'alegando', name:'Alegando', icon:'🕵️', gender:'male',
    skin:0xd8a888, hair:0x2a1a10, shirt:0x2a3a5a, pants:0x1a1a1e, hat:false, glasses:false, tie:true },
  { id:'alech', name:'Alech', icon:'🕵️‍♀️', gender:'female',
    skin:0xe8b898, hair:0x8a4a2a, shirt:0x5a2a3a, pants:0x2a2a30, hat:false, glasses:true, tie:false },
  { id:'detective', name:'Detective', icon:'🎩', gender:'male',
    skin:0xc89878, hair:0x1a1a1e, shirt:0x3a3a3a, pants:0x2a2a30, hat:true, glasses:false, tie:true },
  { id:'forense', name:'Forense', icon:'🥼', gender:'female',
    skin:0xf0d0b0, hair:0x3a2010, shirt:0xf0f0f0, pants:0x2a2a30, hat:false, glasses:true, tie:false },
  { id:'informatico', name:'Informático', icon:'💻', gender:'male',
    skin:0xb88868, hair:0x3a2a1a, shirt:0x2a4a5a, pants:0x1a1a1e, hat:false, glasses:true, tie:false },
  { id:'veterana', name:'Veterana', icon:'🎖️', gender:'female',
    skin:0xc89878, hair:0x5a5a5a, shirt:0x2a3a5a, pants:0x2a2a30, hat:false, glasses:false, tie:false }
];
function getCharDef(id){ return CHARACTERS.find(c => c.id === id) || CHARACTERS[0]; }
function getMyCharDef(){ return getCharDef(state.myChar || 'alegando'); }

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
  if (!Auth.current) return renderLogin();
  if (state.view === 'menu') return renderMenu();
  if (state.view === 'briefing') return renderBriefing();
  if (state.view === 'lobby') return renderLobby();
  if (state.view === 'result') return renderResult();
  return renderGame(force);
}