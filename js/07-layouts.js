/* ====================================================================
   07-LAYOUTS — Cada escena con su identidad propia + interrogatorio
   (posiciones de objetos/slots conservadas; ventanas con hueco real)
   ==================================================================== */

/* Coloca un mueble pegado a una pared y lo registra */
function _wallPlace(scene, wall, off, dist, mk, pad){
  const a = Room.anchor(wall, off, dist, 0);
  const m = mk();
  if (!Room.fits(a.x, a.z, m.w, m.d, a.rot, pad == null ? 0.1 : pad)) return null;
  m.group.position.set(a.x, 0, a.z); m.group.rotation.y = a.rot;
  scene.add(m.group); Room.register(a.x, a.z, m.w, m.d, a.rot, m.round ? { circle: true, r: m.cr } : null);
  return { m, a };
}
/* Coloca un mueble en (x,z) con rotación y lo registra */
function _put(scene, mk, x, z, rot, pad){
  const m = mk();
  if (!Room.fits(x, z, m.w, m.d, rot || 0, pad == null ? 0.06 : pad)) return null;
  m.group.position.set(x, 0, z); m.group.rotation.y = rot || 0;
  scene.add(m.group); Room.register(x, z, m.w, m.d, rot || 0, m.round ? { circle: true, r: m.cr } : null);
  return m;
}
/* Elige el sitio del cadáver: fijo por caso (c.corpseSpot) o determinista por id */
function pickCorpseSpot(ov, spots){
  let list = spots;
  if (ov && ov.corpsePose){ const f = spots.filter(s => s.pose === ov.corpsePose); if (f.length) list = f; }
  const n = list.length;
  const i = (ov && ov.corpseSpot != null) ? (ov.corpseSpot | 0) : Math.floor(_rng('spot|' + ((ov && ov._seed) || ''))() * n);
  return list[((i % n) + n) % n];
}
/* Reserva el hueco del cadáver (colisión real) antes de colocar el resto del decorado */
function reserveCorpse(spot){
  const f = corpseFootprint(spot.pose, spot.x, spot.z, spot.rot);
  Room.register(f.x, f.z, f.w, f.d, f.rot);
}
function _corpseRet(spot){ return { corpsePos: { x: spot.x, z: spot.z, rot: spot.rot }, pose: spot.pose, corpse: spot }; }
function _gravelTex(){
  const S = 512, c = mkCanvas(S), x = c.getContext('2d');
  const img = x.createImageData(S, S), d = img.data;
  for (let py = 0; py < S; py++) for (let px = 0; px < S; px++){
    const n = NZ.h2(px >> 1, py >> 1, 5), m = NZ.fbm(px / S * 12, py / S * 12, 12, 12, 3, 2);
    const k = 70 + n * 70 + m * 40, i = (py * S + px) * 4;
    d[i] = k; d[i+1] = k * 0.95; d[i+2] = k * 0.85; d[i+3] = 255;
  }
  x.putImageData(img, 0, 0);
  return texFromCanvas(c);
}

