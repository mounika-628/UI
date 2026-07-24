/* ===================== HERO: PARTICLE MORPH (Human → Product) ===================== */
// A floating particle cloud that organises itself into a Human Face, then a
// Mobile Interface, then a Dashboard, then scatters back to a cloud — looping.
// It tells the UX story: Human → Research → Product. The face is sampled from
// the illustration; the phone and dashboard are generated as line-art.
(function particleMorph() {
  const wrap = document.querySelector(".hero-art");
  if (!wrap) return;
  const canvas = wrap.querySelector(".virgo-canvas");
  if (!canvas || !window.FACE_SRC || !window.HANDS_SRC) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  const N = 5200;                 // number of particles (high density for detail)
  let W = 0, H = 0, cx = 0, cy = 0, S = 0;
  let particles = [], shapes = {}, ready = false;

  // pause the loop while the hero is scrolled out of view (saves CPU for the lower section)
  let heroVisible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; }, { rootMargin: "120px" }).observe(wrap);

  // ---- colour gradient by x (red left → purple → blue right), cached in a LUT ----
  const mix = (a, b, t) => Math.round(a + (b - a) * t);
  let LUT = [];
  function rawCol(x) {
    let t = Math.max(0, Math.min(1, x / (W || 1)));
    if (t < 0.5) { t *= 2; return `rgb(${mix(241,142,t)},${mix(92,51,t)},${mix(77,224,t)})`; }
    t = (t - 0.5) * 2; return `rgb(${mix(142,75,t)},${mix(51,79,t)},${mix(224,230,t)})`;
  }
  function buildLUT() { LUT = []; for (let i = 0; i < 96; i++) LUT.push(rawCol(i / 95 * W)); }
  function colAt(x) { let i = (x / (W || 1) * 95) | 0; return LUT[i < 0 ? 0 : i > 95 ? 95 : i]; }

  // ---- small drawing helpers (line-art) ----
  const rr = (o, x, y, w, h, r) => { o.beginPath(); o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r); o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath(); o.stroke(); };
  const ln = (o, x1, y1, x2, y2) => { o.beginPath(); o.moveTo(x1, y1); o.lineTo(x2, y2); o.stroke(); };
  const dt = (o, x, y, r) => { o.beginPath(); o.arc(x, y, r, 0, 6.2832); o.fill(); };
  const poly = (o, x0, y0, w, h, arr) => { o.beginPath(); for (let k = 0; k < arr.length; k++) { const X = x0 + w * (k / (arr.length - 1)), Y = y0 + h * arr[k]; k ? o.lineTo(X, Y) : o.moveTo(X, Y); } o.stroke(); };

  function drawMobile(o) {
    o.strokeStyle = "#000"; o.fillStyle = "#000"; o.lineWidth = 2.2; o.lineJoin = "round"; o.lineCap = "round";
    const pw = S * 0.38, ph = S * 0.78, x0 = cx - pw / 2, y0 = cy - ph / 2;
    rr(o, x0, y0, pw, ph, pw * 0.12);                                              // phone body
    rr(o, cx - pw * 0.12, y0 + ph * 0.022, pw * 0.24, ph * 0.02, 5);              // dynamic island
    ln(o, x0 + pw * 0.1, y0 + ph * 0.06, x0 + pw * 0.22, y0 + ph * 0.06);         // time
    dt(o, x0 + pw * 0.76, y0 + ph * 0.06, 1.8); dt(o, x0 + pw * 0.82, y0 + ph * 0.06, 1.8);
    rr(o, x0 + pw * 0.87, y0 + ph * 0.053, pw * 0.06, ph * 0.013, 1);             // battery
    ln(o, x0 + pw * 0.1, y0 + ph * 0.108, x0 + pw * 0.42, y0 + ph * 0.108);       // header title
    ln(o, x0 + pw * 0.1, y0 + ph * 0.132, x0 + pw * 0.3, y0 + ph * 0.132);
    o.beginPath(); o.arc(x0 + pw * 0.85, y0 + ph * 0.118, pw * 0.07, 0, 6.28); o.stroke();   // avatar
    const hx = x0 + pw * 0.08, hy = y0 + ph * 0.17, hw = pw * 0.84, hh = ph * 0.19;
    rr(o, hx, hy, hw, hh, 7);                                                      // hero card
    ln(o, hx + 8, hy + 11, hx + hw * 0.4, hy + 11);
    poly(o, hx + 10, hy + hh * 0.25, hw - 20, hh * 0.55, [0.9, 0.55, 0.7, 0.4, 0.55, 0.25, 0.42, 0.15]);
    const ty = hy + hh + ph * 0.022, tw = hw * 0.47, th = ph * 0.1;
    rr(o, hx, ty, tw, th, 5); rr(o, hx + hw - tw, ty, tw, th, 5);                  // stat tiles
    ln(o, hx + 8, ty + 13, hx + tw * 0.55, ty + 13); ln(o, hx + 8, ty + 26, hx + tw * 0.38, ty + 26);
    ln(o, hx + hw - tw + 8, ty + 13, hx + hw - tw * 0.45, ty + 13); ln(o, hx + hw - tw + 8, ty + 26, hx + hw - tw * 0.6, ty + 26);
    let ly = ty + th + ph * 0.028;
    for (let k = 0; k < 3; k++) { rr(o, hx, ly, pw * 0.11, pw * 0.11, 4); ln(o, hx + pw * 0.16, ly + 5, hx + hw * 0.82, ly + 5); ln(o, hx + pw * 0.16, ly + 15, hx + hw * 0.55, ly + 15); ly += ph * 0.072; }  // list rows
    const ny = y0 + ph * 0.94;
    for (let k = 0; k < 4; k++) { const nx = x0 + pw * (0.18 + k * 0.215); rr(o, nx - 5, ny - 5, 10, 10, 3); }   // bottom nav
  }

  function drawDashboard(o) {
    o.strokeStyle = "#000"; o.fillStyle = "#000"; o.lineWidth = 2.2; o.lineJoin = "round"; o.lineCap = "round";
    const dw = S * 0.98, dh = S * 0.66, x0 = cx - dw / 2, y0 = cy - dh / 2;
    rr(o, x0, y0, dw, dh, 12);                                                     // frame
    const sbw = dw * 0.1; ln(o, x0 + sbw, y0, x0 + sbw, y0 + dh); dt(o, x0 + sbw * 0.5, y0 + dh * 0.09, 3.2);
    for (let k = 0; k < 5; k++) rr(o, x0 + sbw * 0.3, y0 + dh * 0.2 + k * dh * 0.13, sbw * 0.4, sbw * 0.4, 3);   // sidebar nav
    ln(o, x0 + sbw, y0 + dh * 0.13, x0 + dw, y0 + dh * 0.13);
    ln(o, x0 + sbw + 12, y0 + dh * 0.06, x0 + sbw + dw * 0.16, y0 + dh * 0.06);    // title
    rr(o, x0 + dw * 0.56, y0 + dh * 0.035, dw * 0.2, dh * 0.05, 8);                // search
    o.beginPath(); o.arc(x0 + dw * 0.93, y0 + dh * 0.065, dh * 0.032, 0, 6.28); o.stroke();   // avatar
    const ka = x0 + sbw + dw * 0.03, kw = (dw * 0.87 - 2 * dw * 0.03) / 3, ky = y0 + dh * 0.18, kh = dh * 0.19;
    for (let k = 0; k < 3; k++) { const kx = ka + k * (kw + dw * 0.03); rr(o, kx, ky, kw, kh, 6); ln(o, kx + 8, ky + 12, kx + kw * 0.5, ky + 12); ln(o, kx + 8, ky + kh * 0.62, kx + kw * 0.42, ky + kh * 0.62); poly(o, kx + kw * 0.55, ky + kh * 0.35, kw * 0.38, kh * 0.4, [0.8, 0.5, 0.65, 0.3, 0.45, 0.2]); }  // KPI cards
    const ma = ka, my = ky + kh + dh * 0.05, mw = dw * 0.52, mh = dh * 0.4;
    rr(o, ma, my, mw, mh, 6);                                                      // main chart
    for (let g = 1; g < 4; g++) ln(o, ma + 10, my + mh * g / 4, ma + mw - 10, my + mh * g / 4);
    poly(o, ma + 12, my + 12, mw - 24, mh - 24, [0.6, 0.4, 0.5, 0.26, 0.38, 0.18, 0.3, 0.1, 0.22, 0.06]);
    const rxx = ma + mw + dw * 0.03, rw = dw * 0.87 - mw - dw * 0.03;
    rr(o, rxx, my, rw, mh, 6);                                                     // donut panel
    o.beginPath(); o.arc(rxx + rw * 0.5, my + mh * 0.36, mh * 0.2, 0.3, 6.0); o.stroke();
    o.beginPath(); o.arc(rxx + rw * 0.5, my + mh * 0.36, mh * 0.1, 0, 6.28); o.stroke();
    for (let k = 0; k < 3; k++) { dt(o, rxx + rw * 0.22, my + mh * 0.72 + k * 13, 2.4); ln(o, rxx + rw * 0.3, my + mh * 0.72 + k * 13, rxx + rw * 0.8, my + mh * 0.72 + k * 13); }   // legend
  }

  function drawHands(o) {
    // human + robot hands reaching, index fingertips almost touching at the centre
    o.lineCap = "round"; o.lineJoin = "round"; o.strokeStyle = "#000"; o.fillStyle = "#000";
    const k = S / 460;
    o.save(); o.translate(cx, cy); o.scale(k, k); o.translate(-230, -230);
    const cap = (x1, y1, x2, y2, w) => { o.lineWidth = w; o.beginPath(); o.moveTo(x1, y1); o.lineTo(x2, y2); o.stroke(); };
    // human hand (lower-left), index pointing up toward centre
    cap(60, 440, 140, 352, 30);                       // forearm
    o.beginPath(); o.ellipse(158, 338, 30, 25, -0.5, 0, 6.28); o.fill();   // fist
    cap(172, 320, 214, 240, 15);                      // index finger
    o.beginPath(); o.arc(214, 240, 7, 0, 6.28); o.fill();   // fingertip
    cap(150, 348, 138, 372, 12); cap(165, 356, 150, 380, 11);   // curled fingers
    cap(182, 330, 206, 320, 11);                      // thumb
    // robot hand (upper-right), index pointing down toward centre
    cap(404, 24, 330, 112, 26);                       // forearm
    o.lineWidth = 2.2; o.beginPath(); o.arc(330, 112, 9, 0, 6.28); o.stroke();   // wrist joint
    o.save(); o.translate(312, 128); o.rotate(0.7); o.fillRect(-22, -20, 44, 40); o.restore();   // angular hand
    cap(300, 134, 248, 224, 14);                      // index finger
    o.beginPath(); o.arc(248, 224, 6, 0, 6.28); o.fill();   // fingertip
    cap(322, 140, 316, 168, 11); cap(300, 150, 292, 176, 10);   // other fingers
    o.lineWidth = 2; for (let s = 0; s < 3; s++) { const t = 0.3 + s * 0.22, X = 300 + (248 - 300) * t, Y = 134 + (224 - 134) * t; o.beginPath(); o.arc(X, Y, 2.5, 0, 6.28); o.stroke(); }   // finger joints
    o.fillStyle = "#000"; for (let s = 0; s < 7; s++) { const a = s / 7 * 6.28; o.beginPath(); o.arc(231 + Math.cos(a) * 6, 232 + Math.sin(a) * 6, 1.3, 0, 6.28); o.fill(); }   // spark
    o.restore();
  }

  // ---- sample a drawing into candidate points, then resample to exactly N ----
  function sampleDraw(drawFn, skipWhite, step) {
    step = step || 2;
    // supersample so we capture fine detail even on small source images
    const SS = 2, ow = W * SS, oh = H * SS;
    const off = document.createElement("canvas"); off.width = ow; off.height = oh;
    const o = off.getContext("2d"); o.scale(SS, SS); o.imageSmoothingQuality = "high"; drawFn(o);
    const d = o.getImageData(0, 0, ow, oh).data, pts = [], st = step * SS;
    for (let y = 0; y < oh; y += st) for (let x = 0; x < ow; x += st) {
      const i = (y * ow + x) * 4;
      if (d[i + 3] > 40) { if (skipWhite && d[i] + d[i + 1] + d[i + 2] > 720) continue; pts.push([x / SS, y / SS]); }
    }
    return pts;
  }
  function resample(pts, count) {
    const out = [];
    if (!pts.length) { for (let i = 0; i < count; i++) out.push([cx, cy]); return out; }
    for (let i = 0; i < count; i++) out.push(pts[(i * pts.length / count) | 0]);
    return out;
  }

  function build() {
    const rect = wrap.getBoundingClientRect();
    W = Math.round(rect.width); H = Math.round(rect.height || rect.width);
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    cx = W / 2; cy = H / 2; S = Math.min(W, H);
    buildLUT();

    // A fraction of particles are "dust" — they never fully join a shape; instead
    // they disperse to the left (red side), giving the comet-trail look.
    const DUST = Math.floor(N * 0.24), FORM = N - DUST;

    // Scale the face by HEIGHT (so the head matches the other shapes' size) and
    // right-align it — head on the right, dispersion trailing off to the left.
    const ratio = faceImg.naturalHeight / faceImg.naturalWidth;
    const figH = S * 0.92, figW = figH / ratio, fX = W - figW, fY = (H - figH) / 2;
    shapes.face = resample(sampleDraw(o => o.drawImage(faceImg, fX, fY, figW, figH), true, 2), FORM);
    shapes.mobile = resample(sampleDraw(drawMobile, false, 2), FORM);
    shapes.dashboard = resample(sampleDraw(drawDashboard, false, 2), FORM);
    const hRatio = handsImg.naturalHeight / handsImg.naturalWidth;
    const hW = W * 1.0, hH = hW * hRatio, hX = (W - hW) / 2, hY = (H - hH) / 2;
    shapes.hands = resample(sampleDraw(o => o.drawImage(handsImg, hX, hY, hW, hH), true, 2), FORM);

    particles = [];
    for (let i = 0; i < N; i++) {
      const dust = i >= FORM;
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        hx: 18 + Math.random() * (W - 36), hy: 18 + Math.random() * (H - 36),
        // dust scatters on BOTH sides (edge-biased) so neither side looks empty
        dhx: (Math.random() < 0.5 ? Math.pow(Math.random(), 1.7) * W * 0.45 : W - Math.pow(Math.random(), 1.7) * W * 0.45), dhy: Math.random() * H,
        dust, idx: dust ? 0 : i,
        fp: Math.random() * 6.28, fa: 5 + Math.random() * 12, fs: 0.4 + Math.random() * 0.5,
        sx: 0, sy: 0, tw: Math.random() * 6.28, size: 1.0 + Math.random() * 0.7,
        ox: 0, oy: 0, ovx: 0, ovy: 0   // cursor-repulsion displacement + velocity
      });
    }
    ready = true;
  }

  // ---- timeline: scatter → face → mobile → dashboard → (loop) ----
  const ORDER = ["scatter", "face", "mobile", "dashboard", "hands"];
  const MORPH = 1500, HOLD_SHAPE = 2300, HOLD_SCATTER = 2600;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  let phase = 0, phaseStart = null;

  // cursor repulsion (spring-damped): RAD = reach, STR = push, SPRING = pull-back, DAMP = friction
  const RAD = 105, RAD2 = RAD * RAD, STR = 2.8, SPRING = 0.05, DAMP = 0.86;
  let mx = -1e4, my = -1e4, mouseIn = false;

  function frame(ts) {
    if (!ready || !heroVisible) return requestAnimationFrame(frame);
    if (phaseStart === null) { phaseStart = ts; for (const p of particles) { p.sx = p.x; p.sy = p.y; } }
    const name = ORDER[phase];
    const dur = MORPH + (name === "scatter" ? HOLD_SCATTER : HOLD_SHAPE);
    let e = ts - phaseStart;
    if (e >= dur) { phase = (phase + 1) % ORDER.length; phaseStart = ts; for (const p of particles) { p.sx = p.x; p.sy = p.y; } e = 0; }

    ctx.clearRect(0, 0, W, H);
    const tsec = ts / 1000;
    const k = e < MORPH ? ease(e / MORPH) : 1;
    const shape = name === "scatter" ? null : shapes[name];

    for (let i = 0; i < N; i++) {
      const p = particles[i];
      let tx, ty;
      if (shape && !p.dust) { const g = shape[p.idx]; tx = g[0]; ty = g[1]; }
      else if (shape) { tx = p.dhx + Math.cos(tsec * p.fs + p.fp) * p.fa; ty = p.dhy + Math.sin(tsec * p.fs * 1.1 + p.fp) * p.fa; }
      else { tx = p.hx + Math.cos(tsec * p.fs + p.fp) * p.fa; ty = p.hy + Math.sin(tsec * p.fs * 1.1 + p.fp) * p.fa; }
      if (e < MORPH) { p.x = p.sx + (tx - p.sx) * k; p.y = p.sy + (ty - p.sy) * k; }
      else { p.x = tx; p.y = ty; }

      // cursor repulsion — push the displacement out, then spring it back
      if (mouseIn) {
        const ddx = (p.x + p.ox) - mx, ddy = (p.y + p.oy) - my, d2 = ddx * ddx + ddy * ddy;
        if (d2 < RAD2) { const d = Math.sqrt(d2) || 1, f = (1 - d / RAD) * STR; p.ovx += (ddx / d) * f; p.ovy += (ddy / d) * f; }
      }
      p.ovx = (p.ovx - p.ox * SPRING) * DAMP;
      p.ovy = (p.ovy - p.oy * SPRING) * DAMP;
      p.ox += p.ovx; p.oy += p.ovy;

      const dx = p.x + p.ox, dy = p.y + p.oy;
      ctx.globalAlpha = 0.72 + 0.28 * (0.5 + 0.5 * Math.sin(tsec * 2 + p.tw));   // blink (crisper)
      ctx.fillStyle = colAt(dx);
      ctx.fillRect(dx, dy, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  const faceImg = new Image(), handsImg = new Image();
  let loaded = 0;
  const onload = () => {
    if (++loaded < 2) return;
    build();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;   // CSS shows the static image
    requestAnimationFrame(frame);
  };
  faceImg.onload = onload; handsImg.onload = onload;
  faceImg.src = window.FACE_SRC; handsImg.src = window.HANDS_SRC;

  // track the cursor over the hero art (coords in canvas CSS space)
  wrap.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; mouseIn = true; });
  wrap.addEventListener("pointerleave", () => { mouseIn = false; });

  let rt;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (ready) build(); }, 200); });
})();

