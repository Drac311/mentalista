/* ====================================================================
   08B-WORLD-INIT — Hotspot marker (sin orbe) + initWorld + ocultos
   ==================================================================== */

function makeHotspotMarker(obj, examined){
  const g = new THREE.Group();
  const color = examined ? 0x4ade80 : 0xd4a017;

  // Aro sutil en el suelo (SIN esfera/orbe)
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.09, 0.12, 28),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI/2;
  ring.position.y = 0.004;
  g.add(ring);

  // Punto central
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.035, 16),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
  );
  dot.rotation.x = -Math.PI/2;
  dot.position.y = 0.006;
  g.add(dot);

  // Etiqueta pequeña arriba
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 44;
  const cx = cv.getContext('2d');
  cx.fillStyle = 'rgba(0,0,0,0.65)';
  cx.fillRect(0, 0, 256, 44);
  cx.strokeStyle = examined ? '#4ade80' : '#d4a017';
  cx.lineWidth = 2;
  cx.strokeRect(1, 1, 254, 42);
  cx.fillStyle = examined ? '#4ade80' : '#d4a017';
  cx.font = 'bold 20px "Special Elite", monospace';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  let t = obj.name + (examined ? ' ✓' : '');
  if (t.length > 22) t = t.slice(0, 21) + '…';
  cx.fillText(t, 128, 22);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: true, transparent: true, opacity: 0.9 }));
  sprite.scale.set(0.95, 0.16, 1);
  sprite.position.y = 0.32;
  g.add(sprite);

  g.userData.objId = obj.id;
  g.userData.objData = obj;
  return g;
}

function initWorld(c, g, mode){
  disposeWorld();
  World.caseData = c;
  World.obstacles = [];
  World.interactables = [];
  World.floors = []; World.occluders = []; World._movers = null; World.suspectRig = null;
  Player.gy = 0;
  Player.keys = {};
  Player.vel.set(0, 0, 0);
  Player.bobPhase = 0;
  World.mode = mode || 'crime';
  World.dust = null;
  const host = document.getElementById('three-host');
  if (!host) return;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(host.clientWidth || 800, host.clientHeight || 600);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x05050a, 1);
  if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  World.renderer = renderer;
  World.canvas = renderer.domElement;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05050a, 0.035);
  World.scene = scene;
  const camera = new THREE.PerspectiveCamera(75, (host.clientWidth || 800) / (host.clientHeight || 600), 0.05, 200);
  camera.rotation.order = 'YXZ';
  World.camera = camera;
  let roomInfo;
  if (World.mode === 'interrogation'){
    roomInfo = buildInterrogationRoom(scene, World.currentSuspect);
    const sp = roomInfo.spawn;
    Player.pos.set(sp.x, Player.height, sp.z);
    Player.yaw = Math.atan2(-(0 - sp.x), -(-0.85 - sp.z));
    Player.pitch = -0.1;
  } else {
    const roomType = c.sceneType || 'despacho';
    const builder = LAYOUTS[roomType] || layoutDespacho;
    const cfg = Object.assign({}, c.sceneConfig || {}, { corpseSpot: c.corpseSpot, corpsePose: c.corpsePose, _seed: c.id });
    roomInfo = builder(scene, cfg);
    const cs = roomInfo.corpse || { x: roomInfo.corpsePos.x, z: roomInfo.corpsePos.z, rot: roomInfo.corpsePos.rot, pose: roomInfo.pose };
    buildCorpse(scene, cs.pose, cs.x, cs.z, cs.rot, {
      register: !roomInfo.corpse, y: cs.y || 0, seed: c.id, cause: c.cause, look: c.victimLook,
      slots: roomInfo.objectSlots || []
    });
    World.corpseSpot = cs;
    const sp = roomInfo.spawn || { x: 0, z: 3 };
    Player.pos.set(sp.x, Player.height, sp.z);
    Player.yaw = Math.atan2(-(roomInfo.corpsePos.x - sp.x), -(roomInfo.corpsePos.z - sp.z));
    Player.pitch = -0.15;
    const slots = roomInfo.objectSlots || [];
    c.objects.forEach((obj, i) => {
      const slot = slots[i % Math.max(1, slots.length)];
      if (!slot) return;

      // ¿Está oculto? → sólo visible si se ha examinado el objeto "gate"
      const isHidden = !!obj.hiddenBy && !g.examined.includes(obj.hiddenBy);

      const factory = getObjectModel(obj);
      const mg = factory();
      mg.position.set(slot.x, slot.y, slot.z);
      mg.rotation.y = Math.random() * Math.PI * 2;
      mg.visible = !isHidden;
      scene.add(mg);

      const marker = makeHotspotMarker(obj, g.examined.includes(obj.id));
      marker.position.set(slot.x, slot.y + 0.01, slot.z);
      marker.visible = !isHidden;
      scene.add(marker);

      World.interactables.push({
        mesh: marker, type: 'object', objId: obj.id, data: obj,
        hidden: isHidden, baseY: slot.y + 0.01,
        objMesh: mg,
        phase: Math.random() * Math.PI * 2
      });
    });
  }
  RemotePlayers.attachToScene(scene);
  World.raycaster = new THREE.Raycaster();
  World.buildOccluders();
  World.crosshairEl = document.querySelector('.crosshair');
  World.nearHintEl = document.querySelector('.near-hint');
  setupControls();
  const startY = Player.height + 1.8, endY = Player.height;
  const tStart = performance.now(), dur = 1400;
  function intro(){
    const t = Math.min(1, (performance.now() - tStart) / dur);
    const e = 1 - Math.pow(1 - t, 3);
    camera.position.y = startY + (endY - startY) * e;
    if (t < 1) requestAnimationFrame(intro);
  }
  camera.position.y = startY;
  intro();
  World.lastTime = performance.now();
  animateWorld();
}

/* Revela objetos ocultos cuyo gate haya sido examinado */
function updateHiddenObjects(g){
  World.interactables.forEach(it => {
    if (!it.hidden) return;
    if (it.data.hiddenBy && g.examined.includes(it.data.hiddenBy)){
      it.hidden = false;
      it.mesh.visible = true;
      if (it.objMesh) it.objMesh.visible = true;
    }
  });
}