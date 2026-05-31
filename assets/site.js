/* =====================================================
   AJNC Cebu — Site interactions
   - Nav scroll state
   - Reveal-on-scroll
   - Find-a-Church widget (Supabase-backed, static fallback)
   - Prayer request + Newsletter forms (Formspree)
   - Sermon filters
   ===================================================== */

(function(){

  // -------- Nav scroll state --------
  const nav = document.querySelector('.nav');
  if (nav){
    const onScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 32);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // -------- Reveal on scroll --------
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window){
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in'));
  }

  // -------- Plan-card 3D tilt --------
  const tiltCards = document.querySelectorAll('[data-tilt]');
  tiltCards.forEach(card => {
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
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

})();


/* ============ Find a Church widget ============ */
(function(){
  const mapEl = document.getElementById('ajnc-map');
  if (!mapEl || !window.L) return;

  // Built-in defaults. Used as-is when Supabase isn't configured, and
  // as a fallback if the live fetch fails. Live data (when present)
  // takes precedence so edits in the DB reflect without a redeploy.
  const FALLBACK_CHURCHES = [
    { id: "cebu",     name: "AJNC Cebu",           region: "visayas",  province: "Cebu",              city: "Mandaue City",   address: "P. Burgos St., Mandaue City, Cebu 6014", pastor: "Pastor Reyes",     services: ["Sunday 8:00 AM","Sunday 5:00 PM","Wednesday 7:00 PM"], phone: "+63 32 000 0000", website: "/churches/cebu",    coords: [10.3242, 123.9398] },
    { id: "manila",   name: "AJNC Manila",         region: "luzon",    province: "Metro Manila",      city: "Quezon City",    address: "Sample Street, Quezon City, Metro Manila", pastor: "Pastor Cruz",      services: ["Sunday 9:00 AM","Sunday 6:00 PM"],                       phone: "+63 2 0000 0000", website: "/churches/manila",  coords: [14.6760, 121.0437] },
    { id: "davao",    name: "AJNC Davao",          region: "mindanao", province: "Davao del Sur",     city: "Davao City",     address: "Sample Street, Davao City",               pastor: "Pastor Mendoza",   services: ["Sunday 8:00 AM","Sunday 5:00 PM"],                       phone: "+63 82 000 0000", website: "/churches/davao",   coords: [7.0731, 125.6128]  },
    { id: "iloilo",   name: "AJNC Iloilo",         region: "visayas",  province: "Iloilo",            city: "Iloilo City",    address: "Sample Street, Iloilo City",              pastor: "Pastor Santos",    services: ["Sunday 9:00 AM","Sunday 5:00 PM"],                       phone: "+63 33 000 0000", website: "/churches/iloilo",  coords: [10.7202, 122.5621] },
    { id: "cdo",      name: "AJNC Cagayan de Oro", region: "mindanao", province: "Misamis Oriental",  city: "Cagayan de Oro", address: "Sample Street, Cagayan de Oro",           pastor: "Pastor Ramos",     services: ["Sunday 8:30 AM","Sunday 5:00 PM"],                       phone: "+63 88 000 0000", website: "/churches/cagayan-de-oro", coords: [8.4542, 124.6319] },
    { id: "baguio",   name: "AJNC Baguio",         region: "luzon",    province: "Benguet",           city: "Baguio City",    address: "Sample Street, Baguio City",              pastor: "Pastor Garcia",    services: ["Sunday 9:00 AM","Sunday 5:00 PM"],                       phone: "+63 74 000 0000", website: "/churches/baguio",  coords: [16.4023, 120.5960] },
    { id: "bacolod",  name: "AJNC Bacolod",        region: "visayas",  province: "Negros Occidental", city: "Bacolod City",   address: "Sample Street, Bacolod City",             pastor: "Pastor Dela Cruz", services: ["Sunday 8:00 AM","Sunday 5:00 PM"],                       phone: "+63 34 000 0000", website: "/churches/bacolod", coords: [10.6770, 122.9500] },
    { id: "pampanga", name: "AJNC Pampanga",       region: "luzon",    province: "Pampanga",          city: "Angeles City",   address: "Sample Street, Angeles City, Pampanga",   pastor: "Pastor Lim",       services: ["Sunday 9:00 AM","Sunday 5:00 PM"],                       phone: "+63 45 000 0000", website: "/churches/pampanga", coords: [15.1450, 120.5887] }
  ];

  const REGION_VIEWS = {
    all:      { center: [12.4, 122.0], zoom: 5.5 },
    luzon:    { center: [15.5, 121.0], zoom: 6.5 },
    visayas:  { center: [10.7, 123.5], zoom: 7.2 },
    mindanao: { center: [7.5, 124.5],  zoom: 6.5 }
  };

  function svgIcon(d){
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }
  const ICONS = {
    pin:   svgIcon('<path d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
    clock: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    phone: svgIcon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>')
  };

  async function init(){
    let CHURCHES = FALLBACK_CHURCHES;
    try {
      const remote = window.AJNC_DATA && await window.AJNC_DATA.getChurches();
      if (remote && remote.length) CHURCHES = remote;
    } catch (_) { /* keep fallback */ }

    let state = { region: "all", q: "", activeId: null };

    const map = L.map('ajnc-map', { scrollWheelZoom: false, zoomControl: true, attributionControl: true })
      .setView(REGION_VIEWS.all.center, REGION_VIEWS.all.zoom);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    const pinIcon = L.divIcon({
      className: 'ajnc-pin-wrap',
      html: '<div class="ajnc-pin"><span class="ring"></span><span class="ring r2"></span><span class="dot"></span></div>',
      iconSize: [36,36], iconAnchor: [18,18], popupAnchor: [0,-16]
    });

    const markers = {};
    CHURCHES.forEach(c => {
      if (!c.coords || isNaN(c.coords[0])) return;
      const m = L.marker(c.coords, { icon: pinIcon }).addTo(map);
      m.bindPopup(`<strong>${c.name}</strong><span class="pop-pastor">${c.pastor || ''}</span><div class="pop-meta">${c.city}, ${c.province}<br/>${(c.services && c.services[0]) || ''}</div>`);
      m.on('click', () => selectChurch(c.id, { fromMarker: true }));
      markers[c.id] = m;
    });

    const listEl = document.getElementById('ajnc-list');
    const countEl = document.getElementById('ajnc-count');

    function filterChurches(){
      const q = state.q.trim().toLowerCase();
      return CHURCHES.filter(c => {
        if (state.region !== 'all' && c.region !== state.region) return false;
        if (!q) return true;
        return c.name.toLowerCase().includes(q) ||
               (c.city || '').toLowerCase().includes(q) ||
               (c.province || '').toLowerCase().includes(q);
      });
    }

    function renderList(){
      const items = filterChurches();
      countEl.innerHTML = items.length === 0
        ? `<strong>0</strong> churches matched`
        : `<strong>${items.length}</strong> ${items.length === 1 ? 'church' : 'churches'} ${state.region === 'all' ? 'across the Philippines' : 'in ' + state.region.charAt(0).toUpperCase() + state.region.slice(1)}`;

      if (items.length === 0){
        listEl.innerHTML = `
          <div class="finder__empty">
            <h3>We don't have a church <em>there yet.</em></h3>
            <p>Tell us where you are — we're a family that's growing.</p>
            <a href="mailto:hello@ajnc.ph?subject=Church near me" class="finder__btn finder__btn-red">Send us a note →</a>
          </div>`;
        return;
      }

      listEl.innerHTML = items.map(c => `
        <button class="finder__card" data-id="${c.id}" aria-current="${state.activeId === c.id}">
          <div class="eyebrow red">${(c.region || '').toUpperCase()} · ${c.province}</div>
          <h3>${c.name}</h3>
          <div class="pastor">${c.pastor || ''}</div>
          <div class="meta">
            <div class="meta-row">${ICONS.pin}<span>${c.address}</span></div>
            <div class="meta-row">${ICONS.clock}<span>${(c.services || []).join(' · ')}</span></div>
            <div class="meta-row">${ICONS.phone}<a href="tel:${(c.phone||'').replace(/\s/g,'')}">${c.phone || ''}</a></div>
          </div>
          <div class="actions">
            <a class="finder__btn finder__btn-red" href="https://www.google.com/maps/dir/?api=1&destination=${c.coords[0]},${c.coords[1]}" target="_blank" rel="noopener">Get directions →</a>
            <a class="finder__btn finder__btn-ghost" href="${c.website}">Visit page</a>
          </div>
        </button>
      `).join('');

      listEl.querySelectorAll('.finder__card').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('a')) return;
          selectChurch(card.dataset.id, { fromCard: true });
        });
      });
    }

    function selectChurch(id, opts = {}){
      state.activeId = id;
      const c = CHURCHES.find(x => x.id === id);
      if (!c) return;
      listEl.querySelectorAll('.finder__card').forEach(card => {
        card.setAttribute('aria-current', card.dataset.id === id);
      });
      if (opts.fromCard || !opts.fromMarker){
        map.flyTo(c.coords, 13, { duration: 0.9 });
        setTimeout(() => markers[id] && markers[id].openPopup(), 700);
      }
      if (opts.fromMarker){
        const card = listEl.querySelector(`.finder__card[data-id="${id}"]`);
        if (card){
          const offset = card.offsetTop - listEl.offsetTop - 12;
          listEl.scrollTo({ top: offset, behavior: 'smooth' });
        }
      }
    }

    const qEl = document.getElementById('ajnc-q');
    if (qEl) qEl.addEventListener('input', e => { state.q = e.target.value; renderList(); });
    document.querySelectorAll('.finder__chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const region = chip.dataset.region;
        state.region = region;
        document.querySelectorAll('.finder__chip').forEach(c => c.setAttribute('aria-pressed', c === chip));
        const view = REGION_VIEWS[region];
        map.flyTo(view.center, view.zoom, { duration: 0.8 });
        renderList();
      });
    });

    // Keep the live count chip honest with whatever data we loaded.
    if (countEl) countEl.querySelector('strong') && (countEl.querySelector('strong').textContent = CHURCHES.length);

    renderList();
  }

  init();
})();


