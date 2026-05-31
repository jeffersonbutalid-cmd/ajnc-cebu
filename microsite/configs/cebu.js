/* AJNC microsite config — template.
   Deploy a city's microsite by copying this to assets/config.js and setting
   churchSlug (and the Supabase keys). Preview any city without deploying via
   microsite/?church=<slug>. */
window.AJNC_CONFIG = {
  supabaseUrl: '',          // https://xxxx.supabase.co
  supabaseAnonKey: '',      // anon / publishable (public) key
  churchSlug: 'cebu',
  youtubeChannelId: 'UC2S7h4HtT5jO6GdJbTTGpKQ',
  youtubeHandleUrl: 'https://www.youtube.com/@ajnccebu',
  chatEndpoint: '/.netlify/functions/chat',
  formspree: { prayer: 'xkoeaajp', newsletter: 'xvzynnkd' }
};