/* ===================== WORLD MAP DOTS ===================== */
// Scatter a faint dotted "world" grid behind the stats section.
(function buildMap() {
  const g = document.querySelector(".dots-map");
  if (!g) return;
  // simple landmass-ish clusters within 900x420
  const clusters = [
    [120, 140, 90, 90], [180, 230, 110, 120], [420, 110, 120, 90],
    [470, 200, 90, 120], [600, 130, 160, 110], [760, 280, 80, 70], [560, 290, 70, 60]
  ];
  clusters.forEach(([x, y, w, h]) => {
    for (let i = 0; i < 70; i++) {
      const cx = x + Math.random() * w;
      const cy = y + Math.random() * h;
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", cx.toFixed(0)); c.setAttribute("cy", cy.toFixed(0)); c.setAttribute("r", 2.1);
      g.appendChild(c);
    }
  });
})();

/* ===================== TRIO LIQUID FILL (on scroll) ===================== */
/* Red + blue orbs fly out of the hero animation and land on the trio's circles
   as you scroll; the trio sequence starts the moment they land. */
(function flyOrbs() {
  const wrap = document.querySelector(".flyorbs");
  const hero = document.querySelector(".hero-art");
  const trio = document.querySelector(".trio2");
  const orbR = document.querySelector(".flyorb.red");
  const orbB = document.querySelector(".flyorb.blue");
  const leftC = document.querySelector(".t2-left");
  const rightC = document.querySelector(".t2-right");
  if (!wrap || !hero || !trio || !orbR || !orbB || !leftC || !rightC) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { wrap.style.display = "none"; trio.classList.add("play"); return; }

  let sRX, sBX, sY, rX, rY, bX, bY, endScroll;
  function measure() {
    const sy = window.scrollY;
    const hr = hero.getBoundingClientRect();
    sRX = hr.left + hr.width * 0.4; sBX = hr.left + hr.width * 0.6; sY = hr.top + sy + hr.height * 0.5;
    const lr = leftC.getBoundingClientRect(), rr = rightC.getBoundingClientRect();
    rX = lr.left + lr.width / 2; rY = lr.top + sy + lr.height / 2;
    bX = rr.left + rr.width / 2; bY = rr.top + sy + rr.height / 2;
    endScroll = Math.max(1, trio.offsetTop - window.innerHeight * 0.55);
  }
  measure();
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  let played = false;

  function frame() {
    const p = Math.min(1, window.scrollY / endScroll);
    const e = ease(p);
    const sc = Math.min(1, 0.18 + p);   // start tiny, grow to full size by the time it lands
    orbR.style.transform = `translate(${(sRX + (rX - sRX) * e).toFixed(1)}px, ${(sY + (rY - sY) * e).toFixed(1)}px) scale(${sc.toFixed(2)})`;
    orbB.style.transform = `translate(${(sBX + (bX - sBX) * e).toFixed(1)}px, ${(sY + (bY - sY) * e).toFixed(1)}px) scale(${sc.toFixed(2)})`;
    const op = Math.min(1, p / 0.06) * (1 - Math.max(0, (p - 0.8) / 0.1));   // fade in early, vanish as they land
    orbR.style.opacity = op.toFixed(2); orbB.style.opacity = op.toFixed(2);
    if (p >= 0.85 && !played) { played = true; trio.classList.add("play"); }
    if (p < 0.7 && played) { played = false; trio.classList.remove("play"); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 200); });
})();

