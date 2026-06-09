/* =====================================================
   AJNC — Google Maps geocoding helper
   Loads the Google Maps JavaScript API on demand (with the referrer-restricted
   key from config.js) and resolves a street address to exact coordinates using
   the built-in Geocoder. Results are cached in localStorage so repeat visits do
   not re-geocode. Maps still render at the built-in approximate coords first, so
   nothing breaks if the key is missing, unrestricted-and-blocked, or offline.
   ===================================================== */
window.AJNC_MAPS = (function () {
  var KEY = (window.AJNC_CONFIG && window.AJNC_CONFIG.mapsApiKey) || '';
  var _ready = null;

  function load() {
    if (_ready) return _ready;
    _ready = new Promise(function (resolve, reject) {
      if (!KEY) { reject(new Error('no maps key')); return; }
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        resolve(window.google.maps); return;
      }
      window.__ajncMapsReady = function () { resolve(window.google.maps); };
      var s = document.createElement('script');
      s.src = 'https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(KEY) +
        '&callback=__ajncMapsReady&loading=async';
      s.async = true;
      s.onerror = function () { reject(new Error('maps script failed')); };
      document.head.appendChild(s);
    });
    return _ready;
  }

  var _geocoder = null;
  var _cache = {};
  try { _cache = JSON.parse(localStorage.getItem('ajnc_geocache') || '{}'); } catch (e) { /* ignore */ }
  function saveCache() { try { localStorage.setItem('ajnc_geocache', JSON.stringify(_cache)); } catch (e) { /* ignore */ } }

  // Resolve an address string to [lat, lng]. Rejects if no key or no result.
  function geocode(address) {
    if (!address) return Promise.reject(new Error('no address'));
    if (_cache[address]) return Promise.resolve(_cache[address]);
    return load().then(function (maps) {
      if (!_geocoder) _geocoder = new maps.Geocoder();
      return new Promise(function (resolve, reject) {
        _geocoder.geocode({ address: address, region: 'PH' }, function (results, status) {
          if (status === 'OK' && results && results[0]) {
            var loc = results[0].geometry.location;
            var coords = [loc.lat(), loc.lng()];
            _cache[address] = coords; saveCache();
            resolve(coords);
          } else {
            reject(new Error('geocode ' + status));
          }
        });
      });
    });
  }

  // Build a geocodable query from a church record.
  function query(c) {
    if (!c || !c.address) return '';
    var region = c.province || c.city || '';
    var extra = region && c.address.indexOf(region) === -1 ? ', ' + region : '';
    return c.address + extra + ', Philippines';
  }

  return { load: load, geocode: geocode, query: query, hasKey: !!KEY };
})();
