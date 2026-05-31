/* =====================================================
   AJNC — Microsite controller
   A lean, per-church ad-landing page. Reads the church (by slug)
   and its placeholders from Supabase and hydrates the page, so one
   template serves every city and reflects DB edits without a redeploy.
   Slug resolution: ?church=<slug>  ->  AJNC_CONFIG.churchSlug  ->  "cebu".
   ===================================================== */
(function () {
  const CFG = window.AJNC_CONFIG || {};
  const slug = new URLSearchParams(location.search).get('church') || CFG.churchSlug || 'cebu';
  // Keep config bindings in sync with the resolved slug.
  CFG.churchSlug = slug;

  /* ---------- Shared UI behaviours (this page has no site.js) ---------- */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 32);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  document.querySelectorAll('[data-tilt]').forEach(card => {
    let raf = 0;
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        card.style.transform = `translateY(-6px) rotateX(${-y*4}deg) rotateY(${x*5}deg)`;
      });
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ---------- Sermon player (latest uploads / live switch) ---------- */
  (function initSermons(){
    const player = document.getElementById('ajnc-sermon-player');
    const badge  = document.getElementById('ajnc-sermon-badge');
    const channel = CFG.youtubeChannelId;
    if (!player || !channel) return;
    const uploads = 'UU' + channel.slice(2);
    function liveLabel(){
      const pht = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
      const day = pht.getDay(), mins = pht.getHours()*60 + pht.getMinutes();
      if (day === 0 && mins >= 465 && mins <= 615) return 'Sunday Service';
      if (day === 0 && mins >= 855 && mins <= 1005) return 'Sunday Service';
      if (day === 4 && mins >= 1110 && mins <= 1230) return 'Thursday Bible Study';
      return null;
    }
    const live = liveLabel();
    if (live) {
      player.innerHTML = '<iframe src="https://www.youtube.com/embed/live_stream?channel=' + channel + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="AJNC live stream"></iframe>';
      if (badge) { badge.innerHTML = '<span class="ajnc-live-dot"></span> LIVE NOW · ' + live.toUpperCase(); badge.classList.add('ajnc-badge--live'); }
    } else {
      player.innerHTML = '<iframe src="https://www.youtube.com/embed/videoseries?list=' + uploads + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="Latest sermon" loading="lazy"></iframe>';
      if (badge) { badge.textContent = 'LATEST SUNDAY'; badge.classList.add('ajnc-badge--latest'); }
    }
  })();

  /* ---------- Map (single church) ---------- */
  let map, marker;
  function renderMap(coords){
    const el = document.getElementById('ms-map');
    if (!el || !window.L) return;
    if (!map) {
      map = L.map('ms-map', { scrollWheelZoom: false, zoomControl: true }).setView(coords, 15);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19
      }).addTo(map);
      const icon = L.divIcon({
        className: 'ajnc-pin-wrap',
        html: '<div class="ajnc-pin"><span class="ring"></span><span class="ring r2"></span><span class="dot"></span></div>',
        iconSize: [36,36], iconAnchor: [18,18]
      });
      marker = L.marker(coords, { icon }).addTo(map);
    } else {
      map.setView(coords, 15);
      marker.setLatLng(coords);
    }
    const dir = document.getElementById('ms-directions');
    if (dir) dir.href = 'https://www.google.com/maps/dir/?api=1&destination=' + coords[0] + ',' + coords[1];
  }

  /* ---------- Hydrate church-specific content ---------- */
  function setAll(attr, fn){
    document.querySelectorAll('[data-church="' + attr + '"]').forEach(fn);
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  function hydrate(c){
    const shortCity = (c.city || 'Mandaue').replace(/\s+City$/i, '');
    const services = Array.isArray(c.services) ? c.services : [];
    const svcHtml = services.length ? services.map(escapeHtml).join('<br/>') : null;

    setAll('eyebrow',   el => el.textContent = 'Apostolic Jesus Name Church · ' + shortCity);
    setAll('city',      el => el.textContent = shortCity + '.');
    setAll('city-inline', el => el.textContent = 'in ' + shortCity + '.');
    if (c.name)    setAll('name', el => el.textContent = c.name);
    if (c.pastor)  setAll('pastor', el => el.textContent = c.pastor);
    if (c.address) setAll('address', el => el.textContent = c.address);
    if (c.address) setAll('address-block', el => el.textContent = c.address);
    if (svcHtml) {
      setAll('services-block', el => el.innerHTML = svcHtml);
      setAll('services-list', el => el.innerHTML = svcHtml);
      setAll('services-chip', el => el.innerHTML = services.map(s => '<span>' + escapeHtml(s) + '</span>').join(''));
    }
    if (c.phone) setAll('phone-link', el => { el.href = 'tel:' + c.phone.replace(/\s/g,''); });
    if (CFG.youtubeHandleUrl) setAll('youtube', el => { el.href = CFG.youtubeHandleUrl; });

    // SEO / metadata
    if (c.city) {
      document.title = (c.name || 'AJNC') + ' | A Pentecostal Church in ' + shortCity + ' — Plan Your Visit';
      const desc = document.querySelector('[data-church-desc]');
      if (desc) desc.setAttribute('content',
        (c.name || 'AJNC') + ' — a Oneness Pentecostal family in ' + shortCity +
        '. Sunday service, Bible study, and Jesus-name baptism. Come as you are.');
      try {
        const ld = document.getElementById('ms-jsonld');
        const data = JSON.parse(ld.textContent);
        data.name = c.name || data.name;
        data.alternateName = c.name;
        if (data.address) {
          data.address.addressLocality = c.city;
          data.address.addressRegion = c.province || data.address.addressRegion;
          if (c.address) data.address.streetAddress = c.address;
        }
        data.areaServed = (c.province || shortCity) + ', Philippines';
        ld.textContent = JSON.stringify(data);
      } catch (_) { /* ignore */ }
    }

    if (c.coords && !isNaN(c.coords[0])) renderMap(c.coords);
  }

  async function start(){
    // Default map (Cebu) so it renders even before/without remote data.
    renderMap([10.3242, 123.9398]);
    try {
      const church = window.AJNC_DATA && await window.AJNC_DATA.getChurch(slug);
      if (church) hydrate(church);
      // Apply key/value placeholder bindings for this church.
      if (window.AJNC_DATA) window.AJNC_DATA.applyBindings(slug);
    } catch (e) {
      console.warn('[AJNC] microsite hydrate failed:', e.message);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
