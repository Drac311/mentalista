/* ====================================================================
   02-ASSETS — Texturas procedurales, materiales, mapa de entorno y
   helpers de geometría (cajas redondeadas, cojines, torneados…)
   ==================================================================== */

/* ---------- RUIDO PERIÓDICO (tileable) + COLOR ---------- */
const NZ = (function(){
  function h2(x, y, s){
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  const sm = t => t * t * (3 - 2 * t);
  function vnoise(x, y, px, py, s){
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px;
    const y0 = ((yi % py) + py) % py, y1 = (y0 + 1) % py;
    const a = h2(x0, y0, s), b = h2(x1, y0, s), c = h2(x0, y1, s), d = h2(x1, y1, s);
    const u = sm(xf), v = sm(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, px, py, oct, s){
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++){
      sum += amp * vnoise(x * f, y * f, px * f, py * f, s + i * 17);
      norm += amp; amp *= 0.5; f *= 2;
    }
    return sum / norm;
  }
  return { h2, vnoise, fbm };
})();

function parseCol(str){
  if (Array.isArray(str)) return str;
  if (typeof str === 'number') return [(str >> 16) & 255, (str >> 8) & 255, str & 255, 1];
  str = String(str).trim();
  let m;
  if ((m = /^#([0-9a-f]{6})$/i.exec(str))){
    const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  if ((m = /^#([0-9a-f]{3})$/i.exec(str))){
    const s = m[1]; return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16), 1];
  }
  if ((m = /rgba?\(([^)]+)\)/i.exec(str))){
    const p = m[1].split(',').map(parseFloat);
    return [p[0], p[1], p[2], p[3] == null || isNaN(p[3]) ? 1 : p[3]];
  }
  return [128, 128, 128, 1];
}
const rgbS = (c, f, a) => {
  f = f == null ? 1 : f;
  return `rgba(${Math.max(0, Math.min(255, c[0] * f)) | 0},${Math.max(0, Math.min(255, c[1] * f)) | 0},${Math.max(0, Math.min(255, c[2] * f)) | 0},${a == null ? 1 : a})`;
};
const mixCol = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, 1];
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; };

/* ---------- TEXTURAS BASE ---------- */
function texFromCanvas(c, rx, ry, aniso){
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso || 8;
  if (rx) t.repeat.set(rx, ry || rx);
  if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  return t;
}
/* Mapa de relieve a partir de la luminancia de la textura (altura real) */
function makeBump(canvas, strength){
  strength = strength || 1.5;
  const w = canvas.width, h = canvas.height;
  const src = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  const out = mkCanvas(w, h);
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);
  let mean = 0;
  for (let i = 0; i < w * h; i++) mean += (src[i*4] * 0.3 + src[i*4+1] * 0.59 + src[i*4+2] * 0.11);
  mean /= (w * h);
  for (let i = 0; i < w * h; i++){
    const l = src[i*4] * 0.3 + src[i*4+1] * 0.59 + src[i*4+2] * 0.11;
    const g = Math.max(0, Math.min(255, 128 + (l - mean) * strength * 0.55));
    img.data[i*4] = img.data[i*4+1] = img.data[i*4+2] = g; img.data[i*4+3] = 255;
  }
  octx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(out);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

