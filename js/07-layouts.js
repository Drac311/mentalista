/* ====================================================================
   07-LAYOUTS — Cada escena con su identidad propia + interrogatorio
   ==================================================================== */

function layoutDespacho(scene, ov){
  const size = ov.size || 12, H = ov.height || 3.2;
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.parquet,
    wallTex: () => TEX.wallpaper('#2a1d10', 'rgba(0,0,0,0.18)', { damask: true, damaskColor: '#1a0e04' }),
    wallTint: 0x9a8060,
    wainscot: true, wainscotH: 1.1,
    wainscotMat: new THREE.MeshStandardMaterial({ color: 0x4a2410, roughness: 0.7 }),
    wainscotRailMat: new THREE.MeshStandardMaterial({ color: 0x5a2c14, roughness: 0.6 }),
    beams: ov.beams != null ? ov.beams : 5,
    beamColor: 0x1a0a04,
    corniceColor: 0x1a0804,
    baseColor: 0x1a0a04,
    dustColor: 0xffb060,
    ambientColor: 0x3a2a20,
    ambientIntensity: 0.5
  });
  const h = size/2;
  Room.addDoor('E', 2.8, 1.1);
  Room.addWindow('W', -1.2, 2.6, 1.8);
  const doorPos = Room.anchor('E', 2.8, 0.1, 0);
  const d = makeDoor(1.0, 2.2); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  const winPos = Room.anchor('W', -1.2, 0.1, 1.9);
  const w = makeWindow(2.6, 1.8); w.position.set(winPos.x, winPos.y, winPos.z); w.rotation.y = winPos.rot; scene.add(w);
  const rug = makeRug(4.5, 3.5, ['#4a1010', 'rgba(212,160,23,0.5)']);
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
      lamp.group.position.set(x - 0.7*Math.cos(r), 0.79, z - 0.7*Math.sin(r));
      scene.add(lamp.group);
      const cx = x + Math.sin(r) * 1.2, cz = z - Math.cos(r) * 1.2;
      if (Room.fits(cx, cz, 0.6, 0.6, r, 0.1)){
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
    const a = Room.anchor(wall, off, 0.25, 0);
    const bs = makeBookshelf(2.2, 2.8);
    if (Room.fits(a.x, a.z, bs.w, bs.d, a.rot, 0.1)){
      bs.group.position.set(a.x, 0, a.z); bs.group.rotation.y = a.rot;
      scene.add(bs.group); Room.register(a.x, a.z, bs.w, bs.d, a.rot);
    }
  });
  [1.5, -0.3].forEach((off, i) => {
    const s = i === 0 ? [1.6, 1.2, 0] : [0.9, 0.9, 1];
    const a = Room.anchor('N', off, 0.1, 2.0);
    const p = makePainting(s[0], s[1], s[2]);
    p.position.set(a.x, a.y, a.z); p.rotation.y = a.rot; scene.add(p);
  });
  const rp = OBJ.relojPared();
  const rpA = Room.anchor('N', 3.5, 0.1, 2.2);
  rp.position.set(rpA.x, rpA.y, rpA.z); rp.rotation.y = rpA.rot; scene.add(rp);
  [[-h + 0.9, -h + 0.9], [h - 0.9, h - 0.9]].forEach(([x, z]) => {
    const p = makePlant();
    if (Room.fits(x, z, p.w, p.d, 0, 0.05)){
      p.group.position.set(x, 0, z); scene.add(p.group); Room.register(x, z, p.w, p.d, 0);
    }
  });
  const lamp1 = makeCeilingLamp(1.6, 0x90b070);
  lamp1.position.set(-1, H, 1.2); scene.add(lamp1);
  const lamp2 = makeCeilingLamp(1.2, 0xa07040);
  lamp2.position.set(3, H, -1); scene.add(lamp2);
  return {
    corpsePos: { x: 0.5, z: 2.5, rot: Math.PI * 0.3 },
    pose: 'supine',
    spawn: { x: 4, z: -h + 1.5 },
    objectSlots: [
      { x: -3.5, y: 0.80, z: -h + 1.2 }, { x: -2.9, y: 0.80, z: -h + 1.2 },
      { x: -2.2, y: 0.80, z: -h + 1.2 }, { x: -1.5, y: 0.80, z: -h + 1.2 },
      { x: h - 1.5, y: 2.3, z: -2.5 }, { x: h - 1.5, y: 1.7, z: -2.5 },
      { x: h - 1.5, y: 1.1, z: -2.5 }, { x: -2.5, y: 2.4, z: h - 0.8 }
    ]
  };
}

