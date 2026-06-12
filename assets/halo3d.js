/* =====================================================
   AJNC Cebu — Hero Halo 3D
   Five concentric Mission Gold rings on tilted axes
   + faint particle dust + gentle bloom-like glow.
   Lazy-init: mobile / no-WebGL falls back to SVG halo (CSS).
   ===================================================== */

(function(){
  const CANVAS = '#hero-canvas';
  const mountEl = document.querySelector(CANVAS);
  if (!mountEl) return;

  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check WebGL availability
  function hasWebGL(){
    try{
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    }catch(e){ return false; }
  }

  if (isMobile || reduced || !hasWebGL() || !window.THREE){
    document.body.classList.add('no-webgl');
    return;
  }

  // WebGL halo is live: let CSS swap the SVG fallback for the canvas.
  document.body.classList.add('webgl-halo');

  const THREE = window.THREE;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  camera.position.set(0, 0, 22);

  const renderer = new THREE.WebGLRenderer({ alpha:true, antialias:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  mountEl.appendChild(renderer.domElement);

  // Group for all the rings
  const halo = new THREE.Group();
  scene.add(halo);

  const GOLD = 0xE8B53C;
  const GOLD_DEEP = 0xB8862A;

  // Five rings, slightly different radii, tube thicknesses, tilted axes
  const ringDefs = [
    { r: 3.8, t: 0.020, tilt: [ 0.10,  0.00, 0.00], speed:  0.06, color: GOLD,      seg: 220, op: 0.95 },
    { r: 4.6, t: 0.016, tilt: [-0.18,  0.22, 0.00], speed: -0.04, color: GOLD,      seg: 240, op: 0.85 },
    { r: 5.5, t: 0.014, tilt: [ 0.32, -0.14, 0.05], speed:  0.03, color: GOLD_DEEP, seg: 260, op: 0.75 },
    { r: 6.4, t: 0.012, tilt: [-0.10,  0.40, 0.08], speed: -0.025,color: GOLD,      seg: 280, op: 0.65 },
    { r: 7.4, t: 0.010, tilt: [ 0.22,  0.12, 0.10], speed:  0.02, color: GOLD_DEEP, seg: 300, op: 0.55 },
  ];

  const rings = ringDefs.map(def => {
    const geom = new THREE.TorusGeometry(def.r, def.t, 18, def.seg);
    const mat = new THREE.MeshBasicMaterial({
      color: def.color,
      transparent: true,
      opacity: def.op,
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = def.tilt[0];
    mesh.rotation.y = def.tilt[1];
    mesh.rotation.z = def.tilt[2];
    mesh.userData = def;
    halo.add(mesh);
    return mesh;
  });

  // Inner glow disc (soft additive)
  const glowGeom = new THREE.CircleGeometry(2.0, 64);
  const glowMat = new THREE.MeshBasicMaterial({
    color: GOLD,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeom, glowMat);
  halo.add(glow);

  // Particle dust
  const PARTICLE_COUNT = 320;
  const pGeom = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const speeds = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++){
    // Bias particles around the halo radius
    const r = 3.5 + Math.random() * 5.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = (Math.random() - 0.5) * 0.6; // shallow z-spread
    positions[i*3]     = Math.cos(theta) * r;
    positions[i*3 + 1] = Math.sin(theta) * r * 0.85;
    positions[i*3 + 2] = phi * 4;
    speeds[i] = 0.05 + Math.random() * 0.08;
  }
  pGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    color: GOLD,
    size: 0.045,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(pGeom, pMat);
  scene.add(points);

  // Resize handling — render at the size of the mount
  function resize(){
    const w = mountEl.clientWidth;
    const h = mountEl.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // Mouse parallax
  let targetX = 0, targetY = 0, curX = 0, curY = 0;
  window.addEventListener('mousemove', e => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.3;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.2;
  });

  // Animation loop: render only while the tab is visible AND the hero is on
  // screen (no point spinning rings nobody can see).
  const start = performance.now();
  let visible = true, onScreen = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  if ('IntersectionObserver' in window){
    new IntersectionObserver(entries => {
      entries.forEach(e => { onScreen = e.isIntersecting; });
    }, { rootMargin: '100px' }).observe(mountEl);
  }

  function tick(){
    if (visible && onScreen){
      const t = (performance.now() - start) * 0.001;

      rings.forEach((m, i) => {
        const def = m.userData;
        // Slow rotation on each ring's natural axis
        m.rotation.z += def.speed * 0.01;
        m.rotation.x = def.tilt[0] + Math.sin(t * 0.15 + i) * 0.04;
        m.rotation.y = def.tilt[1] + Math.cos(t * 0.12 + i) * 0.04;
      });

      // Particle drift — orbit slowly
      const posAttr = pGeom.getAttribute('position');
      const pa = posAttr.array;
      for (let i = 0; i < PARTICLE_COUNT; i++){
        const idx = i * 3;
        const x = pa[idx], y = pa[idx+1];
        const angle = speeds[i] * 0.003;
        const cs = Math.cos(angle), sn = Math.sin(angle);
        pa[idx]     = x * cs - y * sn;
        pa[idx + 1] = x * sn + y * cs;
      }
      posAttr.needsUpdate = true;

      // Camera parallax
      curX += (targetX - curX) * 0.04;
      curY += (targetY - curY) * 0.04;
      camera.position.x = curX * 2;
      camera.position.y = -curY * 2;
      camera.lookAt(0, 0, 0);

      // Subtle group breathing
      const breathe = 1 + Math.sin(t * 0.4) * 0.012;
      halo.scale.setScalar(breathe);

      renderer.render(scene, camera);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
