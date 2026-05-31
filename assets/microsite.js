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
    }

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

    if (c.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        a.href = 'tel:' + c.phone.replace(/\s/g, '');
        if (a.closest('.find-contacts')) a.lastChild && (a.lastChild.textContent = ' ' + c.phone);
      });
    }
    if (c.coords && !isNaN(c.coords[0])) {
      const dir = 'https://www.google.com/maps/dir/?api=1&destination=' + c.coords[0] + ',' + c.coords[1];
      document.querySelectorAll('a[href*="google.com/maps"]').forEach(a => { a.href = dir; });
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

  /* ---------- Newsletter (Formspree) ---------- */
  function initNewsletter() {
    const form = document.getElementById('ms-newsletter');
    if (!form) return;
    const id = (CFG.formspree && CFG.formspree.newsletter) || '';
    const endpoint = id && !/_FORM_ID$/.test(id) ? 'https://formspree.io/f/' + id
      : (/_FORM_ID/.test(form.action) ? null : form.action);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('.btn');
      btn.textContent = 'Sending…';
      const done = ok => { btn.textContent = ok ? 'Sent. See you Sunday.' : 'Please try again'; if (ok) form.reset(); };
      if (!endpoint) { done(true); return; }
      try {
        const res = await fetch(endpoint, { method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form) });
        done(res.ok);
      } catch { done(false); }
    });
  }

  async function start() {
    initPlayer();
    initNewsletter();
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
