/* ====================================================================
   05-CHARACTERS — Modelo jugador, modelo sospechoso, cadáver, RemotePlayers
   ==================================================================== */

function buildCharacterModel(charDef){
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: charDef.skin, roughness: 0.85 });
  const hairMat = new THREE.MeshStandardMaterial({ color: charDef.hair, roughness: 0.9 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: charDef.shirt, roughness: 0.85 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: charDef.pants, roughness: 0.9 });
  const shoesMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.85 });

  // Piernas (cilindros cónicos, con rodilla)
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.78, 12), pantsMat);
  legL.position.set(-0.1, 0.39, 0);
  legL.castShadow = true;
  g.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.1;
  g.add(legR);

  // Zapatos
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.24), shoesMat);
  shoeL.position.set(-0.1, 0.04, 0.05);
  shoeL.castShadow = true;
  g.add(shoeL);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.1;
  g.add(shoeR);

  // Torso (más ancho en hombros, más estrecho en cintura)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.155, 0.62, 16), shirtMat);
  torso.position.y = 1.1;
  torso.castShadow = true;
  g.add(torso);

  // Detalle del cuello y corbata
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.055, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.8 }));
  collar.position.set(0, 1.36, 0.16);
  g.add(collar);

  if (charDef.tie){
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.24, 0.015),
      new THREE.MeshStandardMaterial({ color: 0x8a1818, roughness: 0.75 }));
    tie.position.set(0, 1.2, 0.17);
    g.add(tie);
  }

  // Hombros
  sph(g, 0.115, shirtMat, -0.215, 1.35, 0);
  sph(g, 0.115, shirtMat, 0.215, 1.35, 0);

  // Brazos (cilindros con codo)
  const upperArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.32, 10), shirtMat);
  upperArmL.position.set(-0.245, 1.17, 0);
  upperArmL.castShadow = true;
  g.add(upperArmL);
  const upperArmR = upperArmL.clone();
  upperArmR.position.x = 0.245;
  g.add(upperArmR);

  // Antebrazos (manga corta)
  const lowerArmL = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.048, 0.3, 10), skin);
  lowerArmL.position.set(-0.245, 0.86, 0);
  lowerArmL.castShadow = true;
  g.add(lowerArmL);
  const lowerArmR = lowerArmL.clone();
  lowerArmR.position.x = 0.245;
  g.add(lowerArmR);

  // Manos
  sph(g, 0.06, skin, -0.245, 0.68, 0);
  sph(g, 0.06, skin, 0.245, 0.68, 0);

  // Cuello
  cyl(g, 0.055, 0.065, 0.09, skin, 0, 1.48, 0, 12);

  // Cabeza (forma natural)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 18), skin);
  head.position.y = 1.64;
  head.scale.set(0.92, 1.06, 0.98);
  head.castShadow = true;
  g.add(head);

  // Pelo (casquete superior)
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 18, 0, Math.PI*2, 0, Math.PI*0.62), hairMat);
  hair.position.y = 1.66;
  hair.scale.set(0.95, 1.05, 1.02);
  hair.castShadow = true;
  g.add(hair);

  // Pelo largo (mujeres)
  if (charDef.gender === 'female'){
    const backHair = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.38, 0.13), hairMat);
    backHair.position.set(0, 1.36, -0.14);
    backHair.castShadow = true;
    g.add(backHair);
  }

  // Ojos
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.5 });
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), eyeMat);
  eL.position.set(-0.042, 1.65, 0.115);
  g.add(eL);
  const eR = eL.clone();
  eR.position.x = 0.042;
  g.add(eR);

  // Gafas
  if (charDef.glasses){
    const fm = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.3, roughness: 0.4 });
    const lL = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.005, 8, 16), fm);
    lL.position.set(-0.042, 1.65, 0.126);
    g.add(lL);
    const lR = lL.clone();
    lR.position.x = 0.042;
    g.add(lR);
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.005, 0.005), fm);
    bridge.position.set(0, 1.65, 0.13);
    g.add(bridge);
  }

  // Sombrero
  if (charDef.hat){
    const hm = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.85 });
    const bm = new THREE.MeshStandardMaterial({ color: 0x5a1a1a, roughness: 0.85 });
    cyl(g, 0.19, 0.19, 0.014, hm, 0, 1.76, 0, 24);
    cyl(g, 0.11, 0.12, 0.11, hm, 0, 1.81, 0, 20);
    cyl(g, 0.115, 0.115, 0.02, bm, 0, 1.775, 0, 20);
  }

  return g;
}

