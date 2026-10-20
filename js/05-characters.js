/* ====================================================================
   05-CHARACTERS — Apariencia personalizable (LOOK), esqueleto humano
   articulado, jugador, sospechoso, cadáver (poses/escenas) y RemotePlayers
   ==================================================================== */

/* ---------- CATÁLOGO DE PERSONALIZACIÓN ---------- */
const LOOK_DEFS = {
  body:    [['masc','Masculina'],['fem','Femenina'],['neutral','Neutra']],
  build:   [[0,'Delgada'],[1,'Media'],[2,'Robusta']],
  height:  [[0,'Baja'],[1,'Algo baja'],[2,'Media'],[3,'Alta'],[4,'Muy alta']],
  hair:    [['bald','Calvo'],['buzz','Rapado'],['short','Corto'],['side','Raya lateral'],['slick','Engominado'],
            ['curly','Rizado'],['afro','Afro'],['wavy','Ondulado'],['bob','Media melena'],['long','Largo'],
            ['pixie','Pixie'],['bun','Moño'],['ponytail','Coleta'],['braid','Trenza'],['mohawk','Cresta']],
  facial:  [['none','Ninguno'],['stubble','Barba de 3 días'],['mustache','Bigote'],['goatee','Perilla'],['beard','Barba'],['sideburns','Patillas']],
  top:     [['shirt','Camisa'],['suit','Traje'],['blouse','Blusa'],['turtleneck','Cuello alto'],['sweater','Jersey'],
            ['hoodie','Sudadera'],['tshirt','Camiseta'],['vest','Chaleco'],['labcoat','Bata'],['trench','Gabardina'],['dress','Vestido']],
  bottom:  [['trousers','Pantalón'],['jeans','Vaqueros'],['skirt','Falda'],['longskirt','Falda larga'],['shorts','Bermudas']],
  shoes:   [['oxford','Oxford'],['sneakers','Zapatillas'],['boots','Botas'],['heels','Tacones'],['flats','Bailarinas']],
  hat:     [['none','Sin sombrero'],['fedora','Fedora'],['cap','Gorra'],['beret','Boina'],['bowler','Bombín'],['tophat','Chistera'],['beanie','Gorro'],['cloche','Cloché']],
  glasses: [['none','Sin gafas'],['round','Redondas'],['square','Cuadradas'],['shades','De sol'],['monocle','Monóculo']],
  neck:    [['none','Nada'],['tie','Corbata'],['bowtie','Pajarita'],['scarf','Bufanda'],['necklace','Collar']],
  extra:   [['none','Nada'],['badge','Placa'],['watch','Reloj'],['gloves','Guantes'],['earrings','Pendientes']],
  skins:   [0xf6dcc4,0xecc4a0,0xd8a888,0xc89878,0xb88868,0xa87858,0x8a5a3c,0x6a4228,0x4a2c1a],
  hairColors:[0x0e0a08,0x2a1a10,0x4a2c18,0x6a4426,0x8a5a2a,0xb8843c,0xd8b46a,0xe8d8a8,0x8a8a8a,0xd0d0d0,0x8a2a1a,0x2a4a8a,0x7a2a8a],
  cloth:   [0x1a1a1e,0x3a3a40,0x6a6a72,0xe8e8e8,0xf0e4c8,0x2a3a5a,0x2a4a8a,0x4a7ab0,0x2a5a3a,0x5a7a3a,
            0x5a2a1a,0x8a5a2a,0xb0924a,0x6a1818,0xb03a3a,0x5a2a6a,0xd0708a,0xe0a040],
  eyes:    [0x2a1a10,0x5a3a1a,0x3a6a8a,0x3a7a4a,0x6a6a6a,0x1a1a1a]
};
const LOOK_DEFAULT = {
  v:1, body:'masc', build:1, height:2, skin:0xd8a888, eyes:0x2a1a10,
  hair:'short', hairColor:0x2a1a10, facial:'none',
  top:'shirt', topColor:0x2a3a5a, topColor2:0x8a1818,
  bottom:'trousers', bottomColor:0x1a1a1e,
  shoes:'oxford', shoeColor:0x0a0a10,
  hat:'none', hatColor:0x1a1a1e, glasses:'none', neck:'none', neckColor:0x8a1818, extra:'none'
};
const LOOK_HEIGHTS = [0.92, 0.96, 1.0, 1.04, 1.08];
function _opt(list, v, def){ return list.some(o => o[0] === v) ? v : def; }
function _col(v, def){ v = typeof v === 'string' ? parseInt(v.replace('#',''), 16) : v; return (typeof v === 'number' && isFinite(v)) ? (v & 0xffffff) : def; }

/* Convierte cualquier cosa (look nuevo, charDef antiguo, nada) en un look completo y válido */
function normalizeLook(src){
  const D = LOOK_DEFAULT;
  if (!src) return Object.assign({}, D);
  if (src.look && !src.v) src = src.look;
  if (!src.v){   // formato antiguo {gender, skin, hair, shirt, pants, hat, glasses, tie}
    const fem = src.gender === 'female';
    return normalizeLook({
      v:1, body: fem ? 'fem' : 'masc', skin: src.skin, hairColor: src.hair,
      hair: fem ? 'long' : 'short',
      top: src.tie ? 'suit' : (fem ? 'blouse' : 'shirt'), topColor: src.shirt, bottom: fem ? 'skirt' : 'trousers', bottomColor: src.pants,
      hat: src.hat ? 'fedora' : 'none', glasses: src.glasses ? 'round' : 'none', neck: src.tie ? 'tie' : 'none',
      shoes: fem ? 'heels' : 'oxford'
    });
  }
  const o = {
    v:1,
    body: _opt(LOOK_DEFS.body, src.body, D.body),
    build: Math.max(0, Math.min(2, src.build | 0)),
    height: Math.max(0, Math.min(4, src.height == null ? 2 : src.height | 0)),
    skin: _col(src.skin, D.skin), eyes: _col(src.eyes, D.eyes),
    hair: _opt(LOOK_DEFS.hair, src.hair, D.hair), hairColor: _col(src.hairColor, D.hairColor),
    facial: _opt(LOOK_DEFS.facial, src.facial, 'none'),
    top: _opt(LOOK_DEFS.top, src.top, D.top), topColor: _col(src.topColor, D.topColor), topColor2: _col(src.topColor2, D.topColor2),
    bottom: _opt(LOOK_DEFS.bottom, src.bottom, D.bottom), bottomColor: _col(src.bottomColor, D.bottomColor),
    shoes: _opt(LOOK_DEFS.shoes, src.shoes, D.shoes), shoeColor: _col(src.shoeColor, D.shoeColor),
    hat: _opt(LOOK_DEFS.hat, src.hat, 'none'), hatColor: _col(src.hatColor, D.hatColor),
    glasses: _opt(LOOK_DEFS.glasses, src.glasses, 'none'),
    neck: _opt(LOOK_DEFS.neck, src.neck, 'none'), neckColor: _col(src.neckColor, D.neckColor),
    extra: _opt(LOOK_DEFS.extra, src.extra, 'none')
  };
  return o;
}
/* Generador pseudoaleatorio determinista */
function _rng(seed){
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++){ h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = (h ^ (h >>> 16)) >>> 0;
  return function(){ a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function lookFromSeed(seed, gender, opts){
  opts = opts || {};
  const r = _rng(seed), pick = a => a[(r() * a.length) | 0];
  const fem = gender === 'female', neutral = gender === 'neutral';
  const body = neutral ? 'neutral' : (fem ? 'fem' : 'masc');
  const hairList = fem ? ['long','bob','wavy','bun','ponytail','pixie','braid','curly','short'] : ['short','side','slick','buzz','curly','short','bald','afro'];
  const aged = opts.age === 'old';
  let hairColor = pick(LOOK_DEFS.hairColors.slice(0, 8));
  if (aged) hairColor = pick([0x8a8a8a, 0xd0d0d0, 0xd0d0d0, 0x4a4a4a]);
  const tops = fem ? ['blouse','dress','sweater','suit','turtleneck','shirt','trench'] : ['shirt','suit','sweater','vest','turtleneck','tshirt','trench','hoodie'];
  const top = opts.top || pick(tops);
  const dark = [0x1a1a1e,0x3a3a40,0x2a3a5a,0x5a2a1a,0x2a4a8a,0x2a5a3a,0x6a1818,0x5a2a6a,0x8a5a2a,0x6a6a72];
  const look = {
    v:1, body, build: (r() * 3) | 0, height: 1 + ((r() * 3) | 0),
    skin: opts.skin != null ? opts.skin : pick(LOOK_DEFS.skins.slice(0, 7)), eyes: pick(LOOK_DEFS.eyes),
    hair: opts.hair || pick(hairList), hairColor,
    facial: (!fem && !neutral && r() < 0.35) ? pick(['stubble','mustache','goatee','beard','sideburns']) : 'none',
    top, topColor: pick(dark), topColor2: pick([0x8a1818,0x2a3a5a,0xb0924a,0xe8e8e8,0x2a5a3a]),
    bottom: fem ? pick(['skirt','trousers','longskirt','jeans']) : pick(['trousers','trousers','jeans']),
    bottomColor: pick([0x1a1a1e,0x2a2a30,0x3a2a1a,0x2a3a5a,0x4a4a52]),
    shoes: fem ? pick(['heels','flats','boots']) : pick(['oxford','oxford','boots','sneakers']), shoeColor: pick([0x0a0a10,0x2a1a10,0x4a2a14]),
    hat: r() < 0.18 ? pick(['fedora','cap','beret','bowler','cloche']) : 'none', hatColor: pick(dark),
    glasses: r() < 0.28 ? pick(['round','square','round']) : 'none',
    neck: top === 'suit' ? pick(['tie','tie','bowtie']) : (r() < 0.2 ? pick(['scarf','necklace']) : 'none'), neckColor: pick([0x8a1818,0x2a3a5a,0xb0924a,0x2a5a3a]),
    extra: r() < 0.15 ? pick(['watch','badge']) : 'none'
  };
  if (fem && look.neck === 'tie') look.neck = 'necklace';
  if (look.top === 'dress'){ look.bottom = 'skirt'; }
  return normalizeLook(look);
}

/* ---------- ESQUELETO HUMANO ARTICULADO ---------- */
function _mat(color, rough, extra){ return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: rough == null ? 0.85 : rough }, extra || {})); }
function _lg(pts, depth, seg){
  if (pts[0][1] > pts[pts.length - 1][1]) pts = pts.slice().reverse();   // Lathe exige y ascendente (normales hacia fuera)
  const g = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg || 22);
  g.scale(1, 1, depth || 0.62); return g;
}
function _m(parent, geo, mat, x, y, z, cast){
  const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = cast !== false; m.receiveShadow = true; parent.add(m); return m;
}
function _ell(parent, rx, ry, rz, mat, x, y, z, seg){
  const m = _m(parent, new THREE.SphereGeometry(1, seg || 16, seg ? Math.max(8, seg - 4) : 12), mat, x, y, z); m.scale.set(rx, ry, rz); return m;
}
function _tcyl(parent, rt, rb, h, mat, x, y, z, seg){ return _m(parent, new THREE.CylinderGeometry(rt, rb, h, seg || 12), mat, x, y, z); }

