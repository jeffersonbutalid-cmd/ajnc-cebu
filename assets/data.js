/* =====================================================
   AJNC — Shared data layer (Supabase)

   Single source of truth for:
     - churches        (Find-a-Church locations)
     - site_config     (per-church microsite placeholders)

   Edit a row in Supabase and every site/microsite that reads
   from it reflects the change on next load — no redeploy.

   Exposes:
     window.AJNC_DATA.getChurches()  -> Promise<Church[] | null>
     window.AJNC_DATA.getConfig()    -> Promise<Record<string,string>>
   and auto-binds any element with [data-ajnc-bind="key"] to the
   matching site_config value for this church.

   Degrades gracefully: with no Supabase configured, getChurches()
   resolves null (callers fall back to built-in defaults) and the
   page renders exactly as the static prototype.
   ===================================================== */
(function () {
  const CFG = window.AJNC_CONFIG || {};
  const hasSupabase = Boolean(CFG.supabaseUrl && CFG.supabaseAnonKey);

  async function rest(path) {
    const url = CFG.supabaseUrl.replace(/\/$/, '') + '/rest/v1/' + path;
    const res = await fetch(url, {
      headers: {
        apikey: CFG.supabaseAnonKey,
        Authorization: 'Bearer ' + CFG.supabaseAnonKey
      }
    });
    if (!res.ok) throw new Error('Supabase ' + res.status);
    return res.json();
  }

  // Normalise a DB row into the shape the Find-a-Church widget expects.
  function normalizeChurch(r) {
    let services = r.services;
    if (typeof services === 'string') {
      try { services = JSON.parse(services); } catch { services = services.split('|'); }
    }
    return {
      id: r.slug,
      slug: r.slug,
      name: r.name,
      region: (r.region || '').toLowerCase(),
      province: r.province,
      city: r.city,
      address: r.address,
      pastor: r.pastor,
      services: Array.isArray(services) ? services : [],
      phone: r.phone,
      website: r.website || ('/churches/' + r.slug),
      coords: [Number(r.lat), Number(r.lng)]
    };
  }

  let _churches = null;
  let _config = null;

  async function getChurches() {
    if (!hasSupabase) return null;
    if (_churches) return _churches;
    try {
      const rows = await rest('churches?select=*&order=name.asc');
      _churches = (rows || []).map(normalizeChurch);
      return _churches;
    } catch (e) {
      console.warn('[AJNC] churches fetch failed, using built-in defaults:', e.message);
      return null;
    }
  }

  async function getConfig() {
    if (!hasSupabase) return {};
    if (_config) return _config;
    try {
      const slug = encodeURIComponent(CFG.churchSlug || 'cebu');
      const rows = await rest(
        'site_config?select=key,value&church_slug=eq.' + slug
      );
      _config = {};
      (rows || []).forEach(r => { _config[r.key] = r.value; });
      return _config;
    } catch (e) {
      console.warn('[AJNC] site_config fetch failed:', e.message);
      return {};
    }
  }

  // Bind [data-ajnc-bind="key"] -> site_config value (text or href).
  async function applyBindings() {
    const targets = document.querySelectorAll('[data-ajnc-bind]');
    if (!targets.length) return;
    const cfg = await getConfig();
    targets.forEach(el => {
      const key = el.getAttribute('data-ajnc-bind');
      const val = cfg[key];
      if (val == null || val === '') return;
      const attr = el.getAttribute('data-ajnc-bind-attr');
      if (attr) el.setAttribute(attr, val);
      else el.textContent = val;
    });
  }

  window.AJNC_DATA = { getChurches, getConfig, applyBindings };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBindings);
  } else {
    applyBindings();
  }
})();
