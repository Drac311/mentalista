/* ====================================================================
   08B-WORLD-INIT — Hotspot marker + initWorld
   ==================================================================== */

function makeHotspotMarker(obj, examined){
  const g = new THREE.Group();
  const color = examined ? 0x4ade80 : 0xd4a017;
  const mat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.8,
    metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0.95
  });
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 10), mat));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.014, 10, 24),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 }));
  ring.rotation.x = Math.PI/2;
  g.add(ring);
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 64;
  const cx = cv.getContext('2d');
  cx.fillStyle = 'rgba(0,0,0,0.85)'; cx.fillRect(0, 0, 256, 64);
  cx.strokeStyle = examined ? '#4ade80' : '#d4a017'; cx.lineWidth = 3;
  cx.strokeRect(2, 2, 252, 60);
  cx.fillStyle = examined ? '#4ade80' : '#d4a017';
  cx.font = 'bold 22px "Special Elite", monospace';
  cx.textAlign = 'center'; cx.textBaseline = 'middle';
  let t = obj.name + (examined ? ' OK' : '');
  if (t.length > 18) t = t.slice(0, 17) + '...';
  cx.fillText(t, 128, 32);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: true }));
  sprite.scale.set(1.2, 0.3, 1);
  sprite.position.y = 0.28;
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
    roomInfo = builder(scene, c.sceneConfig || {});
    buildCorpse(scene, c.corpsePose || roomInfo.pose, roomInfo.corpsePos.x, roomInfo.corpsePos.z, roomInfo.corpsePos.rot);
    const sp = roomInfo.spawn || { x: 0, z: 3 };
    Player.pos.set(sp.x, Player.height, sp.z);
    Player.yaw = Math.atan2(-(roomInfo.corpsePos.x - sp.x), -(roomInfo.corpsePos.z - sp.z));
    Player.pitch = -0.15;
    const slots = roomInfo.objectSlots || [];
    c.objects.forEach((obj, i) => {
      const slot = slots[i % Math.max(1, slots.length)];
      if (!slot) return;
      const factory = getObjectModel(obj);
      const mg = factory();
      mg.position.set(slot.x, slot.y, slot.z);
      mg.rotation.y = Math.random() * Math.PI * 2;
      scene.add(mg);
      const marker = makeHotspotMarker(obj, g.examined.includes(obj.id));
      marker.position.set(slot.x, slot.y + 0.28, slot.z);
      scene.add(marker);
      World.interactables.push({
        mesh: marker, type: 'object', objId: obj.id, data: obj,
        baseY: slot.y + 0.28, phase: Math.random() * Math.PI * 2
      });
    });
  }
  RemotePlayers.attachToScene(scene);
  World.raycaster = new THREE.Raycaster();
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