/*  Devuelve un Group (mira hacia +Z, pies en y=0) con group.userData.rig.
    +X es la IZQUIERDA del personaje.                                         */
function buildHumanoid(lookIn, opts){
  opts = opts || {};
  const L = normalizeLook(lookIn);
  const f = [0.92, 1.0, 1.1][L.build];
  const bt = L.body;
  const waistR = ({ masc:0.150, fem:0.122, neutral:0.138 }[bt]) * f;
  const chestR = ({ masc:0.190, fem:0.162, neutral:0.176 }[bt]) * f;
  const shR    = ({ masc:0.200, fem:0.168, neutral:0.185 }[bt]) * f;
  const hipR   = ({ masc:0.165, fem:0.192, neutral:0.176 }[bt]) * f;
  const shX = shR + 0.012;
  const dead = !!opts.dead;
  let skinCol = L.skin;
  if (dead){ const c = new THREE.Color(skinCol); const g = (c.r + c.g + c.b) / 3; c.r = c.r * 0.7 + g * 0.3; c.g = c.g * 0.7 + g * 0.3 + 0.02; c.b = c.b * 0.7 + g * 0.3 + 0.03; c.multiplyScalar(0.92); skinCol = c.getHex(); }

  const skin = _mat(skinCol, 0.78);
  const hairM = _mat(L.hairColor, 0.55, { metalness: 0.05 });
  const topM = _mat(L.topColor, 0.88), top2M = _mat(L.topColor2, 0.8);
  const botM = _mat(L.bottomColor, 0.9), shoeM = _mat(L.shoeColor, 0.55);
  const whiteM = _mat(0xf0ece0, 0.85);

  const root = new THREE.Group();
  const pelvis = new THREE.Group(); pelvis.position.y = 0.93; root.add(pelvis);
  const spine = new THREE.Group(); spine.position.y = 0.09; pelvis.add(spine);
  const neck = new THREE.Group(); neck.position.y = 0.5; spine.add(neck);
  const head = new THREE.Group(); head.position.y = 0.13; neck.add(head);

  /* --- pelvis y cadera (color del pantalón / falda) --- */
  const longCoat = L.top === 'trench' || L.top === 'labcoat';
  const jacket = L.top === 'suit';
  const dressTop = L.top === 'dress';
  const hipsMat = dressTop ? topM : botM;
  _m(pelvis, _lg([[0.001,-0.14],[hipR*0.8,-0.13],[hipR,-0.05],[hipR*0.98,0.03],[waistR*1.05,0.1],[0.001,0.1]], 0.66), hipsMat, 0, 0, 0);

  /* --- tronco --- */
  const chestPts = (o) => [[0.001,-0.01],[waistR+o,0],[waistR*1.02+o,0.1],[chestR+o,0.27],[shR*0.97+o,0.4],[shR*0.74+o,0.47],[0.075,0.505],[0.001,0.52]];
  _m(spine, _lg(chestPts(0), 0.62), skin, 0, 0, 0, false);
  const shellOff = { shirt:0.006, blouse:0.006, tshirt:0.006, suit:0.014, turtleneck:0.012, sweater:0.018, hoodie:0.022, vest:0.004, labcoat:0.02, trench:0.022, dress:0.006 }[L.top];
  const shirtShellM = (L.top === 'vest') ? top2M : topM;
  const shell = _m(spine, _lg(chestPts(shellOff), 0.62), shirtShellM, 0, 0, 0);
  if (L.top === 'suit' || L.top === 'trench' || L.top === 'labcoat'){
    const jm = L.top === 'suit' ? topM : topM;
    // faldones de la chaqueta/abrigo, siguen a la pelvis
    const hem = L.top === 'suit' ? -0.2 : (L.top === 'labcoat' ? -0.56 : -0.52);
    const flare = L.top === 'suit' ? 1.02 : 1.2;
    _m(pelvis, _lg([[hipR*0.95+shellOff,0.1],[hipR*1.02+shellOff,0.0],[hipR*flare+shellOff+0.01,hem*0.5],[hipR*flare*1.02+shellOff+0.02,hem],[hipR*0.9,hem+0.01]], 0.7), jm, 0, 0, 0);
  }
  if (L.top === 'suit'){
    // solapas y camisa
    box(spine, 0.085, 0.3, 0.012, whiteM, 0, 0.33, shR*0.62*0.62 + 0.06);
    [-1, 1].forEach(s => { const lp = box(spine, 0.065, 0.3, 0.014, topM, s * 0.062, 0.32, chestR*0.62 + 0.03); lp.rotation.z = -s * 0.28; lp.rotation.y = -s * 0.1; });
    [0.1, 0.2].forEach(y => sph(spine, 0.008, _mat(0x111111, 0.4), 0.0, y, waistR*0.62 + 0.05));
  } else if (L.top === 'shirt' || L.top === 'blouse'){
    box(spine, 0.012, 0.42, 0.006, whiteM, 0, 0.28, chestR*0.62 + 0.008).material = _mat(0xd8d0c0, 0.8);
    [0.06, 0.16, 0.26, 0.36].forEach(y => sph(spine, 0.006, whiteM, 0, y, chestR*0.62 + 0.012));
  } else if (L.top === 'hoodie'){
    const hood = _ell(spine, 0.115, 0.1, 0.1, topM, 0, 0.5, -0.07, 14);
    box(spine, 0.2, 0.1, 0.012, _mat(L.topColor, 0.95), 0, 0.1, chestR*0.62 + 0.03);
    [-1, 1].forEach(s => cyl(spine, 0.004, 0.004, 0.14, whiteM, s * 0.03, 0.4, chestR*0.62 + 0.03, 6));
  } else if (L.top === 'trench'){
    _m(spine, new THREE.TorusGeometry(waistR*0.62*1.02 + 0.03, 0.012, 6, 20), top2M, 0, 0.02, 0).rotation.x = Math.PI / 2;
    [-1, 1].forEach(s => { const c = box(spine, 0.08, 0.14, 0.02, topM, s * 0.07, 0.46, chestR*0.62 + 0.02); c.rotation.z = -s * 0.5; });
    [0.15, 0.25, 0.35].forEach(y => sph(spine, 0.009, top2M, 0.04, y, chestR*0.62 + 0.035));
  } else if (L.top === 'labcoat'){
    [-1, 1].forEach(s => { const c = box(spine, 0.07, 0.22, 0.014, topM, s * 0.065, 0.4, chestR*0.62 + 0.032); c.rotation.z = -s * 0.3; });
    [-1, 1].forEach(s => box(pelvis, 0.08, 0.1, 0.01, _mat(L.topColor, 0.9), s * 0.09, -0.12, hipR*0.7 + 0.05));
  } else if (L.top === 'turtleneck'){
    _tcyl(neck, 0.062, 0.07, 0.11, topM, 0, 0.04, 0, 14);
  } else if (L.top === 'sweater'){
    _m(spine, new THREE.TorusGeometry(waistR*0.62 + 0.02, 0.014, 6, 22), topM, 0, 0.0, 0).rotation.x = Math.PI / 2;
    _tcyl(neck, 0.058, 0.066, 0.06, topM, 0, 0.02, 0, 14);
  } else if (L.top === 'vest'){
    [0.08, 0.18, 0.28].forEach(y => sph(spine, 0.007, _mat(0x222222, 0.4), 0, y, chestR*0.62 + 0.012));
    box(spine, 0.12, 0.34, 0.01, whiteM, 0, 0.32, shR*0.62*0.6 + 0.02).visible = true;
  } else if (L.top === 'dress'){
    const hem = -0.5;
    _m(pelvis, _lg([[hipR*0.9,0.1],[hipR*1.05,0.0],[hipR*1.35,-0.28],[hipR*1.6,hem],[hipR*1.55,hem-0.015],[hipR*0.8,hem+0.02]], 0.8), topM, 0, 0, 0);
    _m(pelvis, new THREE.TorusGeometry(hipR*1.58, 0.01, 6, 26), top2M, 0, hem, 0).rotation.x = Math.PI / 2;
  }
  // cuello
  _tcyl(neck, 0.052, 0.06, 0.12, skin, 0, 0.04, 0, 12);
  if (L.top === 'shirt' || L.top === 'blouse' || L.top === 'suit'){
    [-1, 1].forEach(s => { const c = box(neck, 0.05, 0.04, 0.014, L.top === 'suit' ? whiteM : topM, s * 0.032, 0.0, 0.052); c.rotation.z = -s * 0.5; c.rotation.y = -s * 0.5; });
  }
  // accesorios de cuello
  const neckM = _mat(L.neckColor, 0.7);
  if (L.neck === 'tie'){
    sph(spine, 0.022, neckM, 0, 0.5, 0.075);
    const t = box(spine, 0.05, 0.28, 0.008, neckM, 0, 0.34, chestR*0.62 + 0.026); t.rotation.x = -0.05;
  } else if (L.neck === 'bowtie'){
    [-1, 1].forEach(s => { const w = box(neck, 0.045, 0.035, 0.014, neckM, s * 0.032, -0.02, 0.058); w.rotation.z = s * 0.25; });
    sph(neck, 0.014, neckM, 0, -0.02, 0.062);
  } else if (L.neck === 'scarf'){
    _m(neck, new THREE.TorusGeometry(0.068, 0.025, 8, 20), neckM, 0, 0.0, 0).rotation.x = Math.PI / 2;
    box(spine, 0.07, 0.3, 0.02, neckM, 0.07, 0.32, chestR*0.62 + 0.03);
  } else if (L.neck === 'necklace'){
    const nk = _m(neck, new THREE.TorusGeometry(0.062, 0.004, 6, 24), _mat(0xe8d8a8, 0.25, { metalness: 0.8 }), 0, -0.02, 0.012); nk.rotation.x = Math.PI / 2.15;
    sph(spine, 0.012, _mat(0xe8d8a8, 0.25, { metalness: 0.8 }), 0, 0.43, shR*0.62*0.85 + 0.02);
  }

  /* --- cabeza --- */
  _ell(head, 0.095, 0.115, 0.105, skin, 0, 0, 0, 24);
  _ell(head, 0.082, 0.07, 0.088, skin, 0, -0.06, 0.012, 18);
  [-1, 1].forEach(s => _ell(head, 0.016, 0.026, 0.012, skin, s * 0.097, -0.005, 0, 10));
  _ell(head, 0.014, 0.02, 0.022, skin, 0, -0.018, 0.103, 10);
  const eyeM = _mat(L.eyes, 0.3), pupilM = _mat(0x050505, 0.2);
  const lidM = _mat(skinCol, 0.8);
  [-1, 1].forEach(s => {
    if (dead){
      const lid = _ell(head, 0.02, 0.011, 0.012, lidM, s * 0.04, 0.015, 0.089, 10);
      box(head, 0.03, 0.003, 0.004, _mat(0x3a2a2a, 0.9), s * 0.04, 0.012, 0.099);
    } else {
      _ell(head, 0.017, 0.014, 0.01, _mat(0xf4f4f0, 0.3), s * 0.04, 0.015, 0.089, 10);
      _ell(head, 0.009, 0.009, 0.006, eyeM, s * 0.04, 0.015, 0.097, 8);
      _ell(head, 0.004, 0.004, 0.004, pupilM, s * 0.04, 0.015, 0.1, 6);
    }
    const br = box(head, 0.04, 0.007, 0.008, hairM, s * 0.042, 0.047, 0.091); br.rotation.z = s * (bt === 'fem' ? 0.12 : 0.05);
  });
  const lipM = _mat(dead ? 0x7a6a70 : (bt === 'fem' ? 0xb06a6a : 0xa87068), 0.5);
  box(head, 0.046, 0.007, 0.01, lipM, 0, -0.05, 0.09);
  // pelo
  const hairGroup = new THREE.Group(); head.add(hairGroup);
  _buildHair(hairGroup, L.hair, hairM, bt);
  _buildFacial(head, L.facial, hairM);
  // sombrero
  _buildHat(head, L.hat, _mat(L.hatColor, 0.8), top2M);
  // gafas
  _buildGlasses(head, L.glasses);
  // pendientes
  if (L.extra === 'earrings') [-1, 1].forEach(s => sph(head, 0.008, _mat(0xe0c060, 0.2, { metalness: 0.9 }), s * 0.1, -0.04, 0));

  /* --- brazos --- */
  const sleeveLong = !(L.top === 'tshirt' || L.top === 'dress');
  const sleeveM = (L.top === 'vest') ? top2M : topM;
  const armW = 0.052 * f;
  const makeArm = side => {
    const sh = new THREE.Group(); sh.position.set(side * shX, 0.43, 0); spine.add(sh);
    sph(sh, armW * 1.12, sleeveLong || L.top === 'tshirt' || L.top === 'dress' ? sleeveM : skin, 0, 0, 0).castShadow = true;
    _tcyl(sh, armW, armW * 0.86, 0.29, (sleeveLong || L.top === 'tshirt' || L.top === 'dress') ? sleeveM : skin, 0, -0.145, 0);
    const el = new THREE.Group(); el.position.y = -0.29; sh.add(el);
    sph(el, armW * 0.88, sleeveLong ? sleeveM : skin, 0, 0, 0);
    _tcyl(el, armW * 0.86, armW * 0.7, 0.26, sleeveLong ? sleeveM : skin, 0, -0.13, 0);
    if (sleeveLong && L.top !== 'sweater') _tcyl(el, armW * 0.74, armW * 0.74, 0.025, (L.top === 'suit') ? whiteM : sleeveM, 0, -0.26, 0);
    const hand = new THREE.Group(); hand.position.y = -0.27; el.add(hand);
    const handM = (L.extra === 'gloves') ? _mat(0x1a1a1e, 0.6) : skin;
    _ell(hand, 0.034, 0.05, 0.022, handM, 0, -0.03, 0, 12);
    _ell(hand, 0.012, 0.03, 0.012, handM, side * -0.03, -0.02, 0.012, 8);   // pulgar
    if (L.extra === 'watch' && side > 0){ _m(el, new THREE.TorusGeometry(armW * 0.78, 0.007, 6, 14), _mat(0xc8c8d0, 0.2, { metalness: 0.9 }), 0, -0.235, 0).rotation.x = Math.PI / 2; }
    return { sh, el, hand };
  };
  const armL = makeArm(1), armR = makeArm(-1);
  if (L.extra === 'badge'){
    const b = box(spine, 0.05, 0.06, 0.008, _mat(0xe0c060, 0.25, { metalness: 0.9 }), 0.09, 0.3, chestR*0.62 + (shellOff||0.01) + 0.012);
    sph(spine, 0.01, _mat(0xa01818, 0.4), 0.09, 0.3, chestR*0.62 + (shellOff||0.01) + 0.02);
  }

  /* --- piernas --- */
  const legW = 0.088 * f;
  const skirty = L.bottom === 'skirt' || L.bottom === 'longskirt';
  const legSkin = (L.bottom === 'shorts' || skirty || dressTop);
  if (skirty && !dressTop){
    const hem = L.bottom === 'skirt' ? -0.3 : -0.55;
    _m(pelvis, _lg([[hipR*0.95,0.1],[hipR*1.06,0.0],[hipR*(L.bottom === 'skirt' ? 1.25 : 1.4),hem*0.6],[hipR*(L.bottom === 'skirt' ? 1.32 : 1.55),hem],[hipR*1.28,hem+0.012]], 0.78), botM, 0, 0, 0);
  }
  const legColor = (L.bottom === 'jeans') ? _mat(L.bottomColor, 0.95) : botM;
  const makeLeg = side => {
    const hip = new THREE.Group(); hip.position.set(side * 0.085 * (bt === 'fem' ? 1.1 : 1), -0.05, 0); pelvis.add(hip);
    const thighM = legSkin ? (dressTop || skirty ? _mat(skinCol, 0.7) : skin) : legColor;
    _tcyl(hip, legW, legW * 0.74, 0.42, (L.bottom === 'shorts') ? botM : thighM, 0, -0.21, 0);
    if (L.bottom === 'shorts') _tcyl(hip, legW * 1.02, legW * 0.9, 0.2, botM, 0, -0.1, 0);
    const kn = new THREE.Group(); kn.position.y = -0.42; hip.add(kn);
    sph(kn, legW * 0.72, (legSkin ? thighM : legColor), 0, 0, 0);
    _tcyl(kn, legW * 0.72, legW * 0.52, 0.4, legSkin ? thighM : legColor, 0, -0.2, 0);
    if (!legSkin && L.bottom !== 'jeans') _tcyl(kn, legW * 0.545, legW * 0.545, 0.02, botM, 0, -0.385, 0);
    const ank = new THREE.Group(); ank.position.y = -0.4; kn.add(ank);
    _buildShoe(ank, L.shoes, shoeM, side, skin);
    return { hip, kn, ank };
  };
  const legL = makeLeg(1), legR = makeLeg(-1);

  /* --- escala y rig --- */
  root.scale.setScalar(LOOK_HEIGHTS[L.height]);
  root.traverse(o => { if (o.isMesh){ o.castShadow = true; } });
  const rig = {
    root, pelvis, spine, neck, head, look: L, heightScale: LOOK_HEIGHTS[L.height],
    shL: armL.sh, shR: armR.sh, elL: armL.el, elR: armR.el, hdL: armL.hand, hdR: armR.hand,
    hipL: legL.hip, hipR: legR.hip, knL: legL.kn, knR: legR.kn, anL: legL.ank, anR: legR.ank,
    phase: 0, walkAmt: 0, t: Math.random() * 10, mode: 'stand', blinkT: 2 + Math.random() * 3,
    update(dt, moving, running){
      this.t += dt;
      if (this.mode === 'seated') return this.idleSeated(dt);
      const target = moving ? (running ? 1.25 : 1) : 0;
      this.walkAmt += (target - this.walkAmt) * Math.min(1, dt * 9);
      this.phase += dt * (6 + 3 * this.walkAmt) * (this.walkAmt > 0.05 ? 1 : 0);
      const a = this.walkAmt, s = Math.sin(this.phase), c = Math.cos(this.phase);
      this.hipL.rotation.x = s * 0.62 * a;  this.hipR.rotation.x = -s * 0.62 * a;
      this.knL.rotation.x = Math.max(0, -c) * 0.9 * a + 0.04; this.knR.rotation.x = Math.max(0, c) * 0.9 * a + 0.04;
      this.shL.rotation.x = -s * 0.5 * a;   this.shR.rotation.x = s * 0.5 * a;
      this.elL.rotation.x = -0.15 - a * 0.35 - Math.max(0, s) * 0.3 * a; this.elR.rotation.x = -0.15 - a * 0.35 - Math.max(0, -s) * 0.3 * a;
      this.shL.rotation.z = 0.06; this.shR.rotation.z = -0.06;
      this.spine.rotation.y = s * 0.09 * a;  this.pelvis.rotation.y = -s * 0.07 * a;
      this.pelvis.position.y = 0.93 + Math.abs(Math.cos(this.phase)) * 0.025 * a;
      const br = Math.sin(this.t * 1.7) * 0.004;
      this.spine.scale.set(1 + br, 1 + br * 1.5, 1 + br);
      this.head.rotation.y = Math.sin(this.t * 0.5) * 0.05 * (1 - Math.min(1, a));
    },
    idleSeated(dt){
      const br = Math.sin(this.t * 1.6) * 0.006;
      this.spine.scale.set(1 + br, 1 + br * 1.4, 1 + br);
      this.head.rotation.y = Math.sin(this.t * 0.45) * 0.14 + Math.sin(this.t * 1.3) * 0.02;
      this.head.rotation.x = 0.04 + Math.sin(this.t * 0.7) * 0.03;
      this.shL.rotation.x = -1.0 + Math.sin(this.t * 0.9) * 0.03; this.shR.rotation.x = -1.0 + Math.sin(this.t * 0.9 + 1) * 0.03;
    }
  };
  root.userData.rig = rig;
  root.userData.look = L;
  return root;
}

