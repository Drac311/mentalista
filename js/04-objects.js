/* ====================================================================
   04-OBJECTS — Objetos investigables (OBJ.*) y selector por nombre
   ==================================================================== */
const OBJ = {};
OBJ.taza = () => { const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.1, 24, 1, true), MAT.ceramic);
  body.position.y = 0.05; body.castShadow = true; g.add(body);
  cyl(g, 0.048, 0.048, 0.006, MAT.ceramic, 0, 0.003, 0, 24);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.009, 10, 20, Math.PI*1.4), MAT.ceramic);
  h.position.set(0.065, 0.055, 0); h.rotation.z = -Math.PI*0.3; g.add(h);
  const liq = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), new THREE.MeshStandardMaterial({ color: 0x3a2010, roughness: 0.15 }));
  liq.rotation.x = -Math.PI/2; liq.position.y = 0.082; g.add(liq);
  return g; };
OBJ.vaso = () => { const g = new THREE.Group();
  cyl(g, 0.045, 0.042, 0.12, MAT.glass, 0, 0.06, 0, 20);
  cyl(g, 0.041, 0.038, 0.07, new THREE.MeshStandardMaterial({ color: 0x8a4010, roughness: 0.3 }), 0, 0.035, 0, 20);
  cyl(g, 0.042, 0.042, 0.008, MAT.glass, 0, 0.004, 0, 20);
  return g; };
OBJ.copa = () => { const g = new THREE.Group();
  cyl(g, 0.058, 0.022, 0.13, MAT.glass, 0, 0.15, 0, 24);
  cyl(g, 0.05, 0.018, 0.07, new THREE.MeshStandardMaterial({ color: 0x4a0818, roughness: 0.2, transparent: true, opacity: 0.85 }), 0, 0.125, 0, 24);
  cyl(g, 0.008, 0.008, 0.09, MAT.glass, 0, 0.05, 0, 12);
  cyl(g, 0.045, 0.048, 0.008, MAT.glass, 0, 0.004, 0, 24);
  return g; };
OBJ.botella = () => { const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: 0x2a3a1a, roughness: 0.25, metalness: 0.3, transparent: true, opacity: 0.9 });
  cyl(g, 0.05, 0.05, 0.2, glass, 0, 0.1, 0, 20);
  cyl(g, 0.03, 0.05, 0.04, glass, 0, 0.22, 0, 20);
  cyl(g, 0.022, 0.03, 0.09, glass, 0, 0.285, 0, 16);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.08), MAT.paper);
  lbl.position.set(0.051, 0.1, 0); lbl.rotation.y = Math.PI/2; g.add(lbl);
  cyl(g, 0.024, 0.024, 0.035, new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 }), 0, 0.345, 0, 12);
  return g; };
OBJ.frasco = () => { const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: 0xa0c0d0, roughness: 0.1, metalness: 0.15, transparent: true, opacity: 0.65 });
  cyl(g, 0.028, 0.032, 0.07, glass, 0, 0.035, 0, 16);
  cyl(g, 0.022, 0.028, 0.02, glass, 0, 0.08, 0, 16);
  cyl(g, 0.024, 0.024, 0.018, MAT.steelDark, 0, 0.1, 0, 16);
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.04), MAT.paper);
  lbl.position.set(0, 0.04, 0.032); g.add(lbl);
  return g; };
OBJ.azucarero = () => { const g = new THREE.Group();
  const cer = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.3 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x4a6a9a, roughness: 0.35 });
  cyl(g, 0.045, 0.045, 0.07, cer, 0, 0.035, 0, 20);
  cyl(g, 0.048, 0.048, 0.008, blue, 0, 0.07, 0, 20);
  cyl(g, 0.05, 0.045, 0.05, cer, 0, 0.12, 0, 20);
  cyl(g, 0.015, 0.015, 0.025, blue, 0, 0.155, 0, 12);
  sph(g, 0.012, blue, 0, 0.17, 0);
  return g; };
OBJ.lata = () => { const g = new THREE.Group();
  cyl(g, 0.033, 0.033, 0.12, MAT.silver, 0, 0.06, 0, 20);
  cyl(g, 0.0335, 0.0335, 0.07, new THREE.MeshStandardMaterial({ color: 0x8a1a1a, roughness: 0.7 }), 0, 0.06, 0, 20);
  cyl(g, 0.033, 0.033, 0.002, MAT.silver, 0, 0.121, 0, 20);
  return g; };
