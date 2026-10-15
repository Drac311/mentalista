/* ====================================================================
   02-ASSETS — Texturas, materiales compartidos, helpers de geometría
   ==================================================================== */

function texFromCanvas(c, rx, ry, aniso){
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = aniso || 16;
  if (rx) t.repeat.set(rx, ry || rx);
  if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  return t;
}
function makeBump(canvas, strength){
  strength = strength || 1.5;
  const w = canvas.width, h = canvas.height;
  const src = canvas.getContext('2d').getImageData(0, 0, w, h).data;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const octx = out.getContext('2d');
  const img = octx.createImageData(w, h);
  const g = new Float32Array(w*h);
  for (let i = 0; i < w*h; i++) g[i] = (src[i*4] + src[i*4+1] + src[i*4+2]) / 3;
  for (let y = 0; y < h; y++){
    for (let x = 0; x < w; x++){
      const xm = x === 0 ? w-1 : x-1, xp = x === w-1 ? 0 : x+1;
      const ym = y === 0 ? h-1 : y-1, yp = y === h-1 ? 0 : y+1;
      const dx = (g[y*w+xp] - g[y*w+xm]) * strength * 0.0039;
      const dy = (g[yp*w+x] - g[ym*w+x]) * strength * 0.0039;
      const i = (y*w+x)*4;
      img.data[i]   = Math.max(0, Math.min(255, (dx*0.5 + 0.5) * 255));
      img.data[i+1] = Math.max(0, Math.min(255, (dy*0.5 + 0.5) * 255));
      img.data[i+2] = 255;
      img.data[i+3] = 255;
    }
  }
  octx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(out);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

const TEX = {
  parquet(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    const rows = 16, plankH = c.height/rows;
    const bases = ['#3a2614','#402b16','#472e18','#3d2815','#443018'];
    for (let r = 0; r < rows; r++){
      const y = r * plankH;
      x.fillStyle = bases[r % bases.length];
      x.fillRect(0, y, c.width, plankH);
      for (let i = 0; i < 22; i++){
        const vy = y + 3 + Math.random() * (plankH - 6);
        const g = x.createLinearGradient(0, 0, c.width, 0);
        g.addColorStop(0, 'rgba(20,10,4,0)');
        g.addColorStop(0.5, `rgba(20,10,4,${0.1 + Math.random()*0.2})`);
        g.addColorStop(1, 'rgba(20,10,4,0)');
        x.strokeStyle = g; x.lineWidth = 0.5 + Math.random() * 1.4;
        x.beginPath();
        for (let px = 0; px <= c.width; px += 12){
          const yy = vy + Math.sin(px*0.008 + i*1.7) * 1.3;
          px === 0 ? x.moveTo(px, yy) : x.lineTo(px, yy);
        }
        x.stroke();
      }
      x.strokeStyle = 'rgba(0,0,0,0.85)'; x.lineWidth = 2.5;
      x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y); x.stroke();
      const off = (r * 137) % 256;
      for (let px = -off; px < c.width + 256; px += 256){
        x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(px, y); x.lineTo(px, y + plankH); x.stroke();
      }
    }
    return texFromCanvas(c);
  },
  parquetDark(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#1a0e05'; x.fillRect(0, 0, c.width, c.height);
    const rows = 10, plankH = c.height/rows;
    for (let r = 0; r < rows; r++){
      const y = r * plankH;
      x.fillStyle = r % 2 ? '#2a1810' : '#241408';
      x.fillRect(0, y, c.width, plankH);
      for (let i = 0; i < 30; i++){
        x.strokeStyle = `rgba(0,0,0,${0.2+Math.random()*0.3})`;
        x.lineWidth = 0.5 + Math.random() * 1.2;
        x.beginPath();
        const vy = y + Math.random()*plankH;
        x.moveTo(0, vy);
        for (let px = 0; px <= c.width; px += 16) x.lineTo(px, vy + Math.sin(px*0.01 + i)*1.5);
        x.stroke();
      }
      x.strokeStyle = 'rgba(0,0,0,0.95)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y); x.stroke();
      const off = (r * 89) % 320;
      for (let px = -off; px < c.width + 320; px += 320){
        x.beginPath(); x.moveTo(px, y); x.lineTo(px, y + plankH); x.stroke();
      }
    }
    const sh = x.createLinearGradient(0, 0, 0, c.height);
    sh.addColorStop(0, 'rgba(255,200,120,0.05)');
    sh.addColorStop(1, 'rgba(0,0,0,0.3)');
    x.fillStyle = sh; x.fillRect(0, 0, c.width, c.height);
    return texFromCanvas(c);
  },
  marble(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#d8cfb6'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 30; i++){
      const cx = Math.random()*c.width, cy = Math.random()*c.height, r = 80 + Math.random()*200;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(180,170,150,0.3)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(cx-r, cy-r, r*2, r*2);
    }
    for (let v = 0; v < 25; v++){
      x.strokeStyle = `rgba(${60+Math.random()*40|0},${50+Math.random()*40|0},${30+Math.random()*40|0},${0.15 + Math.random()*0.3})`;
      x.lineWidth = 0.5 + Math.random()*2;
      let px = Math.random()*c.width, py = Math.random()*c.height;
      x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 30; s++){ px += (Math.random()-0.5)*70; py += (Math.random()-0.5)*70; x.lineTo(px, py); }
      x.stroke();
    }
    x.strokeStyle = 'rgba(40,32,20,0.55)'; x.lineWidth = 3;
    for (let px = 0; px <= c.width; px += 256){ x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c.height); x.stroke(); }
    for (let py = 0; py <= c.height; py += 256){ x.beginPath(); x.moveTo(0, py); x.lineTo(c.width, py); x.stroke(); }
    return texFromCanvas(c);
  },
  marbleDark(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#0f1a15'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 40; i++){
      const cx = Math.random()*c.width, cy = Math.random()*c.height, r = 60 + Math.random()*180;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, 'rgba(30,60,45,0.5)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(cx-r, cy-r, r*2, r*2);
    }
    for (let v = 0; v < 20; v++){
      x.strokeStyle = `rgba(${180+Math.random()*50|0},${140+Math.random()*40|0},${60+Math.random()*40|0},${0.15 + Math.random()*0.25})`;
      x.lineWidth = 0.8 + Math.random()*2;
      let px = Math.random()*c.width, py = Math.random()*c.height;
      x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 25; s++){ px += (Math.random()-0.5)*80; py += (Math.random()-0.5)*80; x.lineTo(px, py); }
      x.stroke();
    }
    const tile = 256;
    x.strokeStyle = 'rgba(0,0,0,0.8)'; x.lineWidth = 3;
    for (let px = 0; px <= c.width; px += tile){ x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c.height); x.stroke(); }
    for (let py = 0; py <= c.height; py += tile){ x.beginPath(); x.moveTo(0, py); x.lineTo(c.width, py); x.stroke(); }
    return texFromCanvas(c);
  },
  grass(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#1a3310'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 50; i++){
      const cx = Math.random()*c.width, cy = Math.random()*c.height, r = 40 + Math.random()*140;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `rgba(${40+Math.random()*40|0},${70+Math.random()*50|0},${20+Math.random()*30|0},0.55)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI*2); x.fill();
    }
    for (let i = 0; i < 45000; i++){
      const px = Math.random()*c.width, py = Math.random()*c.height;
      const gr = 60 + Math.random()*100;
      x.strokeStyle = `rgba(${20+Math.random()*30|0},${gr|0},${10+Math.random()*40|0},${0.4+Math.random()*0.4})`;
      x.lineWidth = 0.5 + Math.random()*0.7;
      x.beginPath();
      x.moveTo(px, py); x.lineTo(px + (Math.random()-0.5)*2, py - 1 - Math.random()*2.5);
      x.stroke();
    }
    return texFromCanvas(c);
  },
  stone(){
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = '#222226'; x.fillRect(0, 0, c.width, c.height);
    const s = 128;
    for (let px = 0; px < c.width; px += s){
      for (let py = 0; py < c.height; py += s){
        const sh = 40 + Math.random()*36;
        x.fillStyle = `rgb(${sh|0},${sh|0},${(sh+6)|0})`;
        x.fillRect(px+3, py+3, s-6, s-6);
        for (let i = 0; i < 180; i++){
          x.fillStyle = `rgba(255,255,255,${Math.random()*0.05})`;
          x.fillRect(px + 3 + Math.random()*(s-6), py + 3 + Math.random()*(s-6), 1.5, 1.5);
        }
        for (let i = 0; i < 180; i++){
          x.fillStyle = `rgba(0,0,0,${Math.random()*0.09})`;
          x.fillRect(px + 3 + Math.random()*(s-6), py + 3 + Math.random()*(s-6), 1.5, 1.5);
        }
      }
    }
    x.strokeStyle = 'rgba(0,0,0,0.55)'; x.lineWidth = 3;
    for (let px = 0; px <= c.width; px += s){ x.beginPath(); x.moveTo(px,0); x.lineTo(px,c.height); x.stroke(); }
    for (let py = 0; py <= c.height; py += s){ x.beginPath(); x.moveTo(0,py); x.lineTo(c.width,py); x.stroke(); }
    return texFromCanvas(c);
  },
  carpet(palette){
    palette = palette || ['#5a2818', 'rgba(212,160,23,0.4)'];
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = palette[0]; x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = palette[1]; x.lineWidth = 14;
    x.strokeRect(36, 36, c.width-72, c.height-72);
    x.lineWidth = 6; x.strokeRect(76, 76, c.width-152, c.height-152);
    x.lineWidth = 3;
    for (let i = 0; i < 8; i++){
      const sz = 60 + i*36;
      x.beginPath();
      x.moveTo(c.width/2, c.height/2 - sz);
      x.lineTo(c.width/2 + sz, c.height/2);
      x.lineTo(c.width/2, c.height/2 + sz);
      x.lineTo(c.width/2 - sz, c.height/2);
      x.closePath(); x.stroke();
    }
    x.fillStyle = palette[1];
    for (let px = 120; px < c.width - 80; px += 90)
      for (let py = 120; py < c.height - 80; py += 90){
        x.beginPath(); x.arc(px, py, 4, 0, Math.PI*2); x.fill();
      }
    for (let i = 0; i < 15000; i++){
      x.fillStyle = `rgba(0,0,0,${Math.random()*0.1})`;
      x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
    }
    return texFromCanvas(c);
  },
  wallpaper(base, accent, opts){
    opts = opts || {};
    const c = document.createElement('canvas'); c.width = c.height = 1024;
    const x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, c.width, c.height);
    const g = x.createLinearGradient(0, 0, 0, c.height);
    g.addColorStop(0, 'rgba(255,255,255,0.03)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.08)');
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    if (opts.stripes !== false){
      x.fillStyle = accent || 'rgba(0,0,0,0.1)';
      for (let px = 0; px < c.width; px += 64) x.fillRect(px, 0, 4, c.height);
    }
    if (opts.damask){
      x.globalAlpha = 0.08;
      x.strokeStyle = opts.damaskColor || '#000';
      for (let px = 0; px < c.width; px += 128){
        for (let py = 0; py < c.height; py += 128){
          x.save(); x.translate(px + 64, py + 64); x.lineWidth = 1.5;
          for (let k = 0; k < 6; k++){
            x.beginPath();
            x.ellipse(0, 0, 22 + Math.sin(k)*6, 40 + Math.cos(k)*10, k*Math.PI/6, 0, Math.PI*2);
            x.stroke();
          }
          x.restore();
        }
      }
      x.globalAlpha = 1;
    }
    for (let i = 0; i < 10000; i++){
      x.fillStyle = `rgba(255,255,255,${Math.random()*0.025})`;
      x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
    }
    for (let i = 0; i < 5000; i++){
      x.fillStyle = `rgba(0,0,0,${Math.random()*0.04})`;
      x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
    }
    return texFromCanvas(c);
  },
  ceiling(){
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d');
    x.fillStyle = '#e8e0d0'; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 5000; i++){
      x.fillStyle = `rgba(0,0,0,${Math.random()*0.04})`;
      x.fillRect(Math.random()*c.width, Math.random()*c.height, 2, 2);
    }
    x.strokeStyle = 'rgba(0,0,0,0.14)'; x.lineWidth = 2;
    for (let px = 0; px <= c.width; px += 128){ x.beginPath(); x.moveTo(px,0); x.lineTo(px,c.height); x.stroke(); }
    for (let py = 0; py <= c.height; py += 128){ x.beginPath(); x.moveTo(0,py); x.lineTo(c.width,py); x.stroke(); }
    return texFromCanvas(c);
  },
  painting(seed){
    const c = document.createElement('canvas'); c.width = 512; c.height = 384;
    const x = c.getContext('2d');
    const pals = [
      ['#c9a86a','#7a5c2e','#3a2a14','#e8d5a0'],
      ['#4a5a7a','#2a3a5a','#1a2030','#8090b0'],
      ['#7a3a2a','#3a1a10','#1a0808','#c08060'],
      ['#2a5a3a','#1a3a20','#0a1a10','#60a070'],
      ['#6a3a5a','#3a1a30','#1a0a18','#a070a0']
    ];
    const pal = pals[seed % pals.length];
    const g = x.createRadialGradient(c.width/2, c.height/2, 10, c.width/2, c.height/2, c.width*0.9);
    g.addColorStop(0, pal[3]); g.addColorStop(0.4, pal[0]);
    g.addColorStop(0.8, pal[1]); g.addColorStop(1, pal[2]);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 14; i++){
      x.strokeStyle = `rgba(${Math.random()*80|0},${Math.random()*60|0},${Math.random()*40|0},0.5)`;
      x.lineWidth = 2 + Math.random()*4;
      x.beginPath();
      let px = Math.random()*c.width, py = Math.random()*c.height;
      x.moveTo(px, py);
      for (let j = 0; j < 6; j++){ px += (Math.random()-0.5)*160; py += (Math.random()-0.5)*160; x.lineTo(px, py); }
      x.stroke();
    }
    const v = x.createLinearGradient(0, 0, 0, c.height);
    v.addColorStop(0, 'rgba(255,240,200,0.15)');
    v.addColorStop(0.5, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.25)');
    x.fillStyle = v; x.fillRect(0, 0, c.width, c.height);
    return texFromCanvas(c);
  },
  curtain(){
    const c = document.createElement('canvas'); c.width = 512; c.height = 1024;
    const x = c.getContext('2d');
    for (let px = 0; px < c.width; px += 24){
      const g = x.createLinearGradient(px, 0, px+24, 0);
      g.addColorStop(0, '#1a0202'); g.addColorStop(0.35, '#6a1010');
      g.addColorStop(0.5, '#9a1818'); g.addColorStop(0.65, '#6a1010');
      g.addColorStop(1, '#1a0202');
      x.fillStyle = g; x.fillRect(px, 0, 24, c.height);
    }
    const topG = x.createLinearGradient(0, 0, 0, c.height*0.2);
    topG.addColorStop(0, 'rgba(0,0,0,0.75)'); topG.addColorStop(1, 'transparent');
    x.fillStyle = topG; x.fillRect(0, 0, c.width, c.height*0.2);
    const botG = x.createLinearGradient(0, c.height*0.8, 0, c.height);
    botG.addColorStop(0, 'transparent'); botG.addColorStop(1, 'rgba(0,0,0,0.7)');
    x.fillStyle = botG; x.fillRect(0, c.height*0.8, c.width, c.height*0.2);
    return texFromCanvas(c);
  }
};

/* ---------- MATERIALES COMPARTIDOS ---------- */
const MAT = {
  wood:      new THREE.MeshStandardMaterial({ color:0x5a3a20, roughness:0.8 }),
  woodDark:  new THREE.MeshStandardMaterial({ color:0x2a1810, roughness:0.9 }),
  woodLight: new THREE.MeshStandardMaterial({ color:0x6a4628, roughness:0.7 }),
  mahogany:  new THREE.MeshStandardMaterial({ color:0x3a1208, roughness:0.75 }),
  brass:     new THREE.MeshStandardMaterial({ color:0xc8a860, metalness:0.9, roughness:0.2 }),
  steel:     new THREE.MeshStandardMaterial({ color:0xc0c0c8, metalness:0.9, roughness:0.2 }),
  steelDark: new THREE.MeshStandardMaterial({ color:0x909098, metalness:0.9, roughness:0.3 }),
  black:     new THREE.MeshStandardMaterial({ color:0x0a0a10, roughness:0.8 }),
  glass:     new THREE.MeshStandardMaterial({ color:0xe0e8f0, roughness:0.08, metalness:0.15, transparent:true, opacity:0.72 }),
  paper:     new THREE.MeshStandardMaterial({ color:0xf0e8d0, roughness:0.9, side:THREE.DoubleSide }),
  paperDark: new THREE.MeshStandardMaterial({ color:0xd8d0b0, roughness:0.9, side:THREE.DoubleSide }),
  fabricRed: new THREE.MeshStandardMaterial({ color:0x6a1818, roughness:0.95 }),
  fabricBlue:new THREE.MeshStandardMaterial({ color:0x2a3a5a, roughness:0.95 }),
  fabricGreen:new THREE.MeshStandardMaterial({ color:0x1a3a20, roughness:0.95 }),
  leather:   new THREE.MeshStandardMaterial({ color:0x3a2010, roughness:0.85 }),
  leatherGreen:new THREE.MeshStandardMaterial({ color:0x1a2a1a, roughness:0.85 }),
  ceramic:   new THREE.MeshStandardMaterial({ color:0xf0e8d8, roughness:0.35 }),
  gold:      new THREE.MeshStandardMaterial({ color:0xc8a860, metalness:0.95, roughness:0.15 }),
  silver:    new THREE.MeshStandardMaterial({ color:0xc0c0c8, metalness:0.9, roughness:0.2 }),
  stone:     new THREE.MeshStandardMaterial({ color:0x4a4a52, roughness:0.9 })
};

/* ---------- HELPERS GEOMÉTRICOS ---------- */
function mesh(parent, geo, mat, x, y, z){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = true; m.receiveShadow = true;
  parent.add(m);
  return m;
}
function box(parent, w, h, d, mat, x, y, z){ return mesh(parent, new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
function cyl(parent, rt, rb, h, mat, x, y, z, seg){ return mesh(parent, new THREE.CylinderGeometry(rt, rb, h, seg || 20), mat, x, y, z); }
function sph(parent, r, mat, x, y, z){ return mesh(parent, new THREE.SphereGeometry(r, 20, 14), mat, x, y, z); }