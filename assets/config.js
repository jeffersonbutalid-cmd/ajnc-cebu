/* =====================================================
   AJNC — Runtime configuration
   Safe to expose to the browser. The Supabase anon key is
   public by design; protect writes with Row Level Security.
   Fill these in (or inject at deploy time) to go live.
   ===================================================== */
window.AJNC_CONFIG = {
  // --- Supabase (church locations + microsite placeholders) ---
  // e.g. "https://abcdxyz.supabase.co"
  supabaseUrl: '',
  // anon / public key
  supabaseAnonKey: '',

  // Which church record this site represents (matches churches.slug).
  // The main site uses "cebu"; each microsite sets its own slug.
  churchSlug: 'cebu',

  // YouTube channel for this church's sermons (used by the microsite player).
  youtubeChannelId: 'UC2S7h4HtT5jO6GdJbTTGpKQ',
  youtubeHandleUrl: 'https://www.youtube.com/@ajnccebu',

  // --- Google Maps (accurate church pins + directions) ---
  // Public by design; restrict this key by HTTP referrer in Google Cloud
  // Console (ajnc.ph + your Netlify URL) and enable Maps JavaScript API +
  // Geocoding API. Maps render at approximate coords and snap to the exact
  // geocoded address when this key is present.
  mapsApiKey: 'AIzaSyAk1RVhNz-mrWf2T9uPpAH2sBo5bo44MM8',

  // --- AI church assistant (Netlify Function calling Claude) ---
  chatEndpoint: '/.netlify/functions/chat',

  // --- Formspree form IDs (the part after https://formspree.io/f/) ---
  formspree: {
    prayer: 'xkoeaajp',
    newsletter: 'xvzynnkd'
  }
};
