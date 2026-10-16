/* ====================================================================
   03-FURNITURE — Todos los muebles reutilizables
   (mismas dimensiones y alturas de superficie que antes; más detalle)
   ==================================================================== */

/* Pomo / tirador de latón torneado */
function _knob(parent, x, y, z, rotY){
  const g = new THREE.Group();
  const stem = cyl(g, 0.007, 0.007, 0.03, MAT.brass, 0, 0, 0.015, 10); stem.rotation.x = Math.PI / 2;
  sph(g, 0.018, MAT.brass, 0, 0, 0.034);
  g.position.set(x, y, z); if (rotY) g.rotation.y = rotY;
  parent.add(g); return g;
}
/* Tirador de asa (barra con dos soportes) */
function _pull(parent, x, y, z, len){
  len = len || 0.12;
  const g = new THREE.Group();
  const bar = cyl(g, 0.006, 0.006, len, MAT.brass, 0, 0, 0.03, 10); bar.rotation.z = Math.PI / 2;
  [-len / 2 + 0.01, len / 2 - 0.01].forEach(px => { const s = cyl(g, 0.005, 0.005, 0.03, MAT.brass, px, 0, 0.015, 8); s.rotation.x = Math.PI / 2; });
  g.position.set(x, y, z); parent.add(g); return g;
}
/* Ojo de cerradura */
function _keyhole(parent, x, y, z){
  const g = new THREE.Group();
  cyl(g, 0.014, 0.014, 0.004, MAT.brass, 0, 0, 0, 16).rotation.x = Math.PI / 2;
  const hole = cyl(g, 0.004, 0.004, 0.006, MAT.black, 0, 0, 0.001, 8); hole.rotation.x = Math.PI / 2;
  box(g, 0.004, 0.014, 0.006, MAT.black, 0, -0.01, 0.001);
  g.position.set(x, y, z); parent.add(g);
}

function makeDesk(){
  const g = new THREE.Group();
  const leather = new THREE.MeshStandardMaterial({ color: 0x1c2a1e, roughness: 0.6 });
  // sobre con moldura y badana de cuero
  rbox(g, 2.2, 0.05, 1.1, MAT.woodLight, 0, 0.775, 0, 0.012);
  rbox(g, 2.26, 0.025, 1.16, MAT.wood, 0, 0.738, 0, 0.01);
  box(g, 1.82, 0.004, 0.78, leather, 0.15, 0.802, -0.02);
  box(g, 1.84, 0.002, 0.8, MAT.brass, 0.15, 0.8005, -0.02).scale.set(1, 1, 1);
  box(g, 1.80, 0.006, 0.76, leather, 0.15, 0.8, -0.02);
  // faldón trasero
  rbox(g, 2.1, 0.14, 0.03, MAT.wood, 0, 0.66, 0.5, 0.006);
  // lateral derecho: dos patas torneadas + panel
  rbox(g, 0.04, 0.68, 0.98, MAT.wood, 1.06, 0.38, 0, 0.006);
  [[1.04, -0.44], [1.04, 0.44]].forEach(([px, pz]) => {
    lathe(g, [[0.001, 0], [0.032, 0], [0.034, 0.03], [0.026, 0.06], [0.03, 0.2], [0.04, 0.3], [0.03, 0.4], [0.034, 0.5], [0.038, 0.7], [0.045, 0.72]], MAT.woodDark, px, 0.02, pz, 16);
  });
  // pedestal de cajones (lado izquierdo)
  rbox(g, 0.7, 0.7, 1.0, MAT.woodDark, -0.75, 0.38, 0, 0.01);
  box(g, 0.74, 0.04, 1.04, MAT.wood, -0.75, 0.035, 0);
  for (let i = 0; i < 3; i++){
    const dg = new THREE.Group();
    rbox(dg, 0.64, 0.19, 0.92, MAT.wood, 0, 0, 0, 0.006);
    rbox(dg, 0.64, 0.2, 0.025, MAT.woodLight, 0, 0, 0.47, 0.008);
    box(dg, 0.54, 0.1, 0.006, MAT.woodDark, 0, 0, 0.485);
    _pull(dg, 0, 0, 0.482, 0.14);
    if (i === 0) _keyhole(dg, 0, 0.065, 0.484);
    dg.position.set(-0.75, 0.62 - i * 0.22, 0);
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
  // asiento tapizado con borde y tachuelas
  rbox(g, 0.52, 0.05, 0.52, MAT.wood, 0, 0.455, 0, 0.01);
  puffBox(g, 0.46, 0.09, 0.46, MAT.fabricRed, 0, 0.525, 0, { n: 4, bulge: 0.35, seg: 8 });
  for (let i = 0; i < 6; i++){
    sph(g, 0.007, MAT.brass, -0.2 + i * 0.08, 0.47, 0.262);
  }
  // patas delanteras torneadas, traseras rectas que suben al respaldo
  [[-0.22, 0.2], [0.22, 0.2]].forEach(([x, z]) => {
    lathe(g, [[0.001, 0], [0.018, 0], [0.02, 0.04], [0.026, 0.1], [0.02, 0.2], [0.03, 0.3], [0.026, 0.4], [0.03, 0.44]], MAT.wood, x, 0, z, 12);
  });
  [[-0.22, -0.22], [0.22, -0.22]].forEach(([x, z]) => {
    const post = rbox(g, 0.045, 1.08, 0.045, MAT.wood, x, 0.54, z, 0.008);
    post.rotation.x = -0.06;
  });
  // travesaños
  box(g, 0.4, 0.025, 0.025, MAT.woodDark, 0, 0.15, 0.2);
  box(g, 0.4, 0.025, 0.025, MAT.woodDark, 0, 0.15, -0.21);
  box(g, 0.025, 0.025, 0.4, MAT.woodDark, -0.22, 0.15, 0);
  box(g, 0.025, 0.025, 0.4, MAT.woodDark, 0.22, 0.15, 0);
  // respaldo: travesaño superior curvo + panel acolchado
  rbox(g, 0.52, 0.07, 0.04, MAT.wood, 0, 1.04, -0.255, 0.01);
  rbox(g, 0.46, 0.04, 0.035, MAT.wood, 0, 0.76, -0.235, 0.008);
  puffBox(g, 0.4, 0.22, 0.045, MAT.fabricRed, 0, 0.9, -0.24, { n: 4, bulge: 0.5, seg: 8 });
  return { group: g, w: 0.58, d: 0.58 };
}

function makeArmchair(){
  const g = new THREE.Group();
  // base y patas
  rbox(g, 0.95, 0.12, 0.85, MAT.woodDark, 0, 0.3, 0, 0.012);
  [[-0.4, 0.35], [0.4, 0.35], [-0.4, -0.35], [0.4, -0.35]].forEach(([px, pz]) => {
    lathe(g, [[0.001, 0], [0.03, 0], [0.034, 0.04], [0.045, 0.1], [0.05, 0.24]], MAT.woodDark, px, 0.0, pz, 14);
    cyl(g, 0.035, 0.035, 0.012, MAT.brass, px, 0.005, pz, 14);
  });
  // cuerpo: asiento, respaldo y brazos redondeados
  puffBox(g, 0.72, 0.16, 0.72, MAT.leatherGreen, 0, 0.5, 0.04, { n: 4.5, bulge: 0.3 });
  puffBox(g, 0.95, 0.9, 0.2, MAT.leatherGreen, 0, 0.78, -0.33, { n: 4, bulge: 0.18, seg: 12 });
  [-0.41, 0.41].forEach(sx => {
    puffBox(g, 0.16, 0.34, 0.82, MAT.leatherGreen, sx, 0.62, 0, { n: 4, bulge: 0.15, seg: 8 });
    const roll = cyl(g, 0.075, 0.075, 0.82, MAT.leatherGreen, sx, 0.79, 0.0, 16); roll.rotation.x = Math.PI / 2;
  });
  // capitoné: botones de latón en el respaldo
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++){
    const bx = -0.33 + c * 0.22 + (r % 2) * 0.11, by = 0.55 + r * 0.22;
    if (Math.abs(bx) < 0.42) sph(g, 0.012, MAT.brass, bx, by, -0.215);
  }
  // clavos del borde
  for (let i = 0; i < 9; i++) sph(g, 0.007, MAT.brass, -0.4 + i * 0.1, 0.58, 0.45).scale.set(1, 1, 0.6);
  return { group: g, w: 1.0, d: 0.9 };
}