function layoutDespacho(scene, ov){
  const size = ov.size || 12, H = ov.height || 3.2;
  const SPOTS = [
    { x: 0.6,  z: 2.4,  rot: Math.PI * 0.3, pose: 'supine' },
    { x: -2.5, z: -3.5, rot: Math.PI,        pose: 'lolled', chairAt: true },
    { x: -1.0, z: 3.5,  rot: 0.15,           pose: 'crawl' },
    { x: -5.62,z: 1.2,  rot: Math.PI / 2,    pose: 'seated' },
    { x: 4.5,  z: 1.2,  rot: -Math.PI * 0.4, pose: 'curled' },
    { x: -0.4, z: -2.1, rot: 0.4,            pose: 'supine2' }
  ];
  const spot = pickCorpseSpot(ov, SPOTS);
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.parquet,
    wallTex: () => TEX.wallpaper('#4a3422', 'rgba(0,0,0,0.2)', { damask: true, damaskColor: '#140a04' }),
    wallTint: 0xd8c0a0,
    wainscot: true, wainscotH: 1.1,
    wainscotMat: MAT.mahogany, wainscotRailMat: MAT.woodDark, wainscotStileMat: MAT.woodDark,
    windows: [{ wall: 'W', pos: -1.2, w: 2.6, h: 1.5, y: 2.05, curtains: true }],
    beams: ov.beams != null ? ov.beams : 5,
    beamMat: MAT.woodDark,
    corniceColor: 0x2a1408,
    baseMat: MAT.woodDark, baseColor: 0x1a0a04,
    dustColor: 0xffb060,
    ambientColor: 0x3a2a20,
    ambientIntensity: 0.5
  });
  const h = size/2;
  Room.addDoor('E', 2.8, 1.1);
  const doorPos = Room.anchor('E', 2.8, 0.06, 0);
  const d = makeDoor(1.0, 2.2); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  const rug = makeRug(4.5, 3.5, ['#6a1818', 'rgba(222,170,40,0.9)']);
  rug.position.set(-1, 0.006, 1.2); scene.add(rug);
  const fp = makeFireplace();
  const fA = Room.anchor('S', -2.5, 0.4, 0);
  fp.group.position.set(fA.x, 0, fA.z);
  fp.group.rotation.y = fA.rot;
  scene.add(fp.group);
  Room.register(fA.x, fA.z, fp.w, fp.d, fA.rot);
  Room.place(
    (x, z, r) => {
      const dk = makeDesk(); dk.group.position.set(x, 0, z); dk.group.rotation.y = r; scene.add(dk.group);
      const lamp = makeTableLamp();
      lamp.group.position.set(x - 0.7*Math.cos(r), 0.806, z - 0.7*Math.sin(r));
      scene.add(lamp.group);
      // accesorios de escritorio (fuera de las posiciones de objetos)
      const bs = makeBookStack(3); bs.group.position.set(x + 0.95, 0.806, z + 0.28); scene.add(bs.group);
      const cd = makeCandelabra(); cd.group.position.set(x + 0.05, 0.806, z - 0.3); scene.add(cd.group);
      // silla de visita al lado de la sala (la original no cabía junto a la pared)
      const cx = x - Math.sin(r) * 1.2, cz = z + Math.cos(r) * 1.35;
      if (!spot.chairAt && Room.fits(cx, cz, 0.6, 0.6, r, 0.1)){
        const ch = makeChair();
        ch.group.position.set(cx, 0, cz); ch.group.rotation.y = r + Math.PI;
        scene.add(ch.group); Room.register(cx, cz, 0.6, 0.6, r);
      }
    },
    { w: 2.3, d: 1.2, try: [[-2.5, -h + 1.2, 0], [2.5, -h + 1.2, 0]] }
  );
  Room.place(
    (x, z, r) => { const a = makeArmchair(); a.group.position.set(x, 0, z); a.group.rotation.y = r; scene.add(a.group); },
    { w: 1.05, d: 0.95, try: [[-2.5, 0.8, 0], [-2.5, 2.5, 0], [0, 2.5, -Math.PI/2]] }
  );
  [['E', -2.5], ['E', -5.5]].forEach(([wall, off]) => {
    _wallPlace(scene, wall, off, 0.25, () => makeBookshelf(2.2, 2.8));
  });
  reserveCorpse(spot);
  [1.5, -0.3].forEach((off, i) => {
    const s = i === 0 ? [1.6, 1.2, 0] : [0.9, 0.9, 1];
    const a = Room.anchor('N', off, 0.05, 2.0);
    const p = makePainting(s[0], s[1], s[2]);
    p.position.set(a.x, a.y, a.z); p.rotation.y = a.rot; scene.add(p);
  });
  const rp = OBJ.relojPared();
  const rpA = Room.anchor('N', 3.5, 0.1, 2.2);
  rp.position.set(rpA.x, rpA.y, rpA.z); rp.rotation.y = rpA.rot; scene.add(rp);
  [[-h + 0.9, -h + 0.9], [h - 0.9, h - 0.9]].forEach(([x, z]) => _put(scene, makePlant, x, z, 0, 0.05));
  // ambientación nueva
  _wallPlace(scene, 'N', -5.1, 0.3, makeGrandfatherClock);
  _put(scene, makeSideTable, -3.6, 0.8, 0, 0.05) && (() => {
    const cd = makeCandelabra(); cd.group.position.set(-3.6, 0.64, 0.8); scene.add(cd.group);
  })();
  _put(scene, makeFloorLamp, -4.9, 2.0, 0, 0.05);
  _put(scene, makeSideTable, 0.9, -1.4, 0, 0.05) && (() => {
    const v = makeVase(); v.group.position.set(0.9, 0.64, -1.4); scene.add(v.group);
  })();
  [-4.3, -0.7].forEach(x => {
    const a = Room.anchor('S', x, 0.03, 2.0);
    const s = makeSconce(); s.position.set(a.x, a.y, a.z); s.rotation.y = a.rot; scene.add(s);
  });
  const lamp1 = makeCeilingLamp(1.6, 0x90b070);
  lamp1.position.set(-1, H, 1.2); scene.add(lamp1);
  const lamp2 = makeCeilingLamp(1.2, 0xa07040);
  lamp2.position.set(3, H, -1); scene.add(lamp2);
  return {
    ..._corpseRet(spot),
    spawn: { x: 4, z: -h + 1.5 },
    objectSlots: [
      { x: -3.5, y: 0.81, z: -h + 1.2 }, { x: -2.9, y: 0.81, z: -h + 1.2 },
      { x: -2.2, y: 0.81, z: -h + 1.2 }, { x: -1.5, y: 0.81, z: -h + 1.2 },
      { x: h - 0.5, y: 2.3, z: -2.5 }, { x: h - 0.5, y: 1.7, z: -2.5 },
      { x: h - 0.5, y: 1.1, z: -2.5 }, { x: -2.5, y: 2.4, z: h - 0.8 }
    ]
  };
}

