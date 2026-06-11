/* =====================================================
   AJNC — Mission Globe (three.js)
   A living 3D rendering of the AJNC seal: the globe as a dot cloud baked
   from the actual seal artwork (assets/globe-points.js), a pulsing gold
   beacon over the Philippines, and beams of light carrying the gospel to
   the nations. Lazy-inits when scrolled near, pauses offscreen, renders a
   single static frame under prefers-reduced-motion, and falls back to the
   flat seal image without WebGL.
   ===================================================== */
(function () {
  const mount = document.getElementById('world-canvas');
  const section = document.getElementById('world');
  if (!mount || !section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 760px)').matches;

  function hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function fallback() { section.classList.add('world-no3d'); }

  if (!window.THREE || !window.AJNC_GLOBE || !hasWebGL()) { fallback(); return; }

  /* Lazy init: build the scene only when the band approaches the viewport. */
  let built = false;
  if ('IntersectionObserver' in window && !reduced) {
    const lazy = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting) && !built) { built = true; lazy.disconnect(); build(); }
    }, { rootMargin: '600px' });
    lazy.observe(section);
  } else {
    built = true; build();
  }

  function build() {
    const THREE = window.THREE;
    const DATA = window.AJNC_GLOBE;

    /* ---- decode baked dot cloud ---- */
    function bytes(b64) {
      const bin = atob(b64), out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    const raw = new Int16Array(bytes(DATA.pts).buffer);
    const landFlag = bytes(DATA.land);
    const N = DATA.count;

    const R = 3.0;
    const landPos = [], oceanPos = [];
    for (let i = 0; i < N; i++) {
      const x = (raw[i * 3] / 32000) * R,
            y = (raw[i * 3 + 1] / 32000) * R,
            z = (raw[i * 3 + 2] / 32000) * R;
      (landFlag[i] ? landPos : oceanPos).push(x, y, z);
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);
    camera.position.set(0, 0, 11.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const globe = new THREE.Group();
    scene.add(globe);

    const GOLD = 0xE8B53C;

    // round dot sprite (PointsMaterial draws squares without a map)
    function dotTexture() {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d');
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 30);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.55, 'rgba(255,255,255,1)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }
    const dotMap = dotTexture();

    // dark inner sphere: occludes far-side dots so the globe reads solid
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(R * 0.985, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x0C2444 })
    ));

    function cloud(posArr, color, size, opacity, blending) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArr), 3));
      const m = new THREE.PointsMaterial({
        color, size, map: dotMap, transparent: true, opacity,
        blending: blending || THREE.NormalBlending,
        depthWrite: false, sizeAttenuation: true
      });
      const p = new THREE.Points(g, m);
      globe.add(p);
      return p;
    }
    cloud(landPos, 0xF0C155, 0.085, 1.0, THREE.AdditiveBlending);
    cloud(oceanPos, 0x53729E, 0.05, 0.55);

    /* ---- beacon over the Philippines ---- */
    const B = new THREE.Vector3(DATA.beacon[0], DATA.beacon[1], DATA.beacon[2]);
    const bPos = B.clone().multiplyScalar(R * 1.002);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xFFE9B0 })
    );
    core.position.copy(bPos);
    globe.add(core);

    // soft glow sprite (radial gradient canvas texture)
    const gc = document.createElement('canvas'); gc.width = gc.height = 128;
    const ctx = gc.getContext('2d');
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,224,150,0.9)');
    grad.addColorStop(0.35, 'rgba(232,181,60,0.45)');
    grad.addColorStop(1, 'rgba(232,181,60,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(gc), transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    glow.scale.setScalar(1.15);
    glow.position.copy(bPos);
    globe.add(glow);

    // expanding halo ripples, tangent to the sphere at the beacon
    const ripples = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.16, 0.185, 48),
        new THREE.MeshBasicMaterial({
          color: GOLD, transparent: true, opacity: 0,
          side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
        })
      );
      ring.position.copy(B.clone().multiplyScalar(R * 1.01));
      ring.lookAt(B.clone().multiplyScalar(R * 3));
      globe.add(ring);
      ripples.push(ring);
    }

    /* ---- gospel beams: bezier arcs from the beacon to the nations ----
       Control points use spherical interpolation so even near-antipodal
       beams (Manila to Buenos Aires) arc cleanly over the globe. */
    function slerpV(a, b, t) {
      const d = Math.min(Math.max(a.dot(b), -1), 1);
      const th = Math.acos(d);
      if (th < 1e-4) return a.clone();
      const s = Math.sin(th);
      return a.clone().multiplyScalar(Math.sin((1 - t) * th) / s)
        .add(b.clone().multiplyScalar(Math.sin(t * th) / s));
    }
    const ARC_PTS = 120;
    const arcs = DATA.arcs.map((end, i) => {
      const E = new THREE.Vector3(end[0], end[1], end[2]).normalize();
      const n0 = B.clone().normalize();
      const th = Math.acos(Math.min(Math.max(n0.dot(E), -1), 1));
      const p0 = n0.clone().multiplyScalar(R);
      const p3 = E.clone().multiplyScalar(R);
      // short hops hug the surface, long hauls soar
      const lift = R * (1.15 + (th / Math.PI) * 0.55);
      const p1 = slerpV(n0, E, 0.3).multiplyScalar(lift);
      const p2 = slerpV(n0, E, 0.7).multiplyScalar(lift);
      const curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
      const pts = curve.getPoints(ARC_PTS);
      const g = new THREE.BufferGeometry().setFromPoints(pts);
      const m = new THREE.LineBasicMaterial({
        color: GOLD, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const line = new THREE.Line(g, m);
      if (!reduced) line.geometry.setDrawRange(0, 0);
      globe.add(line);

      // bright comet head travelling the beam
      const head = new THREE.Sprite(new THREE.SpriteMaterial({
        map: dotMap, color: 0xFFE9B0, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false
      }));
      head.scale.setScalar(0.22);
      globe.add(head);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 10, 10),
        new THREE.MeshBasicMaterial({ color: 0xFFE9B0, transparent: true, opacity: reduced ? 0.9 : 0 })
      );
      dot.position.copy(p3);
      globe.add(dot);

      // persistent target marker: a small gold city dot, always lit
      const mark = new THREE.Sprite(new THREE.SpriteMaterial({
        map: dotMap, color: GOLD, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true
      }));
      mark.scale.setScalar(0.13);
      mark.position.copy(E.clone().multiplyScalar(R * 1.01));
      globe.add(mark);

      return { line, head, curve, dot, delay: i * 0.9, period: 7.5 };
    });

    /* ---- starfield ---- */
    const STAR_N = isMobile ? 220 : 520;
    const sPos = new Float32Array(STAR_N * 3);
    for (let i = 0; i < STAR_N; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(16 + Math.random() * 22);
      sPos[i * 3] = v.x; sPos[i * 3 + 1] = v.y; sPos[i * 3 + 2] = v.z;
    }
    const sGeom = new THREE.BufferGeometry();
    sGeom.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const stars = new THREE.Points(sGeom, new THREE.PointsMaterial({
      color: 0xCBD8EE, size: 0.05, transparent: true, opacity: 0.55,
      depthWrite: false, sizeAttenuation: true
    }));
    scene.add(stars);

    /* ---- sizing ---- */
    function resize() {
      const w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(mount);
    else window.addEventListener('resize', resize);

    /* ---- gentle drag (mouse only; touch keeps native scroll) ---- */
    let dragX = 0, dragY = 0, dragTX = 0, dragTY = 0, dragging = false, lastPX = 0, lastPY = 0;
    if (!reduced) {
      mount.addEventListener('pointerdown', e => {
        if (e.pointerType !== 'mouse') return;
        dragging = true; lastPX = e.clientX; lastPY = e.clientY;
        mount.style.cursor = 'grabbing';
      });
      window.addEventListener('pointermove', e => {
        if (!dragging) return;
        dragTX = Math.max(-0.7, Math.min(0.7, dragTX + (e.clientX - lastPX) * 0.004));
        dragTY = Math.max(-0.35, Math.min(0.35, dragTY + (e.clientY - lastPY) * 0.003));
        lastPX = e.clientX; lastPY = e.clientY;
      });
      window.addEventListener('pointerup', () => {
        dragging = false; mount.style.cursor = 'grab';
      });
      mount.style.cursor = 'grab';
    }

    /* ---- render loop ---- */
    let onScreen = true, visible = true;
    document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        entries.forEach(e => { onScreen = e.isIntersecting; });
      }, { rootMargin: '120px' }).observe(mount);
    }

    // Initial yaw: place the beacon (Philippines) front of camera, slightly
    // right of centre, then spin continuously about the Earth's axis from there.
    const rb = Math.hypot(B.x, B.z) || 1;
    const baseYaw = Math.asin(Math.min(0.34 / rb, 1)) - Math.atan2(B.x, B.z);
    const SPIN = 0.085; // rad/s, one revolution every ~74s
    const TILT = 0.10;  // slight desk-globe tilt toward the viewer

    const start = performance.now();
    function frame() {
      const t = (performance.now() - start) * 0.001;

      // continuous rotation, drag adds a spring-back offset on top
      if (!dragging) { dragTX *= 0.97; dragTY *= 0.97; }
      dragX += (dragTX - dragX) * 0.06;
      dragY += (dragTY - dragY) * 0.06;
      globe.rotation.y = baseYaw + t * SPIN + dragX;
      globe.rotation.x = TILT + dragY;

      stars.rotation.y = t * 0.004;

      // beacon pulse
      const pulse = 1 + Math.sin(t * 2.1) * 0.12;
      glow.scale.setScalar(1.15 * pulse);
      ripples.forEach((ring, i) => {
        const ph = ((t * 0.42) + i / 3) % 1;
        ring.scale.setScalar(1 + ph * 5.2);
        ring.material.opacity = (1 - ph) * 0.55;
      });

      // travelling beams
      arcs.forEach(a => {
        const ph = ((t - a.delay) % a.period) / a.period;
        if (ph < 0) { a.line.geometry.setDrawRange(0, 0); a.head.material.opacity = 0; a.dot.material.opacity = 0; return; }
        const headF = Math.min(ph * 1.5, 1);            // head reaches the end at 2/3 of the cycle
        const tailF = Math.max(ph * 1.5 - 0.55, 0);     // trailing window
        const head = Math.round(headF * ARC_PTS);
        const tail = Math.round(tailF * ARC_PTS);
        a.line.geometry.setDrawRange(tail, Math.max(head - tail, 0));
        // comet head riding the curve
        if (headF > 0 && headF < 1) {
          a.head.position.copy(a.curve.getPoint(headF));
          a.head.material.opacity = 0.95;
        } else {
          a.head.material.opacity = 0;
        }
        // arrival flash, fading until the cycle restarts
        a.dot.material.opacity = headF >= 1 ? Math.max(0.95 - (ph * 1.5 - 1) * 1.6, 0) : 0;
      });

      renderer.render(scene, camera);
    }

    if (reduced) {
      // single dignified frame: Philippines centred, full arcs, no motion
      globe.rotation.y = baseYaw;
      globe.rotation.x = TILT;
      ripples.forEach((ring, i) => { ring.scale.setScalar(1 + i * 1.7); ring.material.opacity = 0.35 - i * 0.1; });
      arcs.forEach(a => a.line.geometry.setDrawRange(0, ARC_PTS + 1));
      resize();
      renderer.render(scene, camera);
      return;
    }

    (function tick() {
      if (visible && onScreen) frame();
      requestAnimationFrame(tick);
    })();
  }
})();