function makeBookshelf(W, H){
  W = W || 2.4; H = H || 2.8;
  const D = 0.42;
  const g = new THREE.Group();
  const trim = MAT.mahogany;
  // laterales, zócalo, trasera, remate con moldura escalonada
  rbox(g, 0.12, H, D, trim, -W/2, H/2, 0, 0.012);
  rbox(g, 0.12, H, D, trim, W/2, H/2, 0, 0.012);
  rbox(g, W + 0.12, 0.12, D, trim, 0, 0.06, 0, 0.01);
  box(g, W, H, 0.03, MAT.woodDark, 0, H/2, -D/2 + 0.02);
  rbox(g, W + 0.14, 0.08, D + 0.02, trim, 0, H + 0.0, 0, 0.01);
  rbox(g, W + 0.22, 0.06, D + 0.08, trim, 0, H + 0.065, 0.02, 0.012);
  rbox(g, W + 0.28, 0.04, D + 0.12, MAT.woodDark, 0, H + 0.115, 0.04, 0.01);
  // zócalo frontal tallado
  box(g, W - 0.04, 0.1, 0.03, MAT.woodDark, 0, 0.06, D/2 - 0.005);
  // pilastras con base y capitel
  [-1, 1].forEach(s => {
    box(g, 0.05, H - 0.2, 0.03, MAT.woodDark, s * (W/2 + 0.0), H/2, D/2 + 0.005);
    box(g, 0.08, 0.06, 0.04, trim, s * (W/2), 0.15, D/2 + 0.01);
    box(g, 0.08, 0.06, 0.04, trim, s * (W/2), H - 0.1, D/2 + 0.01);
  });

  const bookCols = [0x7a2a1a,0x2a4a3a,0x5a5a1a,0x4a1a2a,0x1a3a5a,0x6a4a1a,0x3a1a4a,0x2a5a4a,0x8a3010,0x203050,0x406020,0x802040,0x6a5a3a,0x3a2a1a];
  const bookMats = bookCols.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.78 }));
  const pageMat = new THREE.MeshStandardMaterial({ color: 0xe0d4b0, roughness: 0.95 });
  const shelfYs = [];
  for (let i = 1; i <= 5; i++){
    const y = i * (H/5);
    if (i < 5) box(g, W - 0.12, 0.06, D - 0.04, trim, 0, y, 0);
    shelfYs.push(y);
  }
  shelfYs.forEach((y, idx) => {
    const shelfY = idx === 0 ? 0.1 : shelfYs[idx-1];
    const sh = y - shelfY;
    let cx = -W/2 + 0.1;
    // cada tanto un hueco con objeto decorativo
    while (cx < W/2 - 0.15){
      const roll = Math.random();
      if (roll < 0.06 && cx < W/2 - 0.5){
        // pila de libros planos + adorno
        const sw = 0.28 + Math.random() * 0.12;
        let yy = shelfY + 0.03;
        for (let k = 0; k < 3; k++){
          const bh = 0.035 + Math.random() * 0.03;
          const b = box(g, sw - k * 0.02, bh, D * 0.7, bookMats[(Math.random() * bookMats.length) | 0], cx + sw / 2, yy + bh / 2, 0);
          b.rotation.y = (Math.random() - 0.5) * 0.25; yy += bh;
        }
        if (Math.random() < 0.5) sph(g, 0.05, MAT.brass, cx + sw / 2, yy + 0.05, 0);
        cx += sw + 0.04; continue;
      }
      const bw = 0.035 + Math.random() * 0.05;
      const bh = sh * (0.68 + Math.random() * 0.27);
      const bd = D * (0.68 + Math.random() * 0.2);
      const mat = bookMats[(Math.random() * bookMats.length) | 0];
      const lean = Math.random() < 0.04;
      const book = rbox(g, bw, bh, bd, mat, cx + bw/2, shelfY + 0.03 + bh/2, 0.02 - (D - bd) * 0.2, 0.004);
      // cantos de las páginas y bandas doradas en el lomo
      box(g, bw * 0.9, bh * 0.985, 0.006, pageMat, cx + bw/2, shelfY + 0.03 + bh/2, 0.02 - (D - bd) * 0.2 - bd / 2 + 0.0).visible = false;
      if (bw > 0.05){
        box(g, bw + 0.002, 0.008, 0.004, MAT.brass, cx + bw/2, shelfY + 0.03 + bh * 0.8, 0.02 - (D - bd) * 0.2 + bd / 2 + 0.001);
        box(g, bw + 0.002, 0.008, 0.004, MAT.brass, cx + bw/2, shelfY + 0.03 + bh * 0.25, 0.02 - (D - bd) * 0.2 + bd / 2 + 0.001);
      }
      if (lean){ book.rotation.z = (Math.random() < 0.5 ? -1 : 1) * 0.28; cx += bh * 0.2; }
      else book.rotation.z = (Math.random() - 0.5) * 0.04;
      cx += bw + 0.004;
      if (Math.random() < 0.05) cx += 0.07;
    }
  });
  return { group: g, w: W + 0.2, d: D + 0.1 };
}

function makeBed(){
  const g = new THREE.Group();
  const sheetMat = MAT.cream;
  const blanket = new THREE.MeshPhysicalMaterial({ color: 0x2a1a4a, roughness: 0.95, sheen: 1, sheenColor: new THREE.Color(0x7a5aaa), sheenRoughness: 0.5 });
  // marco y patas
  rbox(g, 2.1, 0.22, 2.3, MAT.mahogany, 0, 0.21, 0, 0.015);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([px, pz]) => {
    lathe(g, [[0.001, 0], [0.05, 0], [0.06, 0.04], [0.045, 0.08], [0.07, 0.12]], MAT.mahogany, px*0.98, 0, pz*1.08, 14);
  });
  // cabecero tallado
  rbox(g, 2.1, 1.4, 0.14, MAT.mahogany, 0, 0.9, -1.15, 0.015);
  rbox(g, 1.86, 1.06, 0.04, MAT.woodDark, 0, 0.88, -1.06, 0.01);
  rbox(g, 1.64, 0.82, 0.02, MAT.mahogany, 0, 0.88, -1.035, 0.008);
  rbox(g, 2.2, 0.1, 0.22, MAT.mahogany, 0, 1.65, -1.15, 0.02);
  torus(g, 0.38, 0.03, MAT.brass, 0, 1.36, -1.045, 0, 0, 0);
  // piecero
  rbox(g, 2.1, 0.3, 0.1, MAT.mahogany, 0, 0.4, 1.13, 0.012);
  // colchón con vivos, sábana, manta y dobladillo
  puffBox(g, 2.0, 0.32, 2.15, MAT.cream, 0, 0.5, 0, { n: 6, bulge: 0.06, seg: 12 });
  puffBox(g, 2.03, 0.05, 1.95, new THREE.MeshStandardMaterial({ color: 0xcfc6dc, roughness: 0.9 }), 0, 0.665, -0.05, { n: 6, bulge: 0.2, seg: 12 });
  const quilt = puffBox(g, 2.06, 0.1, 1.24, blanket, 0, 0.72, 0.55, { n: 5, bulge: 0.35, seg: 14 });
  // costuras acolchadas
  for (let i = 1; i < 5; i++) box(g, 2.06, 0.004, 0.006, new THREE.MeshStandardMaterial({ color: 0x120a24, roughness: 1 }), 0, 0.775, -0.05 + i * 0.25);
  // doblez de la sábana
  puffBox(g, 2.04, 0.07, 0.26, MAT.cream, 0, 0.74, -0.12, { n: 5, bulge: 0.3, seg: 10 });
  // almohadas abombadas con funda y volante
  [-0.5, 0.5].forEach((px, i) => {
    const p = puffBox(g, 0.86, 0.2, 0.52, MAT.cream, px, 0.78, -0.76, { n: 3, bulge: 0.5, seg: 12 });
    p.rotation.set(-0.08, (i ? -1 : 1) * 0.04, 0);
  });
  // cojín decorativo
  const cush = puffBox(g, 0.5, 0.14, 0.3, MAT.fabricRed, 0, 0.88, -0.58, { n: 3, bulge: 0.6, seg: 10 });
  cush.rotation.x = -0.55;
  // postes del dosel con remates
  [[-1.05, -1.2], [1.05, -1.2], [-1.05, 1.2], [1.05, 1.2]].forEach(([x, z]) => {
    lathe(g, [[0.001, 0], [0.045, 0], [0.04, 0.2], [0.05, 0.3], [0.036, 0.4], [0.03, 1.9], [0.04, 2.0], [0.05, 2.05], [0.03, 2.12], [0.001, 2.17]], MAT.mahogany, x, 0.2, z, 14);
  });
  // dosel y cortinajes laterales
  box(g, 2.3, 0.06, 2.6, MAT.woodDark, 0, 2.17, 0);
  rbox(g, 2.34, 0.12, 2.64, MAT.fabricRed, 0, 2.23, 0, 0.02);
  const drape = new THREE.MeshStandardMaterial({ map: TEX.curtain(), roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
  [-1.1, 1.1].forEach(sx => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 1.5, 1, 1), drape);
    m.position.set(sx, 1.4, -1.0); m.rotation.y = sx > 0 ? -0.2 : 0.2; m.castShadow = true; g.add(m);
  });
  box(g, 2.3, 0.1, 0.05, MAT.fabricRed, 0, 2.1, 1.3);
  for (let i = 0; i < 14; i++) sph(g, 0.02, MAT.brass, -1.1 + i * 0.17, 2.04, 1.3);
  return { group: g, w: 2.2, d: 2.5 };
}

function makeNightstand(){
  const g = new THREE.Group();
  rbox(g, 0.58, 0.58, 0.55, MAT.mahogany, 0, 0.32, 0, 0.012);
  rbox(g, 0.64, 0.045, 0.6, MAT.woodDark, 0, 0.64, 0, 0.012);
  // patas torneadas y faldón
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    lathe(g, [[0.001, 0], [0.02, 0], [0.024, 0.02], [0.03, 0.04], [0.02, 0.08]], MAT.woodDark, sx * 0.25, 0, sz * 0.24, 10);
  });
  // lámina de mármol falsa y cajón
  rbox(g, 0.62, 0.012, 0.58, new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: 0.4 }), 0, 0.668, 0, 0.004);
  const dg = new THREE.Group();
  rbox(dg, 0.52, 0.22, 0.5, MAT.mahogany, 0, 0, 0, 0.008);
  rbox(dg, 0.52, 0.23, 0.02, MAT.woodDark, 0, 0, 0.26, 0.008);
  box(dg, 0.42, 0.14, 0.006, MAT.mahogany, 0, 0, 0.272);
  _knob(dg, 0, 0, 0.272);
  dg.position.set(0, 0.34, 0);
  dg.userData.isDrawer = true;
  dg.userData.drawerState = 0;
  dg.userData.drawerMaxZ = 0.38;
  g.add(dg);
  // estante inferior con puerta ciega
  box(g, 0.46, 0.2, 0.02, MAT.woodDark, 0, 0.12, 0.278);
  World.interactables.push({ mesh: dg, type:'drawer', data:{ desk:g, index:0 } });
  return { group: g, w: 0.65, d: 0.65 };
}