function layoutDormitorio(scene, ov){
  const size = ov.size || 11, H = ov.height || 3.0;
  const SPOTS = [
    { x: 1.5,  z: 1.2,  rot: Math.PI * 0.3, pose: 'side' },
    { x: -1.2, z: -1.5, rot: Math.PI / 2,   pose: 'supine2' },
    { x: -1.9, z: 2.4,  rot: -Math.PI / 2,  pose: 'crawl' },
    { x: 1.5,  z: -4.2, rot: Math.PI,       pose: 'slumped' },
    { x: 5.15, z: 0.9,  rot: -Math.PI / 2,  pose: 'seated' },
    { x: 0.4,  z: -3.0, rot: 0.5,           pose: 'prone' }
  ];
  const spot = pickCorpseSpot(ov, SPOTS);
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.parquet,
    wallTex: () => TEX.wallpaper('#4a3e68', 'rgba(0,0,0,0.12)', { damask: true, damaskColor: '#1c1430' }),
    wallTint: 0xd0c8e8,
    wainscot: true, wainscotH: 0.9,
    wainscotMat: MAT.woodDark, wainscotRailMat: MAT.mahogany, wainscotStileMat: MAT.mahogany,
    windows: [{ wall: 'E', pos: -1.2, w: 2.2, h: 1.4, y: 1.85, curtains: true }],
    corniceColor: 0xb8a8c8, corniceAccent: new THREE.MeshStandardMaterial({ color: 0xd8c8e8, roughness: 0.6 }),
    baseColor: 0x3a2a50,
    dustColor: 0xd0a0ff,
    ambientColor: 0x404060,
    ambientIntensity: 0.5
  });
  const h = size/2;
  Room.addDoor('W', 2.6, 1.0);
  const doorPos = Room.anchor('W', 2.6, 0.06, 0);
  const d = makeDoor(1.0, 2.2); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  const rug = makeRug(4, 3, ['#3a2252', 'rgba(210,170,240,0.85)']);
  rug.position.set(0, 0.006, 1); scene.add(rug);
  const bed = Room.place(
    (x, z, r) => { const m = makeBed(); m.group.position.set(x, 0, z); m.group.rotation.y = r; scene.add(m.group); },
    { w: 2.3, d: 2.6, try: [[-h + 1.8, -h + 1.5, 0], [h - 1.8, -h + 1.5, Math.PI/2]] }
  );
  if (bed){
    [[-1.6, 0], [1.6, 0]].forEach(([dx]) => {
      const nx = bed.x + dx, nz = bed.z;
      const ns = makeNightstand();
      if (Room.fits(nx, nz, 0.65, 0.65, 0, 0.05)){
        ns.group.position.set(nx, 0, nz); scene.add(ns.group);
        Room.register(nx, nz, 0.65, 0.65, 0);
        const v = OBJ.vela(); v.position.set(nx, 0.69, nz); scene.add(v);
        const v2 = OBJ.vela(); v2.position.set(nx + 0.15, 0.69, nz + 0.1); scene.add(v2);
      }
    });
    _put(scene, makeTrunk, bed.x, -h + 3.7, 0, 0.05);
  }
  Room.place(
    (x, z, r) => { const m = makeWardrobe(); m.group.position.set(x, 0, z); m.group.rotation.y = r; scene.add(m.group); },
    { w: 1.8, d: 0.9, try: [[h - 0.6, -h + 1.8, -Math.PI/2], [h - 0.6, h - 1.8, -Math.PI/2]] }
  );
  reserveCorpse(spot);
  const vm = makeVanityMirror();
  const vmAnchor = Room.anchor('N', 1.5, 0.1, 0);
  vm.group.position.set(vmAnchor.x, 0, vmAnchor.z);
  vm.group.rotation.y = vmAnchor.rot;
  scene.add(vm.group);
  const vt = makeNightstand();
  vt.group.position.set(vmAnchor.x, 0, vmAnchor.z + 0.3);
  scene.add(vt.group);
  Room.register(vmAnchor.x, vmAnchor.z + 0.3, 0.65, 0.65, 0);
  const pt = makePainting(1.4, 1.0, 2);
  const ptA = Room.anchor('S', 1.5, 0.05, 2.0);
  pt.position.set(ptA.x, ptA.y, ptA.z); pt.rotation.y = ptA.rot; scene.add(pt);
  _put(scene, makePlant, h - 0.9, h - 0.9, 0, 0.05);
  // rincón de lectura
  _put(scene, makeArmchair, -h + 1.4, h - 1.5, Math.PI * 0.75, 0.05);
  _put(scene, makeFloorLamp, -h + 0.6, h - 0.6, 0, 0.05);
  _put(scene, makeSideTable, -h + 2.5, h - 0.8, 0, 0.05);
  const ch = makeChandelier();
  ch.position.set(0, H - 0.2, 0); scene.add(ch);
  const warmth = new THREE.PointLight(0xffa0c0, 0.6, 8, 1.8);
  warmth.position.set(0, 2, 0); scene.add(warmth);
  return {
    ..._corpseRet(spot),
    spawn: { x: -2, z: 4.0 },
    objectSlots: [
      { x: -h + 2.4, y: 0.87, z: -h + 1.5 }, { x: -h + 3.7, y: 0.87, z: -h + 1.5 },
      { x: -h + 0.9, y: 0.66, z: -h + 1.5 }, { x: -h + 4.5, y: 0.66, z: -h + 1.5 },
      { x: h - 1.7, y: 1.9, z: -h + 1.8 }, { x: h - 1.7, y: 1.3, z: -h + 1.8 },
      { x: 1.5, y: 1.6, z: h - 0.4 }, { x: h - 0.9, y: 0.1, z: h - 0.9 }
    ]
  };
}