function buildSuspectModel(suspect){
  const g = new THREE.Group();
  const isFemale = ['👩‍💻','👩','🧹','👩‍🍳','👩‍💼','💍','🌹','🎤','🎶','💔','🌷','💕','🎭','🎨','💎','🤸','🔮'].includes(suspect.icon);
  const skinTones = [0xd8a888, 0xc89878, 0xe8b898, 0xa87858, 0xb88868];
  const skin = new THREE.MeshStandardMaterial({ color: skinTones[(Math.random()*skinTones.length)|0], roughness: 0.85 });
  const hairColor = isFemale ? [0x3a2010, 0x6a3a1a, 0x2a1a10, 0x8a4a2a][(Math.random()*4)|0] : [0x1a1a1e, 0x3a2a1a, 0x5a5a5a][(Math.random()*3)|0];
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95 });
  const shirtColors = [0x2a3a5a, 0x5a2a3a, 0x3a5a2a, 0x5a4a2a, 0x4a4a4a, 0x6a2a2a, 0x2a4a5a];
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColors[(Math.random()*shirtColors.length)|0], roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: [0x1a1a1e, 0x2a2a30, 0x3a2010][(Math.random()*3)|0], roughness: 0.9 });

  // Piernas
  const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.6, 12), pants);
  legL.position.set(-0.09, 0.3, 0);
  legL.castShadow = true;
  g.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.09;
  g.add(legR);
  // Zapatos
  const shoesMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.85 });
  box(g, 0.12, 0.07, 0.2, shoesMat, -0.09, 0.035, 0.04);
  box(g, 0.12, 0.07, 0.2, shoesMat, 0.09, 0.035, 0.04);

  // Torso sentado (más bajo, inclinado hacia delante)
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.5, 16), shirt);
  torso.position.y = 0.85;
  torso.castShadow = true;
  g.add(torso);

  // Hombros
  sph(g, 0.1, shirt, -0.2, 1.02, 0);
  sph(g, 0.1, shirt, 0.2, 1.02, 0);

  // Brazos apoyados en la mesa (rotados hacia delante)
  [-1, 1].forEach(side => {
    const armG = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.3, 10), shirt);
    upper.position.y = -0.15;
    upper.castShadow = true;
    armG.add(upper);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.045, 0.28, 10), skin);
    lower.position.y = -0.44;
    lower.castShadow = true;
    armG.add(lower);
    sph(armG, 0.055, skin, 0, -0.6, 0);
    armG.position.set(side * 0.22, 1.0, 0.08);
    armG.rotation.x = -0.9;
    armG.rotation.z = side * 0.15;
    g.add(armG);
  });

  // Cuello
  cyl(g, 0.05, 0.055, 0.08, skin, 0, 1.14, 0, 12);

  // Cabeza
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 18), skin);
  head.position.y = 1.29;
  head.scale.set(0.92, 1.06, 0.98);
  head.castShadow = true;
  g.add(head);

  // Pelo
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 18, 0, Math.PI*2, 0, Math.PI*(isFemale ? 0.78 : 0.6)), hairMat);
  hair.position.y = 1.31;
  hair.scale.set(0.95, 1.05, 1.02);
  hair.castShadow = true;
  g.add(hair);
  if (isFemale){
    const bh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.34, 0.12), hairMat);
    bh.position.set(0, 1.05, -0.13);
    bh.castShadow = true;
    g.add(bh);
  }

  // Ojos
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.5 });
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.013, 8, 6), eyeMat);
  eL.position.set(-0.042, 1.3, 0.115);
  g.add(eL);
  const eR = eL.clone();
  eR.position.x = 0.042;
  g.add(eR);

  return g;
}

