/* ====================================================================
   08-WORLD — Objeto World y Player
   ==================================================================== */

const World = {
  renderer:null, scene:null, camera:null, canvas:null,
  bounds:{ minX:-5, maxX:5, minZ:-5, maxZ:5 },
  obstacles:[], interactables:[], dust:null,
  roomHalf:5, roomHeight:3,
  raycaster:null, animId:null, lastTime:0,
  caseData:null, mode:'crime', currentSuspect:null,
  onInteract:null, nearHintEl:null, crosshairEl:null,
  boundEvents:{}, floors:[], occluders:[], suspectRig:null, _movers:null
};

const Player = {
  pos: new THREE.Vector3(0, 1.65, 3),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: Math.PI, pitch: -0.1,
  radius: 0.32, height: 1.65,
  walkSpeed: 2.8, runSpeed: 5.0,
  bobPhase: 0, bobAmp: 0, gy: 0,
  pointerLocked: false, keys:{}, moving:false
};

/* ---------- COLISIONES (rectángulos orientados + círculos) ---------- */
World.groundAt = function(x, z){
  let h = 0;
  for (const f of this.floors) if (x >= f.minX && x <= f.maxX && z >= f.minZ && z <= f.maxZ && f.h > h) h = f.h;
  return h;
};
/* Empuja un círculo (x,z,r) fuera de todos los obstáculos. Devuelve {x,z,nx,nz,hit} */
World.resolve = function(x, z, r){
  let nx = 0, nz = 0, hit = false;
  for (let pass = 0; pass < 3; pass++){
    let moved = false;
    for (const o of this.obstacles){
      if (x + r < o.minX || x - r > o.maxX || z + r < o.minZ || z - r > o.maxZ) continue;
      let ex, ez, push, wx, wz;
      if (o.shape === 'circle'){
        const dx = x - o.cx, dz = z - o.cz, rr = r + o.r, d2 = dx * dx + dz * dz;
        if (d2 >= rr * rr) continue;
        const d = Math.sqrt(d2) || 1e-6;
        wx = dx / d; wz = dz / d; push = rr - d;
        if (d2 < 1e-10){ wx = 1; wz = 0; }
      } else if (o.shape === 'obb'){
        const c = Math.cos(o.rot), s = Math.sin(o.rot);
        const dx = x - o.cx, dz = z - o.cz;
        const lx = c * dx - s * dz, lz = s * dx + c * dz;
        const qx = Math.max(-o.hw, Math.min(o.hw, lx)), qz = Math.max(-o.hd, Math.min(o.hd, lz));
        ex = lx - qx; ez = lz - qz;
        const d2 = ex * ex + ez * ez;
        if (d2 >= r * r) continue;
        let lnx, lnz;
        if (d2 > 1e-9){ const d = Math.sqrt(d2); lnx = ex / d; lnz = ez / d; push = r - d; }
        else {
          const px = o.hw - Math.abs(lx), pz = o.hd - Math.abs(lz);
          if (px < pz){ lnx = lx >= 0 ? 1 : -1; lnz = 0; push = px + r; } else { lnx = 0; lnz = lz >= 0 ? 1 : -1; push = pz + r; }
        }
        wx = c * lnx + s * lnz; wz = -s * lnx + c * lnz;
      } else {   // obstáculo antiguo (solo caja)
        const oX = x + r > o.minX && x - r < o.maxX, oZ = z + r > o.minZ && z - r < o.maxZ;
        if (!(oX && oZ)) continue;
        const pL = (x + r) - o.minX, pR = o.maxX - (x - r), pU = (z + r) - o.minZ, pD = o.maxZ - (z - r);
        const mX = Math.min(pL, pR), mZ = Math.min(pU, pD);
        if (mX < mZ){ wx = pL < pR ? -1 : 1; wz = 0; push = mX; } else { wx = 0; wz = pU < pD ? -1 : 1; push = mZ; }
      }
      x += wx * push; z += wz * push; nx += wx; nz += wz; hit = true; moved = true;
    }
    if (!moved) break;
  }
  const l = Math.hypot(nx, nz) || 1;
  return { x, z, nx: nx / l, nz: nz / l, hit };
};
/* Lista de mallas que pueden tapar la línea de visión (se construye una vez) */
World.buildOccluders = function(){
  const skip = new Set();
  this.interactables.forEach(it => {
    if (it.mesh) it.mesh.traverse(o => skip.add(o));
    if (it.objMesh) it.objMesh.traverse(o => skip.add(o));
  });
  const list = [];
  const underRig = o => { for (let p = o; p; p = p.parent){ if (p.userData && p.userData.rig) return true; } return false; };
  this.scene.traverse(o => {
    if (!o.isMesh || skip.has(o) || !o.visible) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material;
    if (!m || m.transparent || m.visible === false || m.depthWrite === false) return;
    if (underRig(o)) return;
    list.push(o);
  });
  this.occluders = list;
  this._movers = this.interactables.filter(i => i.type === 'drawer' || i.type === 'cabinetDoor').map(i => i.mesh);
};