function layoutBiblioteca(scene, ov){
  const size = ov.size || 14, H = ov.height || 4.0;
  const SPOTS = [
    { x: 0.8,  z: 2.7,  rot: Math.PI * 0.5, pose: 'prone' },
    { x: 0.0,  z: -0.75,rot: 0,             pose: 'deskslump', chairAt: true },
    { x: -3.0, z: -1.6, rot: 0.2,           pose: 'supine2' },
    { x: 5.0,  z: 2.0,  rot: Math.PI / 2,   pose: 'crawl' },
    { x: -6.15,z: 0.0,  rot: Math.PI / 2,   pose: 'seated' },
    { x: -2.8, z: 1.3,  rot: 2.2,           pose: 'side' }
  ];
  const spot = pickCorpseSpot(ov, SPOTS);
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.marbleDark, floorRough: 0.28, floorEnv: 0.7, floorBump: 0.01,
    wallTex: () => TEX.wallpaper('#24402e', 'rgba(0,0,0,0.22)', { damask: true, damaskColor: '#0a1810' }),
    wallTint: 0xc0d8c8,
    wainscot: true, wainscotH: 1.3,
    wainscotMat: MAT.woodDark, wainscotRailMat: MAT.mahogany, wainscotStileMat: MAT.mahogany,
    windows: [
      { wall: 'S', pos: -4, w: 1.7, h: 1.9, y: 2.6, curtains: true },
      { wall: 'S', pos: 4, w: 1.7, h: 1.9, y: 2.6, curtains: true }
    ],
    coffered: true, beamMat: MAT.mahogany,
    columns: [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]],
    colColor: 0xb8a888, colCapColor: 0x4a3a18,
    corniceColor: 0x5a4a22,
    baseMat: MAT.mahogany, baseColor: 0x2a1a08,
    baseH: 0.22,
    dustColor: 0x80d0a0,
    ambientColor: 0x204030,
    ambientIntensity: 0.35
  });
  const h = size/2;
  Room.addDoor('E', 3.0, 1.2);
  const doorPos = Room.anchor('E', 3.0, 0.06, 0);
  const d = makeDoor(1.1, 2.4); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  const rug = makeRug(3.5, 5, ['#4a1818', 'rgba(224,180,70,0.9)']);
  rug.position.set(0, 0.006, 0); scene.add(rug);
  [-4, 0, 4].forEach(off => _wallPlace(scene, 'N', off, 0.3, () => makeBookshelf(3.4, 3.6)));
  [-2.5, 2.5].forEach(off => {
    ['W', 'E'].forEach(wall => _wallPlace(scene, wall, off, 0.3, () => makeBookshelf(3.0, 3.6)));
  });
  // barra y escalera de biblioteca sobre la pared norte
  const rail = cyl(scene, 0.018, 0.018, size - 3, MAT.brass, 0, 2.7, -h + 0.55, 12); rail.rotation.z = Math.PI / 2;
  const lad = makeLibraryLadder(2.8);
  lad.group.position.set(-6.2 + 3, 0, -h + 0.75); scene.add(lad.group);
  Room.register(-3.2, -h + 0.75, 0.6, 0.5, 0);
  Room.place(
    (x, z, r) => {
      const dk = makeDesk(); dk.group.position.set(x, 0, z); dk.group.rotation.y = r; scene.add(dk.group);
      const lamp = makeTableLamp();
      lamp.group.position.set(x - 0.6, 0.806, z - 0.3); scene.add(lamp.group);
      const lamp2 = makeTableLamp();
      lamp2.group.position.set(x + 0.6, 0.806, z + 0.3); scene.add(lamp2.group);
    },
    { w: 2.3, d: 1.2, try: [[0, 0.5, 0]] }
  );
  reserveCorpse(spot);
  [[0, -1.4, 0], [0, 1.4, Math.PI], [-1.8, 0.5, Math.PI/2], [1.8, 0.5, -Math.PI/2]].forEach(([dx, dz, r]) => {
    const cx = dx, cz = 0.5 + dz;
    _put(scene, makeChair, cx, cz, r, 0.05);
  });
  [[-4, -h + 0.9], [4, -h + 0.9]].forEach(([x, z]) => _put(scene, makeGlobeStand, x, z, 0, 0.05));
  // rincón de lectura
  _put(scene, makeArmchair, -4.0, 3.6, Math.PI * 0.2, 0.05);
  _put(scene, makeSideTable, -5.1, 4.6, 0, 0.05);
  _put(scene, makeFloorLamp, -5.3, 2.6, 0, 0.05);
  _put(scene, makeArmchair, 3.4, 3.2, -Math.PI * 0.2, 0.05);
  const pa = Room.anchor('S', 0, 0.05, 2.8);
  const bigP = makePainting(2.2, 1.6, 3);
  bigP.position.set(pa.x, pa.y, pa.z); bigP.rotation.y = pa.rot; scene.add(bigP);
  const ch = makeChandelier();
  ch.position.set(0, H - 0.3, 0); scene.add(ch);
  const lampA = makeCeilingLamp(1.3, 0xffc060);
  lampA.position.set(-4, H - 0.1, -4); scene.add(lampA);
  const lampB = makeCeilingLamp(1.3, 0xffc060);
  lampB.position.set(4, H - 0.1, 4); scene.add(lampB);
  return {
    ..._corpseRet(spot),
    spawn: { x: 4, z: 5.5 },
    objectSlots: [
      { x: -4, y: 2.25, z: -h + 0.6 }, { x: -4, y: 1.5, z: -h + 0.6 },
      { x: 0, y: 2.25, z: -h + 0.6 }, { x: 0, y: 1.5, z: -h + 0.6 },
      { x: 4, y: 2.25, z: -h + 0.6 }, { x: -0.8, y: 0.81, z: 0.2 },
      { x: 0.4, y: 0.81, z: 0.8 }, { x: 0.9, y: 0.81, z: 0.2 }
    ]
  };
}