/* ===================== FLY ORBS 2 — trio colours land on the expertise list ===================== */
(function flyOrbs2() {
  const wrap = document.querySelector(".flyorbs2");
  const trio = document.querySelector(".trio2");
  const exp = document.querySelector(".capx");
  const track = document.querySelector(".capx-track");
  const orbs = [...document.querySelectorAll(".forb")];                 // red, purple, blue
  const startEls = [document.querySelector(".t2-left"), document.querySelector(".t2-center"), document.querySelector(".t2-right")];
  const endEls = [...document.querySelectorAll(".capx-nav .dashed-dot")];   // Research, Design, Human Factors
  if (!wrap || !trio || !exp || !track || orbs.length < 3 || startEls.some(e => !e) || endEls.length < 3) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { wrap.style.display = "none"; exp.classList.add("lit"); return; }

  let S = [], E = [], startScroll = 0, endScroll = 1;
  function measure() {
    const sy = window.scrollY;
    const c = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + sy + r.height / 2 }; };
    const docTop = el => el.getBoundingClientRect().top + sy;   // true document offset (offsetTop is relative to .capx)
    S = startEls.map(c); E = endEls.map(c);
    startScroll = docTop(trio) - window.innerHeight * 0.40;
    endScroll = Math.max(startScroll + 120, docTop(track) - window.innerHeight * 0.12);   // land as the section arrives
  }
  measure();
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  let lit = false;

  function frame() {
    const p = Math.max(0, Math.min(1, (window.scrollY - startScroll) / (endScroll - startScroll)));
    const e = ease(p);
    const sc = Math.min(1, 0.18 + p);                                   // start tiny, grow to the dot size
    const op = Math.min(1, p / 0.06) * (1 - Math.max(0, (p - 0.82) / 0.12));
    orbs.forEach((o, i) => {
      const x = S[i].x + (E[i].x - S[i].x) * e, y = S[i].y + (E[i].y - S[i].y) * e;
      o.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(2)})`;
      o.style.opacity = op.toFixed(2);
    });
    if (p >= 0.86 && !lit) { lit = true; exp.classList.add("lit"); }
    if (p < 0.55 && lit) { lit = false; exp.classList.remove("lit"); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener("load", measure);   // re-measure once the nav has collapsed to its compact layout
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 200); });
})();

/* ===================== FLY ORBS 3 — capability colours land on the project cards ===================== */
(function flyOrbs3() {
  const wrap = document.querySelector(".flyorbs3");
  const track = document.querySelector(".capx-track");
  const work = document.querySelector(".work");
  const orbs = [...document.querySelectorAll(".forb3")];               // red, blue, purple
  const cards = [...document.querySelectorAll(".work .case-card")];    // One(red), Two(blue), Three(purple)
  if (!wrap || !track || !work || orbs.length < 3 || cards.length < 3) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { wrap.style.display = "none"; return; }

  const off = [-46, 46, 0];   // red sits high, blue low, purple middle — mirrors the Research/Design/Human Factors stack
  let E = [], startScroll = 0, endScroll = 1, S = null;
  function measure() {
    const sy = window.scrollY, vh = window.innerHeight;
    E = cards.map(el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + sy + 64 }; });
    const workTop = work.getBoundingClientRect().top + sy;
    startScroll = workTop - vh * 0.92;            // as you scroll past Human Factors, from the left where the circles are
    endScroll = Math.max(startScroll + 1, workTop - vh * 0.2);
  }
  measure();
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const endP = [0.70, 0.84, 0.98];               // each colour reaches (and is absorbed by) its card at a different point
  const filled = [false, false, false];

  function frame() {
    const sy = window.scrollY;
    const p = Math.max(0, Math.min(1, (sy - startScroll) / (endScroll - startScroll)));
    if (p <= 0) {
      S = null; for (const o of orbs) o.style.opacity = "0";
      filled.forEach((f, i) => { if (f) { filled[i] = false; cards[i].classList.remove("filled"); } });
      return requestAnimationFrame(frame);
    }
    if (!S) {   // launch from the capability circle on the left, spread like the three stacked circles
      const a = document.querySelector(".capx-w.is-active .dashed-dot") || document.querySelector(".capx-nav .dashed-dot");
      const r = a.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + sy + r.height / 2;
      S = orbs.map((_, i) => ({ x: cx, y: cy + off[i] }));
    }
    orbs.forEach((o, i) => {
      const pi = Math.min(1, p / endP[i]);                       // this orb's own progress to its card
      const e = ease(pi);
      const x = S[i].x + (E[i].x - S[i].x) * e, y = S[i].y + (E[i].y - S[i].y) * e;
      const grow = Math.min(1, 0.16 + pi);
      const absorb = pi > 0.86 ? Math.max(0, 1 - (pi - 0.86) / 0.14) : 1;   // shrink + fade into the card on arrival
      o.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${(grow * (0.4 + 0.6 * absorb)).toFixed(2)})`;
      o.style.opacity = (Math.min(1, pi / 0.08) * absorb).toFixed(2);
      // the moment the colour touches the card -> the card absorbs it (fill floods from that exact point)
      if (pi >= 0.9 && !filled[i]) { filled[i] = true; cards[i].classList.add("filled"); }
      if (pi < 0.45 && filled[i]) { filled[i] = false; cards[i].classList.remove("filled"); }
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener("load", measure);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 200); });
})();

