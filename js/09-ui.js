/* ====================================================================
   09-UI — Todas las pantallas: login, menú, briefing, lobby, juego, result
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
function getTotalClues(c){
  let n = 0;
  c.objects.forEach(o => { if (o.clue) n++; });
  c.suspects.forEach(s => s.questions.forEach(q => { if (q.clue) n++; }));
  return n;
}

/* ---------- LOGIN ---------- */
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
        <div class="login-form" id="form-sync">
          <div class="sync-info">
            <div class="sync-title">📡 Sincronizar entre dispositivos</div>
            <p>Usa tu <b>código de agente</b> para llevar tu progreso a otro dispositivo.</p>
          </div>
          <label>Tu código</label>
          <div class="sync-box">
            <div class="sync-code" id="sync-output">— inicia sesión para verlo —</div>
            <button type="button" class="sync-copy-btn" id="sync-copy">📋 COPIAR</button>
          </div>
          <label style="margin-top:22px">Pegar código recibido</label>
          <input id="inp-import-code" type="text" placeholder="EC1.xxxxxxxx.xxxx" style="font-family:monospace;font-size:12px">
          <button type="button" class="btn-secondary" id="btn-import">📥 IMPORTAR AGENTE</button>
        </div>
        <div class="login-form" id="form-delete">
          <div class="sync-info" style="border-left-color:var(--red)">
            <div class="sync-title" style="color:var(--red)">⚠️ Borrar cuenta</div>
            <p>Se eliminará el agente <b>y todo su progreso</b> de este dispositivo.</p>
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
  const copyBtn = document.getElementById('sync-copy');
  if (copyBtn) copyBtn.onclick = () => {
    const code = document.getElementById('sync-output').textContent;
    if (!code || code.startsWith('—')){ setErr('Inicia sesión para ver tu código'); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(code);
    setOk('Código copiado al portapapeles');
  };
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

/* ---------- MENÚ ---------- */
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
        <h1 class="brand-title">The Criminalist</h1>
        <div class="tagline">Archivo de Casos</div>
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

/* ---------- BRIEFING ---------- */
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

/* ---------- LOBBY ---------- */
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

/* ---------- GAME ---------- */
function renderGame(force){
  const g = state.game;
  if (!g){ app.innerHTML = `<div class="lobby"><div class="status">${state.status||'Conectando...'} ⏳</div></div>`; return; }
  const c = CASES.find(x => x.id === g.caseId);
  if (!c) return;
  // FIX: también respeta el modo interrogatorio para no reconstruir el mundo
  if (!force && World.renderer && World.caseData && World.caseData.id === g.caseId &&
      (World.mode === 'crime' || World.mode === 'interrogation')){
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

/* ---------- UPDATE DINÁMICO (sin reconstruir el mundo) ---------- */
function updateGameDynamic(g, c){
  // Revela objetos ocultos cuyo gate haya sido examinado
  if (typeof updateHiddenObjects === 'function') updateHiddenObjects(g);

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
  banner.style.cssText = 'position:absolute;top:12px;left:50%;transform:translateX(-50%);font-family:"Special Elite",monospace;font-size:11px;letter-spacing:4px;color:var(--red);padding:6px 18px;background:rgba(0,0,0,.85);border:1px solid var(--red);border-radius:14px;z-index:15;pointer-events:none;';
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