function makeWardrobe(){
  const g = new THREE.Group();
  rbox(g, 1.6, 2.4, 0.7, MAT.mahogany, 0, 1.2, 0, 0.015);
  // cornisa y zócalo escalonados
  rbox(g, 1.7, 0.08, 0.78, MAT.woodDark, 0, 2.42, 0, 0.012);
  rbox(g, 1.78, 0.06, 0.82, MAT.mahogany, 0, 2.5, 0.01, 0.012);
  rbox(g, 1.6, 0.1, 0.5, MAT.woodDark, 0, 2.58, 0.01, 0.015);
  rbox(g, 1.7, 0.1, 0.78, MAT.woodDark, 0, 0.05, 0, 0.012);
  [-0.8, 0.8].forEach(sx => lathe(g, [[0.001, 0], [0.05, 0], [0.06, 0.05], [0.04, 0.1]], MAT.woodDark, sx, -0.0, 0.32, 12));
  // pilastras
  [-0.78, 0.78].forEach(sx => rbox(g, 0.08, 2.3, 0.06, MAT.woodDark, sx, 1.2, 0.36, 0.01));
  // puertas con paneles (pivotan sobre su bisagra exterior)
  [0, 1].forEach(i => {
    const dg = new THREE.Group();
    const dw = 0.76;
    const sx = i === 0 ? 1 : -1;               // el centro de la puerta respecto a la bisagra
    const cxLocal = sx * dw / 2;
    const inner = new THREE.Group(); inner.position.x = cxLocal; dg.add(inner);
    rbox(inner, dw, 2.2, 0.05, MAT.wood, 0, 0, 0, 0.008);
    rbox(inner, dw - 0.18, 0.95, 0.025, MAT.mahogany, 0, 0.5, 0.03, 0.01);
    rbox(inner, dw - 0.18, 0.55, 0.025, MAT.mahogany, 0, -0.62, 0.03, 0.01);
    if (i === 1){
      // luna biselada
      const frame = rbox(inner, dw - 0.18, 0.95, 0.03, MAT.brass, 0, 0.5, 0.035, 0.004);
      const mp = new THREE.Mesh(new THREE.PlaneGeometry(dw - 0.26, 0.87), MAT.mirror);
      mp.position.set(0, 0.5, 0.052); inner.add(mp);
    } else {
      // moldura central
      torus(inner, 0.12, 0.012, MAT.brass, 0, 0.5, 0.045, 0, 0, 0);
    }
    _knob(inner, i === 0 ? dw / 2 - 0.08 : -dw / 2 + 0.08, 0, 0.03);
    dg.position.set(i === 0 ? -0.78 : 0.78, 1.25, 0.36);
    dg.userData.isCabinetDoor = true;
    dg.userData.doorState = 0;
    dg.userData.doorHinge = i === 0 ? -1 : 1;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });
  // interior oscuro
  box(g, 1.46, 2.2, 0.02, MAT.black, 0, 1.25, 0.34);
  return { group: g, w: 1.75, d: 0.85 };
}

function makeCabinet(){
  const g = new THREE.Group();
  rbox(g, 1.0, 1.6, 0.5, MAT.wood, 0, 0.8, 0, 0.012);
  rbox(g, 1.07, 0.06, 0.56, MAT.woodDark, 0, 1.63, 0, 0.012);
  rbox(g, 1.05, 0.08, 0.54, MAT.woodDark, 0, 0.04, 0, 0.01);
  box(g, 0.92, 1.5, 0.02, MAT.black, 0, 0.82, 0.24);
  [0, 1].forEach(i => {
    const dg = new THREE.Group();
    const inner = new THREE.Group(); inner.position.x = (i === 0 ? 1 : -1) * 0.23; dg.add(inner);
    rbox(inner, 0.46, 1.5, 0.04, MAT.wood, 0, 0, 0, 0.008);
    rbox(inner, 0.34, 1.38, 0.02, MAT.woodDark, 0, 0, 0.025, 0.008);
    rbox(inner, 0.26, 0.5, 0.012, MAT.woodLight, 0, 0.4, 0.04, 0.006);
    rbox(inner, 0.26, 0.5, 0.012, MAT.woodLight, 0, -0.35, 0.04, 0.006);
    _pull(inner, i === 0 ? 0.17 : -0.17, 0, 0.04, 0.14).rotation.z = Math.PI / 2;
    dg.position.set(i === 0 ? -0.5 : 0.5, 0.82, 0.26);
    dg.userData.isCabinetDoor = true;
    dg.userData.doorState = 0;
    dg.userData.doorHinge = i === 0 ? -1 : 1;
    g.add(dg);
    World.interactables.push({ mesh: dg, type:'cabinetDoor', data:{ cabinet:g, side:i } });
  });
  return { group: g, w: 1.1, d: 0.6 };
}

function makeTableLamp(){
  const g = new THREE.Group();
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0x2a5a2a, emissive: 0x2a5a2a, emissiveIntensity: 0.55,
    transparent: true, opacity: 0.88, side: THREE.DoubleSide, roughness: 0.9
  });
  const pts = [[0.001, 0], [0.12, 0], [0.13, 0.015], [0.1, 0.03], [0.05, 0.05], [0.035, 0.09], [0.05, 0.13], [0.06, 0.2], [0.04, 0.26], [0.016, 0.3], [0.012, 0.36], [0.02, 0.4], [0.016, 0.42]];
  lathe(g, pts, MAT.brass, 0, 0, 0, 28);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.17, 28, 1, true), shadeMat);
  shade.position.y = 0.52; g.add(shade);
  torus(g, 0.15, 0.004, MAT.brass, 0, 0.605, 0, Math.PI / 2, 0, 0);
  torus(g, 0.22, 0.004, MAT.brass, 0, 0.435, 0, Math.PI / 2, 0, 0);
  sph(g, 0.04, new THREE.MeshStandardMaterial({ color: 0xfff5d0, emissive: 0xffe090, emissiveIntensity: 2 }), 0, 0.5, 0);
  const light = new THREE.PointLight(0x90c070, 1.3, 4.5, 1.6);
  light.position.y = 0.5;
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.003;
  g.add(light);
  return { group: g, w: 0.3, d: 0.3 };
}

function makeCeilingLamp(intensity, color){
  intensity = intensity || 1.6;
  color = color || 0xffd682;
  const g = new THREE.Group();
  const shadeMat = new THREE.MeshStandardMaterial({
    color: color, emissive: color, emissiveIntensity: 1.7,
    transparent: true, opacity: 0.92, side: THREE.DoubleSide
  });
  // rosetón de escayola
  lathe(g, [[0.001, 0.02], [0.3, 0.02], [0.3, 0.0], [0.26, -0.015], [0.18, -0.03], [0.1, -0.035], [0.04, -0.03]], new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.8 }), 0, 0, 0, 28).castShadow = false;
  cyl(g, 0.012, 0.012, 0.36, MAT.brass, 0, -0.2, 0, 8).castShadow = false;
  cyl(g, 0.045, 0.02, 0.06, MAT.brass, 0, -0.4, 0, 14).castShadow = false;
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.28, 28, 1, true), shadeMat);
  shade.rotation.x = Math.PI; shade.position.y = -0.55; g.add(shade);
  torus(g, 0.32, 0.008, MAT.brass, 0, -0.69, 0, Math.PI / 2, 0, 0);
  sph(g, 0.08, new THREE.MeshStandardMaterial({ color: 0xfff5d0, emissive: 0xfff5d0, emissiveIntensity: 3 }), 0, -0.6, 0);
  const light = new THREE.PointLight(color, intensity, 12, 1.4);
  light.position.y = -0.65;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.bias = -0.003;
  g.add(light);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  return g;
}

function makePlant(){
  const g = new THREE.Group();
  const leafMats = [0x2a5a2a, 0x3a6a3a, 0x1a4a1a, 0x4a7a3a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, side: THREE.DoubleSide }));
  const pot = new THREE.MeshStandardMaterial({ color: 0xa86a42, roughness: 0.85 });
  const potBand = new THREE.MeshStandardMaterial({ color: 0x8a5232, roughness: 0.85 });
  // maceta de terracota torneada con plato
  lathe(g, [[0.001, 0], [0.2, 0], [0.22, 0.03], [0.27, 0.3], [0.29, 0.38], [0.31, 0.4], [0.31, 0.44], [0.27, 0.44], [0.26, 0.4]], pot, 0, 0.03, 0, 28);
  cyl(g, 0.3, 0.28, 0.03, potBand, 0, 0.015, 0, 28);
  cyl(g, 0.255, 0.255, 0.02, new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 1 }), 0, 0.45, 0, 24);
  // hojas con forma de lanza (curvadas) sobre tallos arqueados
  const leafGeo = (len, wid) => {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.quadraticCurveTo(wid, len * 0.35, 0, len); s.quadraticCurveTo(-wid, len * 0.35, 0, 0);
    const geo = new THREE.ShapeGeometry(s, 6);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.pow(p.getY(i) / len, 2) * -len * 0.25 + Math.abs(p.getX(i)) * 0.4);
    geo.computeVertexNormals(); return geo;
  };
  for (let i = 0; i < 22; i++){
    const ang = Math.random() * Math.PI * 2;
    const len = 0.45 + Math.random() * 0.55;
    const tilt = 0.25 + Math.random() * 0.8;
    const holder = new THREE.Group();
    holder.position.set(Math.cos(ang) * 0.04, 0.46, Math.sin(ang) * 0.04);
    holder.rotation.y = ang;
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x2a4a1a, roughness: 0.9 });
    const stem = tube(holder, [[0, 0, 0], [0.04, len * 0.35, 0], [0.1 + tilt * 0.12, len * 0.7, 0], [0.2 + tilt * 0.22, len * 0.88, 0]], 0.006, stemMat, 10, 5);
    stem.position.set(0, 0, 0);
    const leaf = new THREE.Mesh(leafGeo(0.3 + Math.random() * 0.2, 0.07 + Math.random() * 0.05), leafMats[i % 4]);
    leaf.position.set(0.2 + tilt * 0.22, len * 0.88, 0);
    leaf.rotation.set(-0.2 + Math.random() * 0.5, Math.PI / 2, -tilt * 0.9 + 0.7);
    leaf.rotation.order = 'YXZ';
    leaf.castShadow = true; holder.add(leaf);
    g.add(holder);
  }
  return { group: g, w: 0.6, d: 0.6 };
}

