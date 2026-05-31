/* AJNC Manila microsite config — deploy by copying to assets/config.js
   on the manila.ajnc.ph subdomain. Set the church's own YouTube channel. */
window.AJNC_CONFIG = {
  supabaseUrl: '',          // https://xxxx.supabase.co
  supabaseAnonKey: '',      // anon/public key
  churchSlug: 'manila',
  youtubeChannelId: '',     // AJNC Manila channel id (UC...)
  youtubeHandleUrl: 'https://www.youtube.com/@ajnc.ph',
  chatEndpoint: '/.netlify/functions/chat',
  formspree: { prayer: 'PRAYER_FORM_ID', newsletter: 'NEWSLETTER_FORM_ID' }
};
