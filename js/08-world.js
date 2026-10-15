/* ====================================================================
   08-WORLD — Objeto World y Player
   ==================================================================== */

const World = {
  renderer:null, scene:null, camera:null, canvas:null,
  bounds:{ minX:-5, maxX:5, minZ:-5, maxZ:5 },
  obstacles:[], interactables:[], dust:null,
  roomHalf:5, roomHeight:3,
  raycaster:null, animId:null, lastTime:0,
  caseData:null, mode:'crime', currentSuspect:null,
  onInteract:null, nearHintEl:null, crosshairEl:null,
  boundEvents:{}
};

const Player = {
  pos: new THREE.Vector3(0, 1.65, 3),
  vel: new THREE.Vector3(0, 0, 0),
  yaw: Math.PI, pitch: -0.1,
  radius: 0.32, height: 1.65,
  walkSpeed: 2.8, runSpeed: 5.0,
  bobPhase: 0, bobAmp: 0,
  pointerLocked: false, keys:{}, moving:false
};