/* ---------- PEINADOS ---------- */
function _hairCap(g, mat, phi, sx, sy, sz, y, z){
  const m = _m(g, new THREE.SphereGeometry(1, 26, 16, 0, Math.PI * 2, 0, phi), mat, 0, (y || 0.004) + 0.014, (z || 0) - 0.006);
  m.scale.set(sx, sy, sz); m.rotation.x = -0.32; return m;
}
function _buildHair(g, style, M, bt){
  const cap = (phi, k, y, z) => _hairCap(g, M, phi, 0.1 * (k || 1.04), 0.122 * (k || 1.04), 0.112 * (k || 1.04), y, z);
  switch (style){
    case 'bald': return;
    case 'buzz': cap(Math.PI * 0.5, 1.01); return;
    case 'short': cap(Math.PI * 0.6, 1.06); [-1, 1].forEach(s => box(g, 0.012, 0.05, 0.05, M, s * 0.096, -0.02, -0.01)); return;
    case 'side': {
      cap(Math.PI * 0.6, 1.06);
      const fr = box(g, 0.12, 0.03, 0.05, M, -0.02, 0.085, 0.085); fr.rotation.z = 0.35; fr.rotation.x = -0.25;
      [-1, 1].forEach(s => box(g, 0.012, 0.05, 0.05, M, s * 0.096, -0.02, -0.01)); return;
    }
    case 'slick': cap(Math.PI * 0.58, 1.045); _ell(g, 0.092, 0.07, 0.085, M, 0, 0.0, -0.045, 14); return;
    case 'curly': {
      cap(Math.PI * 0.5, 1.03);
      for (let i = 0; i < 22; i++){ const a = i * 2.4, r = 0.075 + (i % 3) * 0.012; _ell(g, 0.03, 0.03, 0.03, M, Math.cos(a) * r, 0.065 + (i % 4) * 0.022, Math.sin(a) * r * 0.9 - 0.01, 8); }
      return;
    }
    case 'afro': _ell(g, 0.165, 0.15, 0.16, M, 0, 0.045, -0.012, 18); return;
    case 'wavy': {
      cap(Math.PI * 0.62, 1.07); box(g, 0.2, 0.3, 0.07, M, 0, -0.14, -0.08);
      [-1, 1].forEach(s => { box(g, 0.035, 0.28, 0.1, M, s * 0.105, -0.12, -0.02); for (let k = 0; k < 4; k++) _ell(g, 0.032, 0.03, 0.04, M, s * 0.108, -0.2 - k * 0.04, -0.02 + (k % 2) * 0.015, 8); });
      return;
    }
    case 'long': {
      cap(Math.PI * 0.64, 1.07); box(g, 0.21, 0.36, 0.07, M, 0, -0.19, -0.085);
      [-1, 1].forEach(s => box(g, 0.03, 0.3, 0.1, M, s * 0.103, -0.14, -0.015)); return;
    }
    case 'bob': {
      cap(Math.PI * 0.64, 1.07); box(g, 0.21, 0.17, 0.08, M, 0, -0.07, -0.075);
      [-1, 1].forEach(s => box(g, 0.03, 0.16, 0.1, M, s * 0.103, -0.06, -0.01)); box(g, 0.14, 0.03, 0.04, M, 0, 0.085, 0.09); return;
    }
    case 'pixie': cap(Math.PI * 0.6, 1.05); box(g, 0.12, 0.035, 0.04, M, 0.015, 0.09, 0.085).rotation.z = -0.3; return;
    case 'bun': cap(Math.PI * 0.58, 1.05); _ell(g, 0.055, 0.055, 0.055, M, 0, 0.13, -0.04, 12); return;
    case 'ponytail': {
      cap(Math.PI * 0.58, 1.05);
      tube(g, [[0, 0.02, -0.11], [0, -0.03, -0.17], [0, -0.14, -0.18], [0.0, -0.24, -0.15]], 0.026, M, 12, 6); return;
    }
    case 'braid': {
      cap(Math.PI * 0.58, 1.05);
      for (let k = 0; k < 7; k++) _ell(g, 0.03 - k * 0.002, 0.026, 0.03, M, (k % 2 ? 0.006 : -0.006), -0.02 - k * 0.042, -0.14 - k * 0.003, 8); return;
    }
    case 'mohawk': {
      cap(Math.PI * 0.45, 1.0);
      for (let k = 0; k < 9; k++){ const b = box(g, 0.02, 0.06 - Math.abs(k - 4) * 0.004, 0.025, M, 0, 0.12 - Math.abs(k - 4) * 0.012, 0.08 - k * 0.022); b.rotation.x = (k - 4) * 0.08; }
      return;
    }
  }
}
function _buildFacial(g, style, M){
  if (style === 'none') return;
  const dark = M;
  if (style === 'stubble'){
    const m = _m(g, new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), new THREE.MeshStandardMaterial({ color: M.color.getHex(), roughness: 1, transparent: true, opacity: 0.35 }), 0, -0.012, 0.004, false);
    m.scale.set(0.098, 0.122, 0.108); return;
  }
  if (style === 'mustache'){ box(g, 0.055, 0.012, 0.012, dark, 0, -0.036, 0.098); [-1, 1].forEach(s => _ell(g, 0.012, 0.01, 0.01, dark, s * 0.03, -0.042, 0.094, 8)); return; }
  if (style === 'goatee'){ box(g, 0.04, 0.012, 0.012, dark, 0, -0.036, 0.098); _ell(g, 0.022, 0.03, 0.016, dark, 0, -0.092, 0.08, 10); return; }
  if (style === 'sideburns'){ [-1, 1].forEach(s => box(g, 0.014, 0.07, 0.03, dark, s * 0.092, -0.02, 0.03)); return; }
  if (style === 'beard'){
    const m = _m(g, new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, Math.PI * 0.46, Math.PI * 0.54), dark, 0, -0.016, 0.006);
    m.scale.set(0.102, 0.125, 0.112);
    box(g, 0.055, 0.012, 0.012, dark, 0, -0.036, 0.101);
  }
}
function _buildHat(g, style, M, M2){
  if (style === 'none') return;
  const y = 0.075;
  if (style === 'fedora'){
    cyl(g, 0.19, 0.19, 0.012, M, 0, y + 0.02, 0, 28); cyl(g, 0.105, 0.115, 0.11, M, 0, y + 0.075, 0, 22);
    cyl(g, 0.118, 0.118, 0.025, M2, 0, y + 0.04, 0, 22);
    box(g, 0.1, 0.02, 0.05, M, 0, y + 0.135, 0.0);
  } else if (style === 'cap'){
    _ell(g, 0.11, 0.07, 0.115, M, 0, y + 0.03, 0, 18); box(g, 0.15, 0.01, 0.1, M, 0, y + 0.0, 0.14).rotation.x = 0.12;
  } else if (style === 'beret'){
    const b = _ell(g, 0.15, 0.045, 0.14, M, 0.025, y + 0.045, 0, 18); b.rotation.z = -0.15; sph(g, 0.008, M, 0.03, y + 0.09, 0);
  } else if (style === 'bowler'){
    _m(g, new THREE.SphereGeometry(0.118, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), M, 0, y + 0.0, 0).scale.set(1, 1.1, 1.1);
    cyl(g, 0.15, 0.15, 0.01, M, 0, y + 0.0, 0, 26);
  } else if (style === 'tophat'){
    cyl(g, 0.17, 0.17, 0.01, M, 0, y + 0.02, 0, 26); cyl(g, 0.1, 0.1, 0.2, M, 0, y + 0.12, 0, 22); cyl(g, 0.103, 0.103, 0.03, M2, 0, y + 0.05, 0, 22);
  } else if (style === 'beanie'){
    _m(g, new THREE.SphereGeometry(0.115, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), M, 0, y - 0.02, 0).scale.set(1, 1.05, 1.1);
    sph(g, 0.025, M2, 0, y + 0.115, 0);
  } else if (style === 'cloche'){
    _m(g, new THREE.SphereGeometry(0.12, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), M, 0, y - 0.025, 0).scale.set(1, 1.0, 1.1);
    cyl(g, 0.14, 0.12, 0.012, M, 0, y - 0.045, 0.01, 22);
  }
}
function _buildGlasses(g, style){
  if (style === 'none') return;
  const fm = _mat(0x1a1a1e, 0.35, { metalness: 0.4 });
  const lens = _mat(style === 'shades' ? 0x050505 : 0xaad0e8, 0.1, { transparent: true, opacity: style === 'shades' ? 0.92 : 0.18 });
  const z = 0.099, y = 0.016;
  const sides = style === 'monocle' ? [1] : [-1, 1];
  sides.forEach(s => {
    if (style === 'square' || style === 'shades'){
      box(g, 0.05, 0.004, 0.006, fm, s * 0.042, y + 0.017, z); box(g, 0.05, 0.004, 0.006, fm, s * 0.042, y - 0.017, z);
      box(g, 0.004, 0.036, 0.006, fm, s * 0.042 - 0.025, y, z); box(g, 0.004, 0.036, 0.006, fm, s * 0.042 + 0.025, y, z);
    } else {
      _m(g, new THREE.TorusGeometry(0.0245, 0.0035, 8, 20), style === 'monocle' ? _mat(0xc8a850, 0.25, { metalness: 0.9 }) : fm, s * 0.042, y, z, false);
    }
    const l = _m(g, new THREE.CircleGeometry(0.023, 16), lens, s * 0.042, y, z - 0.001, false);
    if (style !== 'monocle'){ const t = box(g, 0.004, 0.004, 0.19, fm, s * 0.097, y, z - 0.095); }
  });
  if (style !== 'monocle') box(g, 0.02, 0.004, 0.005, fm, 0, y + 0.006, z);
  else tube(g, [[0.066, y - 0.01, z], [0.08, y - 0.07, z - 0.01], [0.1, y - 0.14, 0.0]], 0.0016, _mat(0xc8a850, 0.25, { metalness: 0.9 }), 10, 4);
}
function _buildShoe(g, style, M, side, skin){
  const sole = _mat(0x120c08, 0.8);
  if (style === 'oxford'){
    box(g, 0.1, 0.05, 0.22, M, 0, -0.035, 0.05); _ell(g, 0.05, 0.03, 0.045, M, 0, -0.035, 0.155, 12);
    box(g, 0.1, 0.012, 0.26, sole, 0, -0.06, 0.06); box(g, 0.075, 0.02, 0.05, sole, 0, -0.056, -0.05);
  } else if (style === 'sneakers'){
    _ell(g, 0.055, 0.04, 0.12, M, 0, -0.03, 0.055, 12); box(g, 0.108, 0.02, 0.27, _mat(0xf0f0f0, 0.7), 0, -0.055, 0.06);
    box(g, 0.05, 0.004, 0.1, _mat(0xf0f0f0, 0.7), 0, -0.012, 0.09);
  } else if (style === 'boots'){
    _tcyl(g, 0.06, 0.065, 0.17, M, 0, 0.0, 0, 12); box(g, 0.1, 0.05, 0.2, M, 0, -0.035, 0.055); _ell(g, 0.05, 0.03, 0.04, M, 0, -0.035, 0.15, 10);
    box(g, 0.1, 0.014, 0.25, sole, 0, -0.06, 0.06);
  } else if (style === 'heels'){
    _ell(g, 0.04, 0.025, 0.1, M, 0, -0.028, 0.06, 10); const hl = _tcyl(g, 0.012, 0.007, 0.06, M, 0, -0.03, -0.035, 6);
    box(g, 0.05, 0.01, 0.16, M, 0, -0.01, 0.03).rotation.x = -0.35;
  } else { // flats
    _ell(g, 0.048, 0.02, 0.11, M, 0, -0.045, 0.06, 10);
  }
}