OBJ.tetera = () => { const g = new THREE.Group();
  const cer = new THREE.MeshStandardMaterial({ color: 0xe0d8c8, roughness: 0.4 });
  sph(g, 0.09, cer, 0, 0.08, 0);
  cyl(g, 0.05, 0.06, 0.04, cer, 0, 0.16, 0, 20);
  cyl(g, 0.03, 0.03, 0.015, cer, 0, 0.185, 0, 16);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.1, 10), cer);
  spout.position.set(0.1, 0.1, 0); spout.rotation.z = 0.7; g.add(spout);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 8, 16, Math.PI*1.2), cer);
  h.position.set(-0.08, 0.1, 0); h.rotation.z = -Math.PI*0.3; g.add(h);
  return g; };
OBJ.bandeja = () => { const g = new THREE.Group();
  box(g, 0.35, 0.01, 0.24, MAT.brass, 0, 0.005, 0);
  box(g, 0.36, 0.03, 0.015, MAT.brass, 0, 0.015, 0.12);
  box(g, 0.36, 0.03, 0.015, MAT.brass, 0, 0.015, -0.12);
  box(g, 0.015, 0.03, 0.24, MAT.brass, 0.175, 0.015, 0);
  box(g, 0.015, 0.03, 0.24, MAT.brass, -0.175, 0.015, 0);
  return g; };
OBJ.cuchillo = () => { const g = new THREE.Group();
  box(g, 0.26, 0.004, 0.04, MAT.steel, 0.13, 0.006, 0);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 4), MAT.steel);
  tip.rotation.z = -Math.PI/2; tip.position.set(0.275, 0.006, 0); g.add(tip);
  box(g, 0.012, 0.016, 0.042, MAT.brass, -0.006, 0.008, 0);
  box(g, 0.09, 0.02, 0.03, MAT.woodDark, -0.055, 0.01, 0);
  return g; };
OBJ.tijeras = () => { const g = new THREE.Group();
  box(g, 0.14, 0.003, 0.014, MAT.steel, 0.07, 0.008, 0.01).rotation.y = 0.02;
  box(g, 0.14, 0.003, 0.014, MAT.steel, 0.07, 0.008, -0.01).rotation.y = -0.02;
  const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 8, 16), MAT.woodDark);
  r1.rotation.x = Math.PI/2; r1.position.set(-0.06, 0.008, 0.03); g.add(r1);
  const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.005, 8, 16), MAT.woodDark);
  r2.rotation.x = Math.PI/2; r2.position.set(-0.06, 0.008, -0.03); g.add(r2);
  return g; };
OBJ.pistola = () => { const g = new THREE.Group();
  box(g, 0.16, 0.028, 0.024, MAT.black, 0.02, 0.04, 0);
  box(g, 0.08, 0.004, 0.018, MAT.black, 0, 0.056, 0);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16, Math.PI*1.2), MAT.black);
  guard.position.set(-0.035, 0.02, 0); guard.rotation.z = Math.PI*0.1; g.add(guard);
  box(g, 0.04, 0.08, 0.024, MAT.leather, -0.062, 0.005, 0).rotation.z = -0.2;
  return g; };
OBJ.martillo = () => { const g = new THREE.Group();
  cyl(g, 0.012, 0.015, 0.2, MAT.wood, 0, 0.1, 0, 12);
  box(g, 0.09, 0.04, 0.04, MAT.steelDark, 0, 0.21, 0);
  box(g, 0.05, 0.045, 0.045, MAT.steelDark, 0, 0.21, 0);
  return g; };
OBJ.destornillador = () => { const g = new THREE.Group();
  cyl(g, 0.004, 0.004, 0.14, MAT.steel, 0, 0.07, 0, 8);
  box(g, 0.006, 0.008, 0.006, MAT.steel, 0, 0.14, 0);
  cyl(g, 0.018, 0.014, 0.06, new THREE.MeshStandardMaterial({ color: 0x8a1a1a, roughness: 0.7 }), 0, 0.17, 0, 12);
  return g; };
OBJ.alicates = () => { const g = new THREE.Group();
  box(g, 0.1, 0.008, 0.02, MAT.steelDark, 0.05, 0.008, 0.02).rotation.y = 0.05;
  box(g, 0.1, 0.008, 0.02, MAT.steelDark, 0.05, 0.008, -0.02).rotation.y = -0.05;
  box(g, 0.09, 0.012, 0.03, MAT.black, -0.06, 0.008, 0.03);
  box(g, 0.09, 0.012, 0.03, MAT.black, -0.06, 0.008, -0.03);
  sph(g, 0.012, MAT.steelDark, 0, 0.008, 0);
  return g; };