function layoutDormitorio(scene, ov){
  const size = ov.size || 11, H = ov.height || 3.0;
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.parquet,
    wallTex: () => TEX.wallpaper('#3a3050', 'rgba(0,0,0,0.10)', { damask: true, damaskColor: '#1a1428' }),
    wainscot: true, wainscotH: 0.9,
    wainscotMat: new THREE.MeshStandardMaterial({ color: 0x2a2040, roughness: 0.7 }),
    wainscotRailMat: new THREE.MeshStandardMaterial({ color: 0x4a3a5a, roughness: 0.6 }),
    corniceColor: 0x4a3a5a,
    baseColor: 0x3a2a50,
    dustColor: 0xd0a0ff,
    ambientColor: 0x404060,
    ambientIntensity: 0.5
  });
  const h = size/2;
  Room.addDoor('W', 2.6, 1.0);
  Room.addWindow('E', -1.8, 2.2, 1.6);
  const doorPos = Room.anchor('W', 2.6, 0.1, 0);
  const d = makeDoor(1.0, 2.2); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  const winPos = Room.anchor('E', -1.8, 0.1, 1.9);
  const w = makeWindow(2.2, 1.6); w.position.set(winPos.x, winPos.y, winPos.z); w.rotation.y = winPos.rot; scene.add(w);
  const curtMat = new THREE.MeshStandardMaterial({ map: TEX.curtain(), roughness: 0.85, side: THREE.DoubleSide });
  const curt = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 2.2), curtMat);
  curt.position.set(h - 0.2, 1.9, -1.8); curt.rotation.y = -Math.PI/2; scene.add(curt);
  const rug = makeRug(4, 3, ['#2a1a3a', 'rgba(180,140,220,0.4)']);
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
        const v = OBJ.vela(); v.position.set(nx, 0.65, nz); scene.add(v);
        const v2 = OBJ.vela(); v2.position.set(nx + 0.15, 0.65, nz + 0.1); scene.add(v2);
      }
    });
  }
  Room.place(
    (x, z, r) => { const m = makeWardrobe(); m.group.position.set(x, 0, z); m.group.rotation.y = r; scene.add(m.group); },
    { w: 1.8, d: 0.9, try: [[h - 0.6, -h + 1.8, -Math.PI/2], [h - 0.6, h - 1.8, -Math.PI/2]] }
  );
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
  const ptA = Room.anchor('S', 1.5, 0.1, 2.0);
  pt.position.set(ptA.x, ptA.y, ptA.z); pt.rotation.y = ptA.rot; scene.add(pt);
  const p2 = makePlant();
  p2.group.position.set(h - 0.9, 0, h - 0.9); scene.add(p2.group);
  Room.register(h - 0.9, h - 0.9, 0.6, 0.6, 0);
  const ch = makeChandelier();
  ch.position.set(0, H - 0.2, 0); scene.add(ch);
  const warmth = new THREE.PointLight(0xffa0c0, 0.6, 8, 1.8);
  warmth.position.set(0, 2, 0); scene.add(warmth);
  return {
    corpsePos: { x: 1.5, z: 1.2, rot: Math.PI * 0.3 },
    pose: 'side',
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
  Room.init(size, H);
  buildRoomBase(scene, {
    size, height: H,
    floorTex: TEX.marbleDark,
    wallTex: () => TEX.wallpaper('#1a2a20', 'rgba(0,0,0,0.20)', { damask: true, damaskColor: '#0a1810' }),
    wallTint: 0x709080,
    wainscot: true, wainscotH: 1.3,
    wainscotMat: new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.6 }),
    wainscotRailMat: new THREE.MeshStandardMaterial({ color: 0x4a3a18, roughness: 0.5, metalness: 0.2 }),
    coffered: true,
    columns: [[-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]],
    colColor: 0x8a7a58, colCapColor: 0x4a3a18,
    corniceColor: 0x4a3a18,
    baseColor: 0x2a1a08,
    baseH: 0.22,
    dustColor: 0x80d0a0,
    ambientColor: 0x204030,
    ambientIntensity: 0.35
  });
  const h = size/2;
  Room.addDoor('E', 3.0, 1.2);
  Room.addWindow('W', -3.0, 2.2, 2.0);
  Room.addWindow('W', 3.0, 2.2, 2.0);
  const doorPos = Room.anchor('E', 3.0, 0.1, 0);
  const d = makeDoor(1.1, 2.4); d.position.set(doorPos.x, 0, doorPos.z); d.rotation.y = doorPos.rot; scene.add(d);
  [-3, 3].forEach(off => {
    const a = Room.anchor('W', off, 0.1, 2.1);
    const w = makeWindow(2.2, 2.0);
    w.position.set(a.x, a.y, a.z); w.rotation.y = a.rot; scene.add(w);
  });
  const rug = makeRug(3.5, 5, ['#2a1010', 'rgba(200,160,60,0.6)']);
  rug.position.set(0, 0.006, 0); scene.add(rug);
  [-4, 0, 4].forEach(off => {
    const a = Room.anchor('N', off, 0.3, 0);
    const bs = makeBookshelf(3.4, 3.6);
    if (Room.fits(a.x, a.z, bs.w, bs.d, a.rot, 0.1)){
      bs.group.position.set(a.x, 0, a.z); bs.group.rotation.y = a.rot;
      scene.add(bs.group); Room.register(a.x, a.z, bs.w, bs.d, a.rot);
    }
  });
  [-2.5, 2.5].forEach(off => {
    ['W', 'E'].forEach(wall => {
      const a = Room.anchor(wall, off, 0.3, 0);
      const bs = makeBookshelf(3.0, 3.6);
      if (Room.fits(a.x, a.z, bs.w, bs.d, a.rot, 0.1)){
        bs.group.position.set(a.x, 0, a.z); bs.group.rotation.y = a.rot;
        scene.add(bs.group); Room.register(a.x, a.z, bs.w, bs.d, a.rot);
      }
    });
  });
  Room.place(
    (x, z, r) => {
      const dk = makeDesk(); dk.group.position.set(x, 0, z); dk.group.rotation.y = r; scene.add(dk.group);
      const lamp = makeTableLamp();
      lamp.group.position.set(x - 0.6, 0.79, z - 0.3); scene.add(lamp.group);
      const lamp2 = makeTableLamp();
      lamp2.group.position.set(x + 0.6, 0.79, z + 0.3); scene.add(lamp2.group);
    },
    { w: 2.3, d: 1.2, try: [[0, 0.5, 0]] }
  );
  [[0, -1.4, Math.PI], [0, 1.4, 0], [-1.8, 0.5, Math.PI/2], [1.8, 0.5, -Math.PI/2]].forEach(([dx, dz, r]) => {
    const cx = dx, cz = 0.5 + dz;
    if (Room.fits(cx, cz, 0.6, 0.6, r, 0.05)){
      const ch = makeChair();
      ch.group.position.set(cx, 0, cz); ch.group.rotation.y = r;
      scene.add(ch.group); Room.register(cx, cz, 0.6, 0.6, r);
    }
  });
  [[-4, -h + 0.9], [4, -h + 0.9]].forEach(([x, z]) => {
    const gs = makeGlobeStand();
    if (Room.fits(x, z, gs.w, gs.d, 0, 0.05)){
      gs.group.position.set(x, 0, z); scene.add(gs.group); Room.register(x, z, gs.w, gs.d, 0);
    }
  });
  [-4, 0, 4].forEach((off, i) => {
    const s = i === 1 ? [2.2, 1.6, 3] : [1.4, 1.0, i];
    const a = Room.anchor('S', off, 0.1, i === 1 ? 2.8 : 2.5);
    const p = makePainting(s[0], s[1], s[2]);
    p.position.set(a.x, a.y, a.z); p.rotation.y = a.rot; scene.add(p);
  });
  const ch = makeChandelier();
  ch.position.set(0, H - 0.3, 0); scene.add(ch);
  const lampA = makeCeilingLamp(1.3, 0xffc060);
  lampA.position.set(-4, H - 0.1, -4); scene.add(lampA);
  const lampB = makeCeilingLamp(1.3, 0xffc060);
  lampB.position.set(4, H - 0.1, 4); scene.add(lampB);
  return {
    corpsePos: { x: 0.8, z: 2.5, rot: Math.PI * 0.5 },
    pose: 'prone',
    spawn: { x: 4, z: 5.5 },
    objectSlots: [
      { x: -4, y: 2.4, z: -h + 0.6 }, { x: -4, y: 1.7, z: -h + 0.6 },
      { x: 0, y: 2.4, z: -h + 0.6 }, { x: 0, y: 1.7, z: -h + 0.6 },
      { x: 4, y: 2.4, z: -h + 0.6 }, { x: -0.8, y: 0.80, z: 0.2 },
      { x: 0.4, y: 0.80, z: 0.8 }, { x: 0.9, y: 0.80, z: 0.2 }
    ]
  };
}

