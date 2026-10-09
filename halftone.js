(() => {
  const CONFIG = {
    seed: 7165423,
    cell: 4.5, // halftone screen spacing in CSS px
    angle: Math.PI / 4,
    baseTone: 0.04, // minimum ink so the dot screen reads across the whole page
    ink: "#9a968f",
    paper: "#fbfbf9",
  };

  const canvas = document.getElementById("halftone");
  const ctx = canvas.getContext("2d");

  function mulberry32(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Grayscale "handmade paper" source: mottled clouds, fibres and specks.
  function paintSource(w, h, rand) {
    const src = document.createElement("canvas");
    src.width = w;
    src.height = h;
    const s = src.getContext("2d");
    s.fillStyle = "#fff";
    s.fillRect(0, 0, w, h);

    for (const [scale, strength] of [[140, 0.1], [40, 0.07], [12, 0.05]]) {
      const nw = Math.ceil(w / scale) + 2;
      const nh = Math.ceil(h / scale) + 2;
      const noise = document.createElement("canvas");
      noise.width = nw;
      noise.height = nh;
      const n = noise.getContext("2d");
      const img = n.createImageData(nw, nh);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
        img.data[i + 3] = rand() * 255 * strength;
      }
      n.putImageData(img, 0, 0);
      s.imageSmoothingEnabled = true;
      s.imageSmoothingQuality = "high";
      s.drawImage(noise, -scale, -scale, nw * scale, nh * scale);
    }

    const area = w * h;
    s.lineCap = "round";

    // const fibres = Math.round(area / 3200);
    // for (let i = 0; i < fibres; i++) {
    //   const x = rand() * w;
    //   const y = rand() * h;
    //   const len = 15 + rand() ** 2 * 110;
    //   const a = rand() * Math.PI * 2;
    //   const bend = (rand() - 0.5) * len * 0.8;
    //   const ex = x + Math.cos(a) * len;
    //   const ey = y + Math.sin(a) * len;
    //   const cx = (x + ex) / 2 + Math.cos(a + Math.PI / 2) * bend;
    //   const cy = (y + ey) / 2 + Math.sin(a + Math.PI / 2) * bend;
    //   s.strokeStyle = `rgba(0,0,0,${0.08 + rand() * 0.22})`;
    //   s.lineWidth = 1 + rand() * 1.8;
    //   s.beginPath();
    //   s.moveTo(x, y);
    //   s.quadraticCurveTo(cx, cy, ex, ey);
    //   s.stroke();
    // }

    // const chips = Math.round(area / 22000);
    // for (let i = 0; i < chips; i++) {
    //   const x = rand() * w;
    //   const y = rand() * h;
    //   const len = 6 + rand() * 22;
    //   const a = rand() * Math.PI * 2;
    //   s.strokeStyle = `rgba(0,0,0,${0.45 + rand() * 0.35})`;
    //   s.lineWidth = 2.5 + rand() * 3;
    //   s.beginPath();
    //   s.moveTo(x, y);
    //   s.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    //   s.stroke();
    // }

    // const specks = Math.round(area / 8000);
    // for (let i = 0; i < specks; i++) {
    //   s.fillStyle = `rgba(0,0,0,${0.3 + rand() * 0.5})`;
    //   s.beginPath();
    //   s.ellipse(
    //     rand() * w,
    //     rand() * h,
    //     1 + rand() * 3,
    //     1 + rand() * 2,
    //     rand() * Math.PI,
    //     0,
    //     Math.PI * 4
    //   );
    //   s.fill();
    // }

    return s.getImageData(0, 0, w, h).data;
  }

  function render() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const rand = mulberry32(CONFIG.seed);
    const data = paintSource(w, h, rand);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = CONFIG.paper;
    ctx.fillRect(0, 0, w, h);

    const { cell, angle, baseTone } = CONFIG;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const reach = Math.ceil(Math.hypot(w, h) / cell);
    const ox = w / 2;
    const oy = h / 2;
    const maxR = cell * 0.62;

    ctx.fillStyle = CONFIG.ink;
    ctx.beginPath();
    for (let j = -reach; j <= reach; j++) {
      for (let i = -reach; i <= reach; i++) {
        const gx = i * cell;
        const gy = j * cell;
        const x = ox + gx * cos - gy * sin;
        const y = oy + gx * sin + gy * cos;
        if (x < -cell || y < -cell || x > w + cell || y > h + cell) continue;

        const px = Math.min(w - 1, Math.max(0, x | 0));
        const py = Math.min(h - 1, Math.max(0, y | 0));
        const lum = data[(py * w + px) * 4] / 255;
        const tone = Math.min(1, baseTone + (1 - lum));
        const r = maxR * Math.sqrt(tone);
        if (r < 0.3) continue;

        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }

  let pending;
  window.addEventListener("resize", () => {
    clearTimeout(pending);
    pending = setTimeout(render, 150);
  });

  render();
})();