OBJ.llaveInglesa = () => { const g = new THREE.Group();
  cyl(g, 0.014, 0.014, 0.22, MAT.steelDark, 0, 0.11, 0, 12);
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.009, 8, 16, Math.PI*1.6), MAT.steelDark);
  head.position.set(0, 0.23, 0); head.rotation.x = Math.PI/2; g.add(head);
  return g; };
OBJ.cuchilla = () => { const g = new THREE.Group();
  box(g, 0.18, 0.003, 0.025, MAT.steel, 0.09, 0.005, 0);
  return g; };
OBJ.carta = () => { const g = new THREE.Group();
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.24, 8, 8), MAT.paper);
  sheet.rotation.x = -Math.PI/2;
  const pos = sheet.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x*6)*0.006 + Math.sin(y*8)*0.004);
  }
  sheet.geometry.computeVertexNormals();
  sheet.position.y = 0.005; g.add(sheet);
  for (let i = 0; i < 6; i++){
    const line = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.003), new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.85 }));
    line.rotation.x = -Math.PI/2;
    line.position.set(-0.01, 0.012, -0.08 + i*0.03);
    g.add(line);
  }
  return g; };
OBJ.sobre = () => { const g = new THREE.Group();
  const front = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.12), MAT.paper);
  front.rotation.x = -Math.PI/2; front.position.y = 0.005; g.add(front);
  const flap = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.07), MAT.paperDark);
  flap.rotation.x = -Math.PI/2; flap.position.set(0, 0.006, -0.02); flap.rotation.z = 0.15; g.add(flap);
  return g; };
OBJ.libro = () => { const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0x5a1a1a, roughness: 0.7 });
  box(g, 0.17, 0.008, 0.24, cover, 0, 0.004, 0);
  box(g, 0.16, 0.028, 0.23, MAT.paperDark, 0.005, 0.022, 0);
  box(g, 0.17, 0.008, 0.24, cover, 0, 0.04, 0);
  box(g, 0.008, 0.04, 0.24, cover, -0.085, 0.02, 0);
  return g; };
OBJ.cuaderno = () => { const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.7 });
  box(g, 0.14, 0.006, 0.18, cover, 0, 0.003, 0);
  box(g, 0.13, 0.02, 0.17, MAT.paperDark, 0.005, 0.016, 0);
  box(g, 0.14, 0.006, 0.18, cover, 0, 0.029, 0);
  return g; };
OBJ.periodico = () => { const g = new THREE.Group();
  const paper = new THREE.MeshStandardMaterial({ color: 0xe8e0c8, roughness: 0.9 });
  const ink = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.85 });
  box(g, 0.28, 0.005, 0.4, paper, 0, 0.005, 0);
  box(g, 0.2, 0.001, 0.03, ink, 0, 0.008, -0.14);
  for (let i = 0; i < 8; i++) box(g, 0.2, 0.001, 0.002, ink, 0, 0.008, -0.08 + i*0.025);
  return g; };
OBJ.revista = () => { const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0x8a2a4a, roughness: 0.75 });
  box(g, 0.18, 0.008, 0.24, cover, 0, 0.004, 0);
  box(g, 0.17, 0.004, 0.23, MAT.paperDark, 0, 0.014, 0);
  box(g, 0.18, 0.008, 0.24, cover, 0, 0.024, 0);
  return g; };
OBJ.foto = () => { const g = new THREE.Group();
  box(g, 0.1, 0.001, 0.13, MAT.paper, 0, 0.001, 0);
  box(g, 0.08, 0.0005, 0.1, new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.9 }), 0, 0.002, -0.01);
  return g; };
OBJ.carpeta = () => { const g = new THREE.Group();
  const cover = new THREE.MeshStandardMaterial({ color: 0xa88040, roughness: 0.85 });
  box(g, 0.24, 0.008, 0.32, cover, 0, 0.004, 0);
  box(g, 0.22, 0.006, 0.3, MAT.paper, 0.005, 0.01, 0);
  box(g, 0.24, 0.008, 0.32, cover, 0, 0.017, 0);
  return g; };
OBJ.certificado = () => { const g = new THREE.Group();
  box(g, 0.2, 0.005, 0.28, MAT.paper, 0, 0.005, 0);
  box(g, 0.16, 0.001, 0.002, MAT.gold, 0, 0.008, 0);
  cyl(g, 0.02, 0.02, 0.003, new THREE.MeshStandardMaterial({ color: 0x8a1818, roughness: 0.6 }), 0.06, 0.008, 0.09, 20);
  return g; };