function layoutExterior(scene, ov){
  const SIZE = ov.size || 26;
  const SPOTS = [
    { x: -0.9, z: -0.2, rot: Math.PI * 0.1, pose: 'curled' },
    { x: -1.4, z: 2.8,  rot: Math.PI / 2,   pose: 'crawl' },
    { x: -6.2, z: -2.2, rot: Math.PI / 2,   pose: 'seated' },
    { x: 5.4,  z: -3.6, rot: 0.5,           pose: 'supine2' },
    { x: -3.0, z: 7.6,  rot: 0.15,          pose: 'supine' }
  ];
  const spot = pickCorpseSpot(ov, SPOTS);
  const half = SIZE/2;
  World.roomHalf = half;
  World.roomHeight = 14;
  Room.init(SIZE, 14);
  World.bounds = { minX: -half + 0.4, maxX: half - 0.4, minZ: -half + 0.4, maxZ: half - 0.4 };
  const gt = TEX.grass(); gt.repeat.set(13, 13);
  const gb = makeBump(gt.image, 1.5); gb.repeat.set(13, 13);
  const groundMat = new THREE.MeshStandardMaterial({ map: gt, roughness: 1, bumpMap: gb, bumpScale: 0.3 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), groundMat);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  // camino de grava circular alrededor del estanque
  const gv = _gravelTex(); gv.repeat.set(5, 5);
  const path = new THREE.Mesh(new THREE.RingGeometry(2.6, 4.0, 64), new THREE.MeshStandardMaterial({ map: gv, roughness: 1 }));
  path.rotation.x = -Math.PI/2; path.position.set(2, 0.012, 2); path.receiveShadow = true; scene.add(path);
  const path2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 12), new THREE.MeshStandardMaterial({ map: gv, roughness: 1 }));
  path2.rotation.x = -Math.PI/2; path2.position.set(-3, 0.012, 8); path2.receiveShadow = true; scene.add(path2);
  // cielo con degradado
  const skyC = mkCanvas(8, 256), sx = skyC.getContext('2d');
  const sg = sx.createLinearGradient(0, 0, 0, 256);
  sg.addColorStop(0, '#03040f'); sg.addColorStop(0.5, '#0a1030'); sg.addColorStop(0.85, '#1c2048'); sg.addColorStop(1, '#2c2848');
  sx.fillStyle = sg; sx.fillRect(0, 0, 8, 256);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(skyC), side: THREE.BackSide, fog: false }));
  scene.add(sky);
  for (let i = 0; i < 300; i++){
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.05 + Math.random()*0.1, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 + Math.random()*0.6, fog: false }));
    const theta = Math.random()*Math.PI*2, phi = Math.random()*Math.PI*0.4, r = 80;
    star.position.set(Math.cos(theta)*Math.sin(phi + Math.PI/3)*r, Math.cos(phi)*r, Math.sin(theta)*Math.sin(phi + Math.PI/3)*r);
    star.lookAt(0, 0, 0); scene.add(star);
  }
  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.8, 40),
    new THREE.MeshBasicMaterial({ color: 0xf4eedc, fog: false }));
  moon.position.set(-28, 32, -42); moon.lookAt(0, 1, 0); scene.add(moon);
  const haloC = mkCanvas(128), hx = haloC.getContext('2d');
  const hg = hx.createRadialGradient(64, 64, 4, 64, 64, 64);
  hg.addColorStop(0, 'rgba(220,230,255,0.5)'); hg.addColorStop(1, 'rgba(220,230,255,0)');
  hx.fillStyle = hg; hx.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(haloC), fog: false, transparent: true, depthWrite: false }));
  halo.scale.set(26, 26, 1); halo.position.set(-27.5, 31.5, -41); scene.add(halo);
  const pond = makePond();
  pond.group.position.set(2, 0, 2); scene.add(pond.group);
  Room.register(2, 2, pond.w, pond.d, 0, { circle: true, r: pond.cr });
  [[-10,-10,1.4],[9,-11,1.2],[-11,8,1.1],[10,9,1.3],[0,-12,1.1],[-6,11,1.2],[12,-4,1.1],[-12,1,1.2]].forEach(([x,z,s]) => {
    const t = makeTree(s);
    if (Room.fits(x, z, t.w, t.d, 0, 0)){
      t.group.position.set(x, 0, z); scene.add(t.group); Room.register(x, z, t.w, t.d, 0, { circle: true, r: t.cr });
    }
  });
  Room.place(
    (x, z, r) => { const b = makeBench(); b.group.position.set(x, 0, z); b.group.rotation.y = r; scene.add(b.group); },
    { w: 1.9, d: 0.7, try: [[2, -1, 0], [-1, 2, Math.PI/2]] }
  );
  reserveCorpse(spot);
  // mesa de piedra donde están los objetos de la zona norte
  _put(scene, makeStoneTable, 3, -3, 0, 0.05);
  [[-7,-2],[7,5],[-3,-9],[9,-7]].forEach(([x,z]) => {
    const lp = makeLampPost();
    lp.group.position.set(x, 0, z); scene.add(lp.group);
    Room.register(x, z, lp.w, lp.d, 0, { circle: true, r: lp.cr });
  });
  // setos y verja perimetral
  const hedge = new THREE.MeshStandardMaterial({ color: 0x1c3c1c, roughness: 0.95, map: gt });
  [[-6, -6, 3, 0.9], [-9, 4, 0.9, 3], [6, 8, 3, 0.9]].forEach(([x, z, w, d]) => {
    if (!Room.fits(x, z, w, d, 0, 0.05)) return;
    rbox(scene, w, 1.0, d, hedge, x, 0.5, z, 0.25); Room.register(x, z, w, d, 0);
  });
  const post = makeFencePost();
  const iron = metalMat(0x15151a, 0.5, 0.8, 0.5);
  const fe = half - 0.3;
  for (let i = -half + 1; i <= half - 1; i += 1.5){
    [[i, -fe], [i, fe], [-fe, i], [fe, i]].forEach(([x, z]) => {
      const p = post.clone(); p.position.set(x, 0, z); scene.add(p);
    });
  }
  [[0, -fe, SIZE - 2, 0.04, 0], [0, fe, SIZE - 2, 0.04, 0], [-fe, 0, 0.04, SIZE - 2, 0], [fe, 0, 0.04, SIZE - 2, 0]].forEach(([x, z, w, d]) => {
    box(scene, w || 0.04, 0.04, d || 0.04, iron, x, 0.3, z); box(scene, w || 0.04, 0.04, d || 0.04, iron, x, 0.95, z);
  });
  // flores junto al camino
  const petal = [0xe8c0d0, 0xf0e0a0, 0xc0a0e0];
  for (let i = 0; i < 70; i++){
    const a = Math.random() * 6.283, r = 4.3 + Math.random() * 1.2;
    const fx = 2 + Math.cos(a) * r, fz = 2 + Math.sin(a) * r;
    if (Math.abs(fx) > half - 1.5 || Math.abs(fz) > half - 1.5) continue;
    const stem = cyl(scene, 0.006, 0.006, 0.22, new THREE.MeshStandardMaterial({ color: 0x2a5a22 }), fx, 0.11, fz, 5); stem.castShadow = false;
    sph(scene, 0.03, new THREE.MeshStandardMaterial({ color: petal[i % 3], roughness: 0.7 }), fx, 0.24, fz).castShadow = false;
  }
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
    ..._corpseRet(spot),
    spawn: { x: -3, z: 5 },
    objectSlots: [
      { x: 3.00, y: 0.61, z: -3.00 }, { x: 2.30, y: 0.61, z: -3.00 },
      { x: 3.70, y: 0.61, z: -3.00 }, { x: 0.00, y: 0.05, z: 0.00 },
      { x: 1.20, y: 0.05, z: 0.80 }, { x: -0.80, y: 0.05, z: 1.50 },
      { x: 2.20, y: 0.05, z: 2.30 }, { x: -1.80, y: 0.05, z: -2.40 }
    ]
  };
}