const CORPSE_POSES = {
  supine: { armL: 1.2, armR: 1.2, legL: 0.1, legR: -0.1, torsoY: 0, headY: 0 },
  side:   { armL: 1.4, armR: 0.8, legL: 0.5, legR: -0.1, torsoY: -0.4, headY: 0.2 },
  prone:  { armL: 1.5, armR: -1.5, legL: 0.1, legR: -0.1, torsoY: 0, headY: 0.1 },
  curled: { armL: 2.2, armR: 2.2, legL: 1.4, legR: 1.4, torsoY: -0.5, headY: 0.3 },
  seated: { armL: 0.3, armR: 0.3, legL: 1.5, legR: -1.5, torsoY: 0, headY: 0 }
};
function buildCorpse(scene, poseKey, x, z, ry){
  poseKey = poseKey || 'supine';
  const pose = CORPSE_POSES[poseKey] || CORPSE_POSES.supine;
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xd8c0a8, roughness: 0.95 });
  const shirt = MAT.fabricBlue;
  const pants = MAT.black;
  const shoes = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.85 });
  const blood = new THREE.MeshStandardMaterial({ color: 0x5a0a08, roughness: 0.5, transparent: true, opacity: 0.9 });
  const bloodDark = new THREE.MeshStandardMaterial({ color: 0x3a0605, roughness: 0.6, transparent: true, opacity: 0.85 });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), blood);
  pool.rotation.x = -Math.PI/2; pool.position.y = 0.008;
  pool.scale.set(1, 1.4, 1); g.add(pool);
  for (let i = 0; i < 12; i++){
    const r = 0.05 + Math.random()*0.2;
    const s = new THREE.Mesh(new THREE.CircleGeometry(r, 16), bloodDark);
    s.rotation.x = -Math.PI/2;
    s.position.set((Math.random()-0.5)*2.6, 0.01, (Math.random()-0.5)*3);
    s.scale.set(1, 0.6 + Math.random()*0.8, 1); g.add(s);
  }
  const yb = 0.14;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), skin);
  head.position.set(0, yb, -0.68);
  head.scale.set(0.9, 1.0, 1.15); head.castShadow = true;
  head.rotation.y = pose.headY; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.155, 24, 16, 0, Math.PI*2, 0, Math.PI*0.5),
    new THREE.MeshStandardMaterial({ color: 0x2a1810, roughness: 0.95 }));
  hair.position.set(0, yb + 0.01, -0.68); hair.scale.set(0.9, 1.0, 1.15); g.add(hair);
  box(g, 0.14, 0.1, 0.14, skin, 0, yb, -0.5);
  box(g, 0.5, 0.26, 0.85, shirt, 0, yb, 0);
  box(g, 0.46, 0.24, 0.24, pants, 0, yb, 0.55);
  function buildArm(side, rotY){
    const grp = new THREE.Group();
    box(grp, 0.13, 0.14, 0.42, shirt, 0, 0, -0.21);
    box(grp, 0.12, 0.13, 0.4, shirt, 0, 0, -0.62);
    box(grp, 0.1, 0.11, 0.12, skin, 0, 0, -0.88);
    grp.position.set(side * 0.36, yb, -0.24);
    grp.rotation.y = rotY;
    return grp;
  }
  g.add(buildArm(-1, pose.armL));
  g.add(buildArm(1, pose.armR));
  function buildLeg(side, rotY){
    const grp = new THREE.Group();
    box(grp, 0.16, 0.16, 0.5, pants, 0, 0, 0.25);
    box(grp, 0.13, 0.14, 0.45, pants, 0, 0, 0.82);
    box(grp, 0.15, 0.1, 0.22, shoes, 0, -0.02, 1.15);
    grp.position.set(side * 0.14, yb, 0.65);
    grp.rotation.y = rotY;
    return grp;
  }
  g.add(buildLeg(-1, pose.legL));
  g.add(buildLeg(1, pose.legR));
  g.position.set(x, 0, z);
  g.rotation.y = ry + pose.torsoY;
  scene.add(g);
  Room.register(x, z, 1.6, 2.6, ry);
  return g;
}

const RemotePlayers = {
  players: {},
  add(peerId, charDef){
    if (this.players[peerId]) this.remove(peerId);
    const group = buildCharacterModel(charDef);
    group.position.set(0, -10, 0);
    group.visible = false;
    this.players[peerId] = {
      group, charDef,
      pos: new THREE.Vector3(0,0,0),
      targetPos: new THREE.Vector3(0,0,0),
      yaw: 0, targetYaw: 0,
      moving: false, bobPhase: 0, hasPos: false
    };
    if (World.scene) World.scene.add(group);
  },
  remove(peerId){
    const p = this.players[peerId];
    if (!p) return;
    if (p.group.parent) p.group.parent.remove(p.group);
    delete this.players[peerId];
  },
  update(peerId, x, z, yaw, moving){
    const p = this.players[peerId];
    if (!p) return;
    p.targetPos.set(x, 0, z);
    p.targetYaw = yaw;
    p.moving = moving;
    if (!p.hasPos){
      p.pos.copy(p.targetPos); p.yaw = yaw; p.hasPos = true;
      p.group.visible = true;
      p.group.position.set(x, 0, z);
      p.group.rotation.y = yaw;
    }
  },
  attachToScene(scene){
    for (const id in this.players){
      const g = this.players[id].group;
      if (g.parent !== scene) scene.add(g);
    }
  },
  detachAll(){
    for (const id in this.players){
      const g = this.players[id].group;
      if (g.parent) g.parent.remove(g);
    }
  },
  tick(dt){
    for (const id in this.players){
      const p = this.players[id];
      if (!p.hasPos) continue;
      p.pos.x += (p.targetPos.x - p.pos.x) * Math.min(1, dt * 12);
      p.pos.z += (p.targetPos.z - p.pos.z) * Math.min(1, dt * 12);
      let dyaw = p.targetYaw - p.yaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      p.yaw += dyaw * Math.min(1, dt * 12);
      let y = 0;
      if (p.moving){ p.bobPhase += dt * 10; y = Math.abs(Math.sin(p.bobPhase)) * 0.03; }
      else p.bobPhase *= 0.9;
      p.group.position.set(p.pos.x, y, p.pos.z);
      p.group.rotation.y = p.yaw;
    }
  },
  clear(){
    for (const id in this.players) this.remove(id);
    this.players = {};
  }
};