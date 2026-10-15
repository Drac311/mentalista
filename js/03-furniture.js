/* ====================================================================
   03-FURNITURE — Todos los muebles reutilizables
   ==================================================================== */

function makeDesk(){
  const g = new THREE.Group();
  box(g, 2.2, 0.06, 1.1, MAT.woodLight, 0, 0.76, 0);
  box(g, 2.16, 0.008, 1.06, new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 1 }), 0, 0.795, 0);
  box(g, 2.2, 0.15, 0.04, MAT.wood, 0, 0.68, 0.5);
  box(g, 0.04, 0.72, 1.0, MAT.wood, -1.08, 0.4, 0);
  box(g, 0.06, 0.76, 0.06, MAT.woodDark, 1.04, 0.38, -0.44);
  box(g, 0.06, 0.76, 0.06, MAT.woodDark, 1.04, 0.38, 0.44);
  box(g, 0.68, 0.72, 1.0, MAT.woodDark, -0.75, 0.38, 0);
  for (let i = 0; i < 3; i++){
    const dg = new THREE.Group();
    box(dg, 0.64, 0.19, 0.92, MAT.wood, 0, 0, 0);
    box(dg, 0.66, 0.2, 0.02, MAT.woodLight, 0, 0, 0.47);
    box(dg, 0.14, 0.03, 0.03, MAT.brass, 0, 0, 0.5);
    dg.position.set(-0.75, 0.62 - i*0.22, 0);
    dg.userData.isDrawer = true;
    dg.userData.drawerState = 0;
    dg.userData.drawerMaxZ = 0.44;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'drawer', data:{ desk:g, index:i } });
  }
  return { group: g, w: 2.3, d: 1.2 };
}
function makeChair(){
  const g = new THREE.Group();
  box(g, 0.52, 0.05, 0.52, MAT.wood, 0, 0.46, 0);
  box(g, 0.46, 0.09, 0.46, MAT.fabricRed, 0, 0.53, 0);
  box(g, 0.52, 0.05, 0.06, MAT.wood, 0, 0.78, -0.24);
  box(g, 0.52, 0.05, 0.06, MAT.wood, 0, 1.02, -0.24);
  box(g, 0.04, 0.32, 0.04, MAT.wood, -0.22, 0.9, -0.24);
  box(g, 0.04, 0.32, 0.04, MAT.wood, 0.22, 0.9, -0.24);
  box(g, 0.44, 0.24, 0.03, MAT.fabricRed, 0, 0.9, -0.22);
  [[-0.22,0.2],[0.22,0.2],[-0.22,-0.2],[0.22,-0.2]].forEach(([x,z]) => {
    box(g, 0.05, 0.46, 0.05, MAT.wood, x, 0.23, z);
  });
  box(g, 0.44, 0.03, 0.03, MAT.wood, 0, 0.15, -0.2);
  box(g, 0.44, 0.03, 0.03, MAT.wood, 0, 0.15, 0.2);
  return { group: g, w: 0.58, d: 0.58 };
}
function makeArmchair(){
  const g = new THREE.Group();
  box(g, 0.95, 0.14, 0.85, MAT.leatherGreen, 0, 0.45, 0);
  box(g, 0.85, 0.08, 0.7, MAT.leatherGreen, 0, 0.53, 0);
  box(g, 0.95, 0.85, 0.14, MAT.leatherGreen, 0, 0.8, -0.35);
  box(g, 0.14, 0.4, 0.85, MAT.leatherGreen, -0.4, 0.65, 0);
  box(g, 0.14, 0.4, 0.85, MAT.leatherGreen, 0.4, 0.65, 0);
  [[-0.4,0.35],[0.4,0.35],[-0.4,-0.35],[0.4,-0.35]].forEach(([px, pz]) => {
    cyl(g, 0.05, 0.06, 0.4, MAT.woodDark, px, 0.2, pz, 12);
  });
  return { group: g, w: 1.0, d: 0.9 };
}
function makeBookshelf(W, H){
  W = W || 2.4; H = H || 2.8;
  const D = 0.42;
  const g = new THREE.Group();
  box(g, 0.12, H, D, MAT.mahogany, -W/2, H/2, 0);
  box(g, 0.12, H, D, MAT.mahogany, W/2, H/2, 0);
  box(g, W + 0.12, 0.12, D, MAT.mahogany, 0, 0.06, 0);
  box(g, W + 0.14, 0.1, D + 0.04, MAT.mahogany, 0, H + 0.02, 0);
  box(g, W, H, 0.03, MAT.mahogany, 0, H/2, -D/2 + 0.02);
  const bookCols = [0x7a2a1a,0x2a4a3a,0x5a5a1a,0x4a1a2a,0x1a3a5a,0x6a4a1a,0x3a1a4a,0x2a5a4a,0x8a3010,0x203050,0x406020,0x802040];
  const bookMats = bookCols.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }));
  const shelfYs = [];
  for (let i = 1; i <= 5; i++){
    const y = i * (H/5);
    if (i < 5) box(g, W - 0.12, 0.06, D - 0.04, MAT.mahogany, 0, y, 0);
    shelfYs.push(y);
  }
  shelfYs.forEach((y, idx) => {
    const shelfY = idx === 0 ? 0.1 : shelfYs[idx-1];
    const sh = y - shelfY;
    let cx = -W/2 + 0.1;
    while (cx < W/2 - 0.15){
      const bw = 0.04 + Math.random()*0.05;
      const bh = sh * (0.7 + Math.random()*0.25);
      const bd = D * (0.7 + Math.random()*0.2);
      const book = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), bookMats[(Math.random()*bookMats.length)|0]);
      book.position.set(cx + bw/2, shelfY + 0.03 + bh/2, 0);
      book.rotation.z = (Math.random()-0.5)*0.05;
      book.castShadow = true; g.add(book);
      cx += bw + 0.005;
      if (Math.random() < 0.05) cx += 0.05;
    }
  });
  return { group: g, w: W + 0.2, d: D + 0.1 };
}
function makeBed(){
  const g = new THREE.Group();
  const mattress = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.95 });
  const sheet = new THREE.MeshStandardMaterial({ color: 0x8a7a9a, roughness: 0.9 });
  const blanket = new THREE.MeshStandardMaterial({ color: 0x2a1a4a, roughness: 0.95 });
  const pillow = new THREE.MeshStandardMaterial({ color: 0xf8f0e0, roughness: 0.9 });
  box(g, 2.1, 0.22, 2.3, MAT.mahogany, 0, 0.21, 0);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([px, pz]) => {
    box(g, 0.14, 0.1, 0.14, MAT.mahogany, px*0.98, 0.05, pz*1.08);
  });
  box(g, 2.1, 1.4, 0.14, MAT.mahogany, 0, 0.9, -1.15);
  box(g, 1.9, 1.1, 0.04, MAT.woodDark, 0, 0.9, -1.07);
  box(g, 2.2, 0.1, 0.22, MAT.mahogany, 0, 1.65, -1.15);
  box(g, 2.1, 0.3, 0.1, MAT.mahogany, 0, 0.4, 1.13);
  box(g, 2.0, 0.32, 2.15, mattress, 0, 0.48, 0);
  box(g, 2.02, 0.04, 2.0, sheet, 0, 0.66, 0.05);
  box(g, 2.02, 0.08, 1.1, blanket, 0, 0.72, 0.6);
  box(g, 0.85, 0.18, 0.5, pillow, -0.5, 0.74, -0.75);
  box(g, 0.85, 0.18, 0.5, pillow, 0.5, 0.74, -0.75);
  [[-1.05, -1.2], [1.05, -1.2], [-1.05, 1.2], [1.05, 1.2]].forEach(([x, z]) => {
    cyl(g, 0.04, 0.05, 2.2, MAT.mahogany, x, 1.1, z, 12);
  });
  box(g, 2.3, 0.12, 2.6, MAT.fabricRed, 0, 2.15, 0);
  box(g, 2.3, 0.08, 0.15, MAT.fabricRed, 0, 2.08, -1.25);
  return { group: g, w: 2.2, d: 2.5 };
}
function makeNightstand(){
  const g = new THREE.Group();
  box(g, 0.58, 0.6, 0.55, MAT.mahogany, 0, 0.3, 0);
  box(g, 0.62, 0.05, 0.6, MAT.woodDark, 0, 0.63, 0);
  box(g, 0.58, 0.04, 0.55, MAT.woodDark, 0, 0.01, 0);
  const dg = new THREE.Group();
  box(dg, 0.52, 0.22, 0.5, MAT.mahogany, 0, 0, 0);
  box(dg, 0.52, 0.23, 0.02, MAT.woodDark, 0, 0, 0.26);
  box(dg, 0.1, 0.025, 0.03, MAT.brass, 0, 0, 0.28);
  dg.position.set(0, 0.32, 0);
  dg.userData.isDrawer = true;
  dg.userData.drawerState = 0;
  dg.userData.drawerMaxZ = 0.38;
  g.add(dg);
  World.interactables.push({ mesh: dg, type:'drawer', data:{ desk:g, index:0 } });
  return { group: g, w: 0.65, d: 0.65 };
}
function makeWardrobe(){
  const g = new THREE.Group();
  box(g, 1.6, 2.4, 0.7, MAT.mahogany, 0, 1.2, 0);
  box(g, 1.7, 0.08, 0.78, MAT.woodDark, 0, 2.42, 0);
  box(g, 1.7, 0.1, 0.78, MAT.woodDark, 0, 0.05, 0);
  const mirror = new THREE.MeshStandardMaterial({ color: 0x2a3040, metalness: 0.9, roughness: 0.1 });
  [0, 1].forEach(i => {
    const dg = new THREE.Group();
    const dw = 0.76;
    box(dg, dw, 2.2, 0.05, MAT.wood, 0, 0, 0);
    box(dg, dw - 0.16, 1.0, 0.02, MAT.woodDark, 0, 0.5, 0.03);
    box(dg, dw - 0.16, 0.6, 0.02, MAT.woodDark, 0, -0.6, 0.03);
    box(dg, 0.04, 0.18, 0.05, MAT.brass, i === 0 ? dw/2 - 0.08 : -dw/2 + 0.08, 0, 0.05);
    dg.position.set(i === 0 ? -0.4 : 0.4, 1.25, 0.36);
    dg.userData.isCabinetDoor = true;
    dg.userData.doorState = 0;
    dg.userData.doorHinge = i === 0 ? 1 : -1;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.6), mirror);
  mp.position.set(0.4, 1.25, 0.39); g.add(mp);
  return { group: g, w: 1.75, d: 0.85 };
}
function makeCabinet(){
  const g = new THREE.Group();
  box(g, 1.0, 1.6, 0.5, MAT.wood, 0, 0.8, 0);
  box(g, 1.05, 0.06, 0.55, MAT.woodDark, 0, 1.63, 0);
  box(g, 1.05, 0.06, 0.55, MAT.woodDark, 0, 0.03, 0);
  [0, 1].forEach(i => {
    const dg = new THREE.Group();
    box(dg, 0.46, 1.5, 0.04, MAT.wood, 0, 0, 0);
    box(dg, 0.36, 1.4, 0.02, MAT.woodDark, 0, 0, 0.025);
    box(dg, 0.04, 0.14, 0.04, MAT.brass, i === 0 ? 0.19 : -0.19, 0, 0.05);
    dg.position.set(i === 0 ? -0.25 : 0.25, 0.82, 0.26);
    dg.userData.isCabinetDoor = true;
    dg.userData.doorState = 0;
    dg.userData.doorHinge = i === 0 ? 1 : -1;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });
  return { group: g, w: 1.1, d: 0.6 };
}
function makeTableLamp(){
  const g = new THREE.Group();
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0x1a3a1a, emissive: 0x2a5a2a, emissiveIntensity: 0.5,
    transparent: true, opacity: 0.9, side: THREE.DoubleSide
  });
  cyl(g, 0.11, 0.13, 0.03, MAT.brass, 0, 0.015, 0, 24);
  cyl(g, 0.07, 0.1, 0.04, MAT.brass, 0, 0.05, 0, 24);
  cyl(g, 0.012, 0.012, 0.32, MAT.brass, 0, 0.23, 0, 12);
  cyl(g, 0.02, 0.02, 0.04, MAT.brass, 0, 0.4, 0, 12);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.14, 24, 1, true), shadeMat);
  shade.position.y = 0.52; g.add(shade);
  sph(g, 0.04, new THREE.MeshStandardMaterial({ color: 0xfff5d0, emissive: 0xffe090, emissiveIntensity: 2 }), 0, 0.5, 0);
  const light = new THREE.PointLight(0x90c070, 1.3, 4.5, 1.6);
  light.position.y = 0.5;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  g.add(light);
  return { group: g, w: 0.3, d: 0.3 };
}
function makeCeilingLamp(intensity, color){
  intensity = intensity || 1.6;
  color = color || 0xffd682;
  const g = new THREE.Group();
  const shadeMat = new THREE.MeshStandardMaterial({
    color: color, emissive: color, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.95, side: THREE.DoubleSide
  });
  cyl(g, 0.015, 0.015, 0.4, MAT.black, 0, -0.2, 0, 8);
  cyl(g, 0.08, 0.08, 0.03, MAT.black, 0, 0, 0, 20);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.28, 24, 1, true), shadeMat);
  shade.rotation.x = Math.PI; shade.position.y = -0.55; g.add(shade);
  sph(g, 0.08, new THREE.MeshStandardMaterial({ color: 0xfff5d0, emissive: 0xfff5d0, emissiveIntensity: 3 }), 0, -0.6, 0);
  const light = new THREE.PointLight(color, intensity, 12, 1.4);
  light.position.y = -0.65;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  g.add(light);
  return g;
}
function makePlant(){
  const g = new THREE.Group();
  const leafMats = [
    new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.85, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x3a6a3a, roughness: 0.85, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x1a4a1a, roughness: 0.85, side: THREE.DoubleSide }),
    new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.85, side: THREE.DoubleSide })
  ];
  cyl(g, 0.28, 0.22, 0.4, new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 }), 0, 0.2, 0, 24);
  cyl(g, 0.3, 0.3, 0.04, new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.9 }), 0, 0.42, 0, 24);
  cyl(g, 0.26, 0.26, 0.02, new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 1 }), 0, 0.41, 0, 24);
  for (let i = 0; i < 16; i++){
    const ang = Math.random()*Math.PI*2;
    const len = 0.5 + Math.random()*0.6;
    const h = 0.4 + Math.random()*0.5;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, len, 6),
      new THREE.MeshStandardMaterial({ color: 0x2a4a1a, roughness: 0.9 }));
    stem.position.set(Math.cos(ang)*0.05, 0.42 + h, Math.sin(ang)*0.05);
    stem.rotation.z = (Math.random()-0.5)*0.4;
    stem.rotation.x = (Math.random()-0.5)*0.4;
    g.add(stem);
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.14, len*0.9), leafMats[i%4]);
    leaf.position.set(Math.cos(ang)*0.15, 0.42 + h + len*0.3, Math.sin(ang)*0.15);
    leaf.rotation.y = ang;
    leaf.rotation.x = -0.4 + (Math.random()-0.5)*0.8;
    leaf.castShadow = true; g.add(leaf);
  }
  return { group: g, w: 0.6, d: 0.6 };
}
function makePainting(w, h, seed){
  w = w || 1.6; h = h || 1.1;
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x8a6a20, metalness: 0.6, roughness: 0.35 });
  const frameInner = new THREE.MeshStandardMaterial({ color: 0x6a5a30, roughness: 0.5, metalness: 0.3 });
  box(g, w + 0.22, h + 0.22, 0.1, frame, 0, 0, 0);
  box(g, w + 0.1, h + 0.1, 0.04, frameInner, 0, 0, 0.04);
  const c = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: TEX.painting(seed || 0), roughness: 0.7 }));
  c.position.z = 0.06; g.add(c);
  return g;
}
function makeWindow(w, h){
  w = w || 1.8; h = h || 1.5;
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x4a3d22, roughness: 0.7 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2035, emissive: 0x2a3a6a, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.85, metalness: 0.2, roughness: 0.1
  });
  box(g, w + 0.24, h + 0.24, 0.14, frame, 0, 0, 0);
  const moon = new THREE.Mesh(new THREE.CircleGeometry(0.18, 24), new THREE.MeshBasicMaterial({ color: 0xf0e8d8 }));
  moon.position.set(w*0.25, h*0.2, 0.08); g.add(moon);
  for (let i = 0; i < 15; i++){
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.008 + Math.random()*0.008, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 + Math.random()*0.5 }));
    star.position.set((Math.random()-0.5)*w, (Math.random()-0.5)*h, 0.07); g.add(star);
  }
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
  pane.position.z = 0.06; g.add(pane);
  box(g, 0.08, h, 0.06, frame, 0, 0, 0.09);
  box(g, w, 0.08, 0.06, frame, 0, 0, 0.09);
  box(g, w + 0.35, 0.08, 0.25, frame, 0, -h/2 - 0.1, 0.12);
  const light = new THREE.PointLight(0x8090ff, 0.7, 6, 1.8);
  light.position.set(0, 0, -0.5); g.add(light);
  return g;
}
function makeDoor(w, h){
  w = w || 1.0; h = h || 2.2;
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.8 });
  box(g, w + 0.16, 0.1, 0.12, frame, 0, h + 0.05, 0);
  box(g, 0.1, h + 0.1, 0.12, frame, -(w/2 + 0.03), h/2, 0);
  box(g, 0.1, h + 0.1, 0.12, frame, (w/2 + 0.03), h/2, 0);
  box(g, w, h, 0.06, MAT.mahogany, 0, h/2, 0.03);
  box(g, w - 0.2, h/2 - 0.15, 0.02, MAT.woodDark, 0, h*0.3, 0.07);
  box(g, w - 0.2, h/2 - 0.15, 0.02, MAT.woodDark, 0, h*0.75, 0.07);
  const h1 = cyl(g, 0.025, 0.025, 0.08, MAT.brass, w/2 - 0.15, h/2, 0.1, 12);
  h1.rotation.z = Math.PI/2;
  box(g, 0.06, 0.1, 0.03, MAT.brass, w/2 - 0.15, h/2 - 0.15, 0.08);
  return g;
}
function makeRug(w, d, palette){
  const mat = new THREE.MeshStandardMaterial({ map: TEX.carpet(palette), roughness: 1 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 3.5, d || 2.4), mat);
  m.rotation.x = -Math.PI/2;
  m.receiveShadow = true;
  return m;
}
function makeBench(){
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) box(g, 1.8, 0.05, 0.15, MAT.wood, 0, 0.5, -0.15 + i*0.15);
  for (let i = 0; i < 3; i++) box(g, 1.8, 0.15, 0.05, MAT.wood, 0, 0.7 + i*0.15, -0.28);
  [[-0.75,0],[0.75,0]].forEach(([px, pz]) => {
    box(g, 0.08, 0.5, 0.5, MAT.steelDark, px, 0.25, pz);
  });
  return { group: g, w: 1.9, d: 0.7 };
}
function makeLampPost(){
  const g = new THREE.Group();
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 2.0,
    transparent: true, opacity: 0.9
  });
  cyl(g, 0.15, 0.2, 0.15, MAT.black, 0, 0.075, 0, 12);
  cyl(g, 0.04, 0.06, 4, MAT.black, 0, 2.075, 0, 12);
  cyl(g, 0.03, 0.03, 0.15, MAT.black, 0, 4.1, 0, 8);
  box(g, 0.24, 0.32, 0.24, MAT.black, 0, 4.32, 0);
  box(g, 0.2, 0.28, 0.2, lightMat, 0, 4.32, 0);
  cyl(g, 0.02, 0.15, 0.08, MAT.black, 0, 4.5, 0, 12);
  const light = new THREE.PointLight(0xffd682, 2.5, 12, 1.6);
  light.position.y = 4.3;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024); g.add(light);
  return { group: g, w: 0.4, d: 0.4 };
}
function makeTree(scale){
  scale = scale || 1;
  const g = new THREE.Group();
  const trunk = new THREE.MeshStandardMaterial({ color: 0x3a2410, roughness: 0.95 });
  const fol1 = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.9 });
  const fol2 = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.9 });
  const fol3 = new THREE.MeshStandardMaterial({ color: 0x0f2a0f, roughness: 0.9 });
  cyl(g, 0.18*scale, 0.28*scale, 2.2*scale, trunk, 0, 1.1*scale, 0, 12);
  for (let i = 0; i < 4; i++){
    const ang = (i / 4) * Math.PI * 2 + Math.random();
    const branch = cyl(g, 0.06*scale, 0.1*scale, 1.2*scale, trunk, Math.cos(ang)*0.3*scale, 1.8*scale, Math.sin(ang)*0.3*scale, 8);
    branch.rotation.z = -0.7 + Math.random()*0.2;
    branch.rotation.y = ang;
  }
  for (let i = 0; i < 7; i++){
    const s = (0.9 + Math.random()*0.7)*scale;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), [fol1, fol2, fol3][(Math.random()*3)|0]);
    m.position.set((Math.random()-0.5)*1.4*scale, (2.6 + Math.random()*1.4)*scale, (Math.random()-0.5)*1.4*scale);
    m.castShadow = true; g.add(m);
  }
  return { group: g, w: 0.6*scale, d: 0.6*scale };
}
function makeCrate(stackY){
  stackY = stackY || 0;
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a2a10, roughness: 0.9 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 0.95 });
  box(g, 0.8, 0.8, 0.8, wood, 0, 0.4 + stackY, 0);
  for (let i = 0; i < 4; i++){
    box(g, 0.82, 0.04, 0.04, woodDark, 0, 0.15 + i*0.2 + stackY, 0.41);
    box(g, 0.82, 0.04, 0.04, woodDark, 0, 0.15 + i*0.2 + stackY, -0.41);
  }
  box(g, 0.04, 0.82, 0.82, woodDark, -0.41, 0.4 + stackY, 0);
  box(g, 0.04, 0.82, 0.82, woodDark, 0.41, 0.4 + stackY, 0);
  return { group: g, w: 0.9, d: 0.9 };
}
function makeVase(){
  const g = new THREE.Group();
  const curve = new THREE.LatheGeometry([
    new THREE.Vector2(0.0, 0), new THREE.Vector2(0.08, 0.02),
    new THREE.Vector2(0.12, 0.08), new THREE.Vector2(0.1, 0.16),
    new THREE.Vector2(0.06, 0.22), new THREE.Vector2(0.07, 0.26),
    new THREE.Vector2(0.09, 0.28)
  ], 16);
  const vase = new THREE.Mesh(curve, new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.4 }));
  vase.castShadow = true; g.add(vase);
  return { group: g, w: 0.25, d: 0.25 };
}
function makeFireplace(){
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 });
  const stone2 = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9 });
  box(g, 2.0, 2.2, 0.8, stone, 0, 1.1, 0);
  box(g, 1.2, 1.2, 0.6, MAT.black, 0, 0.6, 0.3);
  box(g, 1.0, 0.02, 0.5, new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1 }), 0, 0.02, 0.35);
  box(g, 2.2, 0.15, 0.9, stone2, 0, 2.28, 0);
  box(g, 0.6, 0.1, 0.5, stone2, -0.9, 0.1, 0.3);
  box(g, 0.6, 0.1, 0.5, stone2, 0.9, 0.1, 0.3);
  const fire = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 8),
    new THREE.MeshStandardMaterial({ color: 0xff7020, emissive: 0xff5000, emissiveIntensity: 3, transparent: true, opacity: 0.85 }));
  fire.position.set(0, 0.3, 0.4); g.add(fire);
  const fire2 = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 8),
    new THREE.MeshStandardMaterial({ color: 0xffd050, emissive: 0xffb020, emissiveIntensity: 3 }));
  fire2.position.set(0, 0.28, 0.42); g.add(fire2);
  const fireLight = new THREE.PointLight(0xff7020, 2.5, 5, 1.8);
  fireLight.position.set(0, 0.6, 0.5); g.add(fireLight);
  return { group: g, w: 2.2, d: 0.9 };
}
function makeChandelier(){
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x8a6a20, metalness: 0.9, roughness: 0.3 });
  const flameMat = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffe090, emissiveIntensity: 3 });
  cyl(g, 0.02, 0.02, 0.8, metal, 0, 0.4, 0, 8);
  cyl(g, 0.25, 0.3, 0.08, metal, 0, 0, 0, 24);
  const arms = 6;
  for (let i = 0; i < arms; i++){
    const a = (i / arms) * Math.PI * 2;
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.015, 8, 20, Math.PI * 0.7), metal);
    arm.position.set(Math.cos(a) * 0.4, -0.15, Math.sin(a) * 0.4);
    arm.rotation.y = -a;
    arm.rotation.z = Math.PI * 0.15;
    g.add(arm);
    sph(g, 0.06, flameMat, Math.cos(a) * 0.55, -0.28, Math.sin(a) * 0.55);
  }
  cyl(g, 0.008, 0.008, 1.2, metal, 0, 1.4, 0, 6);
  const light = new THREE.PointLight(0xffd682, 2.2, 12, 1.4);
  light.position.set(0, -0.2, 0);
  light.castShadow = true; light.shadow.mapSize.set(1024, 1024);
  g.add(light);
  return g;
}
function makeGlobeStand(){
  const g = new THREE.Group();
  const base = MAT.mahogany;
  const metal = MAT.brass;
  cyl(g, 0.12, 0.16, 0.05, base, 0, 0.025, 0, 20);
  cyl(g, 0.03, 0.03, 0.9, base, 0, 0.5, 0, 12);
  cyl(g, 0.02, 0.02, 0.06, metal, 0, 0.98, 0, 12);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0x2a4a6a, roughness: 0.7 }));
  globe.position.y = 1.2; g.add(globe);
  const equator = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.006, 8, 30), metal);
  equator.rotation.x = Math.PI/2; equator.position.y = 1.2; g.add(equator);
  return { group: g, w: 0.4, d: 0.4 };
}
function makeVanityMirror(){
  const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x8a6a20, metalness: 0.8, roughness: 0.4 });
  const mirror = new THREE.MeshStandardMaterial({ color: 0x2a3040, metalness: 0.95, roughness: 0.05 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffe090, emissiveIntensity: 2.5 });
  box(g, 1.0, 1.4, 0.08, frame, 0, 1.4, 0);
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.25), mirror);
  mp.position.set(0, 1.4, 0.05); g.add(mp);
  for (let i = 0; i < 8; i++){
    const a = (i / 8) * Math.PI * 2;
    sph(g, 0.04, bulbMat, Math.cos(a) * 0.56, 1.4 + Math.sin(a) * 0.78, 0.07);
  }
  const light = new THREE.PointLight(0xffe090, 1.5, 4, 1.5);
  light.position.set(0, 1.4, 0.3); g.add(light);
  return { group: g, w: 1.15, d: 0.2 };
}
function makePond(){
  const g = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.8, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a1a2a, roughness: 0.05, metalness: 0.8 }));
  water.rotation.x = -Math.PI/2; water.position.y = 0.02; g.add(water);
  const edge = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.0, 48),
    new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 }));
  edge.rotation.x = -Math.PI/2; edge.position.y = 0.03; g.add(edge);
  for (let i = 0; i < 12; i++){
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 1.5;
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.12, 12),
      new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.9 }));
    lily.rotation.x = -Math.PI/2;
    lily.position.set(Math.cos(a)*r, 0.025, Math.sin(a)*r);
    g.add(lily);
  }
  return { group: g, w: 3.6, d: 3.6 };
}