/* ---------- JUGADOR REMOTO / MODELO DE PERSONAJE ---------- */
function buildCharacterModel(charDef){
  const g = buildHumanoid(normalizeLook(charDef));
  return g;
}

/* ---------- SOSPECHOSO (sentado en la mesa) ---------- */
function guessGender(name, icon){
  const femIcons = ['👩‍💻','👩','🧹','👩‍🍳','👩‍💼','💍','🌹','🎤','🎶','💔','🌷','💕','🎭','🎨','💎','🤸','🔮','👸','🧕'];
  if (femIcons.includes(icon)) return 'female';
  const first = String(name || '').replace(/^(sr\.?|sra\.?|srta\.?|dr\.?|dra\.?|lord|lady|don|doña|dona|madame|mme\.?)\s+/i, '').trim().split(/\s+/)[0] || '';
  const maleA = ['luca','nikita','garcía','costa','borja','josua','elías'];
  if (/^(lady|doña|dona|sra|srta|dra|madame|mme)/i.test(String(name || ''))) return 'female';
  if (/[aá]$/i.test(first) && !maleA.includes(first.toLowerCase())) return 'female';
  return 'male';
}
function suspectLook(suspect){
  if (!suspect) return normalizeLook(null);
  if (suspect.look) return normalizeLook(suspect.look);
  const gender = suspect.gender || guessGender(suspect.name, suspect.icon);
  const old = /(anciano|viej|veter|abuel|lord|lady|don |jubilad)/i.test((suspect.role || '') + ' ' + (suspect.name || ''));
  return lookFromSeed((suspect.id || '') + '|' + (suspect.name || ''), gender, { age: old ? 'old' : 'adult' });
}
function buildSuspectModel(suspect){
  const g = buildHumanoid(suspectLook(suspect));
  const rig = g.userData.rig;
  poseSeated(rig, { onTable: true });
  g.position.y = 0;
  World.suspectRig = rig;
  return g;
}
/* Sentado en una silla (suelo = y 0, asiento a 0.46) */
function poseSeated(rig, o){
  o = o || {};
  rig.mode = 'seated';
  const sc = rig.heightScale;
  rig.root.position.y = (0.5 - 0.93 * sc) + 0.0;
  rig.hipL.rotation.x = rig.hipR.rotation.x = -1.5; rig.hipL.rotation.z = 0.06; rig.hipR.rotation.z = -0.06;
  rig.knL.rotation.x = rig.knR.rotation.x = 1.55;
  rig.spine.rotation.x = o.onTable ? 0.12 : 0.0;
  rig.head.rotation.x = 0.04;
  if (o.onTable){
    rig.shL.rotation.set(-1.0, 0, 0.12); rig.shR.rotation.set(-1.0, 0, -0.12);
    rig.elL.rotation.x = -0.75; rig.elR.rotation.x = -0.75;
  } else {
    rig.shL.rotation.set(-0.3, 0, 0.1); rig.shR.rotation.set(-0.3, 0, -0.1);
    rig.elL.rotation.x = -0.9; rig.elR.rotation.x = -0.9;
  }
}

