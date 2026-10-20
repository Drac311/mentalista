/* ====================================================================
   10-MULTIPLAYER — PeerJS, host, guest, sincronización
   ==================================================================== */

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
            RemotePlayers.add('host', hostInfo.charDef || CHARACTERS[0], hostInfo.name);
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
    RemotePlayers.add(conn.peer, data.charDef || CHARACTERS[0], data.name);
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

/* ====================================================================
   SINCRONIZACIÓN DIRECTA ENTRE DISPOSITIVOS (WebRTC, sin servidor propio)
   Un dispositivo muestra un código de 6 caracteres y el otro lo escribe.
   Ambos intercambian su agente y lo fusionan (nada se pierde).
   ==================================================================== */
const Sync = {
  peer: null, conn: null, timer: null, done: false, onStatus: null,
  _code(){ const c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 6; i++) s += c[(Math.random() * c.length) | 0]; return s; },
  stop(){
    clearTimeout(this.timer); this.timer = null;
    try { if (this.conn) this.conn.close(); } catch(e){}
    try { if (this.peer) this.peer.destroy(); } catch(e){}
    this.peer = null; this.conn = null;
  },
  _begin(onStatus){
    this.stop(); this.done = false; this.onStatus = onStatus;
    if (typeof Peer === 'undefined'){ onStatus({ phase: 'error', msg: 'No se pudo cargar la conexión directa (PeerJS). Usa código, enlace o archivo.' }); return false; }
    this.timer = setTimeout(() => { if (!this.done){ this.stop(); onStatus({ phase: 'error', msg: 'Tiempo agotado (3 min). Inténtalo de nuevo.' }); } }, 180000);
    return true;
  },
  _wire(conn){
    this.conn = conn;
    const send = () => { try { conn.send({ type: 'ec-sync', code: Auth.current ? Auth.exportCode() : null }); } catch(e){} };
    conn.on('open', () => { this.onStatus({ phase: 'connected' }); send(); });
    conn.on('data', d => {
      if (!d || d.type !== 'ec-sync') return;
      this.done = true;
      let r = { ok: true, changed: false, msg: 'El otro dispositivo no tenía agente que enviar' };
      if (d.code){
        r = Auth.importCode(d.code);
        if (r.needPassword) r = { ok: false, needPassword: true, code: d.code, msg: r.msg };
      }
      this.onStatus({ phase: 'done', result: r });
      setTimeout(() => this.stop(), 1500);
    });
    conn.on('close', () => { if (!this.done) this.onStatus({ phase: 'error', msg: 'El otro dispositivo se desconectó antes de terminar.' }); });
  },
  /* Dispositivo que muestra el código */
  host(onStatus){
    if (!this._begin(onStatus)) return;
    const code = this._code();
    const peer = new Peer('ecsync-' + code.toLowerCase(), { debug: 0 });
    this.peer = peer;
    peer.on('open', () => onStatus({ phase: 'waiting', code }));
    peer.on('connection', conn => {
      if (this.conn){ try { conn.close(); } catch(e){} return; }
      this._wire(conn);
    });
    peer.on('error', err => {
      if (err.type === 'unavailable-id'){ this.host(onStatus); return; }
      onStatus({ phase: 'error', msg: 'Error de conexión: ' + err.type });
    });
  },
  /* Dispositivo que introduce el código */
  join(code, onStatus){
    code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length !== 6){ onStatus({ phase: 'error', msg: 'El código tiene 6 caracteres' }); return; }
    if (!this._begin(onStatus)) return;
    const peer = new Peer({ debug: 0 });
    this.peer = peer;
    onStatus({ phase: 'connecting' });
    peer.on('open', () => this._wire(peer.connect('ecsync-' + code.toLowerCase(), { reliable: true })));
    peer.on('error', err => onStatus({ phase: 'error', msg: err.type === 'peer-unavailable' ? 'No se encontró ese código. Comprueba que el otro dispositivo lo está mostrando.' : 'Error de conexión: ' + err.type }));
  }
};
