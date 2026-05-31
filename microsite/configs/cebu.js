/* AJNC Cebu microsite config — deploy by copying to assets/config.js
   on the cebu.ajnc.ph subdomain. */
window.AJNC_CONFIG = {
  supabaseUrl: '',          // https://xxxx.supabase.co
  supabaseAnonKey: '',      // anon/public key
  churchSlug: 'cebu',
  youtubeChannelId: 'UC2S7h4HtT5jO6GdJbTTGpKQ',
  youtubeHandleUrl: 'https://www.youtube.com/@ajnccebu',
  chatEndpoint: '/.netlify/functions/chat',
  formspree: { prayer: 'PRAYER_FORM_ID', newsletter: 'NEWSLETTER_FORM_ID' }
};