function makePainting(w, h, seed){
  w = w || 1.6; h = h || 1.1;
  const g = new THREE.Group();
  const frame = metalMat(0xa88030, 0.35, 0.85, 0.9);
  const frameDark = metalMat(0x5a4018, 0.45, 0.7, 0.8);
  // marco con perfil escalonado
  const fw = 0.09;
  const bars = (ww, hh, dd, zz, mat) => {
    rbox(g, ww, fw * 0.5, dd, mat, 0, hh / 2 - fw * 0.25, zz, 0.006);
    rbox(g, ww, fw * 0.5, dd, mat, 0, -hh / 2 + fw * 0.25, zz, 0.006);
    rbox(g, fw * 0.5, hh - fw, dd, mat, -ww / 2 + fw * 0.25, 0, zz, 0.006);
    rbox(g, fw * 0.5, hh - fw, dd, mat, ww / 2 - fw * 0.25, 0, zz, 0.006);
  };
  box(g, w + fw * 2, h + fw * 2, 0.02, MAT.woodDark, 0, 0, -0.02);
  bars(w + fw * 2, h + fw * 2, 0.07, 0.015, frame);
  bars(w + fw * 1.1, h + fw * 1.1, 0.05, 0.045, frameDark);
  bars(w + fw * 0.35, h + fw * 0.35, 0.03, 0.06, frame);
  const c = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.02, h + 0.02), new THREE.MeshStandardMaterial({ map: TEX.painting(seed || 0), roughness: 0.55 }));
  c.position.z = 0.03; g.add(c);
  // lámpara de cuadro
  const pl = new THREE.Group();
  box(pl, 0.3, 0.03, 0.03, MAT.brass, 0, 0, 0.0);
  tube(pl, [[0, 0, 0], [0, 0.04, 0.08], [0, 0.0, 0.2]], 0.006, MAT.brass, 10, 5);
  return g;
}

/* Ventana con hueco real: marco, hojas con parteluces, alféizar de piedra,
   vista nocturna detrás y cortinas opcionales. Se orienta hacia +Z.        */
function makeWindow(w, h, opts){
  w = w || 1.8; h = h || 1.5;
  opts = opts || {};
  const g = new THREE.Group();
  const T = opts.depth != null ? opts.depth : 0.3;   // grosor del muro
  const frameMat = MAT.woodLight;
  const paint = new THREE.MeshStandardMaterial({ color: 0xe8e0cc, roughness: 0.6 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x8aa0c8, emissive: 0x0a1020, emissiveIntensity: 0.4,
    transparent: true, opacity: 0.16, metalness: 0.1, roughness: 0.04
  });
  ENV.reg(glassMat, 1.8);
  // vista exterior (siempre de noche)
  const view = new THREE.Mesh(new THREE.PlaneGeometry(w + 3.2, h + 2.4),
    new THREE.MeshBasicMaterial({ map: TEX.night((w + 3.2) / (h + 2.4)), fog: false, toneMapped: false }));
  view.position.set(0, 0, -T - 1.4); g.add(view);
  // jambas, dintel y alféizar interior (rebajo del muro)
  const rev = opts.revealMat || new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.95 });
  box(g, 0.02, h, T, rev, -w / 2 - 0.01, 0, -T / 2);
  box(g, 0.02, h, T, rev, w / 2 + 0.01, 0, -T / 2);
  box(g, w + 0.04, 0.02, T, rev, 0, h / 2 + 0.01, -T / 2);
  // sillería del alféizar
  rbox(g, w + 0.44, 0.07, T + 0.18, MAT.stone, 0, -h / 2 - 0.035, -T / 2 + 0.07, 0.012);
  rbox(g, w + 0.34, 0.03, T + 0.2, new THREE.MeshStandardMaterial({ color: 0x5a5048, roughness: 0.8 }), 0, -h / 2 - 0.085, -T / 2 + 0.08, 0.008);
  // marco y hojas
  const fz = -T + 0.06;
  const bar = (bw, bh, x, y, d) => rbox(g, bw, bh, d || 0.06, frameMat, x, y, fz, 0.005);
  bar(w + 0.06, 0.06, 0, h / 2, 0.08); bar(w + 0.06, 0.06, 0, -h / 2, 0.08);
  bar(0.06, h, -w / 2, 0, 0.08); bar(0.06, h, w / 2, 0, 0.08);
  bar(0.05, h, 0, 0, 0.06); bar(w, 0.05, 0, h * 0.18, 0.06);
  const colN = w > 2 ? 2 : 1;
  for (let i = 1; i <= colN; i++){ const px = -w / 2 + (w / (colN + 1)) * i; if (Math.abs(px) > 0.05) bar(0.03, h, px, 0, 0.04); }
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
  pane.position.set(0, 0, fz + 0.005); g.add(pane);
  // manilla
  box(g, 0.03, 0.12, 0.025, MAT.brass, 0.03, 0, fz + 0.045);
  // moldura interior (guarnición)
  const cz = 0.02;
  rbox(g, w + 0.28, 0.1, 0.05, paint, 0, h / 2 + 0.1, cz, 0.008);
  rbox(g, 0.12, h + 0.12, 0.05, paint, -w / 2 - 0.09, 0, cz, 0.008);
  rbox(g, 0.12, h + 0.12, 0.05, paint, w / 2 + 0.09, 0, cz, 0.008);
  rbox(g, w + 0.36, 0.04, 0.07, paint, 0, h / 2 + 0.17, cz + 0.01, 0.008);
  // luz azul de luna entrando
  const light = new THREE.PointLight(0x7a8cff, 0.55, 6, 1.8);
  light.position.set(0, 0, -0.1); g.add(light);
  // cortinas laterales con barra
  if (opts.curtains){
    const cm = new THREE.MeshStandardMaterial({ map: TEX.curtain(), roughness: 0.9, side: THREE.DoubleSide });
    const ch = h + 0.55;
    [-1, 1].forEach(s => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, ch, 1, 1), cm);
      m.position.set(s * (w / 2 + 0.26), 0.05, 0.1); m.rotation.y = -s * 0.12; m.castShadow = true; g.add(m);
    });
    const rod = cyl(g, 0.014, 0.014, w + 0.9, MAT.brass, 0, h / 2 + 0.34, 0.12, 12); rod.rotation.z = Math.PI / 2;
    [-1, 1].forEach(s => sph(g, 0.03, MAT.brass, s * (w / 2 + 0.46), h / 2 + 0.34, 0.12));
  }
  return g;
}

function makeDoor(w, h){
  w = w || 1.0; h = h || 2.2;
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: 0xe0d8c4, roughness: 0.6 });
  // guarnición con friso y dintel
  rbox(g, w + 0.3, 0.12, 0.09, paint, 0, h + 0.06, 0.0, 0.01);
  rbox(g, w + 0.38, 0.05, 0.11, paint, 0, h + 0.145, 0.0, 0.01);
  rbox(g, 0.12, h + 0.12, 0.09, paint, -(w / 2 + 0.07), h / 2 + 0.06, 0.0, 0.01);
  rbox(g, 0.12, h + 0.12, 0.09, paint, (w / 2 + 0.07), h / 2 + 0.06, 0.0, 0.01);
  // hoja con 6 paneles resaltados
  rbox(g, w, h, 0.06, MAT.mahogany, 0, h / 2, 0.02, 0.008);
  const pw = (w - 0.3) / 2;
  [[-1, 0.78], [1, 0.78]].forEach(([sx]) => {
    rbox(g, pw, 0.5, 0.025, MAT.woodDark, sx * (pw / 2 + 0.04), h * 0.80, 0.06, 0.01);
    rbox(g, pw, 0.75, 0.025, MAT.woodDark, sx * (pw / 2 + 0.04), h * 0.45, 0.06, 0.01);
    rbox(g, pw, 0.4, 0.025, MAT.woodDark, sx * (pw / 2 + 0.04), h * 0.15, 0.06, 0.01);
  });
  // manilla de latón con placa y cerradura
  box(g, 0.06, 0.24, 0.012, MAT.brass, w / 2 - 0.1, h / 2, 0.078);
  const lever = cyl(g, 0.011, 0.011, 0.14, MAT.brass, w / 2 - 0.15, h / 2 + 0.04, 0.1, 12); lever.rotation.z = Math.PI / 2;
  const rose = cyl(g, 0.026, 0.026, 0.03, MAT.brass, w / 2 - 0.1, h / 2 + 0.04, 0.09, 16); rose.rotation.x = Math.PI / 2;
  _keyhole(g, w / 2 - 0.1, h / 2 - 0.07, 0.086);
  // bisagras
  [0.25, h / 2, h - 0.25].forEach(y => cyl(g, 0.012, 0.012, 0.1, MAT.brass, -w / 2 - 0.0, y, 0.055, 10));
  return g;
}

function makeRug(w, d, palette){
  const tex = TEX.carpet(palette);
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, bumpMap: makeBump(tex.image, 1.0), bumpScale: 0.12 });
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w || 3.5, d || 2.4), mat);
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  g.add(m);
  // flecos en los extremos
  const col = parseCol((palette || ['#5a2818'])[0]);
  const fr = new THREE.MeshStandardMaterial({ color: new THREE.Color(0xd8caa0), roughness: 1 });
  const ww = w || 3.5, dd = d || 2.4;
  [-1, 1].forEach(s => {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(ww, 0.08), fr);
    strip.rotation.x = -Math.PI / 2; strip.position.set(0, -0.0005, s * (dd / 2 + 0.04)); g.add(strip);
  });
  // borde grueso para que no parezca una calcomanía
  const edge = new THREE.Mesh(new THREE.BoxGeometry(ww, 0.012, dd), new THREE.MeshStandardMaterial({ color: new THREE.Color(col[0] / 400, col[1] / 400, col[2] / 400), roughness: 1 }));
  edge.position.y = -0.0085; edge.receiveShadow = true; g.add(edge);
  return g;
}

