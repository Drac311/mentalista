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
  box(g, 0.13, 0.6, 0.14, pantsMat, -0.1, 0.6, 0);
  box(g, 0.13, 0.6, 0.14, pantsMat, 0.1, 0.6, 0);
  box(g, 0.14, 0.1, 0.22, shoesMat, -0.1, 0.05, 0.03);
  box(g, 0.14, 0.1, 0.22, shoesMat, 0.1, 0.05, 0.03);
  box(g, 0.38, 0.5, 0.22, shirtMat, 0, 1.15, 0);
  if (charDef.tie){
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.28, 0.012),
      new THREE.MeshStandardMaterial({ color: 0x8a1818, roughness: 0.75 }));
    tie.position.set(0, 1.15, 0.115); g.add(tie);
  }
  [[-0.235, 1.4], [0.235, 1.4]].forEach(([x, y]) => {
    box(g, 0.09, 0.34, 0.11, shirtMat, x, y - 0.17, 0);
    box(g, 0.075, 0.28, 0.095, skin, x, y - 0.46, 0);
  });
  cyl(g, 0.045, 0.05, 0.08, skin, 0, 1.43, 0, 12);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 16), skin);
  head.position.y = 1.58; head.scale.set(0.95, 1.05, 1);
  head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.135, 20, 16, 0, Math.PI*2, 0, Math.PI*(charDef.gender === 'female' ? 0.78 : 0.55)), hairMat);
  hair.position.y = 1.6; hair.scale.set(0.98, 1.05, 1); g.add(hair);
  if (charDef.gender === 'female'){
    const bh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.08), hairMat);
    bh.position.set(0, 1.36, -0.1); g.add(bh);
  }
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a10, roughness: 0.5 });
  const eL = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), eyeMat);
  eL.position.set(-0.045, 1.59, 0.115); g.add(eL);
  const eR = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), eyeMat);
  eR.position.set(0.045, 1.59, 0.115); g.add(eR);
  if (charDef.glasses){
    const fm = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, metalness: 0.3, roughness: 0.4 });
    const lL = new THREE.Mesh(new THREE.RingGeometry(0.024, 0.032, 16), fm);
    lL.position.set(-0.045, 1.59, 0.128); g.add(lL);
    const lR = new THREE.Mesh(new THREE.RingGeometry(0.024, 0.032, 16), fm);
    lR.position.set(0.045, 1.59, 0.128); g.add(lR);
    box(g, 0.025, 0.005, 0.008, fm, 0, 1.59, 0.13);
  }
  if (charDef.hat){
    const hm = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.85 });
    const bm = new THREE.MeshStandardMaterial({ color: 0x5a1a1a, roughness: 0.85 });
    cyl(g, 0.18, 0.18, 0.012, hm, 0, 1.71, 0, 24);
    cyl(g, 0.11, 0.12, 0.1, hm, 0, 1.765, 0, 20);
    cyl(g, 0.115, 0.115, 0.018, bm, 0, 1.728, 0, 20);
  }
  return g;
}

function buildSuspectModel(suspect){
  const g = new THREE.Group();
  const isFemale = ['👩‍💻','👩','🧹','👩‍🍳','👩‍💼','💍','🌹','🎤','🎶','💔','🌷','💕','🎭','🎨','💎','🤸','🔮'].includes(suspect.icon);
  const skinTones = [0xd8a888, 0xc89878, 0xe8b898, 0xa87858, 0xb88868];
  const skin = new THREE.MeshStandardMaterial({ color: skinTones[(Math.random()*skinTones.length)|0], roughness: 0.85 });
  const hairColor = isFemale ? [0x3a2010, 0x6a3a1a, 0x2a1a10, 0x8a4a2a][(Math.random()*4)|0] : [0x1a1a1e, 0x3a2a1a, 0x5a5a5a][(Math.random()*3)|0];
  const shirtColors = [0x2a3a5a, 0x5a2a3a, 0x3a5a2a, 0x5a4a2a, 0x4a4a4a, 0x6a2a2a, 0x2a4a5a];
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColors[(Math.random()*shirtColors.length)|0], roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: [0x1a1a1e, 0x2a2a30, 0x3a2010][(Math.random()*3)|0], roughness: 0.9 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.135, 24, 16), skin);
  head.position.y = 1.32; head.scale.set(0.95, 1.1, 1); head.castShadow = true; g.add(head);
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.14, 24, 16, 0, Math.PI*2, 0, Math.PI*(isFemale ? 0.7 : 0.5)),
    new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95 }));
  hair.position.y = 1.34; hair.scale.set(0.98, 1.1, 1); g.add(hair);
  if (isFemale) box(g, 0.24, 0.3, 0.08, new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.95 }), 0, 1.15, -0.13);
  box(g, 0.1, 0.08, 0.1, skin, 0, 1.19, 0);
  box(g, 0.36, 0.42, 0.22, shirt, 0, 0.98, 0);
  function buildArm(side){
    const grp = new THREE.Group();
    box(grp, 0.09, 0.09, 0.32, shirt, 0, 0, -0.16);
    box(grp, 0.08, 0.08, 0.28, skin, 0, 0, -0.44);
    box(grp, 0.07, 0.05, 0.1, skin, 0, -0.015, -0.62);
    grp.position.set(side * 0.24, 0.95, 0.15);
    grp.rotation.x = -1.1; grp.rotation.z = side * 0.15;
    return grp;
  }
  g.add(buildArm(-1)); g.add(buildArm(1));
  box(g, 0.11, 0.42, 0.15, pants, -0.1, 0.55, 0.18);
  box(g, 0.11, 0.42, 0.15, pants, 0.1, 0.55, 0.18);
  box(g, 0.11, 0.14, 0.42, pants, -0.1, 0.73, 0.1);
  box(g, 0.11, 0.14, 0.42, pants, 0.1, 0.73, 0.1);
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