/* Suelo de tablones con variación de tono por pieza, vetas, biseles y juntas */
function _plankFloor(o){
  const S = 1024, c = mkCanvas(S), x = c.getContext('2d');
  const img = x.createImageData(S, S), d = img.data;
  const rows = o.rows, ph = S / rows, len = o.len;
  const pal = o.palette.map(parseCol);
  const seed = o.seed || 3;
  for (let py = 0; py < S; py++){
    const r = Math.floor(py / ph), ly = py - r * ph;
    const off = (r * o.stagger) % len;
    for (let px = 0; px < S; px++){
      const ax = (px + off) % S;
      const j = Math.floor(((px + off)) / len), lx = ((px + off) % len);
      const id = NZ.h2(r, j, seed);
      const base = pal[(id * pal.length) | 0];
      const tone = 0.8 + NZ.h2(r + 31, j + 7, seed) * 0.38;
      const u = px / S, v = py / S;
      const warp = NZ.fbm(u * 3, v * 3, 3, 3, 2, seed + 1) * 2.4;
      const t = ly / ph * 2.6 + warp + id * 9;
      const ring = 0.5 + 0.5 * Math.sin(t * 6.283);
      const fib = NZ.fbm(u * 8, v * 220, 8, 220, 2, seed + 5);
      let k = tone * (1 - 0.08 * ring + (fib - 0.5) * 0.3);
      k *= 0.94 + 0.12 * (ly / ph);
      if (ly < 1.6 || lx < 1.6) k *= 0.18;
      else if (ly < 3.2 || lx < 3.2) k *= 1.18;
      else if (ly > ph - 2.2) k *= 0.82;
      const i = (py * S + px) * 4;
      d[i] = base[0] * k; d[i+1] = base[1] * k; d[i+2] = base[2] * k; d[i+3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return texFromCanvas(c);
}

/* Mármol con nubes, venas “ridged” y baldosas con junta */
function _marble(o){
  const S = 1024, c = mkCanvas(S), x = c.getContext('2d');
  const img = x.createImageData(S, S), d = img.data;
  const base = parseCol(o.base), cloud = parseCol(o.cloud), vein = parseCol(o.vein);
  const tile = S / o.tiles, seed = o.seed || 5;
  for (let py = 0; py < S; py++){
    for (let px = 0; px < S; px++){
      const u = px / S, v = py / S;
      const tx = Math.floor(px / tile), ty = Math.floor(py / tile);
      const lx = px - tx * tile, ly = py - ty * tile;
      const tt = NZ.h2(tx, ty, seed);
      const wob = NZ.fbm(u * 4, v * 4, 4, 4, 3, seed) ;
      const cl = NZ.fbm(u * 6 + tt, v * 6, 6, 6, 3, seed + 2);
      let col = mixCol(base, cloud, Math.min(1, Math.max(0, (cl - 0.3) * 2.2)));
      const r1 = 1 - Math.abs(NZ.fbm(u * 3 + wob * 0.6, v * 3 + wob * 0.4, 3, 3, 4, seed + 8) * 2 - 1);
      const r2 = 1 - Math.abs(NZ.fbm(u * 7 + wob, v * 7, 7, 7, 3, seed + 11) * 2 - 1);
      const vv = Math.pow(r1, o.sharp || 14) * 0.95 + Math.pow(r2, (o.sharp || 14) + 4) * 0.5;
      col = mixCol(col, vein, Math.min(1, vv * o.veinStr));
      let k = 0.92 + tt * 0.16;
      const e = Math.min(lx, ly, tile - 1 - lx, tile - 1 - ly);
      if (e < 1.8) k *= 0.25; else if (e < 3.6) k *= 1.1;
      const i = (py * S + px) * 4;
      d[i] = col[0] * k; d[i+1] = col[1] * k; d[i+2] = col[2] * k; d[i+3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return texFromCanvas(c);
}

/* Motivo damasco (ogee) con reparto a media altura */
function _damask(x, S, color, alpha, light){
  const cell = 256;
  const half = (g) => {
    g.beginPath();
    g.moveTo(0, -1);
    g.bezierCurveTo(0.42, -0.86, 0.62, -0.5, 0.36, -0.22);
    g.bezierCurveTo(0.2, -0.05, 0.66, 0.04, 0.5, 0.36);
    g.bezierCurveTo(0.38, 0.6, 0.12, 0.62, 0, 1);
    g.closePath();
  };
  const motif = (cx, cy) => {
    for (const oy of [-S, 0, S]){
      x.save(); x.translate(cx, cy + oy); x.scale(cell * 0.38, cell * 0.44);
      for (const sx of [1, -1]){
        x.save(); x.scale(sx, 1);
        x.fillStyle = rgbS(light, 1, 0.3); half(x); x.fill();
        x.lineWidth = 0.022; x.strokeStyle = rgbS(color, 1, alpha); half(x); x.stroke();
        x.beginPath(); x.ellipse(0.2, -0.45, 0.08, 0.16, 0.5, 0, 6.283); x.lineWidth = 0.018; x.stroke();
        x.beginPath(); x.ellipse(0.22, 0.45, 0.07, 0.14, -0.5, 0, 6.283); x.stroke();
        x.restore();
      }
      x.beginPath(); x.arc(0, 0, 0.12, 0, 6.283); x.fillStyle = rgbS(light, 1, 0.4); x.fill();
      x.beginPath(); x.arc(0, -0.72, 0.06, 0, 6.283); x.fill();
      x.beginPath(); x.arc(0, 0.72, 0.06, 0, 6.283); x.fill();
      x.restore();
    }
  };
  for (let i = 0; i < S / cell; i++){
    for (let j = 0; j < S / cell; j++){
      motif(i * cell + cell / 2, j * cell + cell / 2 + (i % 2) * cell / 2);
    }
  }
}

const TEX = {
  parquet(){
    return _plankFloor({ rows: 16, len: 256, stagger: 137, seed: 3,
      palette: ['#8a5a30', '#94622f', '#7e5128', '#a06a38', '#895630'] });
  },
  parquetDark(){
    return _plankFloor({ rows: 10, len: 320, stagger: 89, seed: 8,
      palette: ['#4a2c18', '#3e2412', '#523218', '#46281a'] });
  },
  marble(){
    return _marble({ base: '#e4dcc8', cloud: '#c8bea4', vein: '#6a5c44', veinStr: 0.85, tiles: 4, seed: 5, sharp: 30 });
  },
  marbleDark(){
    return _marble({ base: '#1a2a22', cloud: '#2c4a3a', vein: '#d0b070', veinStr: 0.95, tiles: 4, seed: 9, sharp: 34 });
  },
  grass(){
    const S = 1024, c = mkCanvas(S), x = c.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++){
      const u = px / S, v = py / S;
      const n = NZ.fbm(u * 5, v * 5, 5, 5, 4, 4), m = NZ.fbm(u * 2, v * 2, 2, 2, 2, 9);
      const i = (py * S + px) * 4;
      d[i] = 22 + n * 40 + m * 18; d[i+1] = 52 + n * 70 + m * 20; d[i+2] = 14 + n * 22; d[i+3] = 255;
    }
    x.putImageData(img, 0, 0);
    for (let i = 0; i < 60000; i++){
      const px = Math.random() * S, py = Math.random() * S;
      const gr = 70 + Math.random() * 110;
      x.strokeStyle = `rgba(${20 + Math.random() * 40 | 0},${gr | 0},${10 + Math.random() * 40 | 0},${0.35 + Math.random() * 0.45})`;
      x.lineWidth = 0.6 + Math.random() * 0.8;
      x.beginPath(); x.moveTo(px, py);
      x.lineTo(px + (Math.random() - 0.5) * 3, py - 2 - Math.random() * 4); x.stroke();
    }
    for (let i = 0; i < 160; i++){
      x.fillStyle = `rgba(${150 + Math.random() * 80 | 0},${150 + Math.random() * 60 | 0},${90 + Math.random() * 60 | 0},0.5)`;
      x.beginPath(); x.arc(Math.random() * S, Math.random() * S, 1 + Math.random() * 1.6, 0, 6.283); x.fill();
    }
    return texFromCanvas(c);
  },
  stone(){
    const S = 1024, c = mkCanvas(S), x = c.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    const bs = 128;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++){
      const bx = Math.floor(px / bs), by = Math.floor(py / bs);
      const lx = px - bx * bs, ly = py - by * bs;
      const u = px / S, v = py / S;
      const tone = 0.78 + NZ.h2(bx, by, 6) * 0.4;
      const n = NZ.fbm(u * 16, v * 16, 16, 16, 4, 12);
      const stain = NZ.fbm(u * 3, v * 3, 3, 3, 3, 21);
      let k = tone * (0.75 + n * 0.5) * (1 - Math.max(0, stain - 0.55) * 0.7);
      const e = Math.min(lx, ly, bs - 1 - lx, bs - 1 - ly);
      if (e < 2.6) k *= 0.3; else if (e < 5) k *= 0.85 + (e - 2.6) * 0.06;
      const i = (py * S + px) * 4, g = 58 * k;
      d[i] = g; d[i+1] = g; d[i+2] = g + 5; d[i+3] = 255;
    }
    x.putImageData(img, 0, 0);
    return texFromCanvas(c);
  },
  carpet(palette){
    palette = palette || ['#5a2818', 'rgba(212,160,23,0.4)'];
    const base = parseCol(palette[0]);
    const acc = parseCol(palette[1]); acc[3] = 1;
    const dark = mixCol(base, [0, 0, 0], 0.45), light = mixCol(base, acc, 0.35);
    const S = 1024, c = mkCanvas(S), x = c.getContext('2d');
    x.fillStyle = rgbS(base); x.fillRect(0, 0, S, S);
    const R = (inset, lw, col) => { x.lineWidth = lw; x.strokeStyle = rgbS(col); x.strokeRect(inset, inset, S - inset * 2, S - inset * 2); };
    // Campo: rejilla de rosetas
    x.fillStyle = rgbS(dark, 1, 0.45);
    for (let px = 170; px < S - 120; px += 96) for (let py = 170; py < S - 120; py += 96){
      x.save(); x.translate(px, py); x.rotate(Math.PI / 4); x.fillRect(-9, -9, 18, 18); x.restore();
    }
    x.fillStyle = rgbS(acc, 1, 0.55);
    for (let px = 218; px < S - 150; px += 96) for (let py = 218; py < S - 150; py += 96){
      for (let k = 0; k < 6; k++){
        x.beginPath(); x.ellipse(px + Math.cos(k * 1.047) * 7, py + Math.sin(k * 1.047) * 7, 5, 3, k * 1.047, 0, 6.283); x.fill();
      }
    }
    // Medallón central
    x.save(); x.translate(S / 2, S / 2);
    for (let i = 7; i >= 0; i--){
      const sz = 70 + i * 40;
      x.beginPath(); x.moveTo(0, -sz); x.lineTo(sz, 0); x.lineTo(0, sz); x.lineTo(-sz, 0); x.closePath();
      x.fillStyle = rgbS(i % 2 ? dark : mixCol(base, light, 0.5), 1, 0.9); x.fill();
      x.lineWidth = 4; x.strokeStyle = rgbS(acc, 1, 0.85); x.stroke();
    }
    for (let k = 0; k < 8; k++){
      x.save(); x.rotate(k * Math.PI / 4);
      x.beginPath(); x.ellipse(0, -48, 13, 30, 0, 0, 6.283); x.fillStyle = rgbS(acc, 1, 0.9); x.fill();
      x.beginPath(); x.ellipse(0, -48, 6, 18, 0, 0, 6.283); x.fillStyle = rgbS(dark, 1, 0.9); x.fill();
      x.restore();
    }
    x.beginPath(); x.arc(0, 0, 16, 0, 6.283); x.fillStyle = rgbS(light); x.fill();
    x.restore();
    // Esquineros
    [[0, 0], [S, 0], [0, S], [S, S]].forEach(([cx, cy]) => {
      for (let i = 1; i <= 4; i++){
        x.beginPath(); x.arc(cx, cy, 60 + i * 34, 0, 6.283);
        x.lineWidth = 4; x.strokeStyle = rgbS(acc, 1, 0.55); x.stroke();
      }
    });
    // Orlas
    x.fillStyle = rgbS(dark); x.fillRect(0, 0, S, 30); x.fillRect(0, S - 30, S, 30); x.fillRect(0, 0, 30, S); x.fillRect(S - 30, 0, 30, S);
    R(34, 12, acc); R(54, 4, light); R(122, 4, light); R(138, 10, acc); R(160, 3, light);
    // Greca de la orla
    x.fillStyle = rgbS(acc, 1, 0.75);
    for (let p = 70; p < S - 60; p += 34){
      [[p, 88], [p, S - 88], [88, p], [S - 88, p]].forEach(([px, py]) => {
        x.save(); x.translate(px, py); x.rotate(Math.PI / 4); x.fillRect(-7, -7, 14, 14); x.restore();
      });
    }
    // Lana: ruido por píxel + desgaste
    const img = x.getImageData(0, 0, S, S), d = img.data;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++){
      const i = (py * S + px) * 4;
      const n = 0.88 + NZ.h2(px, py, 77) * 0.2 + (NZ.fbm(px / S * 8, py / S * 8, 8, 8, 3, 5) - 0.5) * 0.3;
      d[i] *= n; d[i+1] *= n; d[i+2] *= n;
    }
    x.putImageData(img, 0, 0);
    return texFromCanvas(c);
  },
  wallpaper(base, accent, opts){
    opts = opts || {};
    const S = 1024, c = mkCanvas(S), x = c.getContext('2d');
    const bc = parseCol(base);
    const img0 = x.createImageData(S, S), d0 = img0.data;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++){
      const n = 0.93 + NZ.fbm(px / S * 24, py / S * 24, 24, 24, 3, 14) * 0.14 + ((px + py) % 2 ? 0.012 : 0);
      const i = (py * S + px) * 4;
      d0[i] = bc[0] * n; d0[i+1] = bc[1] * n; d0[i+2] = bc[2] * n; d0[i+3] = 255;
    }
    x.putImageData(img0, 0, 0);
    if (opts.stripes !== false){
      const ac = parseCol(accent || 'rgba(0,0,0,0.1)');
      for (let px = 0; px < S; px += 64){
        x.fillStyle = rgbS(ac, 1, ac[3]); x.fillRect(px, 0, 4, S);
        x.fillStyle = 'rgba(255,255,255,0.035)'; x.fillRect(px + 4, 0, 2, S);
      }
    }
    if (opts.damask) _damask(x, S, parseCol(opts.damaskColor || '#000'), 0.55, mixCol(bc, [255, 245, 220], 0.28));
    const g = x.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, 'rgba(255,255,255,0.03)'); g.addColorStop(1, 'rgba(0,0,0,0.08)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    return texFromCanvas(c);
  },
  ceiling(){
    const S = 512, c = mkCanvas(S), x = c.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++){
      const n = 0.9 + NZ.fbm(px / S * 14, py / S * 14, 14, 14, 3, 2) * 0.16 + NZ.h2(px, py, 3) * 0.03;
      const i = (py * S + px) * 4;
      d[i] = 232 * n; d[i+1] = 224 * n; d[i+2] = 208 * n; d[i+3] = 255;
    }
    x.putImageData(img, 0, 0);
    x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 2;
    for (let p = 0; p <= S; p += 128){
      x.beginPath(); x.moveTo(p, 0); x.lineTo(p, S); x.stroke();
      x.beginPath(); x.moveTo(0, p); x.lineTo(S, p); x.stroke();
    }
    return texFromCanvas(c);
  },
  curtain(){
    const W = 512, H = 1024, c = mkCanvas(W, H), x = c.getContext('2d');
    const img = x.createImageData(W, H), d = img.data;
    for (let py = 0; py < H; py++){
      const v = py / H;
      const top = Math.min(1, v / 0.18), bot = Math.min(1, (1 - v) / 0.06);
      for (let px = 0; px < W; px++){
        const u = px / W;
        const fold = Math.sin(u * 6.283 * 9 + Math.sin(v * 6.283 * 2) * 0.7 + NZ.vnoise(u * 9, v * 4, 9, 4, 5) * 1.4);
        const f = 0.5 + 0.5 * fold;
        let k = 0.28 + 0.95 * Math.pow(f, 1.6);
        k *= 0.55 + 0.45 * top;
        k *= 0.65 + 0.35 * bot;
        k *= 0.94 + NZ.h2(px, py, 9) * 0.1;
        const i = (py * W + px) * 4;
        d[i] = 132 * k; d[i+1] = 14 * k; d[i+2] = 16 * k; d[i+3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    x.fillStyle = 'rgba(212,170,70,0.85)'; x.fillRect(0, H - 34, W, 5); x.fillRect(0, H - 22, W, 2);
    const t = texFromCanvas(c);
    return t;
  },
  painting(seed){
    seed = seed || 0;
    const W = 640, H = 480, c = mkCanvas(W, H), x = c.getContext('2d');
    const kind = seed % 5;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const ridge = (y0, amp, f, col) => {
      x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
      for (let px = 0; px <= W; px += 4) x.lineTo(px, y0 + (NZ.fbm(px / W * f, seed * 0.37, 6, 1, 4, seed + 3) - 0.5) * amp);
      x.lineTo(W, H); x.closePath(); x.fill();
    };
    if (kind === 0){ // paisaje al atardecer
      const sky = x.createLinearGradient(0, 0, 0, H * 0.65);
      sky.addColorStop(0, '#2a3a6a'); sky.addColorStop(0.55, '#c0705a'); sky.addColorStop(1, '#f0c080');
      x.fillStyle = sky; x.fillRect(0, 0, W, H);
      const sun = x.createRadialGradient(W * 0.68, H * 0.52, 4, W * 0.68, H * 0.52, 170);
      sun.addColorStop(0, 'rgba(255,240,200,1)'); sun.addColorStop(0.2, 'rgba(255,200,120,0.7)'); sun.addColorStop(1, 'rgba(255,160,80,0)');
      x.fillStyle = sun; x.fillRect(0, 0, W, H);
      ridge(H * 0.55, 90, 5, '#5a4a6a'); ridge(H * 0.64, 70, 7, '#3a3050'); ridge(H * 0.76, 50, 9, '#1c2a1a');
      for (let i = 0; i < 9; i++){ const tx = rnd(20, W - 20), ty = rnd(H * 0.7, H * 0.9), s = rnd(24, 54);
        x.fillStyle = '#0e1a0e'; x.beginPath(); x.moveTo(tx, ty - s * 2); x.lineTo(tx + s * 0.5, ty); x.lineTo(tx - s * 0.5, ty); x.fill(); }
    } else if (kind === 1){ // retrato
      const bg = x.createRadialGradient(W / 2, H * 0.4, 20, W / 2, H * 0.5, W * 0.7);
      bg.addColorStop(0, '#5a4a30'); bg.addColorStop(1, '#120c06');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.fillStyle = '#16120e'; x.beginPath(); x.moveTo(W * 0.14, H); x.quadraticCurveTo(W * 0.18, H * 0.64, W * 0.5, H * 0.62);
      x.quadraticCurveTo(W * 0.82, H * 0.64, W * 0.86, H); x.fill();
      x.fillStyle = '#e8dcc0'; x.beginPath(); x.moveTo(W * 0.42, H * 0.64); x.lineTo(W * 0.5, H * 0.8); x.lineTo(W * 0.58, H * 0.64); x.fill();
      x.fillStyle = '#c89c78'; x.beginPath(); x.ellipse(W / 2, H * 0.4, W * 0.115, H * 0.19, 0, 0, 6.283); x.fill();
      x.fillRect(W * 0.46, H * 0.55, W * 0.08, H * 0.1);
      x.fillStyle = '#241608'; x.beginPath(); x.ellipse(W / 2, H * 0.3, W * 0.13, H * 0.13, 0, Math.PI, 6.283); x.fill();
      const sh = x.createLinearGradient(W * 0.38, 0, W * 0.62, 0);
      sh.addColorStop(0, 'rgba(0,0,0,0.0)'); sh.addColorStop(1, 'rgba(0,0,0,0.35)');
      x.fillStyle = sh; x.beginPath(); x.ellipse(W / 2, H * 0.4, W * 0.115, H * 0.19, 0, 0, 6.283); x.fill();
      x.fillStyle = '#2a1a10'; x.fillRect(W * 0.455, H * 0.38, W * 0.03, 4); x.fillRect(W * 0.515, H * 0.38, W * 0.03, 4);
    } else if (kind === 2){ // marina nocturna
      const sky = x.createLinearGradient(0, 0, 0, H * 0.6);
      sky.addColorStop(0, '#080c20'); sky.addColorStop(1, '#2a3a60');
      x.fillStyle = sky; x.fillRect(0, 0, W, H * 0.6);
      const sea = x.createLinearGradient(0, H * 0.6, 0, H);
      sea.addColorStop(0, '#1a2a48'); sea.addColorStop(1, '#04060e');
      x.fillStyle = sea; x.fillRect(0, H * 0.6, W, H * 0.4);
      const mo = x.createRadialGradient(W * 0.3, H * 0.25, 3, W * 0.3, H * 0.25, 120);
      mo.addColorStop(0, 'rgba(255,255,240,1)'); mo.addColorStop(0.18, 'rgba(230,230,210,0.9)'); mo.addColorStop(1, 'rgba(200,210,255,0)');
      x.fillStyle = mo; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++){ x.fillStyle = `rgba(230,235,255,${rnd(0.1, 0.35)})`; x.fillRect(W * 0.3 + rnd(-60, 60), H * 0.62 + i * 7, rnd(20, 90), 2); }
      x.fillStyle = '#05070c'; x.beginPath(); x.moveTo(W * 0.6, H * 0.6); x.lineTo(W * 0.66, H * 0.4); x.lineTo(W * 0.7, H * 0.6);
      x.moveTo(W * 0.56, H * 0.62); x.lineTo(W * 0.78, H * 0.62); x.lineTo(W * 0.74, H * 0.67); x.lineTo(W * 0.6, H * 0.67); x.fill();
    } else if (kind === 3){ // bodegón
      const bg = x.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#3a2a1a'); bg.addColorStop(1, '#0e0804');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.fillStyle = '#5a3a1e'; x.fillRect(0, H * 0.7, W, H * 0.3);
      const light = x.createRadialGradient(W * 0.3, H * 0.2, 10, W * 0.3, H * 0.3, 420);
      light.addColorStop(0, 'rgba(255,220,160,0.55)'); light.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = light; x.fillRect(0, 0, W, H);
      x.fillStyle = '#7a8a9a'; x.beginPath(); x.moveTo(W * 0.55, H * 0.7); x.quadraticCurveTo(W * 0.5, H * 0.5, W * 0.56, H * 0.36);
      x.lineTo(W * 0.6, H * 0.36); x.quadraticCurveTo(W * 0.66, H * 0.5, W * 0.62, H * 0.7); x.fill();
      [['#a8321e', 0.3, 0.66, 36], ['#c8a020', 0.38, 0.68, 30], ['#6a8a2a', 0.22, 0.69, 28], ['#b04020', 0.74, 0.68, 32]].forEach(([col, px, py, r]) => {
        const g = x.createRadialGradient(W * px - r * 0.3, H * py - r * 0.3, 2, W * px, H * py, r);
        g.addColorStop(0, '#fff3'); g.addColorStop(0.25, col); g.addColorStop(1, '#00000088');
        x.fillStyle = g; x.beginPath(); x.arc(W * px, H * py, r, 0, 6.283); x.fill();
      });
    } else { // bosque
      const sky = x.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#506a50'); sky.addColorStop(1, '#101a10');
      x.fillStyle = sky; x.fillRect(0, 0, W, H);
      for (let l = 0; l < 3; l++){
        for (let i = 0; i < 12; i++){
          const tx = rnd(0, W), tw = rnd(10, 24) * (1 + l * 0.6);
          x.fillStyle = `rgba(${14 - l * 3},${24 - l * 4},${12 - l * 2},${0.55 + l * 0.2})`;
          x.fillRect(tx, 0, tw, H);
        }
        const fog = x.createLinearGradient(0, H * 0.4, 0, H);
        fog.addColorStop(0, 'rgba(180,210,180,0)'); fog.addColorStop(1, 'rgba(180,210,180,0.1)');
        x.fillStyle = fog; x.fillRect(0, 0, W, H);
      }
    }
    // pincelada de óleo + lienzo + craquelado + barniz
    for (let i = 0; i < 700; i++){
      x.strokeStyle = `rgba(${Math.random() * 255 | 0},${Math.random() * 200 | 0},${Math.random() * 150 | 0},0.05)`;
      x.lineWidth = rnd(2, 6); x.beginPath(); const sx = rnd(0, W), sy = rnd(0, H);
      x.moveTo(sx, sy); x.lineTo(sx + rnd(-30, 30), sy + rnd(-8, 8)); x.stroke();
    }
    const img = x.getImageData(0, 0, W, H), d = img.data;
    for (let py = 0; py < H; py++) for (let px = 0; px < W; px++){
      const i = (py * W + px) * 4, wv = ((px >> 1) + (py >> 1)) & 1 ? 1.03 : 0.97;
      const n = wv * (0.96 + NZ.h2(px, py, 4) * 0.08);
      d[i] *= n; d[i+1] *= n; d[i+2] *= n;
    }
    x.putImageData(img, 0, 0);
    x.strokeStyle = 'rgba(0,0,0,0.12)'; x.lineWidth = 0.7;
    for (let i = 0; i < 26; i++){
      let px = rnd(0, W), py = rnd(0, H); x.beginPath(); x.moveTo(px, py);
      for (let j = 0; j < 7; j++){ px += rnd(-24, 24); py += rnd(-24, 24); x.lineTo(px, py); } x.stroke();
    }
    const v = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
    x.fillStyle = v; x.fillRect(0, 0, W, H);
    const t = texFromCanvas(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  },
  /* Vista nocturna para ventanas */
  night(aspect){
    aspect = aspect || 1;
    const W = 512, H = Math.max(256, Math.round(512 / aspect)), c = mkCanvas(W, H), x = c.getContext('2d');
    const sky = x.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#04061a'); sky.addColorStop(0.55, '#16204a'); sky.addColorStop(0.85, '#3a3058'); sky.addColorStop(1, '#5a3a48');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 110; i++){
      x.fillStyle = `rgba(255,255,255,${0.25 + Math.random() * 0.7})`;
      const r = Math.random() < 0.1 ? 1.6 : 0.8; x.fillRect(Math.random() * W, Math.random() * H * 0.7, r, r);
    }
    const mo = x.createRadialGradient(W * 0.72, H * 0.24, 2, W * 0.72, H * 0.24, 90);
    mo.addColorStop(0, 'rgba(255,255,245,1)'); mo.addColorStop(0.1, 'rgba(240,238,220,1)'); mo.addColorStop(0.14, 'rgba(210,220,255,0.35)'); mo.addColorStop(1, 'rgba(160,180,255,0)');
    x.fillStyle = mo; x.fillRect(0, 0, W, H);
    x.fillStyle = '#080a14'; x.beginPath(); x.moveTo(0, H);
    for (let px = 0; px <= W; px += 6) x.lineTo(px, H * 0.82 - NZ.fbm(px / W * 6, 0.4, 6, 1, 4, 3) * H * 0.2);
    x.lineTo(W, H); x.fill();
    x.fillStyle = '#05060c';
    for (let i = 0; i < 9; i++){
      const bx = i * 60 + Math.random() * 20, bw = 30 + Math.random() * 30, bh = 30 + Math.random() * 50;
      x.fillRect(bx, H - bh, bw, bh);
      for (let k = 0; k < 6; k++) if (Math.random() < 0.4){ x.fillStyle = 'rgba(255,210,120,0.8)'; x.fillRect(bx + 4 + Math.random() * (bw - 10), H - bh + 6 + Math.random() * (bh - 12), 3, 4); x.fillStyle = '#05060c'; }
    }
    const t = texFromCanvas(c); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  },
  /* Madera con anillos, fibras y poros (tileable) */
  wood(base, o){
    o = o || {};
    const S = o.size || 512, c = mkCanvas(S), x = c.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    const col = parseCol(base), seed = o.seed || 1;
    const rings = o.rings || 6, contrast = o.contrast != null ? o.contrast : 0.4;
    for (let py = 0; py < S; py++){
      const v = py / S;
      for (let px = 0; px < S; px++){
        const u = px / S;
        const warp = NZ.fbm(u * 2, v * 3, 2, 3, 3, seed);
        const t = v * rings + warp * 2.6;
        const ring = 0.5 + 0.5 * Math.sin(t * 6.2832);
        const fib = NZ.fbm(u * 6, v * 150, 6, 150, 2, seed + 9);
        let k = 1 - contrast * 0.45 * Math.pow(ring, 1.4) + (fib - 0.5) * contrast * 0.9;
        if (NZ.h2(px, py, seed) < 0.015) k *= 0.8;
        const i = (py * S + px) * 4;
        d[i] = col[0] * k; d[i+1] = col[1] * k; d[i+2] = col[2] * k; d[i+3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    return texFromCanvas(c);
  },
  /* Tejido / terciopelo (tileable) */
  fabric(base, o){
    o = o || {};
    const S = 256, c = mkCanvas(S), x = c.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    const col = parseCol(base), seed = o.seed || 2;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++){
      const weave = (((px >> 1) + (py >> 1)) & 1) ? 1.05 : 0.93;
      const lump = NZ.fbm(px / S * 10, py / S * 10, 10, 10, 3, seed);
      const k = weave * (0.82 + lump * 0.34) * (0.95 + NZ.h2(px, py, seed) * 0.1);
      const i = (py * S + px) * 4;
      d[i] = col[0] * k; d[i+1] = col[1] * k; d[i+2] = col[2] * k; d[i+3] = 255;
    }
    x.putImageData(img, 0, 0);
    return texFromCanvas(c);
  },
  /* Cuero con grano y arrugas */
  leather(base, o){
    o = o || {};
    const S = 256, c = mkCanvas(S), x = c.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    const col = parseCol(base), seed = o.seed || 4;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++){
      const u = px / S, v = py / S;
      const n = NZ.vnoise(u * 26, v * 26, 26, 26, seed);
      const crease = Math.min(1, Math.abs(n - 0.5) * 5);
      const wear = NZ.fbm(u * 3, v * 3, 3, 3, 3, seed + 6);
      const k = (0.86 + 0.14 * crease) * (0.92 + wear * 0.16);
      const i = (py * S + px) * 4;
      d[i] = col[0] * k; d[i+1] = col[1] * k; d[i+2] = col[2] * k; d[i+3] = 255;
    }
    x.putImageData(img, 0, 0);
    return texFromCanvas(c);
  }
};

/* ---------- MAPA DE ENTORNO (reflejos en latón, cristal, barniz…) ---------- */
const ENV = {
  tex: null, rt: null, list: [], shared: [],
  reg(m, k, shared){
    m.envMapIntensity = k == null ? 1 : k;
    (shared ? this.shared : this.list).push(m);
    if (this.tex) m.envMap = this.tex;
    return m;
  },
  build(){
    this.list = [];
    try {
      if (!World.renderer) return;
      if (this.rt){ try { this.rt.dispose(); } catch(e){} this.rt = null; this.tex = null; }
      const s = new THREE.Scene();
      const room = new THREE.Mesh(new THREE.BoxGeometry(26, 10, 26), new THREE.MeshBasicMaterial({ color: 0x2a1e16, side: THREE.BackSide }));
      room.position.y = 4; s.add(room);
      const panel = (w, h, x, y, z, rx, ry, r, g, b) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b), side: THREE.DoubleSide }));
        m.position.set(x, y, z); m.rotation.set(rx, ry, 0); s.add(m);
      };
      panel(3, 3, 4, 8.9, 3, Math.PI / 2, 0, 5, 3.8, 2.2);
      panel(3, 3, -5, 8.9, -2, Math.PI / 2, 0, 4, 3, 1.8);
      panel(5, 4, -12.8, 4, 0, 0, Math.PI / 2, 0.9, 1.3, 3.2);
      panel(4, 3, 3, 3, 12.8, 0, 0, 1.6, 1.2, 0.8);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.MeshBasicMaterial({ color: 0x3a2a1c }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -0.95; s.add(floor);
      const pm = new THREE.PMREMGenerator(World.renderer);
      this.rt = pm.fromScene(s, 0.035);
      this.tex = this.rt.texture;
      pm.dispose();
      room.geometry.dispose();
    } catch(e){ this.tex = null; }
    this.shared.concat(this.list).forEach(m => { m.envMap = this.tex; m.needsUpdate = true; });
  }
};
function metalMat(color, rough, metal, k){
  return ENV.reg(new THREE.MeshStandardMaterial({ color: color, roughness: rough == null ? 0.3 : rough, metalness: metal == null ? 0.9 : metal }), k == null ? 1 : k);
}