function makeBench(){
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4020, roughness: 0.85 });
  // asiento y respaldo de listones con bordes biselados
  for (let i = 0; i < 4; i++) rbox(g, 1.8, 0.04, 0.11, wood, 0, 0.5, -0.17 + i * 0.12, 0.008);
  for (let i = 0; i < 3; i++) rbox(g, 1.8, 0.11, 0.035, wood, 0, 0.72 + i * 0.15, -0.3 - i * 0.02, 0.008).rotation.x = -0.12;
  // laterales de hierro fundido con curvas
  [-0.8, 0.8].forEach(px => {
    const side = new THREE.Group();
    rbox(side, 0.05, 0.05, 0.6, MAT.black, 0, 0.55, -0.02, 0.01);
    box(side, 0.045, 0.5, 0.05, MAT.black, 0, 0.25, 0.25);
    box(side, 0.045, 0.5, 0.05, MAT.black, 0, 0.25, -0.28);
    tube(side, [[0, 0.5, 0.26], [0, 0.55, 0.3], [0, 0.62, 0.3], [0, 0.66, 0.24]], 0.015, MAT.black, 16, 6);
    tube(side, [[0, 0.5, -0.3], [0, 0.8, -0.34], [0, 1.02, -0.38], [0, 1.08, -0.34]], 0.02, MAT.black, 16, 6);
    torus(side, 0.12, 0.012, MAT.black, 0, 0.3, 0, 0, Math.PI / 2, 0);
    side.position.x = px; g.add(side);
  });
  return { group: g, w: 1.9, d: 0.7 };
}

function makeLampPost(){
  const g = new THREE.Group();
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xf0c75e, emissive: 0xf0c75e, emissiveIntensity: 1.8,
    transparent: true, opacity: 0.92
  });
  const iron = metalMat(0x14141a, 0.45, 0.8, 0.7);
  // base y fuste de fundición torneado
  lathe(g, [[0.001, 0], [0.22, 0], [0.22, 0.06], [0.16, 0.1], [0.12, 0.25], [0.08, 0.4], [0.06, 0.6], [0.05, 0.9], [0.045, 3.9], [0.07, 4.0], [0.05, 4.05]], iron, 0, 0, 0, 20);
  torus(g, 0.08, 0.014, iron, 0, 0.95, 0, Math.PI / 2, 0, 0);
  torus(g, 0.07, 0.012, iron, 0, 3.85, 0, Math.PI / 2, 0, 0);
  // farol: base, cristal, montantes y capuchón
  cyl(g, 0.14, 0.08, 0.1, iron, 0, 4.1, 0, 4).rotation.y = Math.PI / 4;
  box(g, 0.2, 0.28, 0.2, lightMat, 0, 4.3, 0);
  [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]].forEach(([x, z]) => box(g, 0.025, 0.34, 0.025, iron, x, 4.3, z));
  const cap = cyl(g, 0.02, 0.2, 0.14, iron, 0, 4.54, 0, 4); cap.rotation.y = Math.PI / 4;
  sph(g, 0.03, iron, 0, 4.64, 0);
  const light = new THREE.PointLight(0xffd682, 2.5, 12, 1.6);
  light.position.y = 4.3;
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024); light.shadow.bias = -0.003; g.add(light);
  return { group: g, w: 0.4, d: 0.4 };
}

function makeTree(scale){
  scale = scale || 1;
  const g = new THREE.Group();
  const trunk = new THREE.MeshStandardMaterial({ color: 0x4a3018, roughness: 0.95 });
  const fol = [0x1a3a1a, 0x244a24, 0x0f2a0f, 0x2e5a2a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.85, flatShading: false }));
  // tronco ramificado con base ensanchada
  lathe(g, [[0.001, 0], [0.4 * scale, 0], [0.3 * scale, 0.3 * scale], [0.22 * scale, 0.8 * scale], [0.18 * scale, 2.0 * scale], [0.14 * scale, 2.4 * scale]], trunk, 0, 0, 0, 14);
  const branchEnds = [];
  for (let i = 0; i < 5; i++){
    const ang = (i / 5) * Math.PI * 2 + Math.random();
    const len = (1.2 + Math.random() * 0.8) * scale;
    const sx = Math.cos(ang), sz = Math.sin(ang);
    const p0 = [sx * 0.05 * scale, 1.7 * scale, sz * 0.05 * scale];
    const p1 = [sx * len * 0.5, 2.3 * scale, sz * len * 0.5];
    const p2 = [sx * len, (2.8 + Math.random() * 0.5) * scale, sz * len];
    tube(g, [p0, p1, p2], 0.06 * scale, trunk, 10, 6);
    branchEnds.push(p2);
  }
  // follaje: racimos de esferas irregulares
  const blobs = (cx, cy, cz, r) => {
    for (let k = 0; k < 4; k++){
      const geo = new THREE.IcosahedronGeometry(r * (0.55 + Math.random() * 0.45), 2);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++){
        const nz = 1 + (NZ.h2(Math.round(p.getX(i) * 40), Math.round(p.getY(i) * 40), Math.round(p.getZ(i) * 40)) - 0.5) * 0.28;
        p.setXYZ(i, p.getX(i) * nz, p.getY(i) * nz * 0.85, p.getZ(i) * nz);
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, fol[(Math.random() * fol.length) | 0]);
      m.position.set(cx + (Math.random() - 0.5) * r, cy + (Math.random() - 0.3) * r * 0.7, cz + (Math.random() - 0.5) * r);
      m.castShadow = true; g.add(m);
    }
  };
  branchEnds.forEach(e => blobs(e[0], e[1] + 0.3 * scale, e[2], 0.85 * scale));
  blobs(0, 3.5 * scale, 0, 1.1 * scale);
  return { group: g, w: 0.6*scale, d: 0.6*scale };
}

function makeCrate(stackY){
  stackY = stackY || 0;
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a28, roughness: 0.9, map: MAT.wood.map, bumpMap: MAT.wood.bumpMap, bumpScale: 0.1 });
  wood.userData.tile = 0.5;
  const strap = new THREE.MeshStandardMaterial({ color: 0x3a2814, roughness: 0.9, map: MAT.woodDark.map });
  strap.userData.tile = 0.5;
  // tablas separadas por cara + listones + esquineros metálicos
  for (let i = 0; i < 4; i++){
    const y = 0.1 + i * 0.2 + stackY;
    [[0, 0.4, 0], [0, -0.4, 0], [0.4, 0, 1], [-0.4, 0, 1]].forEach(([a, b, side]) => {
      if (!side) rbox(g, 0.8, 0.185, 0.03, wood, 0, y, b, 0.006);
      else rbox(g, 0.03, 0.185, 0.8, wood, a, y, 0, 0.006);
    });
  }
  box(g, 0.76, 0.01, 0.76, strap, 0, 0.005 + stackY, 0);
  [[-0.39, -0.39], [0.39, -0.39], [-0.39, 0.39], [0.39, 0.39]].forEach(([x, z]) => rbox(g, 0.06, 0.8, 0.06, strap, x, 0.4 + stackY, z, 0.008));
  [[0.425, 0], [-0.425, 0]].forEach(([x]) => { rbox(g, 0.02, 0.06, 0.82, strap, x, 0.12 + stackY, 0, 0.004); rbox(g, 0.02, 0.06, 0.82, strap, x, 0.68 + stackY, 0, 0.004); });
  [[0.1], [0.7]].forEach(([y]) => { rbox(g, 0.84, 0.05, 0.02, strap, 0, y + stackY, 0.425, 0.004); rbox(g, 0.84, 0.05, 0.02, strap, 0, y + stackY, -0.425, 0.004); });
  [[-0.39, 0.1], [0.39, 0.1], [-0.39, 0.7], [0.39, 0.7]].forEach(([x, y]) => sph(g, 0.012, MAT.steelDark, x, y + stackY, 0.44));
  // tapa
  rbox(g, 0.84, 0.03, 0.84, strap, 0, 0.815 + stackY, 0, 0.006);
  return { group: g, w: 0.9, d: 0.9 };
}

function makeVase(){
  const g = new THREE.Group();
  const glaze = ENV.reg(new THREE.MeshStandardMaterial({ color: 0x4a6a8a, roughness: 0.22 }), 0.8);
  lathe(g, [[0.001, 0], [0.07, 0], [0.09, 0.02], [0.13, 0.08], [0.12, 0.16], [0.07, 0.22], [0.045, 0.26], [0.055, 0.3], [0.075, 0.33], [0.07, 0.34], [0.05, 0.31]], glaze, 0, 0, 0, 28);
  torus(g, 0.12, 0.004, MAT.gold, 0, 0.12, 0, Math.PI / 2, 0, 0);
  return { group: g, w: 0.25, d: 0.25 };
}

