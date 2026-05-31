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

  // --- AI church assistant (Netlify Function calling Claude) ---
  chatEndpoint: '/.netlify/functions/chat',

  // --- Formspree form IDs (the part after https://formspree.io/f/) ---
  formspree: {
    prayer: 'PRAYER_FORM_ID',
    newsletter: 'NEWSLETTER_FORM_ID'
  }
};
