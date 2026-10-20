/* ====================================================================
   08B-WORLD-LOOP — Controles, animación, dispose
   ==================================================================== */

function setupControls(){
  const canvas = World.canvas;
  const overlay = document.getElementById('lock-overlay');
  const onKeyDown = e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    Player.keys[e.code] = true;
    if (e.code === 'KeyE' && Player.pointerLocked && !e.repeat){ const p = pickInteractable(); if (p && World.onInteract) World.onInteract(p.it); }
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
    const p = pickInteractable();
    if (p && World.onInteract) World.onInteract(p.it);
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

let _posTimer = 0, _hintT = 0;

/* Interacción: ayuda de puntería sobre objetos, raycast sobre cajones/puertas y oclusión real */
const _pO = new THREE.Vector3(), _pD = new THREE.Vector3(), _pV = new THREE.Vector3();
function pickInteractable(){
  if (!World.camera || !World.raycaster) return null;
  const cam = World.camera;
  cam.getWorldPosition(_pO); cam.getWorldDirection(_pD);
  const MAXD = 4.5;
  let best = null;
  for (const it of World.interactables){
    if (it.type !== 'object' || it.hidden) continue;
    const c = it.objMesh ? it.objMesh.position : it.mesh.position;
    _pV.set(c.x - _pO.x, (c.y + 0.1) - _pO.y, c.z - _pO.z);
    const t = _pV.dot(_pD);
    if (t < 0.15 || t > MAXD) continue;
    const perp = Math.sqrt(Math.max(0, _pV.lengthSq() - t * t));
    const rad = 0.2 + t * 0.045;
    if (perp < rad && (!best || t < best.t)) best = { it, t };
  }
  if (World._movers && World._movers.length){
    World.raycaster.set(_pO, _pD); World.raycaster.far = MAXD; World.raycaster.near = 0;
    const hits = World.raycaster.intersectObjects(World._movers, true);
    if (hits.length && (!best || hits[0].distance < best.t)){
      let o = hits[0].object;
      while (o && !World.interactables.find(i => i.mesh === o) && o.parent) o = o.parent;
      const it = World.interactables.find(i => i.mesh === o);
      if (it) best = { it, t: hits[0].distance };
    }
    World.raycaster.far = Infinity;
  }
  if (!best) return null;
  // ¿hay una pared o un mueble entre el jugador y el objetivo?
  if (World.occluders && World.occluders.length){
    const far = best.t - (best.it.type === 'object' ? 0.55 : 0.12);
    if (far > 0.1){
      World.raycaster.set(_pO, _pD); World.raycaster.far = far; World.raycaster.near = 0.05;
      const oh = World.raycaster.intersectObjects(World.occluders, false);
      World.raycaster.far = Infinity;
      if (oh.length) return null;
    }
  }
  return best;
}
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
  const b = World.bounds;
  // movimiento en subpasos para no atravesar obstáculos finos
  const mvx = Player.vel.x * dt, mvz = Player.vel.z * dt;
  const steps = Math.max(1, Math.min(8, Math.ceil(Math.hypot(mvx, mvz) / 0.07)));
  let nx = Player.pos.x, nz = Player.pos.z;
  for (let i = 0; i < steps; i++){
    nx += mvx / steps; nz += mvz / steps;
    if (nx - r < b.minX){ nx = b.minX + r; Player.vel.x = 0; }
    if (nx + r > b.maxX){ nx = b.maxX - r; Player.vel.x = 0; }
    if (nz - r < b.minZ){ nz = b.minZ + r; Player.vel.z = 0; }
    if (nz + r > b.maxZ){ nz = b.maxZ - r; Player.vel.z = 0; }
    const res = World.resolve(nx, nz, r);
    if (res.hit){
      nx = res.x; nz = res.z;
      const vn = Player.vel.x * res.nx + Player.vel.z * res.nz;
      if (vn < 0){ Player.vel.x -= vn * res.nx; Player.vel.z -= vn * res.nz; }   // desliza por la pared
    }
  }
  Player.pos.x = nx;
  Player.pos.z = nz;
  // altura del suelo (escenario, escalones) con suavizado
  const gT = World.groundAt(nx, nz);
  Player.gy += (gT - Player.gy) * Math.min(1, dt * 10);
  const moving = Math.hypot(Player.vel.x, Player.vel.z) > 0.3;
  Player.moving = moving;
  Player.bobPhase += dt * (moving ? (running ? 12 : 8.5) : 2.5);
  const targetAmp = moving ? (running ? 0.055 : 0.032) : 0.005;
  Player.bobAmp += (targetAmp - Player.bobAmp) * Math.min(1, dt * 6);
  Player.pos.y = Player.height + Player.gy + Math.sin(Player.bobPhase) * Player.bobAmp;
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
  if (World.suspectRig) World.suspectRig.update(dt, false, false);

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

  _hintT += dt;
  if (_hintT > 0.06){
    _hintT = 0;
    const pk = pickInteractable();
    if (World.crosshairEl){
      if (pk){
        World.crosshairEl.classList.add('hot');
        if (World.nearHintEl){
          const it = pk.it;
          if (it.type === 'object') World.nearHintEl.textContent = 'CLIC - ' + it.data.name;
          else if (it.type === 'drawer') World.nearHintEl.textContent = 'CLIC - ABRIR CAJON';
          else if (it.type === 'cabinetDoor') World.nearHintEl.textContent = 'CLIC - ABRIR PUERTA';
        }
      } else World.crosshairEl.classList.remove('hot');
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
  World.occluders = []; World.floors = []; World._movers = null; World.suspectRig = null;
  World.interactables = []; World.obstacles = []; World.boundEvents = {}; World.dust = null;
  Room.obstacles = []; Room.spawnZones = [];
}