/* ====================================================================
   CADÁVERES — poses articuladas, causa de muerte, props y marcadores
   ==================================================================== */
const CORPSE_POSES = {
  supine:   { kind:'lie-up',   w:1.3, d:1.95, ox:0, oz:0,    label:'boca arriba',
    spec:{ head:[-0.12,0.4,0.1], shL:[0.05,0,0.3], elL:-0.05, shR:[-0.5,0,-1.1], elR:-0.7, hipL:[0,0.15,0.12], hipR:[0.1,-0.2,-0.22], knL:0.05, knR:0.35 } },
  supine2:  { kind:'lie-up',   w:1.5, d:1.95, ox:0, oz:0,    label:'brazos en cruz',
    spec:{ head:[-0.2,-0.3,-0.15], shL:[0,0,1.4], elL:-0.15, shR:[-0.2,0,-1.5], elR:-0.1, hipL:[0,0,0.3], hipR:[0,0,-0.35], knL:0.1, knR:0.05 } },
  prone:    { kind:'lie-down', w:1.4, d:1.95, ox:0, oz:0,    label:'boca abajo',
    spec:{ head:[0,0.9,0], shL:[-2.9,0,0.3], elL:-0.25, shR:[-2.4,0,-0.4], elR:-0.9, hipL:[0.1,0,0.1], hipR:[-0.5,0,-0.2], knL:0.1, knR:0.9 } },
  crawl:    { kind:'lie-down', w:1.2, d:2.05, ox:0, oz:0,    label:'arrastrándose',
    spec:{ head:[-0.7,0.3,0], spine:[-0.25,0,0], shL:[-2.9,0,0.15], elL:-0.1, shR:[-2.1,0,-0.25], elR:-1.1, hipL:[0.2,0,0.1], hipR:[-0.9,0,-0.2], knL:0.1, knR:1.25 } },
  side:     { kind:'lie-side', w:1.0, d:1.9,  ox:0, oz:0,    label:'de costado',
    spec:{ head:[0.2,0,0], spine:[0.15,0,0], shL:[-0.8,0,0.2], elL:-1.1, shR:[-1.2,0,-0.1], elR:-1.6, hipL:[-0.6,0,0.05], knL:0.9, hipR:[-0.2,0,0], knR:0.5 } },
  curled:   { kind:'lie-side', w:0.95, d:1.3, ox:0, oz:0.1,  label:'encogido',
    spec:{ spine:[0.6,0,0], head:[0.5,0,0], shL:[-1.1,0,0.1], elL:-2.1, shR:[-1.3,0,-0.1], elR:-2.2, hipL:[-1.9,0,0.1], knL:2.2, hipR:[-1.8,0,-0.1], knR:2.1 } },
  seated:   { kind:'floor',    w:0.9, d:1.3, ox:0, oz:0.45,  label:'sentado en el suelo',
    spec:{ spine:[0.35,0,0.25], head:[0.6,0,0.35], shL:[0.15,0,0.3], elL:-0.3, shR:[0.3,0,-0.35], elR:-0.2, hipL:[-1.45,0,0.15], hipR:[-1.45,0,-0.15], knL:0.15, knR:0.2 } },
  slumped:  { kind:'chair',    w:0.75, d:0.95, ox:0, oz:0.05, label:'desplomado en la silla',
    spec:{ spine:[0.55,0,0.1], head:[0.5,0,0.2], shL:[0.2,0,0.15], elL:-0.1, shR:[0.1,0,-0.2], elR:-0.15, hipL:[-1.5,0,0.08], hipR:[-1.5,0,-0.08], knL:1.5, knR:1.5 } },
  lolled:   { kind:'chair',    w:0.75, d:0.95, ox:0, oz:0.05, label:'caído hacia atrás',
    spec:{ spine:[-0.15,0,0.12], head:[-0.65,0,0.3], shL:[0.3,0,0.4], elL:-0.1, shR:[0.35,0,-0.45], elR:-0.2, hipL:[-1.4,0,0.2], hipR:[-1.5,0,-0.12], knL:1.3, knR:1.6 } },
  deskslump:{ kind:'chair',    w:0.75, d:0.95, ox:0, oz:0.05, label:'sobre la mesa',
    spec:{ spine:[1.05,0,0], head:[0.55,0.9,0], shL:[-1.45,0,0.2], elL:-0.3, shR:[-1.4,0,-0.2], elR:-0.45, hipL:[-1.5,0,0.08], hipR:[-1.5,0,-0.08], knL:1.5, knR:1.5 } },
  kneel:    { kind:'kneel',    w:0.8, d:1.25, ox:0, oz:-0.2, label:'de rodillas',
    spec:{ spine:[0.95,0,0.1], head:[0.7,0,0.15], shL:[-0.6,0,0.2], elL:-0.7, shR:[-0.2,0,-0.2], elR:-0.4, hipL:[-0.25,0,0.1], hipR:[-0.25,0,-0.1], knL:1.75, knR:1.75 } }
};
function _applySpec(rig, spec, m){
  const J = { head:rig.head, spine:rig.spine, neck:rig.neck, pelvis:rig.pelvis };
  const swap = k => k.endsWith('L') ? k.slice(0, -1) + 'R' : (k.endsWith('R') ? k.slice(0, -1) + 'L' : k);
  for (const k in spec){
    const v = spec[k], key = m < 0 ? swap(k) : k;
    if (typeof v === 'number'){ const j = rig[key]; if (j) j.rotation.x = v; continue; }
    const j = J[key] || rig[key];
    if (j) j.rotation.set(v[0], (v[1] || 0) * (m < 0 ? -1 : 1), (v[2] || 0) * (m < 0 ? -1 : 1));
  }
}
function _bloodShape(r, rnd){
  const s = new THREE.Shape(), n = 28;
  const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
  for (let i = 0; i <= n; i++){
    const a = i / n * Math.PI * 2;
    const k = 1 + 0.22 * Math.sin(a * 3 + ph[0]) + 0.14 * Math.sin(a * 5 + ph[1]) + 0.08 * Math.sin(a * 9 + ph[2]);
    const x = Math.cos(a) * r * k, y = Math.sin(a) * r * k;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  return new THREE.ShapeGeometry(s, 3);
}
function _floorStain(g, r, mat, x, z, rnd, sx, sz){
  const m = new THREE.Mesh(_bloodShape(r, rnd), mat);
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.007 + rnd() * 0.002, z); m.scale.set(sx || 1, sz || 1, 1);
  m.receiveShadow = true; g.add(m); return m;
}
function _evidenceTent(n){
  const g = new THREE.Group();
  const cv = mkCanvas(64), x = cv.getContext('2d');
  x.fillStyle = '#e8b020'; x.fillRect(0, 0, 64, 64); x.fillStyle = '#111'; x.font = 'bold 44px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(n), 32, 36);
  const face = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), roughness: 0.6, side: THREE.DoubleSide });
  const yel = new THREE.MeshStandardMaterial({ color: 0xe8b020, roughness: 0.6, side: THREE.DoubleSide });
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.17), s > 0 ? face : yel); p.position.set(0, 0.085, s * 0.04); p.rotation.x = s * -0.35; p.castShadow = true; g.add(p); });
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.CircleGeometry(0.05, 3), yel); e.position.set(s * 0.05, 0.06, 0); e.rotation.y = Math.PI / 2; g.add(e); });
  return g;
}

