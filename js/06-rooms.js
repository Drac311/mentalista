/* ====================================================================
   06-ROOMS — Sistema de colocación (Room) + base de habitación
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
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.95, color: cfg.ceilTint || 0xaaaaaa });
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

  /* COLUMNAS */
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