OBJ.ticket = () => { const g = new THREE.Group();
  box(g, 0.08, 0.0005, 0.05, MAT.paper, 0, 0.001, 0);
  return g; };
OBJ.panuelo = () => { const g = new THREE.Group();
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18, 8, 8), MAT.paper);
  cloth.rotation.x = -Math.PI/2;
  const pos = cloth.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++){
    const x = pos.getX(i), y = pos.getY(i);
    pos.setZ(i, Math.sin(x*8)*Math.cos(y*8)*0.005);
  }
  cloth.geometry.computeVertexNormals();
  cloth.castShadow = true; g.add(cloth);
  return g; };
OBJ.guante = () => { const g = new THREE.Group();
  box(g, 0.09, 0.02, 0.11, MAT.leather, 0, 0.01, 0);
  box(g, 0.09, 0.022, 0.04, MAT.woodDark, 0, 0.011, 0.07);
  for (let i = 0; i < 4; i++){
    const fg = new THREE.Group();
    box(fg, 0.018, 0.014, 0.035, MAT.leather, 0, 0.008, -0.017);
    box(fg, 0.016, 0.012, 0.03, MAT.leather, 0, 0.008, -0.048);
    fg.position.set(-0.03 + i*0.02, 0.01, -0.055);
    fg.rotation.x = -0.15;
    g.add(fg);
  }
  return g; };
OBJ.guantes = () => { const g = new THREE.Group();
  const a = OBJ.guante(); const b = OBJ.guante();
  b.position.set(0.16, 0, 0.06); b.rotation.y = 0.5;
  g.add(a); g.add(b);
  return g; };
OBJ.llave = () => { const g = new THREE.Group();
  const shaft = cyl(g, 0.006, 0.006, 0.11, MAT.brass, 0.02, 0.006, 0, 12);
  shaft.rotation.z = Math.PI/2;
  const head = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.007, 10, 20), MAT.brass);
  head.rotation.x = Math.PI/2; head.position.set(-0.055, 0.006, 0); g.add(head);
  box(g, 0.008, 0.012, 0.018, MAT.brass, 0.06, 0.012, 0.008);
  return g; };
OBJ.llavero = () => { const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 8, 16), MAT.brass);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.006; g.add(ring);
  const k1 = OBJ.llave(); k1.position.set(0.03, 0, 0.02); g.add(k1);
  const k2 = OBJ.llave(); k2.position.set(0.03, 0, -0.02); k2.rotation.y = 0.3; g.add(k2);
  return g; };
OBJ.reloj = () => { const g = new THREE.Group();
  cyl(g, 0.032, 0.032, 0.012, MAT.gold, 0, 0.006, 0, 24);
  cyl(g, 0.028, 0.028, 0.014, MAT.ceramic, 0, 0.007, 0, 24);
  box(g, 0.003, 0.001, 0.02, MAT.black, 0, 0.014, -0.005);
  box(g, 0.024, 0.008, 0.09, MAT.leather, 0, 0.004, 0.06);
  return g; };
OBJ.relojPared = () => { const g = new THREE.Group();
  cyl(g, 0.12, 0.12, 0.04, MAT.gold, 0, 0.02, 0, 24);
  cyl(g, 0.11, 0.11, 0.045, MAT.ceramic, 0, 0.02, 0, 24);
  for (let i = 0; i < 12; i++){
    const a = (i/12)*Math.PI*2;
    sph(g, 0.004, MAT.gold, Math.cos(a)*0.09, 0.023, Math.sin(a)*0.09);
  }
  box(g, 0.005, 0.005, 0.07, MAT.black, 0, 0.024, -0.035);
  return g; };
OBJ.movil = () => { const g = new THREE.Group();
  box(g, 0.07, 0.008, 0.14, new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.5 }), 0, 0.004, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x1a3050, emissive: 0x2a5080, emissiveIntensity: 0.5 }));
  s.rotation.x = -Math.PI/2; s.position.y = 0.009; g.add(s);
  return g; };
OBJ.cartera = () => { const g = new THREE.Group();
  box(g, 0.12, 0.02, 0.09, MAT.leather, 0, 0.01, 0);
  box(g, 0.12, 0.005, 0.09, MAT.woodDark, 0, 0.022, 0);
  box(g, 0.1, 0.001, 0.06, MAT.paper, 0, 0.024, 0.02);
  return g; };
