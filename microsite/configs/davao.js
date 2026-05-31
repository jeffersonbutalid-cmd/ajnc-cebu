/* AJNC Davao microsite config — deploy by copying to assets/config.js
   on the davao.ajnc.ph subdomain. Set the church's own YouTube channel. */
window.AJNC_CONFIG = {
  supabaseUrl: '',          // https://xxxx.supabase.co
  supabaseAnonKey: '',      // anon/public key
  churchSlug: 'davao',
  youtubeChannelId: '',     // AJNC Davao channel id (UC...)
  youtubeHandleUrl: 'https://www.youtube.com/@ajnc.ph',
  chatEndpoint: '/.netlify/functions/chat',
  formspree: { prayer: 'PRAYER_FORM_ID', newsletter: 'NEWSLETTER_FORM_ID' }
};
