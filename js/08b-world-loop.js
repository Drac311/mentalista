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
          if (it.type === 'object') World.nearHintEl.textContent = 'CLIC - ' + it.data.name;
          else if (it.type === 'drawer') World.nearHintEl.textContent = 'CLIC - ABRIR CAJON';
          else if (it.type === 'cabinetDoor') World.nearHintEl.textContent = 'CLIC - ABRIR PUERTA';
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