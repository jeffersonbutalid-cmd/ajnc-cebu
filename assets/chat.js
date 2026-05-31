/* =====================================================
   AJNC — "Chat with Grace" assistant (client)
   - Friendly persona (Grace) with avatar
   - Language toggle: English / Tagalog / Cebuano
   - "Thinking" dots, then a typewriter reveal
   - Talks to a Netlify Function (Claude) grounded in the KB
   ===================================================== */
(function () {
  const root = document.getElementById('ajnc-chat');
  if (!root) return;

  const launcher   = document.getElementById('ajnc-chat-launcher');
  const minBtn     = document.getElementById('ajnc-chat-min');
  const panel      = document.getElementById('ajnc-chat-panel');
  const log        = document.getElementById('ajnc-chat-log');
  const form       = document.getElementById('ajnc-chat-form');
  const input      = document.getElementById('ajnc-chat-input');
  const suggestions= document.getElementById('ajnc-chat-suggestions');
  const langBtns   = root.querySelectorAll('.ajnc-chat__langs button');

  const CFG = window.AJNC_CONFIG || {};
  const ENDPOINT = CFG.chatEndpoint || '/.netlify/functions/chat';

  const STRINGS = {
    en: {
      greeting: "Hi, I'm Grace from AJNC. Ask me anything about our church, what we believe, baptism, or planning your first visit.",
      placeholder: "Type your message",
      chips: ["Why baptise in Jesus' name?", "What is the Holy Ghost?", "When are your services?"]
    },
    tl: {
      greeting: "Kumusta! Ako si Grace ng AJNC. Itanong mo lang ang tungkol sa aming simbahan, sa pananampalataya, sa bautismo, o sa unang pagdalaw mo.",
      placeholder: "I-type ang iyong mensahe",
      chips: ["Bakit nagbabautismo sa pangalan ni Jesus?", "Ano ang Espiritu Santo?", "Kailan ang serbisyo?"]
    },
    ceb: {
      greeting: "Kumusta! Ako si Grace sa AJNC. Pangutana lang bahin sa among simbahan, sa pagtuo, sa bautismo, o sa imong unang pagduaw.",
      placeholder: "I-type ang imong mensahe",
      chips: ["Nganong magbawtismo sa ngalan ni Jesus?", "Unsa ang Espiritu Santo?", "Kanus-a ang serbisyo?"]
    }
  };

  let lang = (root.dataset.lang && STRINGS[root.dataset.lang]) ? root.dataset.lang : 'en';
  const history = [];
  let busy = false;

  /* ---- open / close ---- */
  function setOpen(open){
    root.dataset.open = String(open);
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => input.focus(), 60);
  }
  launcher.addEventListener('click', () => setOpen(panel.hidden));
  minBtn.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });

  /* ---- language ---- */
  function applyLang(){
    const s = STRINGS[lang];
    input.placeholder = s.placeholder;
    // Update greeting only while the conversation hasn't started.
    if (history.length === 0){
      const greet = log.querySelector('[data-greeting]');
      if (greet) greet.textContent = s.greeting;
    }
    if (suggestions){
      const chips = suggestions.querySelectorAll('.ajnc-chip');
      s.chips.forEach((t, i) => { if (chips[i]) chips[i].textContent = t; });
    }
    langBtns.forEach(b => b.classList.toggle('is-active', b.dataset.lang === lang));
  }
  langBtns.forEach(b => b.addEventListener('click', () => { lang = b.dataset.lang; applyLang(); input.focus(); }));

  /* ---- helpers ---- */
  function el(cls, html){ const d = document.createElement('div'); d.className = cls; if (html != null) d.innerHTML = html; return d; }
  function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  // Strip em/en dashes (and any that slip through) — keep replies clean and human.
  function deDash(s){ return s.replace(/\s*[—–]\s*/g, ', ').replace(/--/g, ', '); }
  function format(text){
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .split(/\n{2,}/).map(p => '<p>' + p.replace(/\n/g, '<br/>') + '</p>').join('');
  }
  function scroll(){ log.scrollTop = log.scrollHeight; }

  function addUser(text){ const m = el('ajnc-msg ajnc-msg--user'); m.textContent = text; log.appendChild(m); scroll(); }
  function thinking(){ const m = el('ajnc-msg ajnc-msg--bot', '<span class="ajnc-typing"><span></span><span></span><span></span></span>'); log.appendChild(m); scroll(); return m; }

  // Typewriter reveal, then render light formatting.
  function typewrite(bubble, text){
    return new Promise(resolve => {
      const plain = text;
      let i = 0;
      bubble.innerHTML = '<span class="ajnc-tw"></span><span class="ajnc-caret"></span>';
      const span = bubble.querySelector('.ajnc-tw');
      const caret = bubble.querySelector('.ajnc-caret');
      const step = () => {
        // reveal a few chars per tick so longer answers don't drag
        i += Math.max(1, Math.round(plain.length / 240));
        span.textContent = plain.slice(0, i);
        scroll();
        if (i < plain.length){ setTimeout(step, 16); }
        else { caret.remove(); bubble.innerHTML = format(plain); scroll(); resolve(); }
      };
      step();
    });
  }

  async function send(text){
    if (busy || !text.trim()) return;
    busy = true;
    input.value = '';
    if (suggestions) suggestions.style.display = 'none';
    addUser(text);
    history.push({ role: 'user', content: text });

    const bubble = thinking();
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.slice(-12), church: CFG.churchSlug || 'cebu', lang })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      let reply = (data && data.reply) ? deDash(data.reply)
        : "Sorry, I could not find an answer. You can reach us at hello@ajnc.ph.";
      await typewrite(bubble, reply);
      history.push({ role: 'assistant', content: reply });
    } catch (err) {
      bubble.innerHTML = format(
        "I am having a little trouble connecting right now. You can still plan your visit or send us a note at hello@ajnc.ph, and we would love to meet you in person."
      );
    } finally {
      busy = false; scroll();
    }
  }

  form.addEventListener('submit', e => { e.preventDefault(); send(input.value); });
  if (suggestions){
    suggestions.querySelectorAll('.ajnc-chip').forEach(chip => chip.addEventListener('click', () => send(chip.textContent)));
  }

  applyLang();
})();