/* ---------- MATERIALES COMPARTIDOS ---------- */
function _woodMat(hex, rough, seed, k, o){
  const t = TEX.wood(hex, Object.assign({ seed: seed }, o || {}));
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: rough, bumpMap: makeBump(t.image, 1.0), bumpScale: 0.1 });
  m.userData.tile = 0.9;
  return ENV.reg(m, k == null ? 0.35 : k, true);
}
function _fabMat(hex, seed, sheenHex){
  const t = TEX.fabric(hex, { seed: seed });
  const m = new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.92, bumpMap: makeBump(t.image, 1.0), bumpScale: 0.12,
    sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(sheenHex || 0x806060) });
  m.userData.tile = 0.3;
  return m;
}
function _leatherMat(hex, seed){
  const t = TEX.leather(hex, { seed: seed });
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 0.52, bumpMap: makeBump(t.image, 1.0), bumpScale: 0.12 });
  m.userData.tile = 0.45;
  return ENV.reg(m, 0.55, true);
}
const MAT = {
  wood:      _woodMat('#8a5a30', 0.62, 1),
  woodDark:  _woodMat('#46281a', 0.7, 2),
  woodLight: _woodMat('#b08050', 0.55, 3),
  mahogany:  _woodMat('#6e2c1a', 0.5, 4, 0.5),
  ebony:     _woodMat('#2a1e18', 0.4, 5, 0.6, { contrast: 0.3 }),
  brass:     ENV.reg(new THREE.MeshStandardMaterial({ color:0xd8b468, metalness:1.0, roughness:0.22 }), 1.0, true),
  steel:     ENV.reg(new THREE.MeshStandardMaterial({ color:0xc8ccd4, metalness:1.0, roughness:0.22 }), 1.0, true),
  steelDark: ENV.reg(new THREE.MeshStandardMaterial({ color:0x8a8e98, metalness:1.0, roughness:0.35 }), 0.9, true),
  black:     new THREE.MeshStandardMaterial({ color:0x0a0a10, roughness:0.8 }),
  glass:     ENV.reg(new THREE.MeshStandardMaterial({ color:0xdde8f0, roughness:0.05, metalness:0.1, transparent:true, opacity:0.55 }), 1.4, true),
  mirror:    ENV.reg(new THREE.MeshStandardMaterial({ color:0xb8c4d0, roughness:0.02, metalness:1.0 }), 1.6, true),
  paper:     new THREE.MeshStandardMaterial({ color:0xf0e8d0, roughness:0.9, side:THREE.DoubleSide }),
  paperDark: new THREE.MeshStandardMaterial({ color:0xd8d0b0, roughness:0.9, side:THREE.DoubleSide }),
  fabricRed: _fabMat('#7a1c1c', 3, 0xc06060),
  fabricBlue:_fabMat('#2e4270', 4, 0x7080b0),
  fabricGreen:_fabMat('#24502c', 5, 0x70a070),
  cream:     _fabMat('#e6dcc4', 6, 0xffffff),
  leather:   _leatherMat('#5a3418', 7),
  leatherGreen:_leatherMat('#24402a', 8),
  ceramic:   ENV.reg(new THREE.MeshStandardMaterial({ color:0xf0e8d8, roughness:0.28 }), 0.6, true),
  gold:      ENV.reg(new THREE.MeshStandardMaterial({ color:0xe0b860, metalness:1.0, roughness:0.18 }), 1.0, true),
  silver:    ENV.reg(new THREE.MeshStandardMaterial({ color:0xd0d4dc, metalness:1.0, roughness:0.18 }), 1.0, true),
  stone:     new THREE.MeshStandardMaterial({ color:0x6a6a72, roughness:0.9 })
};