function makeFireplace(){
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.88, bumpMap: MAT.woodDark.bumpMap, bumpScale: 0.1 });
  const marbleM = new THREE.MeshStandardMaterial({ color: 0xcfc6b4, roughness: 0.35 });
  ENV.reg(marbleM, 0.5);
  const sootM = new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 1 });
  const OW = 1.1, OH = 1.0;                       // hueco del hogar
  // cuerpo de sillería con hueco real: pilares + dintel
  rbox(g, 0.45, 2.2, 0.8, stone, -(OW / 2 + 0.225), 1.1, 0, 0.015);
  rbox(g, 0.45, 2.2, 0.8, stone, (OW / 2 + 0.225), 1.1, 0, 0.015);
  rbox(g, OW + 0.02, 2.2 - OH - 0.05, 0.8, stone, 0, OH + 0.05 + (2.2 - OH - 0.05) / 2, 0, 0.015);
  // interior ennegrecido
  box(g, OW, OH, 0.02, sootM, 0, 0.05 + OH / 2, -0.38);
  box(g, 0.02, OH, 0.7, sootM, -OW / 2, 0.05 + OH / 2, 0);
  box(g, 0.02, OH, 0.7, sootM, OW / 2, 0.05 + OH / 2, 0);
  box(g, OW, 0.05, 0.78, sootM, 0, 0.025, 0);
  // jambas y dintel de mármol
  rbox(g, 0.12, OH + 0.4, 0.5, marbleM, -(OW / 2 + 0.08), (OH + 0.4) / 2 + 0.05, 0.38, 0.012);
  rbox(g, 0.12, OH + 0.4, 0.5, marbleM, (OW / 2 + 0.08), (OH + 0.4) / 2 + 0.05, 0.38, 0.012);
  rbox(g, OW + 0.36, 0.16, 0.52, marbleM, 0, OH + 0.2, 0.38, 0.012);
  // repisa
  rbox(g, 2.3, 0.1, 0.95, marbleM, 0, 2.27, 0.05, 0.014);
  rbox(g, 2.1, 0.08, 0.86, stone, 0, 2.17, 0.0, 0.01);
  rbox(g, 0.7, 0.1, 0.5, stone, -0.9, 0.05, 0.3, 0.01);
  rbox(g, 0.7, 0.1, 0.5, stone, 0.9, 0.05, 0.3, 0.01);
  // morillos y troncos
  const iron = metalMat(0x15151a, 0.5, 0.8, 0.6);
  [-0.4, 0.4].forEach(sx => {
    box(g, 0.04, 0.3, 0.04, iron, sx, 0.2, 0.25);
    sph(g, 0.035, iron, sx, 0.37, 0.25);
    box(g, 0.03, 0.03, 0.5, iron, sx, 0.1, 0.0);
  });
  const logMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0c, roughness: 1 });
  const ember = new THREE.MeshStandardMaterial({ color: 0xff5a10, emissive: 0xff4000, emissiveIntensity: 1.4, roughness: 0.9 });
  [[0, 0.17, 0.12, 0.1], [0.05, 0.3, 0.05, -0.1], [-0.1, 0.17, -0.1, 0.2]].forEach(([x, y, z, ry], i) => {
    const lg = cyl(g, 0.07, 0.07, 0.8, i === 1 ? logMat : ember, x, y, z, 10); lg.rotation.z = Math.PI / 2; lg.rotation.y = ry;
  });
  // llamas
  const fireMats = [0xff5a10, 0xff9a20, 0xffe070].map((c, i) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8 + i * 0.05, side: THREE.DoubleSide }));
  [[0, 0.28, 0.6, 0], [0.2, 0.2, 0.42, 1], [-0.2, 0.2, 0.46, 1], [0.04, 0.14, 0.32, 2], [-0.1, 0.12, 0.28, 2]].forEach(([x, r, hh, mi], k) => {
    const f = new THREE.Mesh(new THREE.ConeGeometry(r, hh, 10, 1, true), fireMats[mi]);
    f.position.set(x, 0.3 + hh / 2, 0.0 + (k % 2) * 0.06); g.add(f);
  });
  const fireLight = new THREE.PointLight(0xff7020, 2.6, 6, 1.7);
  fireLight.position.set(0, 0.7, 0.5); g.add(fireLight);
  return { group: g, w: 2.2, d: 0.9 };
}

function makeChandelier(){
  const g = new THREE.Group();
  const metal = metalMat(0x9a7428, 0.28, 0.95, 1.0);
  const crystal = ENV.reg(new THREE.MeshStandardMaterial({ color: 0xf0f4ff, roughness: 0.05, transparent: true, opacity: 0.7, metalness: 0.1 }), 2);
  const flameMat = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffe090, emissiveIntensity: 3 });
  const waxMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.6 });
  // cadena y rosetón
  cyl(g, 0.006, 0.006, 1.3, metal, 0, 1.4, 0, 6).castShadow = false;
  for (let i = 0; i < 10; i++) torus(g, 0.014, 0.004, metal, 0, 0.9 + i * 0.12, 0, i % 2 ? Math.PI / 2 : 0, 0, 0).castShadow = false;
  lathe(g, [[0.001, 0.1], [0.12, 0.1], [0.14, 0.06], [0.07, 0.03], [0.05, 0], [0.09, -0.06], [0.16, -0.1], [0.1, -0.16], [0.001, -0.2]], metal, 0, 0, 0, 20).castShadow = false;
  // aro principal y brazos curvos con velas
  torus(g, 0.5, 0.014, metal, 0, -0.18, 0, Math.PI / 2, 0, 0);
  const arms = 6;
  for (let i = 0; i < arms; i++){
    const a = (i / arms) * Math.PI * 2;
    const cx = Math.cos(a), cz = Math.sin(a);
    tube(g, [[cx * 0.05, -0.12, cz * 0.05], [cx * 0.28, -0.04, cz * 0.28], [cx * 0.52, -0.22, cz * 0.52], [cx * 0.56, -0.3, cz * 0.56]], 0.012, metal, 18, 6);
    cyl(g, 0.035, 0.03, 0.03, metal, cx * 0.56, -0.31, cz * 0.56, 12);
    cyl(g, 0.016, 0.016, 0.14, waxMat, cx * 0.56, -0.23, cz * 0.56, 10);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.02, 10, 8), flameMat);
    fl.scale.set(1, 1.8, 1); fl.position.set(cx * 0.56, -0.12, cz * 0.56); g.add(fl);
    // lágrimas de cristal
    for (let k = 0; k < 3; k++){
      const aa = a + (k - 1) * 0.1;
      const cr = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 0), crystal);
      cr.scale.set(1, 1.7, 1); cr.position.set(Math.cos(aa) * 0.5, -0.27 - k * 0.04, Math.sin(aa) * 0.5); g.add(cr);
    }
  }
  // gota central de cristal
  const drop = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), crystal); drop.scale.set(1, 1.8, 1); drop.position.y = -0.38; g.add(drop);
  const light = new THREE.PointLight(0xffd682, 2.2, 12, 1.4);
  light.position.set(0, -0.2, 0);
  light.castShadow = true; light.shadow.mapSize.set(1024, 1024); light.shadow.bias = -0.003;
  g.add(light);
  g.traverse(o => { if (o.isMesh) o.castShadow = false; });   // la lámpara no se hace sombra a sí misma
  return g;
}

function makeGlobeStand(){
  const g = new THREE.Group();
  const globeTex = (() => {
    const c = mkCanvas(512, 256), x = c.getContext('2d');
    x.fillStyle = '#35607a'; x.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 26; i++){
      x.fillStyle = `rgba(${150 + Math.random() * 40 | 0},${130 + Math.random() * 40 | 0},${80 + Math.random() * 30 | 0},0.95)`;
      x.beginPath(); let px = Math.random() * 512, py = 40 + Math.random() * 180; x.moveTo(px, py);
      for (let k = 0; k < 9; k++){ px += (Math.random() - 0.5) * 70; py += (Math.random() - 0.5) * 36; x.lineTo(px, py); }
      x.closePath(); x.fill();
    }
    x.strokeStyle = 'rgba(40,30,10,0.35)'; x.lineWidth = 1;
    for (let i = 0; i < 16; i++){ x.beginPath(); x.moveTo(i * 32, 0); x.lineTo(i * 32, 256); x.stroke(); }
    for (let i = 0; i < 8; i++){ x.beginPath(); x.moveTo(0, i * 32); x.lineTo(512, i * 32); x.stroke(); }
    return new THREE.CanvasTexture(c);
  })();
  if (THREE.sRGBEncoding) globeTex.encoding = THREE.sRGBEncoding;
  // trípode torneado
  lathe(g, [[0.001, 0], [0.16, 0], [0.17, 0.02], [0.12, 0.05], [0.04, 0.1], [0.03, 0.3], [0.04, 0.45], [0.03, 0.6], [0.03, 0.9], [0.05, 0.94]], MAT.mahogany, 0, 0, 0, 20);
  [0, 2.09, 4.19].forEach(a => {
    const leg = rbox(g, 0.04, 0.03, 0.34, MAT.mahogany, Math.cos(a) * 0.16, 0.05, Math.sin(a) * 0.16, 0.008);
    leg.rotation.y = -a + Math.PI / 2;
  });
  // meridiano de latón y globo inclinado
  const tilt = new THREE.Group(); tilt.position.y = 1.2; tilt.rotation.z = 0.4; g.add(tilt);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 22), new THREE.MeshStandardMaterial({ map: globeTex, roughness: 0.45 }));
  globe.castShadow = true; tilt.add(globe);
  const mer = torus(tilt, 0.255, 0.008, MAT.brass, 0, 0, 0, 0, Math.PI / 2, 0);
  const eq = torus(tilt, 0.222, 0.005, MAT.brass, 0, 0, 0, Math.PI / 2, 0, 0);
  cyl(tilt, 0.008, 0.008, 0.62, MAT.brass, 0, 0, 0, 8);
  sph(tilt, 0.02, MAT.brass, 0, 0.31, 0); sph(tilt, 0.02, MAT.brass, 0, -0.31, 0);
  cyl(g, 0.012, 0.012, 0.3, MAT.brass, 0, 1.02, 0, 8);
  return { group: g, w: 0.4, d: 0.4 };
}

function makeVanityMirror(){
  const g = new THREE.Group();
  const frame = metalMat(0xa88030, 0.35, 0.9, 0.9);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffe090, emissiveIntensity: 2.5 });
  rbox(g, 1.04, 1.44, 0.07, frame, 0, 1.4, 0, 0.02);
  rbox(g, 0.92, 1.32, 0.04, MAT.woodDark, 0, 1.4, 0.03, 0.012);
  const mp = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.26), MAT.mirror);
  mp.position.set(0, 1.4, 0.055); g.add(mp);
  for (let i = 0; i < 10; i++){
    const a = (i / 10) * Math.PI * 2;
    const b = sph(g, 0.035, bulbMat, Math.cos(a) * 0.58, 1.4 + Math.sin(a) * 0.8, 0.08);
    b.castShadow = false;
    cyl(g, 0.02, 0.02, 0.02, MAT.brass, Math.cos(a) * 0.58, 1.4 + Math.sin(a) * 0.8, 0.065, 10).rotation.x = Math.PI / 2;
  }
  // pie: dos ménsulas
  [-0.4, 0.4].forEach(sx => box(g, 0.05, 0.7, 0.05, MAT.woodDark, sx, 0.35, -0.02));
  rbox(g, 1.05, 0.05, 0.4, MAT.woodDark, 0, 0.72, 0.1, 0.01);
  const light = new THREE.PointLight(0xffe090, 1.5, 4, 1.5);
  light.position.set(0, 1.4, 0.3); g.add(light);
  return { group: g, w: 1.15, d: 0.2 };
}

