/* ====================================================================
   06-ROOMS — Sistema de colocación (Room) + base de habitación con formas
   ==================================================================== */

const Room = {
  size: 11, height: 3, half: 5.5,
  obstacles: [], spawnZones: [], doors: [], windows: [],
  init(size, height){
    this.size = size; this.height = height; this.half = size/2;
    this.obstacles = []; this.spawnZones = []; this.doors = []; this.windows = [];
    if (typeof ENV !== 'undefined') ENV.build();   // mapa de entorno para reflejos
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
  /* Registra un obstáculo. Formas: rectángulo orientado (por defecto) o círculo ({circle:true, r}).
     minX..maxZ es la caja envolvente (para Room.fits); cx/cz/hw/hd/rot se usan en la colisión real. */
  register(x, z, w, d, rot, o){
    o = o || {};
    rot = rot || 0;
    let ob;
    if (o.circle){
      const r = o.r != null ? o.r : Math.min(w, d) / 2;
      ob = { shape: 'circle', cx: x, cz: z, r, minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r };
    } else {
      const cos = Math.abs(Math.cos(rot)), sin = Math.abs(Math.sin(rot));
      const hw = (w * cos + d * sin) / 2, hd = (w * sin + d * cos) / 2;
      ob = { shape: 'obb', cx: x, cz: z, hw: w / 2, hd: d / 2, rot,
             minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd };
    }
    this.obstacles.push(ob);
    World.obstacles.push(ob);
    return ob;
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
      if (opts.walkable !== true) this.register(x, z, w, d, rr, opts.circle ? { circle: true, r: opts.r } : null);
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

/* ---------- BASE HABITACIÓN ---------- */

/* Pared con huecos rectangulares (ventanas). Coordenadas locales: x a lo largo, y hacia arriba. */
function _wallGeo(SIZE, H, holes){
  const s = new THREE.Shape();
  s.moveTo(-SIZE/2, 0); s.lineTo(SIZE/2, 0); s.lineTo(SIZE/2, H); s.lineTo(-SIZE/2, H); s.lineTo(-SIZE/2, 0);
  holes.forEach(hh => {
    const p = new THREE.Path();
    const x0 = hh.x - hh.w/2, x1 = hh.x + hh.w/2, y0 = hh.y - hh.h/2, y1 = hh.y + hh.h/2;
    p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.lineTo(x0, y0);
    s.holes.push(p);
  });
  const geo = new THREE.ShapeGeometry(s);
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + SIZE/2) / SIZE, pos.getY(i) / H);
  return geo;
}
/* Rodea el perímetro de la sala con una pieza de moldura */
function _perimeter(scene, half, SIZE, y, h, t, mat, inset){
  inset = inset || 0;
  const len = SIZE - inset * 2;
  [
    [0, y, -half + t/2 + inset, len, h, t],
    [0, y,  half - t/2 - inset, len, h, t],
    [-half + t/2 + inset, y, 0, t, h, len],
    [ half - t/2 - inset, y, 0, t, h, len]
  ].forEach(([x, yy, z, w, hh, d]) => {
    const m = rbox(scene, w, hh, d, mat, x, yy, z, Math.min(0.01, t / 2.5));
    m.castShadow = false;
  });
}
/* Cornisa en gola: tres piezas escalonadas + bocel */
function _crown(scene, half, SIZE, H, mat, accent){
  _perimeter(scene, half, SIZE, H - 0.04, 0.08, 0.1, mat);
  _perimeter(scene, half, SIZE, H - 0.12, 0.08, 0.06, mat);
  _perimeter(scene, half, SIZE, H - 0.2, 0.05, 0.035, accent || mat);
}

function buildRoomBase(scene, cfg){
  const SIZE = cfg.size, H = cfg.height, half = SIZE/2;
  World.roomHalf = half;
  World.roomHeight = H;
  World.bounds = { minX: -half + 0.12, maxX: half - 0.12, minZ: -half + 0.12, maxZ: half - 0.12 };

  /* SUELO */
  const floorTex = cfg.floorTex();
  floorTex.repeat.set(SIZE / 2, SIZE / 2);
  const floorBump = makeBump(floorTex.image, 2.2);
  floorBump.repeat.copy(floorTex.repeat);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorTex, roughness: cfg.floorRough != null ? cfg.floorRough : 0.55,
    color: cfg.floorTint || 0xffffff,
    bumpMap: floorBump, bumpScale: cfg.floorBump != null ? cfg.floorBump : 0.05
  });
  ENV.reg(floorMat, cfg.floorEnv != null ? cfg.floorEnv : 0.28);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);

  /* TECHO */
  const ceilTex = TEX.ceiling();
  ceilTex.repeat.set(SIZE / 3, SIZE / 3);
  const ceilMat = new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.95, color: cfg.ceilTint || 0x8a8478 });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), ceilMat);
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; ceil.receiveShadow = true; scene.add(ceil);

  /* VIGAS */
  if (cfg.beams && cfg.beams > 0){
    const beamMat = cfg.beamMat || MAT.woodDark;
    for (let i = 1; i < cfg.beams; i++){
      const z = -half + (SIZE / cfg.beams) * i;
      const beam = rbox(scene, SIZE - 0.2, 0.2, 0.26, beamMat, 0, H - 0.1, z, 0.025);
      // ménsulas decorativas en los extremos
      [-1, 1].forEach(s => {
        rbox(scene, 0.18, 0.28, 0.2, beamMat, s * (half - 0.2), H - 0.3, z, 0.02);
        rbox(scene, 0.1, 0.14, 0.18, beamMat, s * (half - 0.32), H - 0.43, z, 0.02);
      });
    }
  }
  /* CASETONES */
  if (cfg.coffered){
    const cofMat = cfg.beamMat || MAT.woodDark;
    const gridN = Math.floor(SIZE / 1.5);
    for (let i = 1; i < gridN; i++){
      const z = -half + (SIZE / gridN) * i;
      rbox(scene, SIZE - 0.2, 0.16, 0.16, cofMat, 0, H - 0.08, z, 0.02);
      rbox(scene, 0.16, 0.16, SIZE - 0.2, cofMat, z, H - 0.08, 0, 0.02);
    }
    // rosetas doradas en las intersecciones
    for (let i = 1; i < gridN; i++) for (let j = 1; j < gridN; j++){
      const x = -half + (SIZE / gridN) * i, z = -half + (SIZE / gridN) * j;
      cyl(scene, 0.07, 0.07, 0.02, MAT.brass, x, H - 0.17, z, 12);
    }
  }

  /* PAREDES (con huecos de ventana) */
  const wallTex = cfg.wallTex();
  wallTex.repeat.set(SIZE / 2.5, H / 2.5);
  const wallBump = makeBump(wallTex.image, 1.4);
  wallBump.repeat.copy(wallTex.repeat);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex, roughness: 0.9, color: cfg.wallTint || 0xffffff,
    bumpMap: wallBump, bumpScale: 0.12
  });
  const wins = cfg.windows || [];
  [
    ['N', 0, -half, 0], ['S', 0, half, Math.PI],
    ['W', -half, 0, Math.PI/2], ['E', half, 0, -Math.PI/2]
  ].forEach(([wall, x, z, ry]) => {
    const holes = wins.filter(w => w.wall === wall).map(w => ({
      x: (wall === 'N' || wall === 'E') ? w.pos : -w.pos, y: w.y || 1.9, w: w.w || 1.8, h: w.h || 1.5
    }));
    const m = new THREE.Mesh(_wallGeo(SIZE, H, holes), wallMat);
    m.position.set(x, 0, z); m.rotation.y = ry;
    m.receiveShadow = true; scene.add(m);
  });
  wins.forEach(w => {
    Room.addWindow(w.wall, w.pos, w.w || 1.8, w.h || 1.5);
    const a = Room.anchor(w.wall, w.pos, 0, w.y || 1.9);
    const wg = makeWindow(w.w || 1.8, w.h || 1.5, { curtains: w.curtains, revealMat: wallMat });
    wg.position.set(a.x, a.y, a.z); wg.rotation.y = a.rot; scene.add(wg);
  });

  /* ZÓCALO (dos piezas) */
  const baseMat = cfg.baseMat || new THREE.MeshStandardMaterial({ color: cfg.baseColor || 0x2a1d10, roughness: 0.6 });
  const bbH = cfg.baseH || 0.18;
  _perimeter(scene, half, SIZE, bbH / 2, bbH, 0.05, baseMat);
  _perimeter(scene, half, SIZE, bbH + 0.015, 0.03, 0.065, baseMat);

  /* CORNISA */
  if (cfg.cornice !== false){
    const cornMat = cfg.corniceMat || new THREE.MeshStandardMaterial({ color: cfg.corniceColor || 0x2a2010, roughness: 0.55 });
    _crown(scene, half, SIZE, H, cornMat, cfg.corniceAccent);
  }

  /* BOISERIE / WAINSCOTING con paneles resaltados */
  if (cfg.wainscot){
    const wainH = cfg.wainscotH || 1.0;
    const panelH = wainH - 0.06;
    const wainMat = cfg.wainscotMat || MAT.mahogany;
    const railMat = cfg.wainscotRailMat || MAT.woodDark;
    const stileMat = cfg.wainscotStileMat || MAT.woodDark;
    ['N','S','E','W'].forEach(wall => {
      const horiz = wall === 'N' || wall === 'S';
      const zOff = wall === 'N' ? -half + 0.035 : wall === 'S' ? half - 0.035 : 0;
      const xOff = wall === 'W' ? -half + 0.035 : wall === 'E' ? half - 0.035 : 0;
      const ry = horiz ? 0 : Math.PI/2;
      const px = horiz ? 0 : xOff;
      const pz = horiz ? zOff : 0;
      const grp = new THREE.Group(); grp.position.set(px, 0, pz); grp.rotation.y = ry; scene.add(grp);
      const inward = (wall === 'N' || wall === 'W') ? 1 : -1;     // hacia el interior
      const sgn = horiz ? inward : (wall === 'W' ? 1 : -1);
      // la rotación del grupo ya orienta +z hacia el interior en N y W; en S y E hay que invertir
      const zIn = (wall === 'N') ? 1 : (wall === 'S') ? -1 : (wall === 'W') ? -1 : 1;
      const back = rbox(grp, SIZE - 0.12, panelH, 0.06, wainMat, 0, panelH/2, 0, 0.006);
      back.castShadow = false;
      const bays = Math.max(3, Math.floor(SIZE / 1.4));
      const bayW = (SIZE - 0.24) / bays;
      for (let i = 0; i < bays; i++){
        const along = -(SIZE - 0.24) / 2 + bayW * (i + 0.5);
        // marco resaltado + panel hundido
        const pw = bayW - 0.16, ph = panelH - 0.28;
        if (pw > 0.2){
          rbox(grp, pw, ph, 0.025, stileMat, along, panelH / 2, zIn * 0.04, 0.008).castShadow = false;
          rbox(grp, pw - 0.1, ph - 0.1, 0.02, wainMat, along, panelH / 2, zIn * 0.05, 0.008).castShadow = false;
        }
        const st = rbox(grp, 0.07, panelH, 0.08, stileMat, -(SIZE - 0.24) / 2 + bayW * i, panelH/2, zIn * 0.03, 0.01);
      }
      rbox(grp, 0.07, panelH, 0.08, stileMat, (SIZE - 0.24) / 2, panelH/2, zIn * 0.03, 0.01);
      // cimacio: pasamanos con perfil
      rbox(grp, SIZE, 0.05, 0.1, railMat, 0, panelH + 0.025, zIn * 0.035, 0.012);
      rbox(grp, SIZE, 0.025, 0.12, railMat, 0, panelH + 0.065, zIn * 0.045, 0.01);
    });
  }

  /* COLUMNAS torneadas con basa, fuste con éntasis y capitel */
  if (cfg.columns){
    const colMat = cfg.colMat || new THREE.MeshStandardMaterial({ color: cfg.colColor || 0xb8a888, roughness: 0.55 });
    const capMat = cfg.colCapMat || new THREE.MeshStandardMaterial({ color: cfg.colCapColor || 0x3a2a14, roughness: 0.6 });
    ENV.reg(colMat, 0.35);
    cfg.columns.forEach(([cx, cz]) => {
      const g = new THREE.Group();
      const shaftH = H - 0.6;
      const pts = [[0.001, 0], [0.34, 0], [0.34, 0.08], [0.28, 0.1], [0.28, 0.16], [0.24, 0.2], [0.23, 0.26]];
      for (let i = 0; i <= 8; i++){ const t = i / 8; pts.push([0.215 - 0.025 * t + 0.012 * Math.sin(t * Math.PI), 0.26 + t * shaftH]); }
      const top = 0.26 + shaftH;
      pts.push([0.2, top + 0.02], [0.24, top + 0.06], [0.27, top + 0.1], [0.001, top + 0.1]);
      const shaft = lathe(g, pts, colMat, 0, 0, 0, 28);
      // estrías
      for (let i = 0; i < 16; i++){
        const a = (i / 16) * Math.PI * 2;
        const f = box(g, 0.012, shaftH - 0.1, 0.012, capMat, Math.cos(a) * 0.205, 0.26 + shaftH / 2, Math.sin(a) * 0.205);
        f.rotation.y = -a; f.castShadow = false;
      }
      rbox(g, 0.64, 0.08, 0.64, capMat, 0, top + 0.14, 0, 0.015);
      rbox(g, 0.5, 0.05, 0.5, colMat, 0, top + 0.07, 0, 0.012);
      g.position.set(cx, 0, cz); scene.add(g);
      Room.register(cx, cz, 0.7, 0.7, 0, { circle: true, r: 0.36 });
    });
  }

  /* ══════════════════════════════════════════════════════════════════
     FORMAS ESPECIALES — L-shape, alcove, chimenea_block, escalón
     ══════════════════════════════════════════════════════════════════ */
  const wallMat2 = wallMat; // reusar

  // CORTE EN L: quita una esquina (bloque de pared)
  if (cfg.lCut){
    const { size: cs = 3.2, corner = 'NE' } = cfg.lCut;
    let cx, cz;
    if (corner === 'NE'){ cx = half - cs/2; cz = -half + cs/2; }
    if (corner === 'NW'){ cx = -half + cs/2; cz = -half + cs/2; }
    if (corner === 'SE'){ cx = half - cs/2; cz = half - cs/2; }
    if (corner === 'SW'){ cx = -half + cs/2; cz = half - cs/2; }
    const wallH = H;
    const wallT = 0.12;
    if (corner === 'NE' || corner === 'SE'){
      const px = half - cs;
      const wallV = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, cs), wallMat2);
      wallV.position.set(px, wallH/2, cz);
      wallV.receiveShadow = true; scene.add(wallV);
    } else {
      const px = -half + cs;
      const wallV = new THREE.Mesh(new THREE.BoxGeometry(wallT, wallH, cs), wallMat2);
      wallV.position.set(px, wallH/2, cz);
      wallV.receiveShadow = true; scene.add(wallV);
    }
    if (corner === 'NE' || corner === 'NW'){
      const pz = -half + cs;
      const wallH2 = new THREE.Mesh(new THREE.BoxGeometry(cs - wallT, wallH, wallT), wallMat2);
      wallH2.position.set(cx, wallH/2, pz);
      wallH2.receiveShadow = true; scene.add(wallH2);
    } else {
      const pz = half - cs;
      const wallH2 = new THREE.Mesh(new THREE.BoxGeometry(cs - wallT, wallH, wallT), wallMat2);
      wallH2.position.set(cx, wallH/2, pz);
      wallH2.receiveShadow = true; scene.add(wallH2);
    }
    Room.register(cx, cz, cs, cs, 0);
  }

  // ALCOVA
  if (cfg.alcove){
    const { wall = 'N', offset = 0, width = 3, depth = 1.5 } = cfg.alcove;
    const alcMat = wallMat2;
    const alcH = H;
    const t = 0.1;
    if (wall === 'N' || wall === 'S'){
      const zSign = wall === 'N' ? -1 : 1;
      const zBase = zSign * half;
      const zBack = zBase + zSign * depth;
      const wL = new THREE.Mesh(new THREE.BoxGeometry(t, alcH, depth), alcMat);
      wL.position.set(offset - width/2, alcH/2, zBase + zSign*depth/2);
      scene.add(wL);
      const wR = wL.clone();
      wR.position.x = offset + width/2;
      scene.add(wR);
      const wB = new THREE.Mesh(new THREE.BoxGeometry(width, alcH, t), alcMat);
      wB.position.set(offset, alcH/2, zBack);
      scene.add(wB);
      Room.register(offset, zBack, width, t, 0);
    }
  }

  // ESCALÓN / PLATAFORMA
  if (cfg.platform){
    const { x = 0, z = 0, w = 4, d = 3, h = 0.25, color = 0x3a2a14 } = cfg.platform;
    const platMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
    const plat = rbox(scene, w, h, d, platMat, x, h/2, z, 0.02);
  }

  // NICHOS EN PARED
  if (cfg.niches){
    cfg.niches.forEach(n => {
      const { wall = 'N', offset = 0, w = 0.8, h = 1.2, depth = 0.4 } = n;
      const zSign = wall === 'N' ? -1 : wall === 'S' ? 1 : 0;
      const xSign = wall === 'W' ? -1 : wall === 'E' ? 1 : 0;
      const t = 0.06;
      const mat = wallMat2;
      const group = new THREE.Group();
      if (zSign !== 0){
        const zBase = zSign * half;
        const back = new THREE.Mesh(new THREE.BoxGeometry(w, h, t), mat);
        back.position.set(offset, h/2 + 0.4, zBase + zSign*0.05);
        group.add(back);
      } else {
        const xBase = xSign * half;
        const back = new THREE.Mesh(new THREE.BoxGeometry(t, h, w), mat);
        back.position.set(xBase + xSign*0.05, h/2 + 0.4, offset);
        group.add(back);
      }
      scene.add(group);
    });
  }

  /* POLVO EN SUSPENSIÓN */
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