/* ---------- HELPERS GEOMÉTRICOS ---------- */
/* UV a escala de mundo (la veta corre por la dimensión más larga de cada cara) */
function _worldUV(geo, w, h, d, tile){
  const uv = geo.attributes.uv;
  const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  const ou = Math.random(), ov = Math.random();
  for (let f = 0; f < 6; f++){
    const a = faces[f][0], b = faces[f][1];
    for (let k = 0; k < 4; k++){
      const i = f * 4 + k, u0 = uv.getX(i), v0 = uv.getY(i);
      if (a >= b) uv.setXY(i, u0 * a / tile + ou, v0 * b / tile + ov);
      else uv.setXY(i, v0 * b / tile + ou, u0 * a / tile + ov);
    }
  }
  uv.needsUpdate = true;
}
function _cylUV(geo, seg, h, r, tile){
  const uv = geo.attributes.uv, pos = geo.attributes.position;
  const torso = (seg + 1) * 2;
  const circ = 6.2832 * Math.max(r, 0.01), ou = Math.random();
  for (let i = 0; i < uv.count; i++){
    if (i < torso){
      const u0 = uv.getX(i), v0 = uv.getY(i);
      uv.setXY(i, v0 * h / tile + ou, u0 * circ / tile);
    } else {
      uv.setXY(i, pos.getX(i) / tile + 0.5 + ou, pos.getZ(i) / tile + 0.5);
    }
  }
  uv.needsUpdate = true;
}
function mesh(parent, geo, mat, x, y, z){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(parent, w, h, d, mat, x, y, z){
  const geo = new THREE.BoxGeometry(w, h, d);
  if (mat && mat.map && mat.userData && mat.userData.tile) _worldUV(geo, w, h, d, mat.userData.tile);
  return mesh(parent, geo, mat, x, y, z);
}
function cyl(parent, rt, rb, h, mat, x, y, z, seg){
  seg = seg || 20;
  const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
  if (mat && mat.map && mat.userData && mat.userData.tile) _cylUV(geo, seg, h, Math.max(rt, rb), mat.userData.tile);
  return mesh(parent, geo, mat, x, y, z);
}
function sph(parent, r, mat, x, y, z){ return mesh(parent, new THREE.SphereGeometry(r, 24, 16), mat, x, y, z); }

/* Caja con bordes biselados y normales suaves: atrapa la luz como un mueble real */
function rbox(parent, w, h, d, mat, x, y, z, r){
  r = Math.min(r == null ? 0.014 : r, Math.min(w, h, d) / 2 - 0.0005);
  const geo = new THREE.BoxGeometry(w, h, d, 4, 4, 4);
  if (mat && mat.map && mat.userData && mat.userData.tile) _worldUV(geo, w, h, d, mat.userData.tile);
  const p = geo.attributes.position, n = geo.attributes.normal;
  const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r;
  const rm = (c, half, rr) => { const a = Math.abs(c); if (a > half - 1e-6) return c; if (a < 1e-6) return 0; return Math.sign(c) * (half - rr); };
  const v = new THREE.Vector3(), inner = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let i = 0; i < p.count; i++){
    v.set(rm(p.getX(i), w / 2, r), rm(p.getY(i), h / 2, r), rm(p.getZ(i), d / 2, r));
    inner.set(Math.max(-hw, Math.min(hw, v.x)), Math.max(-hh, Math.min(hh, v.y)), Math.max(-hd, Math.min(hd, v.z)));
    nn.subVectors(v, inner);
    const len = nn.length();
    if (len > 1e-6){
      nn.divideScalar(len); v.copy(inner).addScaledVector(nn, r);
      n.setXYZ(i, nn.x, nn.y, nn.z);
    }
    p.setXYZ(i, v.x, v.y, v.z);
  }
  return mesh(parent, geo, mat, x, y, z);
}
/* Cojín / almohada abombada (superelipsoide con normales analíticas) */
function puffBox(parent, w, h, d, mat, x, y, z, o){
  o = o || {};
  const nExp = o.n || 4, seg = o.seg || 10, bulge = o.bulge != null ? o.bulge : 0.15;
  const geo = new THREE.BoxGeometry(w, h, d, seg, Math.max(3, seg >> 1), seg);
  if (mat && mat.map && mat.userData && mat.userData.tile) _worldUV(geo, w, h, d, mat.userData.tile);
  const p = geo.attributes.position, nrm = geo.attributes.normal;
  for (let i = 0; i < p.count; i++){
    const ux = p.getX(i) / (w / 2), uy = p.getY(i) / (h / 2), uz = p.getZ(i) / (d / 2);
    const ax = Math.abs(ux), ay = Math.abs(uy), az = Math.abs(uz);
    const nr = Math.pow(Math.pow(ax, nExp) + Math.pow(ay, nExp) + Math.pow(az, nExp), 1 / nExp);
    const s = nr > 1e-6 ? Math.max(ax, ay, az) / nr : 1;
    const bl = 1 + bulge * (1 - ux * ux) * (1 - uz * uz) * ay * (o.flatBottom && uy < 0 ? 0 : 1);
    p.setXYZ(i, ux * s * w / 2, uy * s * h / 2 * bl, uz * s * d / 2);
    const gx = Math.sign(ux) * Math.pow(ax * s, nExp - 1) / (w / 2), gy = Math.sign(uy) * Math.pow(ay * s, nExp - 1) / (h / 2), gz = Math.sign(uz) * Math.pow(az * s, nExp - 1) / (d / 2);
    const gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
    nrm.setXYZ(i, gx / gl, gy / gl, gz / gl);
  }
  return mesh(parent, geo, mat, x, y, z);
}
/* Torneado: perfil [[radio, y], …] */
function lathe(parent, pts, mat, x, y, z, seg){
  const geo = new THREE.LatheGeometry(pts.map(q => new THREE.Vector2(q[0], q[1])), seg || 28);
  return mesh(parent, geo, mat, x, y, z);
}
/* Tubo curvo por puntos [[x,y,z], …] */
function tube(parent, pts, radius, mat, seg, rseg){
  const curve = new THREE.CatmullRomCurve3(pts.map(q => new THREE.Vector3(q[0], q[1], q[2])));
  return mesh(parent, new THREE.TubeGeometry(curve, seg || 24, radius, rseg || 8, false), mat, 0, 0, 0);
}
function torus(parent, R, r, mat, x, y, z, rx, ry, rz, arc){
  const m = mesh(parent, new THREE.TorusGeometry(R, r, 10, 36, arc || Math.PI * 2), mat, x, y, z);
  m.rotation.set(rx || 0, ry || 0, rz || 0);
  return m;
}