function layoutExterior(scene, ov){
  const SIZE = ov.size || 26;
  const half = SIZE/2;
  World.roomHalf = half;
  World.roomHeight = 14;
  World.bounds = { minX: -half + 1, maxX: half - 1, minZ: -half + 1, maxZ: half - 1 };
  Room.init(SIZE, 14);
  const gt = TEX.grass(); gt.repeat.set(13, 13);
  const groundMat = new THREE.MeshStandardMaterial({ map: gt, roughness: 1 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), groundMat);
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 16),
    new THREE.MeshBasicMaterial({ color: 0x080818, side: THREE.BackSide, fog: false }));
  scene.add(sky);
  for (let i = 0; i < 240; i++){
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.05 + Math.random()*0.1, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 + Math.random()*0.6, fog: false }));
    const theta = Math.random()*Math.PI*2, phi = Math.random()*Math.PI*0.4, r = 80;
    star.position.set(Math.cos(theta)*Math.sin(phi + Math.PI/3)*r, Math.cos(phi)*r, Math.sin(theta)*Math.sin(phi + Math.PI/3)*r);
    star.lookAt(0, 0, 0); scene.add(star);
  }
  const moon = new THREE.Mesh(new THREE.CircleGeometry(2.8, 32),
    new THREE.MeshBasicMaterial({ color: 0xf0e8d8, fog: false }));
  moon.position.set(-28, 32, -42); moon.lookAt(0, 1, 0); scene.add(moon);
  const pond = makePond();
  pond.group.position.set(2, 0, 2); scene.add(pond.group);
  Room.register(2, 2, pond.w, pond.d, 0);
  [[-10,-10,1.4],[9,-11,1.2],[-11,8,1.1],[10,9,1.3],[0,-12,1.1],[-6,11,1.2],[12,-4,1.1],[-12,1,1.2]].forEach(([x,z,s]) => {
    const t = makeTree(s);
    if (Room.fits(x, z, t.w, t.d, 0, 0)){
      t.group.position.set(x, 0, z); scene.add(t.group); Room.register(x, z, t.w, t.d, 0);
    }
  });
  Room.place(
    (x, z, r) => { const b = makeBench(); b.group.position.set(x, 0, z); b.group.rotation.y = r; scene.add(b.group); },
    { w: 1.9, d: 0.7, try: [[2, -1, 0], [-1, 2, Math.PI/2]] }
  );
  [[-7,-2],[7,5],[-3,-9],[9,-7]].forEach(([x,z]) => {
    const lp = makeLampPost();
    lp.group.position.set(x, 0, z); scene.add(lp.group);
    Room.register(x, z, lp.w, lp.d, 0);
  });
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
    corpsePos: { x: 0, z: 0, rot: Math.PI * 0.1 },
    pose: 'curled',
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
  Room.init(SIZE, H);
  const half = SIZE/2;
  World.roomHalf = half; World.roomHeight = H;
  World.bounds = { minX: -half + 0.6, maxX: half - 0.6, minZ: -half + 0.6, maxZ: half - 0.6 };
  const wt = TEX.parquetDark(); wt.repeat.set(4, 4);
  const floorMat = new THREE.MeshStandardMaterial({ map: wt, roughness: 0.55 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshStandardMaterial({ color: 0x0a0204, roughness: 1 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; scene.add(ceil);
  const stage = new THREE.Group();
  box(stage, SIZE - 1.5, 0.4, 3.5, MAT.mahogany, 0, 0.2, -half + 2);
  box(stage, SIZE - 1.5, 0.04, 3.5, new THREE.MeshStandardMaterial({ color: 0x6a1010, roughness: 0.7 }), 0, 0.42, -half + 2);
  scene.add(stage);
  Room.register(0, -half + 2, SIZE - 1.5, 3.5, 0);
  box(stage, 1.5, 0.2, 0.7, MAT.wood, -3, 0.1, -half + 3.8);
  box(stage, 1.5, 0.2, 0.7, MAT.wood, 3, 0.1, -half + 3.8);
  const curtMat = new THREE.MeshStandardMaterial({ map: TEX.curtain(), roughness: 0.9, side: THREE.DoubleSide });
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
  for (let i = 0; i < 5; i++){
    const z = -half + 1.5 + i * 2.5;
    const b = new THREE.Mesh(new THREE.PlaneGeometry(SIZE - 1, 0.8), curtMat);
    b.position.set(0, H - 0.8, z); scene.add(b);
  }
  [-3, 3].forEach(off => {
    const vm = makeVanityMirror();
    const a = Room.anchor('S', off, 0.1, 0);
    vm.group.position.set(a.x, 0, a.z); vm.group.rotation.y = a.rot; scene.add(vm.group);
  });
  [[-4, -half + 2], [4, -half + 2], [0, -half + 1]].forEach(([x, z], i) => {
    const spot = new THREE.SpotLight(i === 2 ? 0xffd080 : 0xffaa66, 3, 12, Math.PI/4, 0.6, 1.5);
    spot.position.set(x, H - 0.5, z);
    spot.target.position.set(x, 0, 0);
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024);
    scene.add(spot); scene.add(spot.target);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2, H - 1, 16, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffeecc, transparent: true, opacity: 0.06, side: THREE.DoubleSide }));
    cone.position.set(x, H/2 - 0.25, (z + 0)/2); cone.rotation.x = Math.PI/2;
    scene.add(cone);
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
  const p = makePlant();
  p.group.position.set(-half + 1.5, 0, half - 1.5); scene.add(p.group);
  Room.register(-half + 1.5, half - 1.5, 0.6, 0.6, 0);
  return {
    corpsePos: { x: 0, z: -half + 2, rot: Math.PI },
    pose: 'supine',
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
  const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, color: 0x707078 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE), floorMat);
  floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, SIZE),
    new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 1 }));
  ceil.rotation.x = Math.PI/2; ceil.position.y = H; scene.add(ceil);
  const wallTex = TEX.stone(); wallTex.repeat.set(2, 1.5);
  const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, color: 0x808088 });
  const wallGeo = new THREE.PlaneGeometry(SIZE, H);
  [[0, H/2, -half, 0], [0, H/2, half, Math.PI], [-half, H/2, 0, Math.PI/2], [half, H/2, 0, -Math.PI/2]].forEach(([x, y, z, ry]) => {
    const m = new THREE.Mesh(wallGeo, wallMat);
    m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m);
  });
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x1a2a3a, metalness: 0.95, roughness: 0.05, emissive: 0x0a1a2a, emissiveIntensity: 0.4 }));
  mirror.position.set(0, 1.8, -half + 0.03); scene.add(mirror);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x3a3a42, metalness: 0.7, roughness: 0.5 });
  box(scene, 2.6, 0.08, 0.1, frameMat, 0, 1.8 + 0.85, -half + 0.05);
  box(scene, 2.6, 0.08, 0.1, frameMat, 0, 1.8 - 0.85, -half + 0.05);
  box(scene, 0.08, 1.7, 0.1, frameMat, -1.3, 1.8, -half + 0.05);
  box(scene, 0.08, 1.7, 0.1, frameMat, 1.3, 1.8, -half + 0.05);
  const metal = MAT.steelDark;
  box(scene, 1.5, 0.06, 0.9, metal, 0, 0.75, 0);
  box(scene, 1.52, 0.03, 0.92, MAT.black, 0, 0.72, 0);
  [[-0.65,-0.35],[0.65,-0.35],[-0.65,0.35],[0.65,0.35]].forEach(([px, pz]) => {
    cyl(scene, 0.03, 0.03, 0.72, metal, px, 0.36, pz, 12);
  });
  Room.register(0, 0, 1.6, 1.0, 0);
  [1, -1].forEach(side => {
    const cg = new THREE.Group();
    box(cg, 0.44, 0.05, 0.44, metal, 0, 0.46, 0);
    box(cg, 0.44, 0.5, 0.05, metal, 0, 0.72, -0.2);
    [[-0.19,0.19],[0.19,0.19],[-0.19,-0.19],[0.19,-0.19]].forEach(([px, pz]) => {
      box(cg, 0.05, 0.42, 0.05, metal, px, 0.24, pz);
    });
    cg.position.set(0, 0, side * 0.95); scene.add(cg);
    Room.register(0, side * 0.95, 0.5, 0.5, 0);
  });
  const lampG = new THREE.Group();
  cyl(lampG, 0.02, 0.02, 0.6, MAT.black, 0, 2.2, 0, 8);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.28, 24, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.6, side: THREE.DoubleSide }));
  shade.rotation.x = Math.PI; shade.position.y = 1.75; lampG.add(shade);
  sph(lampG, 0.09, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xfff0c0, emissiveIntensity: 3 }), 0, 1.72, 0);
  const spot = new THREE.SpotLight(0xfff0c0, 3, 8, Math.PI/3.5, 0.6, 1.5);
  spot.position.set(0, 1.7, 0);
  spot.target.position.set(0, 0.75, 0);
  spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024);
  lampG.add(spot); lampG.add(spot.target);
  scene.add(lampG);
  const amb = new THREE.PointLight(0x8090b0, 0.5, 12, 1.5);
  amb.position.set(0, 2.5, 0); scene.add(amb);
  scene.add(new THREE.AmbientLight(0x303040, 0.4));
  const suspectG = buildSuspectModel(suspect);
  suspectG.position.set(0, 0, -0.85); scene.add(suspectG);
  return { spawn: { x: 0, z: 2.6 } };
}