/* ============ Sermon filters (chip toggle) ============ */
(function(){
  document.querySelectorAll('.sermon-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.sermon-chip').forEach(c => c.setAttribute('aria-pressed', c === chip));
    });
  });
})();


/* ============ Forms (Formspree) ============ */
(function(){
  const CFG = (window.AJNC_CONFIG && window.AJNC_CONFIG.formspree) || {};

  // Resolve the Formspree endpoint for a form: prefer config IDs, fall
  // back to whatever is in the action attribute.
  function endpointFor(form){
    const key = form.getAttribute('data-formspree');
    const id = key && CFG[key];
    if (id && !/_FORM_ID$/.test(id)) return 'https://formspree.io/f/' + id;
    const action = form.getAttribute('action') || '';
    return /_FORM_ID/.test(action) ? null : action; // null => not configured yet
  }

  async function submitForm(form, onDone){
    const endpoint = endpointFor(form);
    // Not configured yet (placeholder ID): show optimistic success so the
    // prototype still demos. Once a real Formspree ID is set, posts go live.
    if (!endpoint){
      onDone(true);
      return;
    }
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form)
      });
      onDone(res.ok);
    } catch (_) {
      onDone(false);
    }
  }

  const prayer = document.getElementById('prayer-form');
  if (prayer){
    prayer.addEventListener('submit', e => {
      e.preventDefault();
      const btn = prayer.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending…';
      submitForm(prayer, ok => {
        if (ok){
          btn.textContent = 'Sent. The pastors will pray.';
          btn.style.background = 'var(--gold)';
          btn.style.color = 'var(--ink)';
          prayer.reset();
        } else {
          btn.disabled = false;
          btn.textContent = original;
          alert('Sorry, something went wrong. Please email hello@ajnc.ph.');
        }
      });
    });
  }

  const news = document.getElementById('newsletter-form');
  if (news){
    news.addEventListener('submit', e => {
      e.preventDefault();
      const btn = news.querySelector('button');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Subscribing…';
      submitForm(news, ok => {
        if (ok){
          btn.textContent = 'Subscribed. Salamat!';
          news.reset();
        } else {
          btn.disabled = false;
          btn.textContent = original;
          alert('Sorry, something went wrong. Please try again.');
        }
      });
    });
  }
})();