/* ===================== FLY ORBS 4 — project colours fade off and land on Mounika ===================== */
(function flyOrbs4() {
  const wrap = document.querySelector(".flyorbs4");
  const work = document.querySelector(".work");
  const about = document.querySelector(".about");
  const orbs = [...document.querySelectorAll(".forb4")];          // red, blue, purple
  const cards = [...document.querySelectorAll(".work .case-card")];
  const fills = cards.map(c => c.querySelector(".card-fill"));
  const dots = [...document.querySelectorAll(".about-dots .dot")]; // red, purple, blue
  if (!wrap || !work || !about || orbs.length < 3 || cards.length < 3 || dots.length < 3) return;
  const dotIdx = [0, 2, 1];   // red orb -> red dot, blue orb -> blue dot, purple orb -> purple dot
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { wrap.style.display = "none"; dots.forEach(d => d.classList.add("lit")); return; }

  let S = [], E = [], startScroll = 0, endScroll = 1;
  function measure() {
    const sy = window.scrollY, vh = window.innerHeight;
    const c = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + sy + r.height / 2 }; };
    S = cards.map(c);
    E = orbs.map((_, i) => c(dots[dotIdx[i]]));
    const workTop = work.getBoundingClientRect().top + sy;
    startScroll = workTop + vh * 0.15;            // once the cards are filled and you scroll on down
    endScroll = Math.max(startScroll + 1, E[0].y - vh * 0.35);
  }
  measure();
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const endP = [0.80, 0.90, 1.0];
  const lit = [false, false, false];

  function frame() {
    const p = Math.max(0, Math.min(1, (window.scrollY - startScroll) / (endScroll - startScroll)));
    // the project colours drain off the cards as they lift away
    fills.forEach(f => { if (f) f.style.opacity = p > 0 ? Math.max(0, 1 - p / 0.42).toFixed(2) : ""; });
    if (p <= 0) {
      for (const o of orbs) o.style.opacity = "0";
      lit.forEach((l, i) => { if (l) { lit[i] = false; dots[dotIdx[i]].classList.remove("lit"); } });
      return requestAnimationFrame(frame);
    }
    orbs.forEach((o, i) => {
      const pi = Math.min(1, p / endP[i]);
      const e = ease(pi);
      const x = S[i].x + (E[i].x - S[i].x) * e, y = S[i].y + (E[i].y - S[i].y) * e;
      const absorb = pi > 0.88 ? Math.max(0, 1 - (pi - 0.88) / 0.12) : 1;
      const sc = (0.5 + 0.5 * pi) * (0.35 + 0.65 * absorb);
      o.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(2)})`;
      o.style.opacity = (Math.min(1, pi / 0.08) * absorb).toFixed(2);
      if (pi >= 0.9 && !lit[i]) { lit[i] = true; dots[dotIdx[i]].classList.add("lit"); }
      if (pi < 0.5 && lit[i]) { lit[i] = false; dots[dotIdx[i]].classList.remove("lit"); }
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener("load", measure);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 200); });
})();

/* ===================== FLY ORBS 6 — FAQ colours float onto the CTA quote and form a gradient ===================== */
(function flyOrbs6() {
  const wrap = document.querySelector(".flyorbs6");
  const faq = document.querySelector(".faq");
  const cta = document.querySelector(".footer-cta");
  const h2 = document.querySelector(".footer-cta h2");
  const orbs = [...document.querySelectorAll(".forb6")];               // red, purple, blue
  const src = [...document.querySelectorAll(".faq-title .dot")];       // red, purple, blue
  if (!wrap || !faq || !cta || !h2 || orbs.length < 3 || src.length < 3) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { wrap.style.display = "none"; cta.classList.add("lit"); return; }

  let S = [], E = [], startScroll = 0, endScroll = 1;
  function measure() {
    const sy = window.scrollY, vh = window.innerHeight;
    const c = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + sy + r.height / 2 }; };
    S = src.map(c);
    const r = h2.getBoundingClientRect(), cx = r.left + r.width / 2, barY = r.top + sy - 32, hw = 185;
    E = [{ x: cx - hw, y: barY }, { x: cx, y: barY }, { x: cx + hw, y: barY }];   // red left, purple mid, blue right
    startScroll = S[0].y - vh * 0.2;
    endScroll = Math.max(startScroll + 1, barY - vh * 0.45);
  }
  measure();
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const endP = [0.70, 0.76, 0.82];   // the three colours arrive (distinct) well before the gradient forms
  const LAND = 0.86;                  // once landed, the card slowly fills with the gradient
  let landed = false;

  function frame() {
    const p = Math.max(0, Math.min(1, (window.scrollY - startScroll) / (endScroll - startScroll)));
    src.forEach(d => { d.style.opacity = p > 0 ? Math.max(0, 1 - p / 0.4).toFixed(2) : ""; });   // colours leave the FAQ dots
    if (p <= 0) { for (const o of orbs) o.style.opacity = "0"; if (landed) { landed = false; cta.classList.remove("lit"); } return requestAnimationFrame(frame); }
    // after landing, the distinct orbs are absorbed as the gradient blends in
    const fade = p < LAND ? 1 : Math.max(0, (1 - p) / (1 - LAND));
    orbs.forEach((o, i) => {
      const pi = Math.min(1, p / endP[i]);
      const e = ease(pi);
      const x = S[i].x + (E[i].x - S[i].x) * e, y = S[i].y + (E[i].y - S[i].y) * e;
      const sc = (0.5 + 0.5 * pi) * (0.55 + 0.45 * fade);
      o.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(2)})`;
      o.style.opacity = (Math.min(1, pi / 0.08) * fade).toFixed(2);
    });
    if (p >= LAND && !landed) { landed = true; cta.classList.add("lit"); }   // the three mixed colours slowly form the gradient
    if (p < 0.5 && landed) { landed = false; cta.classList.remove("lit"); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener("load", measure);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 200); });
})();