function makePond(){
  const g = new THREE.Group();
  const water = new THREE.Mesh(new THREE.CircleGeometry(1.8, 56),
    ENV.reg(new THREE.MeshStandardMaterial({ color: 0x0a1c2c, roughness: 0.04, metalness: 0.85 }), 1.6));
  water.rotation.x = -Math.PI / 2; water.position.y = 0.02; g.add(water);
  // ondas
  [0.5, 0.95, 1.4].forEach(r => {
    const rg = new THREE.Mesh(new THREE.RingGeometry(r, r + 0.012, 48), new THREE.MeshBasicMaterial({ color: 0x6a8aaa, transparent: true, opacity: 0.18, side: THREE.DoubleSide }));
    rg.rotation.x = -Math.PI / 2; rg.position.y = 0.025; g.add(rg);
  });
  // borde de piedras irregulares
  const stoneM = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.9 });
  const n = 34;
  for (let i = 0; i < n; i++){
    const a = (i / n) * Math.PI * 2;
    const geo = new THREE.DodecahedronGeometry(0.18 + Math.random() * 0.08, 1);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) * 1.2, p.getY(k) * 0.55, p.getZ(k));
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, stoneM);
    m.position.set(Math.cos(a) * 1.9, 0.06, Math.sin(a) * 1.9); m.rotation.y = -a + Math.random() * 0.4;
    m.castShadow = m.receiveShadow = true; g.add(m);
  }
  // nenúfares con flor
  const lilyM = new THREE.MeshStandardMaterial({ color: 0x2a5a2a, roughness: 0.7, side: THREE.DoubleSide });
  const flowerM = new THREE.MeshStandardMaterial({ color: 0xf0c0d0, roughness: 0.6 });
  for (let i = 0; i < 12; i++){
    const a = Math.random() * Math.PI * 2, r = Math.random() * 1.45;
    const lily = new THREE.Mesh(new THREE.CircleGeometry(0.13 + Math.random() * 0.06, 16, 0.3, Math.PI * 2 - 0.5), lilyM);
    lily.rotation.x = -Math.PI / 2; lily.rotation.z = Math.random() * 6;
    lily.position.set(Math.cos(a) * r, 0.026, Math.sin(a) * r); g.add(lily);
    if (i % 4 === 0) for (let k = 0; k < 6; k++){
      const pet = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 6), flowerM);
      pet.position.set(Math.cos(a) * r + Math.cos(k) * 0.03, 0.06, Math.sin(a) * r + Math.sin(k) * 0.03);
      pet.rotation.set(Math.sin(k) * 0.5, 0, -Math.cos(k) * 0.5); g.add(pet);
    }
  }
  return { group: g, w: 3.8, d: 3.8 };
}

/* ====================================================================
   MUEBLES NUEVOS (para dar más vida a cada sala)
   ==================================================================== */

/* Reloj de pie */
function makeGrandfatherClock(){
  const g = new THREE.Group();
  const face = (() => {
    const c = mkCanvas(256), x = c.getContext('2d');
    x.fillStyle = '#efe6cc'; x.beginPath(); x.arc(128, 128, 124, 0, 6.283); x.fill();
    x.strokeStyle = '#2a1a08'; x.lineWidth = 5; x.stroke();
    x.fillStyle = '#2a1a08'; x.font = 'bold 26px serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'].forEach((n, i) => {
      const a = i / 12 * 6.283 - 1.5708; x.fillText(n, 128 + Math.cos(a) * 94, 128 + Math.sin(a) * 94);
    });
    return new THREE.CanvasTexture(c);
  })();
  if (THREE.sRGBEncoding) face.encoding = THREE.sRGBEncoding;
  rbox(g, 0.55, 0.2, 0.36, MAT.mahogany, 0, 0.1, 0, 0.015);
  rbox(g, 0.42, 1.25, 0.3, MAT.mahogany, 0, 0.82, 0, 0.012);
  // cuerpo con ventanilla del péndulo
  box(g, 0.2, 0.7, 0.01, new THREE.MeshStandardMaterial({ color: 0x120c08, roughness: 0.6 }), 0, 0.85, 0.155);
  rbox(g, 0.26, 0.76, 0.02, MAT.brass, 0, 0.85, 0.15, 0.004).scale.set(1, 1, 0.4);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.7), MAT.glass); glass.position.set(0, 0.85, 0.162); g.add(glass);
  const pend = new THREE.Group(); pend.position.set(0, 1.15, 0.12); g.add(pend);
  cyl(pend, 0.004, 0.004, 0.5, MAT.brass, 0, -0.25, 0, 6);
  cyl(pend, 0.07, 0.07, 0.015, MAT.brass, 0, -0.5, 0, 24).rotation.x = Math.PI / 2;
  // cabeza del reloj con esfera
  rbox(g, 0.5, 0.52, 0.34, MAT.mahogany, 0, 1.7, 0, 0.015);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.19, 32), new THREE.MeshStandardMaterial({ map: face, roughness: 0.5 }));
  disc.position.set(0, 1.72, 0.172); g.add(disc);
  torus(g, 0.2, 0.012, MAT.brass, 0, 1.72, 0.172, 0, 0, 0);
  const hh = box(g, 0.012, 0.11, 0.004, MAT.black, 0, 1.76, 0.18); hh.geometry.translate(0, 0.045, 0); hh.position.y = 1.72; hh.rotation.z = -0.5;
  const mh = box(g, 0.008, 0.16, 0.004, MAT.black, 0, 1.8, 0.182); mh.geometry.translate(0, 0.07, 0); mh.position.y = 1.72; mh.rotation.z = 1.8;
  // remate arqueado
  rbox(g, 0.56, 0.06, 0.38, MAT.woodDark, 0, 2.0, 0, 0.012);
  const pedi = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.34, 20, 1, false, 0, Math.PI), MAT.mahogany);
  pedi.rotation.set(Math.PI / 2, 0, Math.PI / 2); pedi.scale.set(1, 1, 0.5); pedi.position.set(0, 2.03, 0); g.add(pedi);
  sph(g, 0.035, MAT.brass, 0, 2.3, 0);
  return { group: g, w: 0.6, d: 0.42 };
}

/* Mesita auxiliar redonda */
function makeSideTable(){
  const g = new THREE.Group();
  cyl(g, 0.3, 0.3, 0.035, MAT.woodLight, 0, 0.62, 0, 32);
  torus(g, 0.3, 0.014, MAT.woodLight, 0, 0.62, 0, Math.PI / 2, 0, 0);
  lathe(g, [[0.001, 0], [0.18, 0], [0.18, 0.02], [0.06, 0.06], [0.04, 0.12], [0.05, 0.2], [0.035, 0.3], [0.04, 0.45], [0.05, 0.5], [0.12, 0.6]], MAT.woodDark, 0, 0, 0, 24);
  return { group: g, w: 0.65, d: 0.65 };
}

/* Mesa baja con tablero de mármol */
function makeCoffeeTable(){
  const g = new THREE.Group();
  const top = ENV.reg(new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.2 }), 0.7);
  rbox(g, 1.1, 0.04, 0.6, top, 0, 0.43, 0, 0.012);
  rbox(g, 1.14, 0.03, 0.64, MAT.brass, 0, 0.40, 0, 0.008);
  [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([x, z]) => {
    lathe(g, [[0.001, 0], [0.02, 0], [0.028, 0.1], [0.02, 0.3], [0.03, 0.39]], MAT.woodDark, x, 0, z, 12);
  });
  box(g, 1.0, 0.03, 0.04, MAT.woodDark, 0, 0.12, 0.25); box(g, 1.0, 0.03, 0.04, MAT.woodDark, 0, 0.12, -0.25);
  return { group: g, w: 1.2, d: 0.7 };
}

/* Sofá Chesterfield */
function makeSofa(){
  const g = new THREE.Group();
  const L = MAT.leather;
  rbox(g, 1.9, 0.14, 0.88, MAT.woodDark, 0, 0.18, 0, 0.012);
  [[-0.85, 0.36], [0.85, 0.36], [-0.85, -0.36], [0.85, -0.36]].forEach(([x, z]) => lathe(g, [[0.001, 0], [0.04, 0], [0.045, 0.04], [0.05, 0.12]], MAT.woodDark, x, 0, z, 12));
  puffBox(g, 1.5, 0.2, 0.8, L, 0, 0.36, 0.04, { n: 4, bulge: 0.25, seg: 14 });
  [-0.55, 0.55].forEach(px => puffBox(g, 0.72, 0.14, 0.74, L, px, 0.5, 0.06, { n: 4, bulge: 0.35, seg: 8 }));
  puffBox(g, 1.9, 0.62, 0.2, L, 0, 0.72, -0.34, { n: 4, bulge: 0.15, seg: 16 });
  [-0.85, 0.85].forEach(sx => {
    puffBox(g, 0.2, 0.46, 0.88, L, sx, 0.52, 0, { n: 4, bulge: 0.12, seg: 8 });
    const roll = cyl(g, 0.11, 0.11, 0.88, L, sx, 0.78, 0, 18); roll.rotation.x = Math.PI / 2;
  });
  // capitoné
  for (let r = 0; r < 2; r++) for (let c = 0; c < 9; c++){
    const bx = -0.76 + c * 0.19 + (r % 2) * 0.095, by = 0.6 + r * 0.2;
    if (Math.abs(bx) < 0.84) sph(g, 0.011, MAT.brass, bx, by, -0.235);
  }
  return { group: g, w: 2.0, d: 0.95 };
}