OBJ.monedero = () => { const g = new THREE.Group();
  box(g, 0.08, 0.025, 0.07, new THREE.MeshStandardMaterial({ color: 0x5a3a5a, roughness: 0.85 }), 0, 0.0125, 0);
  sph(g, 0.008, MAT.brass, 0, 0.027, 0.02);
  return g; };
OBJ.monedas = () => { const g = new THREE.Group();
  [[0,0,0,MAT.gold],[0.03,0,0.005,MAT.silver],[-0.02,0.005,0.02,MAT.gold],[0.02,0.005,0.03,MAT.silver]].forEach(([x,y,z,m]) => {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.003, 16), m);
    c.position.set(x, y + 0.002, z); c.castShadow = true; g.add(c);
  });
  return g; };
OBJ.billetes = () => { const g = new THREE.Group();
  box(g, 0.14, 0.001, 0.07, new THREE.MeshStandardMaterial({ color: 0x6a8a6a, roughness: 0.75, side: THREE.DoubleSide }), 0, 0.001, 0);
  box(g, 0.14, 0.001, 0.07, new THREE.MeshStandardMaterial({ color: 0x8a6a8a, roughness: 0.75, side: THREE.DoubleSide }), 0.01, 0.003, 0.005);
  return g; };
OBJ.gafas = () => { const g = new THREE.Group();
  const frame = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.3, roughness: 0.4 });
  const l1 = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.03, 20), frame);
  l1.rotation.x = -Math.PI/2; l1.position.set(-0.035, 0.005, 0); g.add(l1);
  const l2 = new THREE.Mesh(new THREE.RingGeometry(0.022, 0.03, 20), frame);
  l2.rotation.x = -Math.PI/2; l2.position.set(0.035, 0.005, 0); g.add(l2);
  return g; };
OBJ.sombrero = () => { const g = new THREE.Group();
  cyl(g, 0.11, 0.11, 0.008, MAT.black, 0, 0.004, 0, 32);
  cyl(g, 0.06, 0.07, 0.09, MAT.black, 0, 0.05, 0, 24);
  cyl(g, 0.062, 0.062, 0.015, MAT.fabricRed, 0, 0.015, 0, 24);
  return g; };
OBJ.gorra = () => { const g = new THREE.Group();
  sph(g, 0.075, MAT.fabricBlue, 0, 0.065, 0).scale.set(1, 0.7, 1);
  const v = box(g, 0.14, 0.008, 0.09, MAT.black, 0, 0.045, 0.09);
  v.rotation.x = -0.15;
  return g; };
OBJ.zapato = () => { const g = new THREE.Group();
  box(g, 0.12, 0.02, 0.3, MAT.black, 0, 0.01, 0);
  box(g, 0.1, 0.05, 0.2, new THREE.MeshStandardMaterial({ color: 0x1a1010, roughness: 0.65 }), 0, 0.045, 0.02);
  return g; };
OBJ.pendiente = () => { const g = new THREE.Group();
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.003, 8, 20), MAT.gold);
  hoop.rotation.x = Math.PI/2; hoop.position.y = 0.02; g.add(hoop);
  sph(g, 0.014, MAT.ceramic, 0, 0.005, 0);
  return g; };
OBJ.joyas = () => { const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.005, 10, 24), MAT.gold);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.006; g.add(ring);
  const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0),
    new THREE.MeshStandardMaterial({ color: 0x4a90e2, roughness: 0.05, emissive: 0x1a3060, emissiveIntensity: 0.3 }));
  stone.position.set(0, 0.022, 0); g.add(stone);
  return g; };
OBJ.pulsera = () => { const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.005, 10, 30), MAT.gold);
  ring.rotation.x = Math.PI/2; ring.position.y = 0.005; g.add(ring);
  return g; };
OBJ.cadena = () => { const g = new THREE.Group();
  for (let i = 0; i < 20; i++){
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0018, 6, 10), MAT.gold);
    link.rotation.y = Math.PI/2;
    link.rotation.x = (i % 2)*Math.PI/2;
    link.position.set(0, 0.005, -0.08 + i*0.008);
    g.add(link);
  }
  return g; };
OBJ.medalla = () => { const g = new THREE.Group();
  box(g, 0.04, 0.001, 0.06, MAT.fabricRed, 0, 0.001, -0.03);
  cyl(g, 0.025, 0.025, 0.004, MAT.gold, 0, 0.004, 0, 24);
  sph(g, 0.012, MAT.gold, 0, 0.008, 0);
  return g; };