/* ===================== FLY ORBS 5 — Mounika's colours float over to the FAQ heading ===================== */
(function flyOrbs5() {
  const wrap = document.querySelector(".flyorbs5");
  const about = document.querySelector(".about");
  const faq = document.querySelector(".faq");
  const orbs = [...document.querySelectorAll(".forb5")];               // red, purple, blue
  const src = [...document.querySelectorAll(".about-dots .dot")];      // red, purple, blue
  const dst = [...document.querySelectorAll(".faq-title .dot")];       // red, purple, blue
  if (!wrap || !about || !faq || orbs.length < 3 || src.length < 3 || dst.length < 3) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { wrap.style.display = "none"; dst.forEach(d => d.classList.add("lit")); return; }

  let S = [], E = [], startScroll = 0, endScroll = 1;
  function measure() {
    const sy = window.scrollY, vh = window.innerHeight;
    const c = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + sy + r.height / 2 }; };
    S = src.map(c); E = dst.map(c);
    startScroll = S[0].y - vh * 0.2;             // the moment you scroll down past Mounika
    endScroll = Math.max(startScroll + 1, E[0].y - vh * 0.4);
  }
  measure();
  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const endP = [0.82, 0.91, 1.0];
  const lit = [false, false, false];

  function frame() {
    const p = Math.max(0, Math.min(1, (window.scrollY - startScroll) / (endScroll - startScroll)));
    src.forEach(d => { d.style.opacity = p > 0 ? Math.max(0, 1 - p / 0.4).toFixed(2) : ""; });   // colours leave Mounika
    if (p <= 0) {
      for (const o of orbs) o.style.opacity = "0";
      lit.forEach((l, i) => { if (l) { lit[i] = false; dst[i].classList.remove("lit"); } });
      return requestAnimationFrame(frame);
    }
    orbs.forEach((o, i) => {
      const pi = Math.min(1, p / endP[i]);
      const e = ease(pi);
      const x = S[i].x + (E[i].x - S[i].x) * e, y = S[i].y + (E[i].y - S[i].y) * e;
      const absorb = pi > 0.88 ? Math.max(0, 1 - (pi - 0.88) / 0.12) : 1;
      const sc = (0.45 + 0.55 * pi) * (0.35 + 0.65 * absorb);
      o.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(2)})`;
      o.style.opacity = (Math.min(1, pi / 0.08) * absorb).toFixed(2);
      if (pi >= 0.9 && !lit[i]) { lit[i] = true; dst[i].classList.add("lit"); }
      if (pi < 0.5 && lit[i]) { lit[i] = false; dst[i].classList.remove("lit"); }
    });
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  window.addEventListener("load", measure);
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(measure, 200); });
})();

/* ===================== EXPERTISE — STICKY NAV + DETAIL SWITCHER ===================== */
(function capx() {
  const section = document.querySelector(".capx");
  const track = document.querySelector(".capx-track");
  const words = [...document.querySelectorAll(".capx-w")];
  const imgs = [...document.querySelectorAll(".capx-img")];
  if (!section || !track || words.length < 2) return;
  const n = words.length;
  let cur = -2;

  function onScroll() {
    const total = track.offsetHeight - window.innerHeight;
    const top = track.getBoundingClientRect().top;
    const scrolled = Math.min(total, Math.max(0, -top));
    const p = total > 0 ? scrolled / total : 0;
    // keep all three visible (dots compact for the colour landing) until the section pins
    const i = top > 8 ? -1 : Math.min(n - 1, Math.floor(p * n + 0.0001));
    if (i === cur) return;
    cur = i;
    section.classList.toggle("engaged", i >= 0);   // once pinned, show only the active word
    words.forEach((el, k) => el.classList.toggle("is-active", k === i));
    imgs.forEach((el, k) => el.classList.toggle("is-active", k === i));   // swap the illustration
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();
})();

/* ===================== EXPERTISE — PARTICLE GLYPHS (matches the hero dot style) ===================== */
(function capxParticles() {
  const canvas = document.querySelector(".capx-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const words = [...document.querySelectorAll(".capx-w")];
  const VB = 440, SG = 1150;   // SG = how many nodes trace each glyph
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let scale = 1;

  function fitCanvas() {
    const s = Math.round(canvas.clientWidth) || 380;
    canvas.width = s * DPR; canvas.height = s * DPR; scale = canvas.width / VB;
  }

  // glyphs drawn with the canvas API (no images -> no file:// tainting), then pixel-sampled.
  // one glyph per list item; the cloud morphs through them like the hero loops its shapes.
  const TAU = 6.2832;
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  // RESEARCH: user · usability · interviews · surveys · journey · insight
  function rUser(c) { c.lineWidth = 13; c.beginPath(); c.arc(220, 148, 40, 0, TAU); c.stroke(); c.beginPath(); c.arc(220, 168, 92, 3.55, 5.87); c.stroke(); }
  function rScreen(c) { c.lineWidth = 11; rr(c, 148, 118, 150, 116, 12); c.stroke(); c.beginPath(); c.moveTo(244, 196); c.lineTo(244, 252); c.lineTo(259, 237); c.lineTo(269, 257); c.lineTo(279, 252); c.lineTo(269, 233); c.lineTo(286, 232); c.closePath(); c.fill(); }
  function rChat(c) { c.lineWidth = 11; rr(c, 116, 116, 152, 92, 18); c.stroke(); c.beginPath(); c.moveTo(150, 208); c.lineTo(150, 236); c.lineTo(180, 208); c.closePath(); c.fill(); rr(c, 214, 176, 110, 72, 18); c.stroke(); c.beginPath(); c.moveTo(302, 248); c.lineTo(302, 272); c.lineTo(278, 248); c.closePath(); c.fill(); }
  function rClip(c) { c.lineWidth = 11; rr(c, 150, 108, 140, 178, 12); c.stroke(); rr(c, 196, 94, 48, 28, 8); c.stroke(); for (let i = 0; i < 3; i++) { const y = 160 + i * 42; c.beginPath(); c.arc(178, y, 9, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(200, y); c.lineTo(262, y); c.stroke(); } }
  function rRoute(c) { c.lineWidth = 11; c.beginPath(); c.moveTo(142, 150); c.lineTo(212, 150); c.lineTo(212, 230); c.lineTo(300, 230); c.stroke(); c.beginPath(); c.arc(142, 150, 17, 0, TAU); c.stroke(); c.beginPath(); c.arc(142, 150, 5, 0, TAU); c.fill(); c.beginPath(); c.arc(300, 230, 17, 0, TAU); c.stroke(); c.beginPath(); c.arc(300, 230, 5, 0, TAU); c.fill(); }
  function rBulb(c) { c.lineWidth = 11; c.beginPath(); c.arc(220, 166, 54, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(198, 214); c.lineTo(202, 252); c.lineTo(238, 252); c.lineTo(242, 214); c.stroke(); c.beginPath(); c.moveTo(206, 264); c.lineTo(234, 264); c.stroke(); }

  // DESIGN: wireframe · prototype · interaction · system · visual · handoff
  function dFrame(c) { c.lineWidth = 11; rr(c, 150, 108, 140, 178, 16); c.stroke(); c.beginPath(); c.moveTo(170, 142); c.lineTo(240, 142); c.stroke(); rr(c, 170, 162, 100, 58, 8); c.stroke(); c.beginPath(); c.moveTo(170, 244); c.lineTo(270, 244); c.stroke(); }
  function dProto(c) { c.lineWidth = 11; rr(c, 116, 140, 90, 110, 10); c.stroke(); rr(c, 250, 140, 90, 110, 10); c.stroke(); c.beginPath(); c.moveTo(210, 195); c.lineTo(248, 195); c.moveTo(238, 184); c.lineTo(250, 195); c.lineTo(238, 206); c.stroke(); }
  function dTap(c) { c.lineWidth = 11; c.beginPath(); c.arc(220, 190, 30, 0, TAU); c.stroke(); c.beginPath(); c.arc(220, 190, 62, 0, TAU); c.stroke(); c.beginPath(); c.arc(220, 190, 8, 0, TAU); c.fill(); }
  function dGrid(c) { c.lineWidth = 10; for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) { rr(c, 140 + q * 64, 144 + r * 70, 48, 54, 8); c.stroke(); } }
  function dLayers(c) { c.lineWidth = 11; c.beginPath(); c.moveTo(220, 118); c.lineTo(302, 162); c.lineTo(220, 206); c.lineTo(138, 162); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(138, 208); c.lineTo(220, 252); c.lineTo(302, 208); c.stroke(); }
  function dCode(c) { c.lineWidth = 13; c.beginPath(); c.moveTo(182, 150); c.lineTo(140, 190); c.lineTo(182, 230); c.moveTo(258, 150); c.lineTo(300, 190); c.lineTo(258, 230); c.moveTo(236, 138); c.lineTo(204, 242); c.stroke(); }

  // HUMAN FACTORS: cognition · models · perception · errors · ergonomics · inclusion
  function hBrain(c) { c.lineWidth = 11; c.beginPath(); c.arc(194, 190, 56, 0.7, TAU - 0.7); c.stroke(); c.beginPath(); c.arc(252, 190, 40, Math.PI + 0.7, Math.PI * 3 + 0.7); c.stroke(); c.beginPath(); c.moveTo(220, 138); c.lineTo(220, 242); c.stroke(); }
  function hNodes(c) { c.lineWidth = 9; const P = [[160, 150], [300, 160], [228, 210], [168, 262], [300, 258]]; c.beginPath(); c.moveTo(160, 150); c.lineTo(228, 210); c.lineTo(300, 160); c.moveTo(228, 210); c.lineTo(168, 262); c.moveTo(228, 210); c.lineTo(300, 258); c.stroke(); P.forEach(p => { c.beginPath(); c.arc(p[0], p[1], 14, 0, TAU); c.stroke(); }); }
  function hEye(c) { c.lineWidth = 12; c.beginPath(); c.moveTo(120, 190); c.quadraticCurveTo(220, 112, 320, 190); c.quadraticCurveTo(220, 268, 120, 190); c.closePath(); c.stroke(); c.lineWidth = 10; c.beginPath(); c.arc(220, 190, 38, 0, TAU); c.stroke(); c.beginPath(); c.arc(220, 190, 14, 0, TAU); c.fill(); }
  function hShield(c) { c.lineWidth = 11; c.beginPath(); c.moveTo(220, 114); c.lineTo(300, 148); c.lineTo(300, 200); c.quadraticCurveTo(300, 262, 220, 292); c.quadraticCurveTo(140, 262, 140, 200); c.lineTo(140, 148); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(188, 196); c.lineTo(212, 222); c.lineTo(258, 168); c.stroke(); }
  function hErgo(c) { c.lineWidth = 12; c.beginPath(); c.arc(194, 138, 26, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(194, 164); c.lineTo(194, 222); c.lineTo(258, 222); c.moveTo(194, 222); c.lineTo(194, 272); c.moveTo(194, 196); c.lineTo(244, 196); c.stroke(); }
  function hAccess(c) { c.lineWidth = 12; c.beginPath(); c.arc(220, 126, 22, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(174, 172); c.lineTo(266, 172); c.moveTo(220, 158); c.lineTo(220, 224); c.moveTo(220, 224); c.lineTo(190, 282); c.moveTo(220, 224); c.lineTo(250, 282); c.stroke(); }

  const SETS = [
    [rUser, rScreen, rChat, rClip, rRoute, rBulb],
    [dFrame, dProto, dTap, dGrid, dLayers, dCode],
    [hBrain, hNodes, hEye, hShield, hErgo, hAccess]
  ];

  function sample(fn) {
    const s = 200, oc = document.createElement("canvas"); oc.width = s; oc.height = s;
    const o = oc.getContext("2d"); o.scale(s / VB, s / VB); o.strokeStyle = "#000"; o.fillStyle = "#000"; o.lineCap = "round"; o.lineJoin = "round"; fn(o);
    const d = o.getImageData(0, 0, s, s).data, pts = [];
    for (let y = 0; y < s; y += 2) for (let x = 0; x < s; x += 2) { if (d[(y * s + x) * 4 + 3] > 50) pts.push([x / s * VB, y / s * VB]); }
    return pts;
  }
  function toN(pts, n) { const a = []; const L = pts.length; for (let i = 0; i < n; i++) a.push(L ? pts[Math.floor(i * L / n)] : [220, 190]); return a; }

  // red -> purple -> blue palette (same accents as the hero)
  const pal = [], cR = [241, 92, 77], cP = [142, 51, 224], cB = [75, 79, 230];
  const lerp = (a, b, t) => [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
  for (let i = 0; i < 32; i++) { const t = i / 31, c = t < 0.5 ? lerp(cR, cP, t * 2) : lerp(cP, cB, (t - 0.5) * 2); pal.push(`rgb(${c[0]},${c[1]},${c[2]})`); }
  const colAt = x => pal[Math.max(0, Math.min(31, (x / VB * 32) | 0))];
  // darker, bolder gradient for the morphing item so it reads clearly over the faint field
  const palD = [], d1 = [190, 44, 34], d2 = [33, 36, 140];
  for (let i = 0; i < 32; i++) { const t = i / 31; palD.push(`rgb(${Math.round(d1[0] + (d2[0] - d1[0]) * t)},${Math.round(d1[1] + (d2[1] - d1[1]) * t)},${Math.round(d1[2] + (d2[2] - d1[2]) * t)})`); }
  const colAtD = x => palD[Math.max(0, Math.min(31, (x / VB * 32) | 0))];

  // free particle cloud (NOT a grid) — mirrors the hero: morphs through the glyphs, a slice
  // of "dust" trails to the sides, scatter between loops, gentle blink + cursor repel.
  const NP = 4200, DUST = Math.floor(NP * 0.4), FORM = NP - DUST;
  let shapes;
  try { shapes = SETS.map(set => set.map(fn => toN(sample(fn), FORM).map(([x, y]) => [220 + (x - 220) * 1.26, 200 + (y - 200) * 1.26]))); }
  catch (e) { canvas.style.display = "none"; return; }

  const ps = [];
  for (let i = 0; i < NP; i++) {
    const dust = i >= FORM;
    ps.push({
      x: Math.random() * VB, y: Math.random() * VB,
      hx: 14 + Math.random() * (VB - 28), hy: 14 + Math.random() * (VB - 28),
      dhx: (Math.random() < 0.5 ? Math.pow(Math.random(), 1.7) * VB * 0.42 : VB - Math.pow(Math.random(), 1.7) * VB * 0.42), dhy: Math.random() * VB,
      dust, idx: dust ? 0 : i,
      fp: Math.random() * 6.28, fa: 4 + Math.random() * 8, fs: 0.4 + Math.random() * 0.5,
      sx: 0, sy: 0, tw: Math.random() * 6.28, size: 0.9 + Math.random() * 0.6,
      ox: 0, oy: 0, ovx: 0, ovy: 0
    });
  }

  // dense red->blue gradient node field that fills the square behind the white shape
  const field = []; const FG = 46, fstep = 414 / (FG - 1);
  for (let gy = 0; gy < FG; gy++) for (let gx = 0; gx < FG; gx++) {
    const bx = 13 + gx * fstep + (Math.random() - 0.5) * 5, by = 13 + gy * fstep + (Math.random() - 0.5) * 5;
    field.push({ bx, by, x: bx, y: by, vx: 0, vy: 0 });
  }

  let mx = -1e4, my = -1e4;
  canvas.addEventListener("mousemove", e => { const r = canvas.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * VB; my = (e.clientY - r.top) / r.height * VB; });
  canvas.addEventListener("mouseleave", () => { mx = -1e4; my = -1e4; });

  const activeIdx = () => { const a = words.find(w => w.classList.contains("is-active")); return a ? +a.dataset.i : -1; };

  // highlight the list item that the current glyph represents
  function setCur(cat, sub) {
    document.querySelectorAll(".capx-sub li.cur").forEach(li => li.classList.remove("cur"));
    if (cat < 0 || sub < 0 || !words[cat]) return;
    const lis = words[cat].querySelectorAll(".capx-sub li");
    if (lis[sub]) lis[sub].classList.add("cur");
  }

  let visible = true;
  if ("IntersectionObserver" in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { rootMargin: "240px" }).observe(canvas);

  fitCanvas();
  window.addEventListener("resize", fitCanvas);

  // timeline per active category: scatter -> item0 -> item1 -> ... -> item5 -> (loop)
  const MORPH = 700, HOLD_SHAPE = 1300, HOLD_SCATTER = 850;   // ~2s per item
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const RAD = 60, RAD2 = RAD * RAD, STR = 2.6, SPRING = 0.05, DAMP = 0.86;
  let curCat = -2, phase = 0, prevPhase = 0, phaseStart = null;

  function frame(ts) {
    requestAnimationFrame(frame);
    if (!visible) return;
    const cat = activeIdx();
    if (cat !== curCat) { curCat = cat; phase = 0; prevPhase = 0; phaseStart = null; }
    const engaged = cat >= 0;
    // nothing shows until a word is active — no stray square of nodes before/after the morphing
    if (!engaged) { ctx.clearRect(0, 0, canvas.width, canvas.height); setCur(-1, -1); return; }
    if (phaseStart === null) { phaseStart = ts; for (const p of ps) { p.sx = p.x; p.sy = p.y; } setCur(cat, phase); }

    // only morphing items — flow shape -> shape directly, no blank scatter square
    let e = ts - phaseStart;
    const dur = MORPH + HOLD_SHAPE;
    if (e >= dur) {
      prevPhase = phase; phase = (phase + 1) % shapes[cat].length; phaseStart = ts; for (const p of ps) { p.sx = p.x; p.sy = p.y; } e = 0;
      setCur(cat, phase);
    }
    const shapeArr = shapes[cat][phase];
    const morphing = e < MORPH, k = morphing ? ease(e / MORPH) : 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const tsec = ts / 1000;

    // background gradient field (red -> blue), cursor-reactive
    const fsz = Math.max(1, Math.round(0.8 * DPR));
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < field.length; i++) {
      const f = field[i];
      f.vx += (f.bx - f.x) * 0.06; f.vy += (f.by - f.y) * 0.06; f.vx *= 0.8; f.vy *= 0.8;
      const fdx = f.x - mx, fdy = f.y - my, fdm = fdx * fdx + fdy * fdy;
      if (fdm < 3600) { const d = Math.sqrt(fdm) || 1, fo = (60 - d) / 60 * 3; f.vx += fdx / d * fo; f.vy += fdy / d * fo; }
      f.x += f.vx; f.y += f.vy;
      ctx.fillStyle = colAt(f.bx);
      ctx.fillRect(f.x * scale, f.y * scale, fsz, fsz);
    }

    // the morphing item shape, in white, on top
    for (let i = 0; i < NP; i++) {
      const p = ps[i];
      if (!p.dust) continue;   // the item is drawn solid below, not as dots
      const tx = p.dhx + Math.cos(tsec * p.fs + p.fp) * p.fa, ty = p.dhy + Math.sin(tsec * p.fs * 1.1 + p.fp) * p.fa;
      if (morphing) { p.x = p.sx + (tx - p.sx) * k; p.y = p.sy + (ty - p.sy) * k; }
      else { p.x = tx; p.y = ty; }

      const ddx = (p.x + p.ox) - mx, ddy = (p.y + p.oy) - my, d2 = ddx * ddx + ddy * ddy;
      if (d2 < RAD2) { const d = Math.sqrt(d2) || 1, f = (1 - d / RAD) * STR; p.ovx += (ddx / d) * f; p.ovy += (ddy / d) * f; }
      p.ovx = (p.ovx - p.ox * SPRING) * DAMP; p.ovy = (p.ovy - p.oy * SPRING) * DAMP;
      p.ox += p.ovx; p.oy += p.ovy;

      ctx.globalAlpha = 0.82;   // heavy red/purple/blue nodes massing on the sides
      ctx.fillStyle = colAt(p.x + p.ox);
      const ds = (p.size + 0.5) * DPR; ctx.fillRect((p.x + p.ox) * scale, (p.y + p.oy) * scale, ds, ds);
    }

    // the item itself — a solid red icon at 50% opacity, crossfading between items
    ctx.setTransform(1.26 * scale, 0, 0, 1.26 * scale, -57.2 * scale, -52 * scale);
    ctx.strokeStyle = "#f15c4d"; ctx.fillStyle = "#f15c4d"; ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (morphing && prevPhase !== phase) {
      ctx.globalAlpha = 0.5 * (1 - k); SETS[cat][prevPhase](ctx);
      ctx.globalAlpha = 0.5 * k; SETS[cat][phase](ctx);
    } else {
      ctx.globalAlpha = 0.5; SETS[cat][phase](ctx);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
})();

/* ===================== COUNT UP ===================== */
const counter = document.querySelector(".count");
if (counter) {
  const target = parseInt(counter.dataset.target, 10);
  new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      let cur = 0;
      const tick = () => { cur++; counter.textContent = cur; if (cur < target) setTimeout(tick, 180); };
      tick();
      obs.unobserve(e.target);
    });
  }, { threshold: 0.6 }).observe(counter);
}

/* ===================== TESTIMONIAL SLIDER ===================== */
(function testimonials() {
  const row = document.querySelector(".testi-row");
  const viewport = document.querySelector(".testi-viewport");
  if (!row || !viewport) return;
  const items = [...row.children];        // 8 real + 1 clone of the first
  const real = items.length - 1;          // 8
  const dots = [...document.querySelectorAll(".testi-dots button")];
  let idx = 0, timer;
  const ANIM = "transform .7s cubic-bezier(.5,.05,.2,1)";

  const setDots = () => { const a = idx % real; dots.forEach((d, n) => d.classList.toggle("active", n === a)); };
  function goTo(i) {
    idx = i;
    row.style.transition = ANIM;
    row.style.transform = `translateX(-${idx * 100}%)`;
    setDots();
    if (idx === real) {                   // landed on the clone -> jump back to the start with no transition
      setTimeout(() => { row.style.transition = "none"; idx = 0; row.style.transform = "translateX(0)"; }, 720);
    }
  }
  const next = () => goTo(idx + 1);
  const start = () => { timer = setInterval(next, 2000); };
  dots.forEach((d, i) => d.addEventListener("click", () => { clearInterval(timer); goTo(i); start(); }));
  viewport.addEventListener("mouseenter", () => clearInterval(timer));
  viewport.addEventListener("mouseleave", start);
  start();
})();

/* ===================== FAQ ACCORDION ===================== */
const faqItems = document.querySelectorAll(".faq-item");
faqItems.forEach(item => {
  item.addEventListener("toggle", () => {
    if (item.open) faqItems.forEach(o => { if (o !== item) o.open = false; });
  });
});

/* FAQ tabs are visual for now (single content set) */
const faqTabs = document.querySelectorAll(".faq-tabs button");
faqTabs.forEach(tab => tab.addEventListener("click", () => {
  faqTabs.forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
}));

/* ===================== THEME TOGGLE ===================== */
const themeBtn = document.querySelector(".theme-toggle");
if (themeBtn) themeBtn.addEventListener("click", () => {
  const isDark = document.documentElement.classList.toggle("dark");
  try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch (e) {}
});

/* ===================== SCROLL REVEAL ===================== */
const reveal = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in-view"); reveal.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll(".statement, .service, .case-card, .about-card, .stats, .testi, .expertise-list li")
  .forEach(el => { el.classList.add("reveal"); reveal.observe(el); });

/* ===================== BACKGROUND DOT TEXTURE (cursor-reactive) ===================== */
// A light grid of grey dots covering the viewport, behind all content. The same
// spring-repel physics push them away from the cursor anywhere on the page.
(function bgDots() {
  const canvas = document.querySelector(".bg-dots");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const GAP = 26, RAD = 110, RAD2 = RAD * RAD, STR = 2.2, SPRING = 0.06, DAMP = 0.85;
  let W = 0, H = 0, dots = [], mx = -1e4, my = -1e4, mouseIn = false;
  const lerp = (a, b, t) => Math.round(a + (b - a) * t);
  function gcol(x) {   // left red → centre purple → right blue, across the viewport
    let t = Math.max(0, Math.min(1, x / (W || 1)));
    if (t < 0.5) { t *= 2; return `rgb(${lerp(241,142,t)},${lerp(92,51,t)},${lerp(77,224,t)})`; }
    t = (t - 0.5) * 2; return `rgb(${lerp(142,75,t)},${lerp(51,79,t)},${lerp(224,230,t)})`;
  }

  function build() {
    W = window.innerWidth; H = window.innerHeight;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dots = [];
    // jittered grid + varied size/opacity → organic dotted texture (not a rigid grid)
    for (let gy = 0; gy < H + GAP; gy += GAP) for (let gx = 0; gx < W + GAP; gx += GAP) {
      const x = gx + (Math.random() - 0.5) * GAP * 1.25, y = gy + (Math.random() - 0.5) * GAP * 1.25;
      dots.push({ hx: x, hy: y, ox: 0, oy: 0, vx: 0, vy: 0, size: 0.6 + Math.random() * 1.8, a: 0.22 + Math.random() * 0.42, col: gcol(x) });
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (const d of dots) {
      if (mouseIn) {
        const ddx = (d.hx + d.ox) - mx, ddy = (d.hy + d.oy) - my, dd = ddx * ddx + ddy * ddy;
        if (dd < RAD2) { const dist = Math.sqrt(dd) || 1, f = (1 - dist / RAD) * STR; d.vx += (ddx / dist) * f; d.vy += (ddy / dist) * f; }
      }
      d.vx = (d.vx - d.ox * SPRING) * DAMP; d.vy = (d.vy - d.oy * SPRING) * DAMP;
      d.ox += d.vx; d.oy += d.vy;
      ctx.globalAlpha = d.a; ctx.fillStyle = d.col;
      ctx.fillRect(d.hx + d.ox - d.size / 2, d.hy + d.oy - d.size / 2, d.size, d.size);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  build();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    for (const d of dots) { ctx.globalAlpha = d.a; ctx.fillStyle = d.col; ctx.fillRect(d.hx - d.size / 2, d.hy - d.size / 2, d.size, d.size); }
    ctx.globalAlpha = 1;
  } else {
    window.addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; mouseIn = true; });
    document.addEventListener("pointerleave", () => { mouseIn = false; });
    requestAnimationFrame(frame);
  }
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 200); });
})();

