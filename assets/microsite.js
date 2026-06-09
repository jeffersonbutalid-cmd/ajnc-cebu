/* =====================================================
   AJNC — Microsite controller (for the AJNC Cebu Microsite design)

   One template, every city. Resolves the church by slug
   (?church=<slug> -> AJNC_CONFIG.churchSlug -> "cebu"), hydrates the
   page from the church record (Supabase, or the built-in dataset), and
   owns the sermon player, the map, and the newsletter form.
   ===================================================== */
(function () {
  const CFG = window.AJNC_CONFIG || {};
  const slug = new URLSearchParams(location.search).get('church') || CFG.churchSlug || 'cebu';
  CFG.churchSlug = slug;

  /* ---------- Sermon player (live / latest) ---------- */
  function initPlayer() {
    const player = document.getElementById('ajnc-player');
    const badge = document.getElementById('ajnc-badge');
    const channel = CFG.youtubeChannelId;
    if (!player || !channel) return;
    const uploads = 'UU' + channel.slice(2);
    const pht = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    const day = pht.getDay(), mins = pht.getHours() * 60 + pht.getMinutes();
    let live = null;
    if (day === 0 && mins >= 465 && mins <= 615) live = 'Sunday Service';
    else if (day === 0 && mins >= 855 && mins <= 1005) live = 'Sunday Service';
    else if (day === 4 && mins >= 1110 && mins <= 1230) live = 'Thursday Bible Study';

    if (live) {
      player.innerHTML = '<iframe src="https://www.youtube.com/embed/live_stream?channel=' + channel + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="AJNC live stream"></iframe>';
      if (badge) { badge.className = 'badge live'; badge.innerHTML = '<span class="live-dot" aria-hidden="true"></span> LIVE NOW · ' + live.toUpperCase(); }
    } else {
      player.innerHTML = '<iframe src="https://www.youtube.com/embed/videoseries?list=' + uploads + '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy" title="Latest sermon"></iframe>';
      if (badge) { badge.className = 'badge latest'; badge.textContent = 'LATEST · SUNDAY'; }
    }
  }

  /* ---------- Map ---------- */
  let map, marker;
  function renderMap(coords, name, address) {
    const el = document.getElementById('find-map');
    if (!el || typeof L === 'undefined') return;
    if (!map) {
      map = L.map('find-map', { center: coords, zoom: 14, scrollWheelZoom: false, zoomControl: true });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO', subdomains: 'abcd', maxZoom: 19
      }).addTo(map);
      const icon = L.divIcon({
        className: '',
        html: '<div class="halo-marker"><div class="ring"></div><div class="ring r2"></div><div class="dot"></div></div>',
        iconSize: [30, 30], iconAnchor: [15, 15]
      });
      marker = L.marker(coords, { icon, title: name || 'AJNC' }).addTo(map);
    } else {
      map.setView(coords, 14);
      marker.setLatLng(coords);
    }
    marker.bindPopup('<strong>' + (name || 'AJNC') + '</strong><br/>' + (address || ''));
  }

  /* ---------- Hydration helpers ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
  function lastWordEm(name) {
    const parts = String(name).trim().split(/\s+/);
    if (parts.length === 1) return '<em>' + esc(parts[0]) + '.</em>';
    const last = parts.pop();
    return esc(parts.join(' ')) + ' <em>' + esc(last) + '.</em>';
  }
  function serviceRow(s) {
    const m = String(s).match(/^(\S+)\s+(.*)$/);
    return m ? '<span><strong>' + esc(m[1]) + '</strong> · ' + esc(m[2]) + '</span>'
             : '<span>' + esc(s) + '</span>';
  }

  function to24(h, m, ap) {
    h = +h;
    if (/pm/i.test(ap) && h !== 12) h += 12;
    if (/am/i.test(ap) && h === 12) h = 0;
    return String(h).padStart(2, '0') + ':' + m;
  }
  // Rewrite the Church JSON-LD from the record so schema never drifts from the page.
  function hydrateSchema(c, short, services) {
    const el = document.getElementById('ms-church-jsonld');
    if (!el) return;
    try {
      const d = JSON.parse(el.textContent);
      if (c.name) { d.name = c.name.replace(/^AJNC\b/, 'Apostolic Jesus Name Church'); d.alternateName = [c.name]; }
      if (d.address) {
        if (c.address) d.address.streetAddress = c.address;
        if (c.city) d.address.addressLocality = c.city;
        if (c.province) d.address.addressRegion = c.province;
      }
      if (c.coords && !isNaN(c.coords[0]) && d.geo) { d.geo.latitude = c.coords[0]; d.geo.longitude = c.coords[1]; }
      if (Array.isArray(services) && services.length) {
        const spec = [];
        services.forEach(s => {
          const m = s.match(/^(\w+)\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (!m) return;
          const opens = to24(m[2], m[3], m[4]);
          let oh = +opens.slice(0, 2) + 2; if (oh > 23) oh = 23;
          const closes = String(oh).padStart(2, '0') + ':' + opens.slice(3);
          spec.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase(), opens, closes });
        });
        if (spec.length) d.openingHoursSpecification = spec;
      }
      el.textContent = JSON.stringify(d);
    } catch (e) { /* leave the static schema in place */ }
  }

  function hydrate(c) {
    const short = (c.city || 'Mandaue').replace(/\s+City$/i, '');
    const services = Array.isArray(c.services) ? c.services : [];

    const nav = $('.nav-brand .wordmark');
    if (nav) nav.innerHTML = 'AJNC <em>' + esc(short) + '</em>';

    const eb = $('.hero .eyebrow.gold');
    if (eb) eb.textContent = 'Apostolic Jesus Name Church · ' + short;

    const h1 = $('.hero h1');
    if (h1) h1.innerHTML = 'Worship with family,<br/>here in <em>' + esc(short) + '.</em>';

    if (services.length) {
      const st = $('.hero .service-times');
      if (st) st.innerHTML = services.map(s => '<span class="row">' + esc(s) + '</span>')
        .join('<span class="sep" aria-hidden="true"></span>');
      const tl = $('.plan .times-list');
      if (tl) tl.innerHTML = services.map(serviceRow).join('');
      const ft = $('.find-times');
      if (ft) ft.innerHTML = services.map(s => '<span class="pill">' + esc(s) + '</span>').join('');
      // What's Next strip: this Sunday's times only
      const sundays = services.filter(s => /^sun/i.test(s)).map(s => s.replace(/^sun(day)?\s*/i, ''));
      const stripT = document.querySelector('[data-church="strip-time"]');
      if (stripT && sundays.length) stripT.textContent = sundays.join(' and ');
    }

    hydrateSchema(c, short, services);

    if (c.pastor) {
      const info = $('.player-meta .info span');
      if (info) info.textContent = c.pastor;
      const ah = $('.about-body h2');
      if (ah) ah.innerHTML = lastWordEm(c.pastor);
      const sub = $('.about-body .pastor-sub');
      if (sub) sub.textContent = 'Shepherd of the AJNC ' + short + ' family.';
      const bios = document.querySelectorAll('.about-body p:not(.pastor-sub)');
      if (bios[0]) bios[0].textContent = c.pastor + ' shepherds the AJNC ' + short +
        ' family' + (c.address ? ' at ' + c.address : '') + '. The ministry here is shaped by the apostolic doctrine of Acts 2:38, a deep love for the Word, and a pastoral heart for every family in the room.';
      if (bios[1]) bios[1].textContent = 'Whoever you are and whatever you are carrying, there is a seat at the table for you.';
    }

    const addrEl = $('.find-address');
    if (addrEl && c.address) {
      addrEl.innerHTML = '<span class="street">' + esc(c.address) + '</span>' +
        '<span class="locality">' + esc((short ? short : '') + (c.province ? ', ' + c.province : '')) + '</span>';
    }
    // plan card 3 address line
    const planCards = document.querySelectorAll('.plan-grid .plan-card');
    if (planCards.length && c.address) {
      const last = planCards[planCards.length - 1];
      const p = last.querySelector('p');
      if (p) p.textContent = c.address + '.';
    }

    // Directions resolve to the real street address (Google geocodes it precisely),
    // not the approximate map pin.
    const dest = c.address
      ? encodeURIComponent(c.address + ', ' + (c.province || short || '') + ', Philippines')
      : (c.coords && !isNaN(c.coords[0]) ? c.coords[0] + ',' + c.coords[1] : '');
    if (dest) {
      const dir = 'https://www.google.com/maps/dir/?api=1&destination=' + dest;
      document.querySelectorAll('a[href*="google.com/maps"]').forEach(a => { a.href = dir; });
    }
    // Snap the pin to the exact geocoded address when a Maps key is set;
    // otherwise fall back to the built-in approximate coords.
    if (window.AJNC_MAPS && window.AJNC_MAPS.hasKey && c.address) {
      window.AJNC_MAPS.geocode(window.AJNC_MAPS.query(c))
        .then(coords => { c.coords = coords; renderMap(coords, c.name, c.address); })
        .catch(() => { if (c.coords && !isNaN(c.coords[0])) renderMap(c.coords, c.name, c.address); });
    } else if (c.coords && !isNaN(c.coords[0])) {
      renderMap(c.coords, c.name, c.address);
    }

    // footer
    const fwm = $('.footer-brand .wordmark');
    if (fwm) fwm.innerHTML = 'AJNC <em>' + esc(short) + '</em>';
    const ftag = $('.footer-brand .tagline');
    if (ftag) ftag.innerHTML = 'Together we carry the gospel. <em>Here in ' + esc(short) + '.</em>';

    // metadata
    if (c.city) {
      document.title = (c.name || 'AJNC') + ' | Apostolic Jesus Name Church | ' + short;
      const md = document.querySelector('meta[name="description"]');
      if (md) md.setAttribute('content', (c.name || 'AJNC') + ' is a Oneness Pentecostal church in ' + short +
        '. ' + (services[0] ? services[0] + '. ' : '') + 'Come as you are.');
    }
  }

  /* ---------- Forms (Formspree): newsletter + prayer ---------- */
  function initForms() {
    document.querySelectorAll('form[data-formspree]').forEach(form => {
      const key = form.getAttribute('data-formspree');
      const id = (CFG.formspree && CFG.formspree[key]) || '';
      const endpoint = id && !/_FORM_ID$/.test(id) ? 'https://formspree.io/f/' + id
        : (/_FORM_ID/.test(form.getAttribute('action') || '') ? null : form.getAttribute('action'));
      const success = form.id === 'ms-prayer-form' ? 'Sent. The pastors will pray.' : 'Sent. See you Sunday.';
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"], .btn');
        if (btn) btn.textContent = 'Sending…';
        const done = ok => { if (btn) btn.textContent = ok ? success : 'Please try again'; if (ok) form.reset(); };
        if (!endpoint) { done(true); return; }
        try {
          const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
          done(res.ok);
        } catch { done(false); }
      });
    });
  }

  function initNav() {
    const burger = document.getElementById('ms-nav-burger');
    const links = document.querySelector('.nav-links');
    if (!burger || !links) return;
    burger.addEventListener('click', () => {
      const open = links.classList.toggle('nav-open');
      burger.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
    }));
    // Dropdown toggles
    const ddItems = links.querySelectorAll('.nav-item.has-dd');
    ddItems.forEach(item => {
      const toggle = item.querySelector('.dd-toggle');
      if (!toggle) return;
      toggle.addEventListener('click', e => {
        e.preventDefault();
        const open = item.classList.contains('open');
        ddItems.forEach(i => { i.classList.remove('open'); const t = i.querySelector('.dd-toggle'); if (t) t.setAttribute('aria-expanded', 'false'); });
        if (!open) { item.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); }
      });
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav-item.has-dd')) ddItems.forEach(i => i.classList.remove('open'));
    });
  }

  async function start() {
    initNav();
    initPlayer();
    initForms();
    // Default map (Cebu) so it always renders.
    renderMap([10.3242, 123.9398], 'AJNC Cebu', '2nd floor, Un Heng Building, Casuntingan, Mandaue');
    try {
      const church = window.AJNC_DATA && await window.AJNC_DATA.getChurch(slug);
      if (church) hydrate(church);
      if (window.AJNC_DATA) window.AJNC_DATA.applyBindings(slug);
    } catch (e) {
      console.warn('[AJNC] microsite hydrate failed:', e.message);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