OBJ.huella = () => { const g = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.8 });
  for (let i = 0; i < 5; i++){
    const arc = new THREE.Mesh(new THREE.RingGeometry(0.012 + i*0.006, 0.014 + i*0.006, 24, 1, -Math.PI/2, Math.PI*1.3), dark);
    arc.rotation.x = -Math.PI/2;
    arc.position.y = 0.002 + i*0.0003;
    g.add(arc);
  }
  return g; };
OBJ.casquillo = () => { const g = new THREE.Group();
  cyl(g, 0.006, 0.006, 0.022, MAT.brass, 0, 0.011, 0, 14);
  cyl(g, 0.004, 0.004, 0.002, MAT.woodDark, 0, 0.001, 0, 14);
  cyl(g, 0.0065, 0.0065, 0.002, MAT.brass, 0, 0.021, 0, 14);
  return g; };
OBJ.bala = () => { const g = new THREE.Group();
  cyl(g, 0.005, 0.005, 0.018, new THREE.MeshStandardMaterial({ color: 0xb08050, metalness: 0.85, roughness: 0.3 }), 0, 0.009, 0, 12);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.005, 0.012, 12),
    new THREE.MeshStandardMaterial({ color: 0x8a7a6a, metalness: 0.6, roughness: 0.5 }));
  tip.position.y = 0.024; g.add(tip);
  return g; };
OBJ.mancha = () => { const g = new THREE.Group();
  const blood = new THREE.MeshStandardMaterial({ color: 0x5a0a08, roughness: 0.5, transparent: true, opacity: 0.9 });
  const circle = new THREE.Mesh(new THREE.CircleGeometry(0.08, 20), blood);
  circle.rotation.x = -Math.PI/2; circle.position.y = 0.002;
  circle.scale.set(1.2, 0.8, 1); g.add(circle);
  for (let i = 0; i < 5; i++){
    const drop = new THREE.Mesh(new THREE.CircleGeometry(0.01 + Math.random()*0.015, 12), blood);
    drop.rotation.x = -Math.PI/2;
    const a = Math.random()*Math.PI*2, r = 0.1 + Math.random()*0.08;
    drop.position.set(Math.cos(a)*r, 0.002, Math.sin(a)*r);
    g.add(drop);
  }
  return g; };
OBJ.polvo = () => { const g = new THREE.Group();
  const dust = new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.95, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 40; i++){
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.003 + Math.random()*0.003, 6, 5), dust);
    p.position.set((Math.random()-0.5)*0.1, 0.002 + Math.random()*0.005, (Math.random()-0.5)*0.1);
    g.add(p);
  }
  return g; };
OBJ.flores = () => { const g = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: 0x2a4a1a, roughness: 0.9 });
  const red = new THREE.MeshStandardMaterial({ color: 0xc02020, roughness: 0.7, side: THREE.DoubleSide });
  const pink = new THREE.MeshStandardMaterial({ color: 0xd06080, roughness: 0.7, side: THREE.DoubleSide });
  cyl(g, 0.004, 0.006, 0.24, green, 0, 0.12, 0, 8);
  for (let i = 0; i < 4; i++){
    const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.08), green);
    leaf.position.set((Math.random()-0.5)*0.05, 0.05 + i*0.05, (Math.random()-0.5)*0.05);
    leaf.rotation.z = -0.5 + Math.random();
    leaf.rotation.y = Math.random()*Math.PI*2;
    g.add(leaf);
  }
  const pms = [red, pink, red];
  for (let i = 0; i < 8; i++){
    const angle = (i/8)*Math.PI*2;
    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.022, 12), pms[i%3]);
    petal.position.set(Math.cos(angle)*0.018, 0.25, Math.sin(angle)*0.018);
    petal.lookAt(0, 0.25, 0); g.add(petal);
  }
  sph(g, 0.012, new THREE.MeshStandardMaterial({ color: 0xf0d040, roughness: 0.7 }), 0, 0.255, 0);
  return g; };
OBJ.vela = () => { const g = new THREE.Group();
  cyl(g, 0.03, 0.035, 0.015, MAT.brass, 0, 0.008, 0, 20);
  cyl(g, 0.018, 0.018, 0.14, new THREE.MeshStandardMaterial({ color: 0xe8e0c0, roughness: 0.85 }), 0, 0.09, 0, 20);
  box(g, 0.002, 0.012, 0.002, MAT.black, 0, 0.165, 0);
  const fireMat = new THREE.MeshStandardMaterial({ color: 0xffd040, emissive: 0xff8020, emissiveIntensity: 3 });
  sph(g, 0.015, fireMat, 0, 0.175, 0);
  const light = new THREE.PointLight(0xffb040, 0.6, 2, 1.5);
  light.position.y = 0.18; g.add(light);
  return g; };