/* Lámpara de pie */
function makeFloorLamp(){
  const g = new THREE.Group();
  const shadeMat = new THREE.MeshStandardMaterial({ color: 0xe8d4a0, emissive: 0xf0c070, emissiveIntensity: 0.6, transparent: true, opacity: 0.92, side: THREE.DoubleSide });
  lathe(g, [[0.001, 0], [0.16, 0], [0.17, 0.02], [0.1, 0.05], [0.03, 0.1], [0.02, 0.4], [0.026, 0.5], [0.02, 0.6], [0.016, 1.5], [0.02, 1.55]], MAT.brass, 0, 0, 0, 24);
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.26, 0.3, 28, 1, true), shadeMat); sh.position.y = 1.72; g.add(sh);
  torus(g, 0.17, 0.004, MAT.brass, 0, 1.87, 0, Math.PI / 2, 0, 0); torus(g, 0.26, 0.004, MAT.brass, 0, 1.57, 0, Math.PI / 2, 0, 0);
  sph(g, 0.05, new THREE.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffe090, emissiveIntensity: 2.5 }), 0, 1.7, 0);
  const light = new THREE.PointLight(0xffc878, 1.0, 6, 1.7); light.position.y = 1.7; g.add(light);
  return { group: g, w: 0.5, d: 0.5 };
}

/* Candelabro de sobremesa */
function makeCandelabra(){
  const g = new THREE.Group();
  const flame = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffe090, emissiveIntensity: 3 });
  const wax = new THREE.MeshStandardMaterial({ color: 0xf2ead2, roughness: 0.6 });
  lathe(g, [[0.001, 0], [0.07, 0], [0.075, 0.015], [0.04, 0.04], [0.02, 0.08], [0.03, 0.12], [0.015, 0.18], [0.012, 0.3]], MAT.brass, 0, 0, 0, 18);
  [-1, 0, 1].forEach(i => {
    if (i !== 0) tube(g, [[0, 0.16, 0], [i * 0.06, 0.2, 0], [i * 0.11, 0.26, 0]], 0.007, MAT.brass, 12, 6);
    const x = i * 0.11, y = i === 0 ? 0.3 : 0.26;
    cyl(g, 0.02, 0.012, 0.02, MAT.brass, x, y, 0, 10);
    cyl(g, 0.012, 0.012, 0.09, wax, x, y + 0.055, 0, 8);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), flame); f.scale.set(1, 1.9, 1); f.position.set(x, y + 0.12, 0); g.add(f);
  });
  const l = new THREE.PointLight(0xffc060, 0.5, 2.5, 2); l.position.y = 0.45; g.add(l);
  return { group: g, w: 0.3, d: 0.15 };
}

/* Pila de libros / sobremesa */
function makeBookStack(n){
  n = n || 3;
  const g = new THREE.Group();
  const cols = [0x7a2a1a, 0x2a4a3a, 0x1a3a5a, 0x6a4a1a, 0x4a1a2a];
  let y = 0;
  for (let i = 0; i < n; i++){
    const bh = 0.035 + Math.random() * 0.03, bw = 0.2 + Math.random() * 0.06, bd = 0.15 + Math.random() * 0.05;
    const b = rbox(g, bw, bh, bd, new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.75 }), 0, y + bh / 2, 0, 0.004);
    b.rotation.y = (Math.random() - 0.5) * 0.5;
    box(g, bw * 0.96, bh * 0.7, bd * 0.96, MAT.paper, 0, y + bh / 2, 0.003).rotation.y = b.rotation.y;
    y += bh;
  }
  return { group: g, w: 0.3, d: 0.25 };
}

/* Baúl de viaje */
function makeTrunk(){
  const g = new THREE.Group();
  const leather = MAT.leather;
  rbox(g, 1.0, 0.42, 0.55, leather, 0, 0.24, 0, 0.02);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.0, 20, 1, false, 0, Math.PI), leather);
  lid.rotation.set(0, 0, Math.PI / 2); lid.rotation.order = 'ZYX'; lid.rotation.y = Math.PI / 2; lid.position.set(0, 0.45, 0); lid.scale.set(1, 1, 1);
  lid.rotation.set(Math.PI / 2, 0, Math.PI / 2); lid.castShadow = true; lid.receiveShadow = true;
  const lidG = new THREE.Group(); lidG.add(lid); lid.rotation.set(0, 0, Math.PI / 2); lid.position.set(0, 0, 0); lid.rotation.y = 0;
  lidG.position.set(0, 0.44, 0); lidG.rotation.y = Math.PI / 2; g.add(lidG);
  lid.rotation.set(Math.PI / 2, 0, 0); lid.rotation.z = 0;
  [-0.38, 0, 0.38].forEach(x => { rbox(g, 0.04, 0.44, 0.58, MAT.brass, x, 0.24, 0, 0.006); });
  [[-0.5, -0.27], [0.5, -0.27], [-0.5, 0.27], [0.5, 0.27]].forEach(([x, z]) => sph(g, 0.03, MAT.brass, x, 0.04, z));
  rbox(g, 0.1, 0.1, 0.03, MAT.brass, 0, 0.32, 0.29, 0.006);
  return { group: g, w: 1.1, d: 0.65 };
}

/* Pequeño aplique de pared con luz cálida */
function makeSconce(){
  const g = new THREE.Group();
  const flame = new THREE.MeshStandardMaterial({ color: 0xfff0b0, emissive: 0xffe090, emissiveIntensity: 3 });
  rbox(g, 0.1, 0.22, 0.02, MAT.brass, 0, 0, 0, 0.006);
  tube(g, [[0, -0.02, 0.01], [0, -0.1, 0.1], [0, -0.06, 0.18]], 0.01, MAT.brass, 14, 6);
  cyl(g, 0.045, 0.03, 0.03, MAT.brass, 0, -0.04, 0.18, 12);
  cyl(g, 0.016, 0.016, 0.1, new THREE.MeshStandardMaterial({ color: 0xf2ead2, roughness: 0.6 }), 0, 0.02, 0.18, 8);
  const f = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), flame); f.scale.set(1, 2, 1); f.position.set(0, 0.1, 0.18); g.add(f);
  const l = new THREE.PointLight(0xffc060, 0.35, 3, 2); l.position.set(0, 0.1, 0.22); g.add(l);
  return g;
}

/* Barril */
function makeBarrel(){
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4424, roughness: 0.85, map: MAT.wood.map }); wood.userData.tile = 0.6;
  const pts = []; for (let i = 0; i <= 12; i++){ const t = i / 12, y = t * 0.9; pts.push([0.28 + Math.sin(t * Math.PI) * 0.09, y]); }
  lathe(g, pts, wood, 0, 0, 0, 24);
  [0.1, 0.3, 0.6, 0.8].forEach(y => { const t = y / 0.9; torus(g, 0.28 + Math.sin(t * Math.PI) * 0.09 + 0.004, 0.012, MAT.steelDark, 0, y, 0, Math.PI / 2, 0, 0); });
  cyl(g, 0.27, 0.27, 0.02, wood, 0, 0.9, 0, 24);
  return { group: g, w: 0.7, d: 0.7 };
}

/* Butaca de teatro con asiento abatible */
function makeTheaterSeat(){
  const g = new THREE.Group();
  const velvet = MAT.fabricRed;
  // laterales de hierro
  [-0.26, 0.26].forEach(sx => {
    rbox(g, 0.04, 0.9, 0.5, MAT.black, sx, 0.45, 0, 0.01);
    rbox(g, 0.07, 0.06, 0.46, MAT.woodDark, sx, 0.62, 0.02, 0.01);
  });
  puffBox(g, 0.46, 0.1, 0.46, velvet, 0, 0.46, 0.04, { n: 4, bulge: 0.3, seg: 8 });
  const back = puffBox(g, 0.46, 0.5, 0.1, velvet, 0, 0.8, -0.2, { n: 4, bulge: 0.3, seg: 8 });
  back.rotation.x = -0.1;
  return { group: g, w: 0.56, d: 0.55 };
}
/* Mesa de piedra de jardín */
function makeStoneTable(){
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x6a6860, roughness: 0.92 });
  rbox(g, 1.6, 0.1, 0.8, stone, 0, 0.55, 0, 0.03);
  rbox(g, 0.3, 0.52, 0.6, stone, -0.5, 0.26, 0, 0.03);
  rbox(g, 0.3, 0.52, 0.6, stone, 0.5, 0.26, 0, 0.03);
  rbox(g, 0.5, 0.06, 0.8, stone, 0, 0.03, 0, 0.02).visible = false;
  // musgo
  const moss = new THREE.MeshStandardMaterial({ color: 0x2a4a22, roughness: 1 });
  for (let i = 0; i < 6; i++) sph(g, 0.06 + Math.random() * 0.05, moss, -0.7 + Math.random() * 1.4, 0.59, -0.35 + Math.random() * 0.7).scale.set(1, 0.25, 1);
  return { group: g, w: 1.7, d: 0.9 };
}
/* Escalera de biblioteca con rueda de latón */
function makeLibraryLadder(h){
  h = h || 2.8;
  const g = new THREE.Group();
  const lean = 0.22;
  const len = Math.sqrt(h * h + lean * lean);
  const ang = Math.atan2(lean, h);
  [-0.22, 0.22].forEach(sx => {
    const r = rbox(g, 0.045, len, 0.03, MAT.woodLight, sx, h / 2, 0, 0.008);
    r.rotation.x = ang;
  });
  for (let i = 0; i < 9; i++){
    const y = 0.3 + i * (h - 0.5) / 8;
    rbox(g, 0.44, 0.03, 0.1, MAT.woodLight, 0, y, -(h - y) / h * 0.0 + (y / h) * -lean + 0.0, 0.006);
  }
  [-0.22, 0.22].forEach(sx => { const w = cyl(g, 0.03, 0.03, 0.02, MAT.brass, sx, h - 0.04, -lean - 0.02, 14); w.rotation.z = Math.PI / 2; });
  return { group: g, w: 0.6, d: 0.4 };
}
/* Poste y barra de verja de hierro forjado */
function makeFencePost(){
  const g = new THREE.Group();
  const iron = metalMat(0x15151a, 0.5, 0.8, 0.5);
  lathe(g, [[0.001, 0], [0.05, 0], [0.05, 0.05], [0.035, 0.1], [0.035, 1.1], [0.05, 1.15], [0.03, 1.2], [0.001, 1.32]], iron, 0, 0, 0, 10);
  sph(g, 0.045, iron, 0, 1.2, 0);
  return g;
}