/* Construye el cadáver. opts: {look, cause, seed, register, slots, mirror, chairMat} */
function buildCorpse(scene, poseKey, x, z, ry, opts){
  opts = opts || {};
  const pk = CORPSE_POSES[poseKey] ? poseKey : 'supine';
  const P = CORPSE_POSES[pk];
  const rnd = _rng((opts.seed || 'x') + '|' + pk);
  const m = opts.mirror != null ? opts.mirror : (rnd() < 0.5 ? 1 : -1);
  const cause = String(opts.cause || '').toLowerCase();
  const poison = /veneno|envenen|cian|arsén|arsen|planta|cicuta|tóxic/.test(cause);
  const choke = /asfixi|estrang|ahog|sofoc/.test(cause);
  const blunt = /golpe|apale|nuca|contus|cráneo/.test(cause);
  const fall = /caída|caida|precipit/.test(cause);
  const stab = /puñal|cuchill|apuñal|herida|bala|disparo/.test(cause);
  const bloodLevel = blunt ? 2 : (fall ? 3 : (stab ? 3 : (poison || choke ? 0 : 1)));

  let look = Object.assign({}, normalizeLook(opts.look || lookFromSeed('victim|' + (opts.seed || 'x'), 'male', { age:'old' })));
  const droppedHat = look.hat !== 'none' ? look.hat : null;
  const hatCol = look.hatColor, hatAcc = look.topColor2;
  if (droppedHat) look.hat = 'none';
  const body = buildHumanoid(look, { dead: true });
  const rig = body.userData.rig;
  rig.mode = 'dead';
  _applySpec(rig, P.spec, m);
  if (choke){ rig.head.rotation.x = Math.min(rig.head.rotation.x, -0.3); }

  const g = new THREE.Group();
  const lay = new THREE.Group();
  const sc = rig.heightScale;
  let pelvisWorldY = 0;
  switch (P.kind){
    case 'lie-up':   lay.rotation.x = -Math.PI / 2; lay.position.set(0, 0.105 * sc + 0.012, 0.88 * sc); break;
    case 'lie-down': lay.rotation.x = Math.PI / 2;  lay.position.set(0, 0.105 * sc + 0.012, -0.88 * sc); break;
    case 'lie-side': lay.rotation.x = -Math.PI / 2; body.rotation.y = m * Math.PI / 2; lay.position.set(0, 0.19 * sc + 0.01, 0.8 * sc); break;
    case 'floor':    body.position.y = 0.105 - 0.93 * sc; break;
    case 'chair':    body.position.y = 0.55 - 0.93 * sc; break;
    case 'kneel':    body.position.y = 0.5 - 0.93 * sc; break;
  }
  if (P.kind === 'floor' || P.kind === 'chair' || P.kind === 'kneel'){ g.add(body); } else { lay.add(body); g.add(lay); }

  // silla bajo el cuerpo
  if (P.kind === 'chair' && opts.chair !== false && typeof makeChair === 'function'){
    const ch = makeChair(); ch.group.position.set(0, 0, -0.03); ch.group.rotation.y = (rnd() - 0.5) * 0.25; g.add(ch.group);
  }

  /* --- sangre y fluidos --- */
  const bloodM = new THREE.MeshStandardMaterial({ color: 0x4a0707, roughness: 0.28, transparent: true, opacity: 0.93, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  if (typeof ENV !== 'undefined') ENV.reg(bloodM, 0.7);
  const dryM = new THREE.MeshStandardMaterial({ color: 0x2c0404, roughness: 0.6, transparent: true, opacity: 0.88, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const headLocal = (P.kind.indexOf('lie') === 0)
    ? { x: 0, z: (P.kind === 'lie-down' ? 1 : -1) * (0.88 * sc + (P.kind === 'lie-down' ? -0.0 : 0)) * 1.0 + (P.kind === 'lie-down' ? -0.0 : 0) }
    : { x: 0, z: 0.1 };
  // la cabeza queda a ~1.7*sc del origen de los pies; el centro del grupo está a 0.88*sc de los pies
  const headZ = (P.kind === 'lie-up' || P.kind === 'lie-side') ? -0.82 * sc : (P.kind === 'lie-down' ? 0.82 * sc : 0.2);
  const torsoZ = (P.kind === 'lie-up' || P.kind === 'lie-side') ? -0.3 * sc : (P.kind === 'lie-down' ? 0.3 * sc : 0.1);
  if (bloodLevel > 0){
    const R = [0, 0.32, 0.5, 0.72][bloodLevel] * (0.9 + rnd() * 0.3);
    const at = (blunt || fall) ? headZ : torsoZ;
    _floorStain(g, R, bloodM, (rnd() - 0.5) * 0.14, at, rnd, 1, 1.15);
    for (let i = 0; i < 4 + bloodLevel * 3; i++){
      const a = rnd() * 6.28, d = R * (1.1 + rnd() * 1.4);
      _floorStain(g, 0.012 + rnd() * 0.05, dryM, Math.cos(a) * d, at + Math.sin(a) * d, rnd);
    }
    if (pk === 'crawl' || pk === 'prone'){      // rastro de arrastre
      for (let i = 1; i < 9; i++) _floorStain(g, 0.09 - i * 0.004, dryM, (rnd() - 0.5) * 0.12 + Math.sin(i) * 0.05, -0.9 * sc - i * 0.34, rnd, 1, 1.9);
    }
  }
  if (poison){      // vómito / espuma junto a la boca + taza volcada
    const vm = new THREE.MeshStandardMaterial({ color: 0xcfc9a0, roughness: 0.4, transparent: true, opacity: 0.85, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    _floorStain(g, 0.1, vm, 0.14, headZ + (P.kind === 'lie-down' ? 0.1 : -0.12), rnd, 1, 0.8);
    if (P.kind !== 'chair'){
      const cup = new THREE.Group();
      const cm = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.3 });
      lathe(cup, [[0.001, 0], [0.035, 0], [0.045, 0.01], [0.055, 0.07], [0.052, 0.075], [0.04, 0.02]], cm, 0, 0, 0, 18);
      cup.position.set(0.6 * m, 0.055, headZ * 0.5 + 0.1); cup.rotation.z = Math.PI / 2 * 0.95; cup.rotation.y = rnd() * 6; g.add(cup);
      const liq = new THREE.MeshStandardMaterial({ color: 0x5a3a18, roughness: 0.15, transparent: true, opacity: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      _floorStain(g, 0.13, liq, 0.6 * m - 0.12, headZ * 0.5 + 0.1, rnd, 1.3, 0.8);
    }
  }
  if (choke){        // marcas en el cuello: aro amoratado
    const nk = _m(rig.neck, new THREE.TorusGeometry(0.057, 0.008, 6, 18), new THREE.MeshStandardMaterial({ color: 0x7a2a3a, roughness: 0.7 }), 0, 0.02, 0, false); nk.rotation.x = Math.PI / 2;
  }
  // sombrero caído
  if (droppedHat){
    const hg = new THREE.Group(); _buildHat(hg, droppedHat, _mat(hatCol, 0.8), _mat(hatAcc, 0.8));
    hg.position.set(-0.55 * m, 0.0, headZ + 0.15); hg.rotation.set(Math.PI / 2 * 0.95 + (rnd() - 0.5) * 0.4, rnd() * 6, 0); hg.position.y = 0.1; hg.scale.setScalar(1.0); g.add(hg);
  }
  // marcadores de evidencia
  if (opts.markers !== false){
    const slots = opts.slots || [];
    let placed = 0, tries = 0;
    while (placed < 3 && tries++ < 40){
      const a = rnd() * 6.28, d = 0.95 + rnd() * 0.45;
      const lx = Math.cos(a) * d + P.ox, lz = Math.sin(a) * d + P.oz;
      const wx = x + lx * Math.cos(ry) + lz * Math.sin(ry), wz = z - lx * Math.sin(ry) + lz * Math.cos(ry);
      if (slots.some(s => Math.hypot(s.x - wx, s.z - wz) < 0.7)) continue;
      if (typeof Room !== 'undefined' && !Room.fits(wx, wz, 0.12, 0.12, 0, 0.02)) continue;
      const t = _evidenceTent(placed + 1); t.position.set(lx, 0, lz); t.rotation.y = rnd() * 6; g.add(t); placed++;
    }
  }
  g.position.set(x, opts.y || 0, z);
  g.rotation.y = ry;
  scene.add(g);
  const cxw = x + P.ox * Math.cos(ry) + P.oz * Math.sin(ry), czw = z - P.ox * Math.sin(ry) + P.oz * Math.cos(ry);
  if (opts.register !== false && typeof Room !== 'undefined') Room.register(cxw, czw, P.w, P.d, ry);
  g.userData.corpse = { pose: pk, kind: P.kind, footprint: { x: cxw, z: czw, w: P.w, d: P.d, rot: ry } };
  return g;
}
/* Huella (para reservar el sitio antes de colocar muebles) */
function corpseFootprint(poseKey, x, z, ry){
  const P = CORPSE_POSES[poseKey] || CORPSE_POSES.supine;
  return { x: x + P.ox * Math.cos(ry) + P.oz * Math.sin(ry), z: z - P.ox * Math.sin(ry) + P.oz * Math.cos(ry), w: P.w, d: P.d, rot: ry };
}

/* ====================================================================
   JUGADORES REMOTOS — con modelo articulado, caminar y etiqueta
   ==================================================================== */
function _nameTag(name){
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 48;
  const x = cv.getContext('2d');
  x.fillStyle = 'rgba(0,0,0,0.6)'; x.fillRect(0, 0, 256, 48);
  x.strokeStyle = '#d4a017'; x.lineWidth = 2; x.strokeRect(1, 1, 254, 46);
  x.fillStyle = '#f0d890'; x.font = 'bold 24px "Special Elite", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(String(name).slice(0, 16), 128, 25);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false }));
  s.scale.set(0.8, 0.15, 1); s.renderOrder = 10; return s;
}
const RemotePlayers = {
  players: {},
  add(peerId, charDef, name){
    if (this.players[peerId]) this.remove(peerId);
    const group = buildCharacterModel(charDef);
    group.position.set(0, -10, 0);
    group.visible = false;
    if (name){ const tag = _nameTag(name); tag.position.set(0, 2.0, 0); group.add(tag); }
    this.players[peerId] = {
      group, charDef, rig: group.userData.rig,
      pos: new THREE.Vector3(0,0,0), targetPos: new THREE.Vector3(0,0,0),
      yaw: 0, targetYaw: 0, moving: false, hasPos: false, speed: 0, last: null
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
      p.group.rotation.y = yaw + Math.PI;
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
      const ox = p.pos.x, oz = p.pos.z;
      p.pos.x += (p.targetPos.x - p.pos.x) * Math.min(1, dt * 12);
      p.pos.z += (p.targetPos.z - p.pos.z) * Math.min(1, dt * 12);
      const sp = Math.hypot(p.pos.x - ox, p.pos.z - oz) / Math.max(dt, 1e-3);
      p.speed += (sp - p.speed) * Math.min(1, dt * 8);
      let dyaw = p.targetYaw - p.yaw;
      while (dyaw > Math.PI) dyaw -= Math.PI * 2;
      while (dyaw < -Math.PI) dyaw += Math.PI * 2;
      p.yaw += dyaw * Math.min(1, dt * 12);
      p.gy = (p.gy || 0) + ((World.groundAt ? World.groundAt(p.pos.x, p.pos.z) : 0) - (p.gy || 0)) * Math.min(1, dt * 10);
      p.group.position.set(p.pos.x, p.gy, p.pos.z);
      p.group.rotation.y = p.yaw + Math.PI;       // el modelo mira a +Z, la cámara a -Z
      if (p.rig) p.rig.update(dt, p.moving || p.speed > 0.4, p.speed > 3.6);
    }
  },
  clear(){
    for (const id in this.players) this.remove(id);
    this.players = {};
  }
};