OBJ.cerillas = () => { const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xe0c090, roughness: 0.9 });
  const head = new THREE.MeshStandardMaterial({ color: 0x8a1818, roughness: 0.7 });
  for (let i = 0; i < 8; i++){
    const m = cyl(g, 0.0015, 0.0015, 0.05, wood, -0.008 + i*0.002, 0.025, (Math.random()-0.5)*0.005, 6);
    m.rotation.z = (Math.random()-0.5)*0.2;
    sph(g, 0.003, head, -0.008 + i*0.002, 0.05, 0);
  }
  return g; };
OBJ.cenicero = () => { const g = new THREE.Group();
  const glass = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.85 });
  cyl(g, 0.055, 0.06, 0.02, glass, 0, 0.01, 0, 24);
  cyl(g, 0.045, 0.045, 0.003, new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1 }), 0, 0.019, 0, 20);
  return g; };
OBJ.cuerda = () => { const g = new THREE.Group();
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.06, 0.01, 64, 8, 2, 3),
    new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.95 }));
  knot.position.y = 0.02; knot.scale.set(1, 0.4, 1);
  knot.castShadow = true; g.add(knot);
  return g; };
OBJ.baston = () => { const g = new THREE.Group();
  cyl(g, 0.014, 0.02, 0.85, MAT.wood, 0, 0.425, 0, 12);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 10, 20, Math.PI), MAT.brass);
  handle.position.set(0, 0.85, 0); handle.rotation.x = Math.PI/2; g.add(handle);
  return g; };
OBJ.paraguas = () => { const g = new THREE.Group();
  const fabric = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.8 });
  cyl(g, 0.02, 0.02, 0.75, fabric, 0, 0.375, 0, 16);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.2, 16, 1, true), fabric);
  canopy.position.y = 0.85; g.add(canopy);
  cyl(g, 0.008, 0.008, 0.15, MAT.black, 0, 0.9, 0, 8);
  return g; };
OBJ.marco = () => { const g = new THREE.Group();
  box(g, 0.14, 0.02, 0.18, new THREE.MeshStandardMaterial({ color: 0x4a3d22, roughness: 0.6 }), 0, 0.01, 0);
  const img = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.13), new THREE.MeshStandardMaterial({ color: 0x6a5a4a, roughness: 0.85 }));
  img.rotation.x = -Math.PI/2; img.position.y = 0.022; g.add(img);
  return g; };
OBJ.camara = () => { const g = new THREE.Group();
  box(g, 0.12, 0.08, 0.05, MAT.black, 0, 0.04, 0);
  cyl(g, 0.025, 0.03, 0.05, MAT.steelDark, 0, 0.04, 0.05, 20).rotation.x = Math.PI/2;
  return g; };
OBJ.grabadora = () => { const g = new THREE.Group();
  box(g, 0.1, 0.025, 0.06, new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.6 }), 0, 0.0125, 0);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.015),
    new THREE.MeshStandardMaterial({ color: 0x1a3050, emissive: 0x2a5080, emissiveIntensity: 0.4 }));
  s.rotation.x = -Math.PI/2; s.position.y = 0.026; s.position.z = -0.01; g.add(s);
  return g; };
OBJ.usb = () => { const g = new THREE.Group();
  box(g, 0.018, 0.008, 0.04, MAT.black, 0, 0.004, 0);
  box(g, 0.012, 0.005, 0.012, MAT.silver, 0, 0.004, -0.026);
  return g; };
OBJ.dvd = () => { const g = new THREE.Group();
  cyl(g, 0.06, 0.06, 0.0015, MAT.silver, 0, 0.001, 0, 40);
  cyl(g, 0.045, 0.045, 0.002, new THREE.MeshStandardMaterial({ color: 0x4a2a5a, roughness: 0.5 }), 0, 0.0018, 0, 40);
  return g; };