function layoutTeatro(scene, ov){
  const SIZE = ov.size || 16, H = ov.height || 6;
  const SPOTS = [
    { x: 0.0,  z: -6.0, rot: Math.PI,       pose: 'supine',  y: 0.44 },
    { x: 0.3,  z: -5.3, rot: 0,             pose: 'crawl',   y: 0.44 },
    { x: -5.0, z: -6.0, rot: Math.PI,       pose: 'kneel',   y: 0.44 },
    { x: -6.6, z: -6.2, rot: Math.PI / 2,   pose: 'seated',  y: 0.44 },
    { x: 0.2,  z: 0.8,  rot: 0.1,           pose: 'side' },
    { x: -4.2, z: 5.2,  rot: 0.3,           pose: 'supine2' }
  ];
  const spot = pickCorpseSpot(ov, SPOTS);
  Room.init(SIZE, H);
  const half = SIZE/2;
  World.roomHalf = half; World.roomHeight = H;
  World.bounds = { minX: -half + 0.15, maxX: half - 0.15, minZ: -half + 0.15, maxZ: half - 0.15 };
  const wt = TEX.parquetDark(); wt.repeat.set(4, 4);
  const wb = makeBump(wt.image, 2); wb.repeat.set(4, 4);
  const floorMat = ENV.reg(new THREE.MeshStandardMaterial({ map: wt, roughness: 0.4, bumpMap: wb, bumpScale: 0.05 }), 0.35);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
  const ceilTex = TEX.ceiling(); ceilTex.repeat.set(5, 5);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshStandardMaterial({ map: ceilTex, color: 0x3a1a1a, roughness: 1 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; scene.add(ceil);
  // muros bajo las cortinas
  const wallTex = TEX.wallpaper('#2a0a10', 'rgba(0,0,0,0.2)', { damask: true, damaskColor: '#100004' }); wallTex.repeat.set(SIZE / 2.5, H / 2.5);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 });
  [[0, H/2, -half, 0], [0, H/2, half, Math.PI], [-half, H/2, 0, Math.PI/2], [half, H/2, 0, -Math.PI/2]].forEach(([x, y, z, ry]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, H), wallMat);
    m.position.set(x, y, z); m.rotation.y = ry; scene.add(m);
  });
  // escenario con proscenio y tablas
  const stage = new THREE.Group();
  rbox(stage, SIZE - 1.5, 0.4, 3.5, MAT.mahogany, 0, 0.2, -half + 2, 0.015);
  const boards = new THREE.MeshStandardMaterial({ map: wt, color: 0xb89878, roughness: 0.5 });
  box(stage, SIZE - 1.5, 0.04, 3.5, boards, 0, 0.42, -half + 2);
  // moldura frontal con luces de candilejas
  rbox(stage, SIZE - 1.4, 0.08, 0.12, MAT.brass, 0, 0.44, -half + 3.72, 0.015);
  for (let i = 0; i < 16; i++){
    const bx = -SIZE / 2 + 1.2 + i * ((SIZE - 2.4) / 15);
    sph(stage, 0.05, new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffd070, emissiveIntensity: 2.2 }), bx, 0.5, -half + 3.62).castShadow = false;
  }
  scene.add(stage);
  World.floors.push({ minX: -(SIZE - 1.5) / 2, maxX: (SIZE - 1.5) / 2, minZ: -half + 0.25, maxZ: -half + 3.75, h: 0.44 });
  box(stage, 1.5, 0.2, 0.7, MAT.wood, -3, 0.1, -half + 3.8);
  box(stage, 1.5, 0.2, 0.7, MAT.wood, 3, 0.1, -half + 3.8);
  // cortinaje de terciopelo con plisado
  const curtMat = new THREE.MeshStandardMaterial({ map: TEX.curtain(), roughness: 0.85, side: THREE.DoubleSide });
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
  // bambalinas con festón y flecos dorados
  for (let i = 0; i < 5; i++){
    const z = -half + 1.5 + i * 2.5;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(SIZE - 1, 0.8), curtMat);
    b.position.set(0, H - 0.8, z); scene.add(b);
    box(scene, SIZE - 1, 0.04, 0.05, MAT.gold, 0, H - 1.22, z);
    for (let k = 0; k < 40; k++) cyl(scene, 0.006, 0.006, 0.1, MAT.gold, -SIZE / 2 + 0.5 + k * ((SIZE - 1) / 39), H - 1.28, z, 4).castShadow = false;
  }
  // arco de proscenio dorado
  rbox(scene, SIZE - 1, 0.35, 0.3, MAT.gold, 0, H - 1.4, -half + 3.85, 0.04);
  [-1, 1].forEach(s => rbox(scene, 0.35, H - 1.4, 0.3, MAT.gold, s * (SIZE / 2 - 1), (H - 1.4) / 2, -half + 3.85, 0.04));
  [-3, 3].forEach(off => {
    const vm = makeVanityMirror();
    const a = Room.anchor('S', off, 0.1, 0);
    vm.group.position.set(a.x, 0, a.z); vm.group.rotation.y = a.rot; scene.add(vm.group);
  });
  [[-4, -half + 2], [4, -half + 2], [0, -half + 1]].forEach(([x, z], i) => {
    const spot = new THREE.SpotLight(i === 2 ? 0xffd080 : 0xffaa66, 3, 12, Math.PI/4, 0.6, 1.5);
    spot.position.set(x, H - 0.5, z);
    spot.target.position.set(x, 0, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.002;
    scene.add(spot); scene.add(spot.target);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2, H - 1, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffeecc, transparent: true, opacity: 0.05, side: THREE.DoubleSide, depthWrite: false }));
    cone.position.set(x, H/2 - 0.25, (z + 0)/2); cone.rotation.x = Math.PI/2;
    scene.add(cone);
    // foco metálico
    const can = cyl(scene, 0.12, 0.18, 0.3, MAT.black, x, H - 0.4, z, 14); can.rotation.x = 0.4;
  });
  const ch = makeChandelier();
  ch.position.set(0, H - 0.4, 2); scene.add(ch);
  scene.add(new THREE.AmbientLight(0x301818, 0.5));
  [[-half + 2, 1, 0.3, 0], [-half + 2, 2, -0.2, 0], [half - 2, 4, 0.6, 0], [half - 2, 4, 0.6, 0.85]].forEach(([x, z, r, sy]) => {
    const c = makeCrate(sy);
    if (sy > 0 || Room.fits(x, z, c.w, c.d, r, 0.05)){
      c.group.position.set(x, 0, z); c.group.rotation.y = r; scene.add(c.group);
      if (sy === 0) Room.register(x, z, c.w, c.d, r);
    }
  });
  Room.place(
    (x, z, r) => { const m = makeCabinet(); m.group.position.set(x, 0, z); m.group.rotation.y = r; scene.add(m.group); },
    { w: 1.1, d: 0.6, try: [[half - 1.5, -half + 2.5, -Math.PI/2]] }
  );
  reserveCorpse(spot);
  const p = makePlant();
  p.group.position.set(-half + 1.5, 0, half - 1.5); scene.add(p.group);
  Room.register(-half + 1.5, half - 1.5, 0.6, 0.6, 0, { circle: true, r: p.cr });
  // patio de butacas (dos bloques con pasillo central)
  [-1, 1].forEach(side => {
    for (let row = 0; row < 3; row++) for (let c = 0; c < 4; c++){
      const sx = side * (1.5 + c * 0.62), sz = -0.4 + row * 0.95;
      const seat = makeTheaterSeat();
      seat.group.position.set(sx, 0, sz); seat.group.rotation.y = Math.PI; scene.add(seat.group);
    }
    Room.register(side * 2.43, 0.55, 2.42, 2.46, 0);
  });
  return {
    ..._corpseRet(spot),
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

function buildInterrogationRoom(scene, suspect){
  const SIZE = 8, H = 3;
  Room.init(SIZE, H);
  const half = SIZE/2;
  World.roomHalf = half; World.roomHeight = H;
  World.bounds = { minX: -half + 0.45, maxX: half - 0.45, minZ: -half + 0.45, maxZ: half - 0.45 };
  const floorTex = TEX.stone(); floorTex.repeat.set(2, 2);
  const fb = makeBump(floorTex.image, 2); fb.repeat.set(2, 2);
  const floorMat = ENV.reg(new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, color: 0x909098, bumpMap: fb, bumpScale: 0.1 }), 0.3);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshStandardMaterial({ color: 0x3a3a42, roughness: 1 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; scene.add(ceil);
  const wallTex = TEX.stone(); wallTex.repeat.set(2, 1.5);
  const wbump = makeBump(wallTex.image, 2); wbump.repeat.set(2, 1.5);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, color: 0x9a9aa4, bumpMap: wbump, bumpScale: 0.12 });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  [[0, H/2, -half, 0], [0, H/2, half, Math.PI], [-half, H/2, 0, Math.PI/2], [half, H/2, 0, -Math.PI/2]].forEach(([x, y, z, ry]) => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m);
  });
  // franja de pintura industrial en la parte baja y zócalo
  const band = new THREE.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.6 });
  _perimeter(scene, half, SIZE, 0.6, 1.2, 0.02, band);
  _perimeter(scene, half, SIZE, 1.22, 0.04, 0.03, MAT.steelDark);
  _perimeter(scene, half, SIZE, 0.07, 0.14, 0.04, MAT.black);
  // espejo unidireccional con marco de acero
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), MAT.mirror);
  mirror.position.set(0, 1.8, -half + 0.045); scene.add(mirror);
  const frameMat = MAT.steelDark;
  rbox(scene, 2.6, 0.1, 0.08, frameMat, 0, 1.8 + 0.8, -half + 0.05, 0.01);
  rbox(scene, 2.6, 0.1, 0.08, frameMat, 0, 1.8 - 0.8, -half + 0.05, 0.01);
  rbox(scene, 0.1, 1.7, 0.08, frameMat, -1.3, 1.8, -half + 0.05, 0.01);
  rbox(scene, 0.1, 1.7, 0.08, frameMat, 1.3, 1.8, -half + 0.05, 0.01);
  // tabla de estaturas junto al espejo
  const hc = mkCanvas(128, 512), hx = hc.getContext('2d');
  hx.fillStyle = '#d8d8cc'; hx.fillRect(0, 0, 128, 512);
  hx.strokeStyle = '#222'; hx.fillStyle = '#222'; hx.font = '16px monospace'; hx.lineWidth = 2;
  for (let i = 0; i <= 10; i++){ const y = 20 + i * 46; hx.beginPath(); hx.moveTo(10, y); hx.lineTo(i % 2 ? 60 : 90, y); hx.stroke(); if (!(i % 2)) hx.fillText(String(200 - i * 10), 94, y + 5); }
  const chart = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 2.0), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(hc), roughness: 0.8 }));
  chart.position.set(2.8, 1.2, -half + 0.03); scene.add(chart);
  // puerta metálica y rejilla de ventilación
  const doorM = metalMat(0x4a5058, 0.5, 0.7, 0.6);
  rbox(scene, 1.0, 2.1, 0.08, doorM, -half + 1.2, 1.05, half - 0.05, 0.01);
  rbox(scene, 0.7, 0.4, 0.04, MAT.black, -half + 1.2, 1.5, half - 0.1, 0.01);
  box(scene, 0.12, 0.06, 0.06, MAT.steel, -half + 1.55, 1.0, half - 0.12);
  const vent = rbox(scene, 0.6, 0.35, 0.04, MAT.steelDark, 2.5, 2.5, half - 0.03, 0.01);
  for (let i = 0; i < 6; i++) box(scene, 0.54, 0.012, 0.02, MAT.black, 2.5, 2.38 + i * 0.045, half - 0.06);
  // mesa de acero con tablero biselado y patas con travesaño
  const metal = MAT.steelDark;
  rbox(scene, 1.5, 0.05, 0.9, MAT.steel, 0, 0.75, 0, 0.012);
  rbox(scene, 1.46, 0.05, 0.86, MAT.black, 0, 0.71, 0, 0.01);
  [[-0.65,-0.35],[0.65,-0.35],[-0.65,0.35],[0.65,0.35]].forEach(([px, pz]) => {
    rbox(scene, 0.05, 0.72, 0.05, metal, px, 0.36, pz, 0.01);
  });
  box(scene, 1.3, 0.03, 0.03, metal, 0, 0.2, 0.35); box(scene, 1.3, 0.03, 0.03, metal, 0, 0.2, -0.35);
  // argolla de esposas en la mesa
  torus(scene, 0.05, 0.007, MAT.steel, 0.5, 0.79, 0.1, Math.PI / 2, 0, 0);
  Room.register(0, 0, 1.6, 1.0, 0);
  [1, -1].forEach(side => {
    const cg = new THREE.Group();
    rbox(cg, 0.44, 0.05, 0.44, metal, 0, 0.46, 0, 0.01);
    rbox(cg, 0.44, 0.5, 0.05, metal, 0, 0.72, -0.2, 0.01);
    [[-0.19,0.19],[0.19,0.19],[-0.19,-0.19],[0.19,-0.19]].forEach(([px, pz]) => {
      rbox(cg, 0.04, 0.44, 0.04, metal, px, 0.23, pz, 0.008);
    });
    box(cg, 0.36, 0.03, 0.03, metal, 0, 0.12, 0.19);
    cg.position.set(0, 0, side * 0.95); if (side === 1) cg.rotation.y = Math.PI; else cg.rotation.y = 0;
    scene.add(cg);
    Room.register(0, side * 0.95, 0.5, 0.5, 0);
  });
  // lámpara cenital con jaula y cable
  const lampG = new THREE.Group();
  cyl(lampG, 0.012, 0.012, 0.8, MAT.black, 0, 2.6, 0, 8);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.26, 28, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x2a2e32, roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }));
  shade.rotation.x = Math.PI; shade.position.y = 1.78; lampG.add(shade);
  torus(lampG, 0.28, 0.01, MAT.steelDark, 0, 1.65, 0, Math.PI / 2, 0, 0);
  sph(lampG, 0.09, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xfff0c0, emissiveIntensity: 3 }), 0, 1.72, 0);
  const spot = new THREE.SpotLight(0xfff0c0, 3, 8, Math.PI/3.5, 0.6, 1.5);
  spot.position.set(0, 1.7, 0);
  spot.target.position.set(0, 0.75, 0);
  spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.002;
  lampG.add(spot); lampG.add(spot.target);
  scene.add(lampG);
  // cámara de seguridad en la esquina
  const cam = new THREE.Group();
  rbox(cam, 0.12, 0.12, 0.3, MAT.black, 0, 0, 0, 0.02);
  cyl(cam, 0.045, 0.045, 0.02, MAT.glass, 0, 0, 0.16, 14).rotation.x = Math.PI / 2;
  sph(cam, 0.012, new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xff2020, emissiveIntensity: 3 }), 0.04, 0.07, 0.1);
  cam.position.set(half - 0.4, H - 0.3, -half + 0.4); cam.rotation.set(0.4, Math.PI * 0.75, 0); scene.add(cam);
  const amb = new THREE.PointLight(0x8090b0, 0.5, 12, 1.5);
  amb.position.set(0, 2.5, 0); scene.add(amb);
  scene.add(new THREE.AmbientLight(0x303040, 0.4));
  const suspectG = buildSuspectModel(suspect);
  suspectG.position.set(0, 0, -0.85); scene.add(suspectG);
  return { spawn: { x: 0, z: 2.6 } };
}