function getObjectModel(obj){
  const id = (obj.id || '').toLowerCase();
  const name = (obj.name || '').toLowerCase();
  if (OBJ[id]) return OBJ[id];
  const map = [
    ['taza','taza'],['té','taza'],['termo','taza'],
    ['azucarero','azucarero'],['azúcar','azucarero'],
    ['vaso','vaso'],['whisky','vaso'],['brandy','vaso'],['licor','vaso'],
    ['copa','copa'],['champán','copa'],
    ['botella','botella'],['licorera','botella'],
    ['frasco','frasco'],['somnífero','frasco'],['reactivo','frasco'],['vial','frasco'],
    ['lata','lata'],['refresco','lata'],
    ['tetera','tetera'],['bandeja','bandeja'],
    ['cuchillo','cuchillo'],['tijeras','tijeras'],['podar','tijeras'],
    ['pistola','pistola'],['revólver','pistola'],['arma','pistola'],
    ['martillo','martillo'],['destornillador','destornillador'],
    ['alicates','alicates'],['llave inglesa','llaveInglesa'],
    ['cuchilla','cuchilla'],['navaja','cuchilla'],
    ['carta','carta'],['nota','carta'],['mensaje','carta'],
    ['sobre','sobre'],
    ['libro','libro'],['cuaderno','cuaderno'],['testamento','libro'],['bitácora','libro'],
    ['periódico','periodico'],['revista','revista'],
    ['carpeta','carpeta'],
    ['certificado','certificado'],['diploma','certificado'],
    ['foto','foto'],['ticket','ticket'],['entrada','ticket'],
    ['pañuelo','panuelo'],['guante','guantes'],['guantes','guantes'],
    ['llave','llave'],['llavero','llavero'],
    ['reloj de pared','relojPared'],['reloj','reloj'],
    ['móvil','movil'],['teléfono','movil'],
    ['cartera','cartera'],['monedero','monedero'],
    ['moneda','monedas'],['dinero','billetes'],['billete','billetes'],
    ['gafas','gafas'],['anteojos','gafas'],
    ['sombrero','sombrero'],['gorra','gorra'],
    ['zapato','zapato'],
    ['pendiente','pendiente'],
    ['joya','joyas'],['anillo','joyas'],['collar','joyas'],
    ['pulsera','pulsera'],['cadena','cadena'],['medalla','medalla'],
    ['huella','huella'],
    ['casquillo','casquillo'],['vaina','casquillo'],
    ['bala','bala'],['mancha','mancha'],['sangre','mancha'],
    ['polvo','polvo'],['flor','flores'],['rosa','flores'],
    ['vela','vela'],['cerilla','cerillas'],['cenicero','cenicero'],
    ['cuerda','cuerda'],['soga','cuerda'],['cabo','cuerda'],
    ['bastón','baston'],['paraguas','paraguas'],['marco','marco'],
    ['cámara','camara'],['grabadora','grabadora'],['usb','usb'],['dvd','dvd']
  ];
  for (const [kw, type] of map){
    if (name.includes(kw) && OBJ[type]) return OBJ[type];
  }
  const icon = obj.icon || '';
  if (['🍷','🥃','🥂','🍾','🥤','🍵','☕'].includes(icon)) return OBJ.vaso;
  if (['🔪','🗡️','⚔️'].includes(icon)) return OBJ.cuchillo;
  if (['🔫'].includes(icon)) return OBJ.pistola;
  if (['🔑','🗝️'].includes(icon)) return OBJ.llave;
  if (['📱','📲'].includes(icon)) return OBJ.movil;
  if (['📖','📚','📓','📔','📕'].includes(icon)) return OBJ.libro;
  if (['📝','✉️','📜','📄','💌'].includes(icon)) return OBJ.carta;
  if (['💎','💍'].includes(icon)) return OBJ.joyas;
  if (['🧤'].includes(icon)) return OBJ.guantes;
  if (['🧣'].includes(icon)) return OBJ.panuelo;
  if (['🔧','🔨','🛠️'].includes(icon)) return OBJ.llaveInglesa;
  if (['💊','🧪','💉'].includes(icon)) return OBJ.frasco;
  if (['🩸'].includes(icon)) return OBJ.mancha;
  if (['🔦','💡','🕯️'].includes(icon)) return OBJ.vela;
  if (['🎩','👒','🧢'].includes(icon)) return OBJ.sombrero;
  if (['👞','👟','👠'].includes(icon)) return OBJ.zapato;
  if (['🕰️','⌚','⏰'].includes(icon)) return OBJ.reloj;
  if (['📷','📸','🎥'].includes(icon)) return OBJ.camara;
  return () => {
    const g = new THREE.Group();
    box(g, 0.08, 0.05, 0.08, MAT.wood, 0, 0.025, 0);
    box(g, 0.085, 0.008, 0.085, MAT.brass, 0, 0.054, 0);
    return g;
  };
}